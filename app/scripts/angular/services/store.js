// store service
azureTicketsApp
    .factory(
        'storeService',
        [
            '$q',
            '$rootScope',
            'modelService',
            'configService',
            'geoService',
            function($q, $rootScope, modelService, configService, geoService) {
              var _stores = [], _lastAvailableURI = null;

              return {
                listStoresAsync : function(levels) {
                  var def = $q.defer();

                  BWL.Services.StoreService.ListStoresAsync(levels, function(
                      stores) {
                    _stores = angular.isArray(stores) ? stores : [];

                    $rootScope.$apply(function() {
                      def.resolve();
                    });
                  }, function(err) {
                    $rootScope.$apply(function() {
                      def.reject(err)
                    })
                  });

                  return def.promise;
                },
                hasStore : function() {
                  return _stores !== null && angular.isObject(_stores[0])
                      && _stores[0].Key !== null
                },
                getStores : function() {
                  return _stores;
                },
                getStore : function() {
                  return modelService.getInstanceOf('Store');
                },
                /**
                 * Find for existent URIs.
                 * 
                 * @param uri
                 *          URI
                 * @returns {void}
                 */
                getStoreKeyByURI : function(uri) {
                  var def = $q.defer();

                  BWL.Services.StoreService.FindStoreKeyFromCustomURIAsync(uri,
                      function(storeKey) {
                        if (!angular.isDefined(storeKey)
                            || storeKey.trim() === '') {
                          _lastAvailableURI = uri;
                        }

                        $rootScope.$apply(function() {
                          def.resolve(storeKey);
                        })
                      }, function(err) {
                        $rootScope.$apply(function() {
                          def.reject(err)
                        })
                      });

                  return def.promise;
                },
                getURISuggestion : function(h, c, def) {
                  def = angular.isDefined(def) ? def : $q.defer(), _this = this;

                  // check URI availability and regenerate if
                  // exists
                  c = angular.isDefined(c) ? c : 0, maxIt = 20;
                  h = c > 0 ? h + String.valueOf(c) : h;

                  this.getStoreKeyByURI(h).then(
                      function(storeKey) {
                        if (angular.isDefined(storeKey) && storeKey !== '') {
                          // existing URI,
                          // generate
                          // extra string
                          if (c < maxIt) {
                            _this.getURISuggestion(h, c++, def);
                            return;
                          } else {
                            def.reject(CommonResources.Error_System.replace(
                                /\{0\}/g, 'maximum iteration achieved'));
                          }
                        } else {
                          // URI not found,
                          // proceed to
                          // creation
                          def.resolve(h);
                        }
                      }, function(err) {
                        def.reject(err)
                      });

                  return def.promise;
                },
                createStore : function(store) {
                  var def = $q.defer();

                  BWL.Services.ModelService.CreateAsync(
                      configService.container.store, this.getStore().Type,
                      store, function(storeKey) {
                        $rootScope.$apply(function() {
                          def.resolve(storeKey)
                        });
                      }, function(err) {
                        $rootScope.$apply(function() {
                          def.reject(err)
                        })
                      });

                  return def.promise;
                },
                initStore : function(storeKey) {
                  var def = $q.defer();

                  BWL.Services.ModelService
                      .ReadAsync(
                          configService.container.store,
                          "Store",
                          storeKey,
                          4,
                          function(store) {
                            if (!angular.isDefined(store.Address)
                                || store.Address === null) {
                              store.Address = modelService
                                  .getInstanceOf('Address');
                            }
                            store.URI = store.StoreURIs
                                && angular.isArray(store.StoreURIs) ? store.StoreURIs[0].URI
                                : null;

                            var _finishes = function() {
                              BWL.Services.GeoService.ReadCurrencyAsync(
                                  store.Currency, function(currency) {
                                    $rootScope.$apply(function() {
                                      def.resolve(store, currency)
                                    });
                                  }, function(err) {
                                    $rootScope.$apply(function() {
                                      def.reject(err)
                                    })
                                  });
                            }

                            if (!angular.isArray(store.PaymentProviders)
                                || store.PaymentProviders.length === 0) {
                              _finishes();
                            } else {
                              // we handle only one PaymentProvider per Store
                              BWL.Services.ModelService
                                  .ReadAsync(
                                      store.Key,
                                      'PaymentProvider',
                                      store.PaymentProviders[0].Key,
                                      1,
                                      function(paymentProvider) {
                                        store.PaymentProviders[0] = paymentProvider;

                                        _finishes();
                                      }, function(err) {
                                        $rootScope.$apply(function() {
                                          def.reject(err)
                                        })
                                      });
                            }
                          }, function(err) {
                            $rootScope.$apply(function() {
                              def.reject(err)
                            })
                          });

                  return def.promise;
                },
                addStoreURI : function(storeKey, uri) {
                  var def = $q.defer(), _this = this;

                  BWL.Services.ModelService.CreateAsync(storeKey, "StoreURI", {
                    URI : uri
                  }, function(uriKey) {
                    BWL.Services.ModelService.AddAsync(
                        configService.container.store, "Store", storeKey,
                        "StoreURIs", BWL.Model.StoreURI.Type, uriKey, function(
                            ret) {
                          $rootScope.$apply(def.resolve)
                        }, function(err) {
                          $rootScope.$apply(function() {
                            def.reject(err)
                          })
                        });
                  }, function(err) {
                    $rootScope.$apply(function() {
                      def.reject(err)
                    })
                  });

                  return def.promise;
                },
                getCurrencies : function() {
                  var def = $q.defer();

                  BWL.Services.GeoService.ListCurrenciesAsync(function(
                      currencies) {
                    $rootScope.$apply(function() {
                      def.resolve(currencies)
                    });
                  }, function(err) {
                    $rootScope.$apply(function() {
                      def.reject(err)
                    })
                  });

                  return def.promise;
                },
                getPaymentProvidersByCurrency : function(currency) {
                  var def = $q.defer();

                  BWL.Services.PaymentService.ListProvidersByCurrencyAsync(
                      currency, function(paypros) {
                        $rootScope.$apply(function() {
                          def.resolve(paypros)
                        });
                      }, function(err) {
                        $rootScope.$apply(function() {
                          def.reject(err)
                        })
                      });

                  return def.promise;
                },
                getPaymentProviderInfo : function(providerType) {
                  var def = $q.defer();

                  BWL.Services.PaymentService.FindProviderInfoByTypeAsync(
                      providerType, function(info) {
                        $rootScope.$apply(function() {
                          def.resolve(info);
                        });
                      }, function(err) {
                        $rootScope.$apply(function() {
                          def.reject(err)
                        })
                      });

                  return def.promise;
                },
                addPaymentProvider : function(store, p) {
                  var def = $q.defer();

                  delete p.Type;
                  delete p.Key;

                  BWL.Services.ModelService.AddAsync(store.Key,
                      BWL.Model.Store.Type, store.Key, 'PaymentProviders',
                      BWL.Model.PaymentProvider.Type, p, function(ret) {
                        $rootScope.$apply(function() {
                          def.resolve(ret)
                        })
                      }, function(err) {
                        $rootScope.$apply(function() {
                          def.reject(err)
                        })
                      });

                  return def.promise;
                },
                removePaymentProvider : function(store, ix) {
                  var def = $q.defer();

                  if (angular.isDefined(store.PaymentProviders)
                      && store.PaymentProviders !== null) {
                    BWL.Services.ModelService.RemoveAsync(store.Key, 'Store',
                        store.Key, 'PaymentProviders',
                        BWL.Model.PaymentProvider.Type,
                        store.PaymentProviders[ix].Key, function(ret) {
                          $rootScope.$apply(function() {
                            def.resolve(ret)
                          })
                        }, function(err) {
                          $rootScope.$apply(function() {
                            def.reject(err)
                          })
                        });
                  } else {
                    def.resolve();
                  }

                  return def.promise;
                },
                addEvent : function(storeKey, eventKey) {
                  var def = $q.defer();

                  BWL.Services.ModelService.AddAsync(storeKey,
                      BWL.Model.Store.Type, storeKey, 'Events',
                      BWL.Model.Event.Type, {
                        Key : eventKey
                      }, function(ret) {
                        $rootScope.$apply(function() {
                          def.resolve(ret)
                        })
                      }, function(err) {
                        $rootScope.$apply(function() {
                          def.reject(err)
                        })
                      });

                  return def.promise;
                },
                updateStore : function(store) {
                  var def = $q.defer(), tmpStore = angular.copy(store);
                  var _store = angular.copy(store);

                  delete tmpStore.Address;
                  delete tmpStore.StoreURIs;
                  delete tmpStore.isNew;
                  delete tmpStore.PaymentProviders;
                  delete tmpStore.tmpPaymentProvider;

                  BWL.Services.ModelService.UpdateAsync(
                      configService.container.store, 'Store', _store.Key,
                      tmpStore, function(ret) {
                        $rootScope.$apply(function() {
                          def.resolve(_store)
                        });
                      }, function(err) {
                        $rootScope.$apply(function() {
                          def.reject(err)
                        })
                      });

                  return def.promise;
                }
              }
            }
        ]);