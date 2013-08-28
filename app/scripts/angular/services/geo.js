// geo service
azureTicketsApp
    .factory(
        'geoService',
        [
            '$q',
            '$rootScope',
            'configService',
            'modelService',
            function($q, $rootScope, configService, modelService) {
              var _countries = null, _continents = null, _regions = null, _cities = null;

              return {
                getAddress : function() {
                  return modelService.getInstanceOf('Address');
                },
                getLoadedCountries : function() {
                  return _countries;
                },
                getLoadedRegions : function() {
                  return _regions;
                },
                getLoadedCities : function() {
                  return _cities;
                },
                getContinents : function() {
                  var def = $q.defer();

                  if (_continents !== null) {
                    def.resolve(_continents)
                  } else {
                    BWL.Services.GeoService.ListContinentsAsync(function(
                        continents) {
                      _continents = continents;

                      $rootScope.$apply(function() {
                        def.resolve(continents)
                      })
                    }, function(err) {
                      $rootScope.$apply(function() {
                        def.reject(err)
                      })
                    })
                  }

                  return def.promise;
                },
                getCountriesByContinent : function(continentIso) {
                  var def = $q.defer();

                  BWL.Services.GeoService.ListCountriesByContinentAsync(
                      continentIso, function(countries) {
                        _countries = countries;

                        $rootScope.$apply(function() {
                          def.resolve(countries)
                        })
                      }, function(err) {
                        $rootScope.$apply(function() {
                          def.reject(err)
                        })
                      })

                  return def.promise;
                },
                getCityByName : function(name, regionIso, countryIso) {
                  var def = $q.defer();

                  BWL.Services.GeoService.FindCityAsync(name, countryIso,
                      regionIso, function(city) {
                        $rootScope.$apply(function() {
                          def.resolve(city)
                        })
                      }, function(err) {
                        $rootScope.$apply(function() {
                          def.reject(err)
                        })
                      })

                  return def.promise;
                },
                loadCountry : function(countryIso) {
                  var def = $q.defer();

                  BWL.Services.GeoService.FindCountryByISOAsync(countryIso,
                      function(country) {
                        $rootScope.$apply(function() {
                          def.resolve(country)
                        })
                      }, function(err) {
                        $rootScope.$apply(function() {
                          def.reject(err)
                        })
                      })

                  return def.promise;
                },
                getTimezonesByCountry : function(countryIso) {
                  var def = $q.defer();

                  BWL.Services.GeoService.ListTimezonesByCountryISOAsync(
                      countryIso, function(timezones) {
                        $rootScope.$apply(function() {
                          def.resolve(timezones)
                        })
                      }, function(err) {
                        $rootScope.$apply(function() {
                          def.reject(err)
                        })
                      })

                  return def.promise;
                },
                getRegionsByCountry : function(countryIso) {
                  var def = $q.defer();

                  BWL.Services.GeoService.ListRegionsByCountryAsync(countryIso,
                      function(regions) {
                        _regions = regions;

                        $rootScope.$apply(function() {
                          def.resolve(regions)
                        })
                      }, function(err) {
                        $rootScope.$apply(function() {
                          def.reject(err)
                        })
                      })

                  return def.promise;
                },
                getCityByPostalCode : function(countryIso, postalCode) {
                  var def = $q.defer();

                  BWL.Services.GeoService.FindPostalCodeAsync(countryIso,
                      postalCode, function(city) {
                        $rootScope.$apply(function() {
                          def.resolve(city)
                        })
                      }, function(err) {
                        $rootScope.$apply(function() {
                          def.reject(err)
                        })
                      })

                  return def.promise;
                },
                getCitiesByRegion : function(countryIso, regionIso) {
                  var def = $q.defer();

                  BWL.Services.GeoService.ListCitiesByRegionAsync(countryIso,
                      regionIso, function(cities) {
                        _cities = cities;

                        $rootScope.$apply(function() {
                          def.resolve(cities)
                        })
                      }, function(err) {
                        $rootScope.$apply(function() {
                          def.reject(err)
                        })
                      })

                  return def.promise;
                },
                createAddress : function(storeKey, address) {
                  var def = $q.defer();

                  delete address.tmpContinentIso;
                  modelService.nonNull(address);

                  BWL.Services.ModelService.CreateAsync(
                      configService.container.store, BWL.Model.Address.Type,
                      address, function(addressKey) {
                        $rootScope.$apply(function() {
                          def.resolve(addressKey)
                        });
                      }, function(err) {
                        $rootScope.$apply(function() {
                          def.reject(err)
                        });
                      });

                  return def.promise;
                },
                createAddressForStore : function(storeKey, address) {
                  var def = $q.defer();

                  delete address.tmpContinentIso;
                  modelService.nonNull(address);

                  BWL.Services.ModelService.CreateAsync(
                      configService.container.store, BWL.Model.Address.Type,
                      address, function(addressKey) {
                        if (addressKey) {
                          BWL.Services.ModelService.AddAsync(storeKey, "Store",
                              storeKey, "Address", BWL.Model.Address.Type,
                              addressKey, function(ret) {
                                $rootScope.$apply(function() {
                                  def.resolve(ret)
                                })
                              }, function(err) {
                                $rootScope.$apply(function() {
                                  def.reject(err)
                                })
                              });
                        }
                      }, function(err) {
                        $rootScope.$apply(function() {
                          def.reject(err)
                        });
                      });

                  return def.promise;
                },
                deleteAddress : function(storeKey, addressKey) {
                  var def = $q.defer();

                  BWL.Services.ModelService.DeleteAsync(storeKey, this
                      .getAddress().Type, addressKey, function() {
                    $rootScope.$apply(function() {
                      def.resolve()
                    });
                  }, function(err) {
                    $rootScope.$apply(function() {
                      def.reject(err)
                    })
                  });

                  return def.promise;
                },
                updateAddress : function(address) {
                  var def = $q.defer();

                  delete address.tmpContinentIso;
                  modelService.nonNull(address);

                  BWL.Services.ModelService.UpdateAsync(
                      configService.container.store, BWL.Model.Address.Type,
                      address.Key, address, function(ret) {
                        $rootScope.$apply(function() {
                          def.resolve()
                        })
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