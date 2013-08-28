function storeController($scope, $cookieStore, $location, $timeout,
    $routeParams, configService, authService, permService, storeService,
    modelService, errorService, geoService, formService, objectService,
    placeService, orderService, eventService, ticketService, cartService) {
  /**
   * The following vars are shared across controllers and accessible via $scope
   */
  $scope.storeKey = null, $scope.config = configService, $scope.name = 'store',
      $scope.stores = [], $scope.venues = [], $scope.events = [],
      $scope.tickets = [], $scope.orders = [], $scope.currencies = [],
      $scope.paymentProviders = [], $scope.suggestedURLs = [],
      $scope.form = formService, $scope.geo = geoService,
      $scope.error = errorService, $scope.object = objectService,
      $scope.auth = authService, $scope.model = modelService,
      $scope.event = eventService, $scope.place = placeService,
      $scope.store = storeService, $scope.order = orderService,
      $scope.ticket = ticketService, $scope.cart = cartService;

  // initialize wizard for Store
  $scope.wizard = $scope.form.getWizard($scope);

  $scope.$on('initStore', function(ev, key) {
    if (key === null) {
      delete $scope.Store;
    } else if (angular.isDefined(key)) {
      $scope.storeKey = key;
      $cookieStore.put($scope.config.cookies.storeKey, key);
      $scope.initStore(key, true);
    }
    if (angular.isDefined(ev) && angular.isFunction(ev.stopPropagation)) {
      ev.stopPropagation();
    }
  });

  $scope.$on('resetDomainProfile', function() {
    delete $scope.DomainProfile;
  });

  $scope.$watch('wizard.saved', function(v) {
    if (v) {
      $scope.wizard.checkStep = {}
    }
  })

  $scope.showInfo = function() {
    $('#storeInfo').modal({
      show : true,
      backdrop : 'static'
    });
  }

  $scope.hideInfo = function() {
    $('#storeInfo').modal('hide')
  }

  $scope.init = function() {
    $scope.auth.authenticate($scope).then(
        function() {
          $scope.DomainProfile = $scope.auth.getDomainProfile();

          // redirect to login if no profile, but allow store visitors
          if (!angular.isDefined($routeParams.storeURI)
              && $scope.DomainProfile.Key === null) {
            $location.path('/auth/login');
            return;
          }

          // if we are accessing a store from URI
          if (angular.isDefined($routeParams.storeURI)) {
            $scope.store.getStoreKeyByURI($routeParams.storeURI).then(
                function(storeKey) {
                  $scope.storeURI = $routeParams.storeURI;
                  $scope.$emit('initStore', storeKey);
                }, function(err) {
                  $scope.error.log(err)
                });
          } else if ($scope.auth.hasStoreAccess()) {
            // check if user has access to a store and populate list if so
            $scope.store.listStoresAsync(1).then(
                function() {
                  $scope.stores = $scope.store.getStores();

                  if (!angular.isArray($scope.stores)) {
                    // if user has been upgraded but have not yet created a
                    // store
                    $scope.createStore();
                  } else {
                    var storeKey = $cookieStore
                        .get($scope.config.cookies.storeKey)
                        || $scope.stores[0].Key;
                    $scope.$emit('initStore', storeKey);
                  }
                }, function(err) {
                  $scope.error.log(err)
                });
          } else if ($scope.auth.isLogged()) {
            $scope.createStore();
          }
        }, function(err) {
          $scope.error.log(err)
        });
  }

  $scope.createStore = function() {
    $scope.wizard.reset(0);
    // initialize props
    $scope.Store = $scope.model.getInstanceOf('Store', null, null, true);
    $scope.Store.tmpPaymentProvider = $scope.model
        .getInstanceOf('PaymentProvider');
    $scope.Store.isNew = true; // removed by storeService on save, temporary
    // for UI checks
    $scope.Store.Address = $scope.model.getInstanceOf('Address');

    // monitor URI
    $scope.initStoreURI();

    // show agreement
    $timeout(function() {
      $scope.$apply(function() {
        jQuery('#serviceAgreement').modal('show');
      })
    }, 500);

  }

  $scope.initStoreURI = function() {
    if (!angular.isDefined($scope.Store) || $scope.Store === null) {
      return;
    }

    $scope.Store.URI = angular.isDefined($scope.Store.URI) ? $scope.Store.URI
        : null, $scope.URIAvailable = true;

    // suggest URIs
    $scope.$watch('Store.URI', function(uri, oldUri) {
      if (!angular.isDefined($scope.Store) || $scope.Store === null) {
        return;
      }

      if (angular.equals(uri, oldUri)) {
        return;
      }

      var isNew = $scope.Store.Key === null;

      if (isNew && angular.isDefined(uri) && uri !== null
          && uri.length > $scope.config.typeahead.minLength) {
        var re = /[^\a-z\d\-\_]{1,}/gi;
        var sug = $scope.Store.Name !== null ? $scope.Store.Name.replace(re,
            '-').toLowerCase() : null;

        if (sug !== null && $scope.suggestedURLs.indexOf(sug) === -1) {
          $scope.store.getURISuggestion(sug).then(function(_uri) {
            if ($scope.suggestedURLs.indexOf(_uri) === -1) {
              $scope.suggestedURLs.push(_uri);
            }
          });
        }

        $scope.Store.URI = uri.replace(re, '-').toLowerCase();
        $scope.checkURIAvailability(uri);
      }
    })
  }

  $scope.setStoreKey = function(key) {
    // here $watch is not being triggered, so we later call initStore manually
    if ($scope.storeKey !== key) {
      $scope.storeKey = key;
    }

    $scope.wizard.reset();

    // manually load location & accounting items
    $timeout(function() {
      $scope.$apply(function() {
        $scope.initStore($scope.storeKey, true);
      })
    }, 500);
  }

  $scope.initStore = function(storeKey, resetWizard) {
    if (storeKey !== null) {
      $scope.store
          .initStore(storeKey)
          .then(
              function(store, currency) {
                $scope.Store = store;
                $scope.Store.tmpPaymentProvider = angular
                    .isArray($scope.Store.PaymentProviders) ? $scope.Store.PaymentProviders[0]
                    : null;

                if (resetWizard) {
                  $scope.wizard.reset();
                }

                if ($scope.Store.Address
                    && $scope.Store.Address.Country !== null) {
                  // we've got a country, alert address
                  // widget. somehow we should delay this
                  // a bit in order to properly broadcast
                  // msg
                  $timeout(function() {
                    $scope.$broadcast('loadCountry', $scope.Store.Address);
                  }, 500);
                }

                // this API call requires DomainProfile
                if ($scope.Store.Currency && $scope.Store.Currency !== null
                    && $scope.auth.isDomainProfileReady()) {
                  $scope.loadPaymentProvidersByCurrency($scope.Store.Currency);
                }

                // monitor URI
                $scope.initStoreURI();

                // init venues, events
                if ($scope.venues.length === 0
                    && $scope.auth.isDomainProfileReady()
                    && $scope.Store.IsOwner) {
                  $scope.place.loadPlaces($scope);
                }

                if ($scope.events.length === 0
                    && $scope.auth.isDomainProfileReady()) {
                  // always load whole set of events for owners
                  if ($scope.Store.IsOwner) {
                    $scope.event.loadEvents($scope);
                  } else if (angular.isDefined($scope.Store.Events)) {
                    $scope.events = angular.copy($scope.Store.Events);
                  }
                } else if (angular.isDefined($scope.Store.Events)) {
                  $scope.events = angular.copy($scope.Store.Events);
                }

                // if visitor, then remember visited store
                if (!$scope.Store.IsOwner) {
                  if (!angular.isObject($scope.object.grep($scope.stores,
                      'Key', $scope.Store.Key))) {
                    $scope.stores.push($scope.Store);
                  }
                }
              }, function(err) {
                $scope.error.log(err)
              });
    }
  }

  $scope.upgradeProfile = function() {
    $scope.auth.upgradeProfile().then(function() {
      return $scope.auth.authenticate($scope);
    }).then(function() {
      $scope.wizard.reset();
    }, function(err) {
      $scope.error.log(err)
    });
  }

  $scope.loadCurrencies = function() {
    $scope.store.getCurrencies().then(function(currencies) {
      var c = [
          'CAD', 'USD', 'EUR', 'GBP'
      ];
      $scope.currencies = $scope.object.prioritizeSort(currencies, c, 'ISO');
    }, function(err) {
      $scope.error.log(err)
    });
  }

  $scope.loadPaymentProvidersByCurrency = function(currency) {
    if (angular.isDefined(currency) && currency !== '') {
      $scope.store.getPaymentProvidersByCurrency(currency).then(
          function(paypros) {
            $scope.paymentProviders = paypros;

            if ($scope.Store.tmpPaymentProvider !== null) {
              $scope.loadPaymentProviderInfo($scope.Store.tmpPaymentProvider);
            }
          }, function(err) {
            $scope.error.log(err)
          });
    }
  }

  /**
   * The Payment Providers list returned by
   * $scope.loadPaymentProvidersByCurrency doesn't include PaymentProvider model
   * (Key, etc), instead it does only return array of strings so we cannot match
   * them against the selection contained in $scope.Store.PaymentProviders
   */
  $scope.isPaymentProviderSelected = function(pType) {
    if (angular.isDefined($scope.Store.PaymentProviders)
        && $scope.Store.PaymentProviders !== null) {
      $scope.Store.PaymentProviders.forEach(function(p) {
        if (p.ProviderType === pType) {
          return true;
        }
      });
    }
    return false;
  }

  $scope.checkURIAvailability = function(uri) {
    if (angular.isDefined(uri)) {
      $scope.store.getStoreKeyByURI(uri).then(
          function(storeKey) {
            $scope.URIAvailable = angular.isString(storeKey)
                && storeKey.trim() === '';
          }, function(err) {
            $scope.error.log(err)
          });
    }
  }

  $scope.loadPaymentProviderInfo = function(paymentProvider) {
    if (angular.isDefined(paymentProvider)
        && paymentProvider.ProviderType !== null) {
      $scope.store.getPaymentProviderInfo(paymentProvider.ProviderType).then(
          function(info) {
            $scope.tmpPaymentProviderInfo = info;
          }, function(err) {
            $scope.error.log(err)
          });
    }
  }

  $scope.save = function() {
    if ($scope.wizard.finished) {
      $scope.wizard.saved = false;

      if ($scope.Store.Key === null) {
        // create store

        // API claims not null properties
        $scope.model.nonNull($scope.Store.Address);

        // go on and create
        $scope.store.createStore({
          Name : $scope.Store.Name,
          Description : $scope.Store.Description,
          Public : true,
          HasMemberships : true,
          HasWishlist : true,
          Currency : $scope.Store.Currency,
          StoreURIs : [
            {
              URI : $scope.Store.URI
            }
          ],
          Address : $scope.Store.Address
        }).then(
            function(storeKey) {
              if (angular.isString(storeKey)) {
                $scope.wizard.checkStep.store = true,
                    $scope.wizard.checkStep.uri = true,
                    $scope.wizard.checkStep.address = true;

                $scope.Store.Key = storeKey;

                $scope.model.nonNull($scope.Store.tmpPaymentProvider);

                // attach payment providers
                $scope.store.addPaymentProvider($scope.Store,
                    $scope.Store.tmpPaymentProvider).then(function() {
                  $scope.wizard.checkStep.payment = true;
                  $scope.wizard.saved = true;

                  // reload full model
                  $scope.initStore(storeKey);
                }, function(err) {
                  $scope.wizard.payment = false;

                  $scope.error.log(err)
                });
              }
            },
            function(err) {
              $scope.wizard.checkStep.store = false,
                  $scope.wizard.checkStep.uri = false,
                  $scope.wizard.checkStep.address = false,
                  $scope.wizard.checkStep.payment = false;
              $scope.error.log(err)
            });

      } else {
        // update store
        var _finishes = function(ret) {
          $scope.wizard.checkStep.address = true;

          // attach payment providers
          $scope.store.removePaymentProvider($scope.Store, 0).then(
              function() {
                $scope.model.nonNull($scope.Store.tmpPaymentProvider);

                $scope.store.addPaymentProvider($scope.Store,
                    $scope.Store.tmpPaymentProvider).then(function() {
                  $scope.wizard.checkStep.payment = true;

                  $scope.wizard.saved = true;

                  // reload full model
                  $scope.initStore($scope.Store.Key);
                }, function(err) {
                  $scope.wizard.payment = false;

                  $scope.error.log(err)
                });
              }, function(err) {
                $scope.wizard.payment = false;

                $scope.error.log(err)
              });
        }

        // update store & address
        if ($scope.Store.Address.Key !== null) {
          $scope.store.updateStore($scope.Store).then(
              function(store) {
                if (angular.isDefined(store.Key)) {
                  $scope.wizard.checkStep.store = true,
                      $scope.wizard.checkStep.uri = true;

                  $scope.geo.updateAddress($scope.Store.Address).then(
                      _finishes, function(err) {
                        $scope.wizard.address = false;

                        $scope.error.log(err)
                      });
                }
              },
              function(err) {
                $scope.wizard.checkStep.store = false,
                    $scope.wizard.checkStep.uri = false,
                    $scope.wizard.checkStep.address = false,
                    $scope.wizard.checkStep.payment = false;

                $scope.error.log(err)
              });
        } else {
          // update store & create address
          $scope.store.updateStore($scope.Store).then(
              function(store) {
                if (angular.isDefined(store.Key)) {
                  $scope.wizard.checkStep.store = true,
                      $scope.wizard.checkStep.uri = true;

                  $scope.geo.createAddressForStore(store.Key,
                      $scope.Store.Address).then(_finishes, function(err) {
                    $scope.wizard.checkStep.address = false;

                    $scope.error.log(err)
                  });
                }
              },
              function(err) {
                $scope.wizard.checkStep.store = false,
                    $scope.wizard.checkStep.uri = false,
                    $scope.wizard.checkStep.address = false,
                    $scope.wizard.checkStep.payment = false;

                $scope.error.log(err)
              });
        }
      }
    }
  }
}

storeController.$inject = [
    '$scope', '$cookieStore', '$location', '$timeout', '$routeParams',
    'configService', 'authService', 'permService', 'storeService',
    'modelService', 'errorService', 'geoService', 'formService',
    'objectService', 'placeService', 'orderService', 'eventService',
    'ticketService', 'cartService'
];