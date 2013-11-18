function storeController($scope, $cookieStore, $location, $timeout,
    $routeParams, configService, authService, permService, storeService,
    modelService, errorService, geoService, formService, objectService,
    placeService, orderService, eventService, ticketService, cartService,
    accountService, mediaService, categoryService, scannerService, $q, $filter,
    $modal) {
  /**
   * The following vars are shared across controllers and accessible via $scope
   */
  $scope.storeKey = null, $scope.config = configService, $scope.name = 'store',
      $scope.stores = [], $scope.venues = [], $scope.events = [],
      $scope.tickets = [], $scope.orders = [], $scope.currencies = [],
      $scope.images = [], $scope.paymentProviders = [], $scope.categories = [],
      $scope.scanDevices = [], $scope.suggestedURLs = [],
      $scope.form = formService, $scope.geo = geoService,
      $scope.error = errorService, $scope.object = objectService,
      $scope.auth = authService, $scope.model = modelService,
      $scope.event = eventService, $scope.place = placeService,
      $scope.store = storeService, $scope.order = orderService,
      $scope.ticket = ticketService, $scope.cart = cartService,
      $scope.account = accountService, $scope.category = categoryService,
      $scope.media = mediaService, $scope.scanner = scannerService,
      $scope.enums = BWL.ModelEnum, $scope.storeHasChanged = false;

  $scope.storeAgreement = {
    open : false,
    agreed : false
  }
  $scope.$watch('storeAgreement.open', function(v) {
    if (v) {
      $scope.storeAgreement.modal = $modal.open({
        templateUrl : 'agreement.html',
        scope : $scope,
        backdrop : 'static'
      });
    } else if (angular.isDefined($scope.storeAgreement.modal)) {
      $scope.storeAgreement.modal.close();
    }
  })
  $scope.$watch('storeAgreement.agreed', function(v) {
    if (v) {
      $scope.wizardPreRegister.next('atStorePreRegister2', true,
          $scope.submitRequest)
      $scope.storeAgreement.agreed = false;
    }
  })

  // this is used to contain object selection made from child scopes created by
  // ng-include
  $scope.selection = {};

  // Pagination setup
  $scope.pagination = {
    pageSize : 20,
    predicates : [],
    pageItems : function() {
    },
    textFilter : '',
    propFilter : '*',
    filteringObj : {},
    sort : function() {
    },
    currentPageIndex : 0,
    results : [],
    numberOfPages : 0
  };

  // initialize wizard for Store
  $scope.wizard = $scope.form.getWizard($scope);
  $scope.wizardPreRegister = $scope.form.getWizard($scope);

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

  $scope.upgradeProfile = function() {
    if ($scope.auth.isPublic() || $scope.auth.isAuthenticated()) {
      $scope.auth.upgradeProfile().then(function() {
        return $scope.auth.authenticate($scope);
      }).then(function() {
        $scope.wizard.reset();
        $scope.wizardPreRegister.reset();
      }, function(err) {
        $scope.error.log(err)
      });
    } else {
      $scope.wizard.reset();
      $scope.wizardPreRegister.reset();
    }
  }

  $scope.init = function() {
    $scope.auth.authenticate($scope).then(
        function() {
          $scope.DomainProfile = $scope.auth.getDomainProfile();

          // redirect to login if no profile, but allow store visitors
          if (!angular.isDefined($routeParams.storeURI)
              && !$scope.auth.isDomainProfileReady()
              && !$cookieStore.get(configService.cookies.initPages)) {
            $location.path('/login');
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

                  if (!angular.isArray($scope.stores)
                      || $scope.stores.length === 0) {
                    // if user has been upgraded but have not yet created a
                    // store
                    $location.path('/storeRequest');
                    $scope.requestAccess();
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
            // let's upgrade user by redirecting to storeRequest page
            $location.path('/storeRequest');
            $scope.requestAccess();
          }
        }, function(err) {
          $scope.error.log(err)
        });
  }

  $scope.createStore = function() {
    // initialize props
    $scope.Store = $scope.model.getInstanceOf('Store', null, null, true);
    $scope.Store.tmpPaymentProvider = $scope.model
        .getInstanceOf('PaymentProvider');
    $scope.Store.isNew = true; // removed by storeService on save, temporary
    // for UI checks
    $scope.Store.Address = $scope.model.getInstanceOf('Address');

    // monitor URI
    $scope.initStoreURI();

    $scope.wizard.reset();
  }

  $scope.requestAccess = function() {
    $scope.wizardPreRegister.reset(0);

    // initialize props
    $scope.StorePreRegister = $scope.model.getInstanceOf('StorePreRegister',
        null, null, true);
    $scope.selection.StorePreRegisterKey = null;

    $scope.wizardPreRegister.reset();
  }

  $scope.searchStorePreRegister = function() {
    $scope.error.info($filter('t')('Common.Text_WaitLoading'))

    $scope.model.find({
      Name : $scope.StorePreRegister.Name,
      City : $scope.StorePreRegister.City,
      Type : $scope.StorePreRegister.Type,
    }, '').then(function(ret) {
      if (angular.isArray(ret)) {
        $scope.storePreRegisters = ret;
      }

      $scope.error.info(null)
    }, function(err) {
      $scope.error.log(err)
      $scope.error.info(null)
    });
  }

  $scope.submitRequest = function() {
    if ($scope.wizardPreRegister.finished) {
      $scope.wizardPreRegister.saved = false;

      // send request
      if (!angular.isDefined($scope.StorePreRegister.StoreKey)
          || $scope.StorePreRegister.StoreKey === null) {
        $scope.account.accessRequest($scope.StorePreRegister.Type,
            $scope.selection.StorePreRegisterKey,
            $scope.enums.ModelAccessTypeEnum.FullAccess).then(function(ret) {
          if (ret) {
            $scope.wizardPreRegister.checkStep.requested = true;
            $scope.wizardPreRegister.saved = true;

            // refresh
            $scope.getPendingAccessRequests()
          }
        }, function(err) {
          $scope.wizardPreRegister.checkStep.requested = false;
          $scope.wizardPreRegister.saved = false;

          $scope.error.log(err)
        })
      } else {
        $scope.error.log()
      }
    }
  }

  $scope.initStoreURI = function() {
    if (!angular.isDefined($scope.Store) || $scope.Store === null) {
      return;
    }

    $scope.Store.URI = angular.isDefined($scope.Store.URI) ? $scope.Store.URI
        : null;
    $scope.URIAvailable = true;

    // suggest URIs
    $scope.$watch('Store.URI', function(uri, oldUri) {
      if (!angular.isDefined($scope.Store) || $scope.Store === null) {
        return;
      }

      // checks for no change or if URI is already set
      if (angular.equals(uri, oldUri) || $scope.tmpURI) {
        return;
      }

      if (angular.isDefined(uri) && uri !== null
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

  $scope.setStoreKey = function(key, forwardUrl) {
    if ($scope.storeKey !== key) {
      $scope.storeKey = key;
      $scope.storeHasChanged = true;
    }

    $scope.wizard.reset();

    // manually load location & accounting items
    $timeout(function() {
      $scope.$apply(function() {
        $scope.$emit('initStore', $scope.storeKey, true)

        if (angular.isDefined(forwardUrl))
          $location.url(forwardUrl)
      })
    }, 1000);
  }

  $scope.initStore = function(storeKey, resetWizard) {
    if (storeKey !== null) {
      $scope.store
          .initStore(storeKey)
          .then(
              function(store, currency) {
                // reset images library
                $scope.images = [];

                $scope.Store = store;
                $scope.Store.tmpPaymentProvider = angular
                    .isArray($scope.Store.PaymentProviders) ? $scope.Store.PaymentProviders[0]
                    : null;

                if (resetWizard) {
                  $scope.wizard.reset();
                }

                // this API call requires DomainProfile
                if ($scope.Store.Currency && $scope.Store.Currency !== null
                    && $scope.auth.isDomainProfileReady()) {
                  $scope.loadPaymentProvidersByCurrency($scope.Store.Currency);
                }

                // monitor URI
                $scope.initStoreURI();
                $scope.tmpURI = angular.copy($scope.Store.URI); // make copy to
                // let
                // us know there
                // was an URI set
                // initially (or not)

                // init venues, events, approvals
                if ($scope.auth.isDomainProfileReady()) {
                  $scope.media.loadImages($scope)
                  $scope.getPendingAccessRequests();

                  // always load whole set of events for owners
                  if ($scope.Store.IsOwner) {
                    $scope.place.loadPlaces($scope);
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

                $scope.storeHasChanged = false;
              }, function(err) {
                $scope.error.log(err)
              });
    }
  }

  $scope.loadCurrencies = function() {
    $scope.store.getCurrencies().then(function(currencies) {
      var c = [ 'CAD', 'USD', 'EUR', 'GBP' ];
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

      // only super admin can create a Store directly
      if ($scope.Store.Key === null && auth.isAdministrator()) {
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
          StoreURIs : [ {
            URI : $scope.Store.URI
          } ],
          Address : $scope.Store.Address
        }).then(
            function(storeKey) {
              if (angular.isString(storeKey)) {
                $scope.wizard.checkStep.store = true,
                    $scope.wizard.checkStep.uri = true,
                    $scope.wizard.checkStep.address = true;

                $scope.Store.Key = storeKey;

                var _attachPaymentProviders = function() {
                  // attach payment providers
                  $scope.model.nonNull($scope.Store.tmpPaymentProvider);
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

                // add pic
                if ($scope.Store.Image && $scope.Store.Image.Key) {
                  $scope.model.associate($scope.Store, 'Image',
                      $scope.Store.Image).then(function() {
                    $scope.wizard.checkStep.image = true;

                    if ($scope.auth.isAdministrator()) {
                      _attachPaymentProviders();
                    } else {
                      $scope.wizard.saved = true;

                      // reload full model
                      $scope.initStore(storeKey);
                    }
                  }, function(err) {
                    $scope.wizard.checkStep.image = false;

                    $scope.error.log(err)
                  })
                } else if ($scope.auth.isAdministrator()) {
                  _attachPaymentProviders();
                } else {
                  $scope.wizard.saved = true;

                  // reload full model
                  $scope.initStore(storeKey);
                }
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
        var _attachPaymentProviders = function() {
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
        var _finishes = function(ret) {
          $scope.wizard.checkStep.address = true;

          // add pic
          if ($scope.Store.Image && $scope.Store.Image.Key) {
            $scope.model.associate($scope.Store, 'Image', $scope.Store.Image)
                .then(function() {
                  $scope.wizard.checkStep.image = true;

                  if ($scope.auth.isAdministrator()) {
                    _attachPaymentProviders();
                  } else {
                    $scope.wizard.saved = true;

                    // reload full model
                    $scope.initStore($scope.Store.Key);
                  }
                }, function(err) {
                  $scope.wizard.checkStep.image = false;

                  $scope.error.log(err)
                })
          } else if ($scope.auth.isAdministrator()) {
            _attachPaymentProviders();
          } else {
            $scope.wizard.saved = true;

            // reload full model
            $scope.initStore($scope.Store.Key);
          }
        }

        var _updateStoreAddress = function() {
          // update store & address
          if ($scope.Store.Address.Key !== null) {
            $scope.store.updateStore($scope.Store).then(
                function(store) {
                  if (angular.isDefined(store.Key)) {
                    $scope.wizard.checkStep.store = true;

                    // super admin can update existing address
                    if ($scope.auth.isAdministrator()) {
                      $scope.geo.updateAddress($scope.Store.Address).then(
                          _finishes, function(err) {
                            $scope.wizard.address = false;

                            $scope.error.log(err)
                          });
                    } else {
                      // if regular admin, replace address
                      // if it has no access, let's create a new one anyway
                      var _replaceAddress = function() {
                        delete $scope.Store.Address.Key;

                        $scope.geo.createAddressForStore(store.Key,
                            $scope.Store.Address).then(_finishes,
                            function(err) {
                              $scope.wizard.checkStep.address = false;

                              $scope.error.log(err)
                            });
                      }
                      $scope.geo.deleteAddress($scope.Store.Key,
                          $scope.Store.Address.Key).then(_replaceAddress,
                          _replaceAddress);
                    }
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
                    $scope.wizard.checkStep.store = true;

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

        // if the URI has not yet been set - which means this is the first time
        // we
        // edit
        // the Store -
        if ($scope.tmpURI === null || $scope.tmpURI.length === 0) {
          if (angular.isDefined($scope.Store.URI)
              && $scope.Store.URI.length > 0) {
            $scope.store.addStoreURI($scope.Store.Key, $scope.Store.URI).then(
                function() {
                  $scope.wizard.checkStep.uri = true;

                  _updateStoreAddress();
                },
                function(err) {
                  $scope.wizard.checkStep.store = false,
                      $scope.wizard.checkStep.uri = false;
                  $scope.error.log(err)
                })
          } else {
            $scope.error.log($scope.error.log($filter('t')(
                'Common.Text_MissingURI')))
          }
        } else {
          $scope.wizard.checkStep.uri = true;

          _updateStoreAddress();
        }
      }
    }
  }

  $scope.getPendingAccessRequests = function() {
    $scope.error.info($filter('t')('Common.Text_WaitLoading'))

    var def = $q.defer();

    $scope.account.getAccessRequests().then(function(pending) {
      $scope.approvals = angular.isArray(pending) ? pending : [];

      def.resolve();
      $scope.error.info(null)
    }, function(err) {
      $scope.error.log(err)
      $scope.error.info(null)

      def.reject()
    });

    return def.promise;
  }

  // Remove TinyMCE instance on closing the popup window
  // This is to avoid bug #6013:
  // http://www.tinymce.com/develop/bugtracker_view.php?id=6013
  // If we haven't got this, 'NS_ERROR_UNEXPECTED' will appear on the third
  // opening the Create/Update buttons
  // Place this function here so that it can be used in any Create/Update popups
  // descTinymce: @param - the ID of <textarea> element where tinymce directive
  // is used
  $scope.removeTinymceIns = function() {
    $scope.tinyInstance = tinymce.get('descTinymce');
    if ($scope.tinyInstance) {
      $scope.tinyInstance.remove();
      $scope.tinyInstance = null;
    }
  }

  // customTime for searching orders in orderController.js
  // Place this here since the atfield directive gets the
  // parent scope of its nearest form element which is storeController's scope
  $scope.customTime = {};
}

storeController.$inject = [ '$scope', '$cookieStore', '$location', '$timeout',
    '$routeParams', 'configService', 'authService', 'permService',
    'storeService', 'modelService', 'errorService', 'geoService',
    'formService', 'objectService', 'placeService', 'orderService',
    'eventService', 'ticketService', 'cartService', 'accountService',
    'mediaService', 'categoryService', 'scannerService', '$q', '$filter',
    '$modal' ];
