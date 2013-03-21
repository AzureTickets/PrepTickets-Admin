function storeController($scope, $cookieStore, $timeout, configService,
    authService, permService, storeService, modelService, errorService,
    geoService, formService) {
  $scope.storeKey = $cookieStore.get('storeKey') || null,
      $scope.config = configService, $scope.name = 'store', $scope.stores = [],
      $scope.currencies = [], $scope.paymentProviders = [],
      $scope.suggestedURLs = [], $scope.wizard = formService.getWizard($scope);

  /**
   * models in play here.
   * 
   * @todo inject models, using array of strings maybe.
   */
  $scope.DomainProfile = authService.getDomainProfile();
  $scope.Store = modelService.getInstanceOf('Store');
  $scope.Store.tmpPaymentProvider = modelService
      .getInstanceOf('PaymentProvider');

  $scope.init = function() {
    $scope.Store.URI = angular.isDefined($scope.Store.URI) ? $scope.Store.URI
        : null, $scope.URIAvailable = true;

    // suggest URIs
    $scope.$watch('Store.URI', function(uri) {
      var isNew = ($scope.Store.Key === null);

      if (isNew && angular.isDefined(uri) && uri !== null
          && uri.length > configService.typeahead.minLength) {
        var re = /[^\a-z\d\-\_]{1,}/gi;
        var sug = $scope.Store.Name.replace(re, '-').toLowerCase();

        if ($scope.suggestedURLs.indexOf(sug) === -1) {
          storeService.getURISuggestion(sug).then(function(_uri) {
            $scope.suggestedURLs.push(_uri);
          });
        }

        $scope.Store.URI = uri.replace(re, '-').toLowerCase();
        $scope.checkURIAvailability(uri);
      }
    })

    authService.authenticate($scope).then(function() {
      if (authService.hasStoreAccess()) {
        storeService.listStoresAsync($scope.storeKey, 1).then(function() {
          $scope.initStore(null, true);
        }, function(err) {
          errorService.log(err)
        });
      } else {
        // initialize props
        $scope.Store.Address = modelService.getInstanceOf('Address');

        // show agreement
        $timeout(function() {
          $scope.$apply(function() {
            $scope.wizard.currentStep = 0;
            jQuery('#serviceAgreement').modal('show');
          })
        }, 500);
      }
    }, function(err) {
      errorService.log(err)
    });
  }

  $scope.initStore = function(storeKey, resetWizard) {
    // reload full model
    $scope.stores = storeService.getStores();
    var storesLoaded = !configService.multipleStores
        && angular.isDefined($scope.stores[0]) && $scope.stores[0].Key !== null;

    storeKey = angular.isDefined(storeKey) && storeKey !== null ? storeKey
        : storesLoaded ? $scope.stores[0].Key : $scope.storeKey

    if (storeKey !== null) {
      storeService
          .initStore(storeKey)
          .then(
              function(store, currency) {
                $cookieStore.put('storeKey', store.Key);
                $scope.Store = store;
                $scope.Store.tmpPaymentProvider = angular
                    .isArray($scope.Store.PaymentProviders) ? $scope.Store.PaymentProviders[0]
                    : null;

                if (resetWizard) {
                  $scope.wizard.currentStep = 1;
                }

                if ($scope.Store.Address
                    && $scope.Store.Address.Country !== null) {
                  // we've got a country, alert address
                  // widget. somehow we should delay this
                  // a bit in order to properly broadcast
                  // msg
                  $timeout(function() {
                    $scope.$apply(function() {
                      $scope.$broadcast('loadCountry', $scope.Store.Address);
                    })
                  }, 500);
                }

                if ($scope.Store.Currency && $scope.Store.Currency !== null) {
                  $scope.loadPaymentProvidersByCurrency($scope.Store.Currency);
                }
              }, function(err) {
                errorService.log(err)
              });
    } else {
      // show agreement
      $scope.wizard.currentStep = 0;
      jQuery('#serviceAgreement').modal('show');

      // initialize props
      $scope.Store.Address = modelService.getInstanceOf('Address');
    }
  }

  $scope.upgradeProfile = function() {
    authService.upgradeProfile().then(function() {
      return authService.authenticate($scope);
    }).then(function() {
      $scope.wizard.currentStep = 1;
    }, function(err) {
      errorService.log(err)
    });
  }

  $scope.loadCurrencies = function() {
    storeService.getCurrencies().then(function(currencies) {
      $scope.currencies = currencies;
    }, function(err) {
      errorService.log(err)
    });
  }

  $scope.loadPaymentProvidersByCurrency = function(currency) {
    if (angular.isDefined(currency) && currency !== '') {
      storeService.getPaymentProvidersByCurrency(currency).then(
          function(paypros) {
            $scope.paymentProviders = paypros;

            if ($scope.Store.tmpPaymentProvider !== null) {
              $scope.loadPaymentProviderInfo($scope.Store.tmpPaymentProvider);
            }
          }, function(err) {
            errorService.log(err)
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
      storeService.getStoreKeyByURI(uri).then(
          function(storeKey) {
            $scope.URIAvailable = (angular.isString(storeKey) && storeKey
                .trim() === '');
          }, function(err) {
            errorService.log(err)
          });
    }
  }

  $scope.loadPaymentProviderInfo = function(paymentProvider) {
    if (angular.isDefined(paymentProvider)
        && paymentProvider.ProviderType !== null) {
      storeService.getPaymentProviderInfo(paymentProvider.ProviderType).then(
          function(info) {
            $scope.tmpPaymentProviderInfo = info;
          }, function(err) {
            errorService.log(err)
          });
    }
  }

  $scope.save = function() {
    if ($scope.wizard.finished) {
      $scope.wizard.saved = false;

      if ($scope.Store.Key === null) {
        // create store

        // API claims not null properties
        modelService.nonNull($scope.Store.Address);

        // go on and create
        storeService.createStore({
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
                $scope.Store.Key = storeKey;

                modelService.nonNull($scope.Store.tmpPaymentProvider);

                // attach payment providers
                storeService.addPaymentProvider($scope.Store,
                    $scope.Store.tmpPaymentProvider).then(function() {
                  $scope.wizard.saved = true;

                  // reload full model
                  $scope.initStore(storeKey);
                }, function(err) {
                  errorService.log(err)
                });
              }
            }, function(err) {
              errorService.log(err)
            });

      } else {
        // update store
        var _finishes = function(ret) {
          // attach payment providers
          storeService.removePaymentProvider($scope.Store, 0).then(
              function() {
                modelService.nonNull($scope.Store.tmpPaymentProvider);

                storeService.addPaymentProvider($scope.Store,
                    $scope.Store.tmpPaymentProvider).then(function() {
                  $scope.wizard.saved = true;

                  // reload full model
                  $scope.initStore($scope.Store.Key);
                }, function(err) {
                  errorService.log(err)
                });
              }, function(err) {
                errorService.log(err)
              });
        }

        // update store & address
        if ($scope.Store.Address.Key !== null) {
          storeService.updateStore($scope.Store).then(
              function(store) {
                geoService.updateAddress($scope.Store.Address).then(_finishes,
                    function(err) {
                      errorService.log(err)
                    });
              });
        } else {
          // update store & create address
          storeService.updateStore($scope.Store).then(
              function(store) {
                geoService.createAddressForStore(store.Key,
                    $scope.Store.Address).then(_finishes, function(err) {
                  errorService.log(err)
                });
              });
        }
      }
    }
  }
}

storeController.$inject = [
    '$scope', '$cookieStore', '$timeout', 'configService', 'authService',
    'permService', 'storeService', 'modelService', 'errorService',
    'geoService', 'formService'
];