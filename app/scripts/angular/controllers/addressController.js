function addressController($rootScope, $scope, $q, $timeout, $filter) {
  $scope.name = 'address', $scope.countries = [], $scope.continents = [],
      $scope.regions = [], $scope.timezones = [], $scope.randId = null;

  $scope.$on('loadCountry', function(ev, address) {
    $scope.loadCountry(address);
  });

  $scope.mapStyle = {
    // width is automatically calculated from container
    height : 400
  }

  // custom validation
  $scope.validation = {
    Address : {
      City : {
        fn : 'Custom',
        opts : {
          against : function(v, args) {
            var def = $q.defer();
            var addr = $scope[$scope.modelName].Address;

            $scope.geo
                .getCityByName(v, addr.Region, addr.Country)
                .then(
                    function(city) {
                      var isValidCity = angular.isObject(city)
                          && city.Type === BWL.Model.City.Type;

                      if (isValidCity) {
                        if (!$scope[$scope.modelName].Address.Latitude
                            && !$scope[$scope.modelName].Address.Longitude) {
                          $scope[$scope.modelName].Address.Latitude = city.Latitude;
                          $scope[$scope.modelName].Address.Longitude = city.Longitude
                        }

                        def.resolve()
                      } else {
                        def.reject()
                      }
                    }, def.reject)

            return def.promise
          },
          failureMessage : $filter('t')('Common.Validation_City')
        }
      }
    }
  }

  $scope.addressChange = function() {
    var addr = angular.copy($scope[$scope.modelName].Address)

    var r = $scope.object.grep($scope.regions, 'ISO', addr.Region);
    var c = $scope.object.grep($scope.countries, 'ISO', addr.Country);
    addr.Region = addr.Region !== null && r !== null && r.Name || null
    addr.Country = addr.Country !== null && c !== null && c.Name || null

    $scope.relocateMap(addr)
  }

  $scope.init = function(address) {
    $scope.randId = Math.ceil(Math.random() * Date.now())

    $scope.loadCountries().then(
        function() {
          $scope.loadCountry(address).then(
              function() {
                if (angular.isDefined(address.Country)) {
                  // countries with additional behavior
                  $scope.isSpecialCountry = address.Country !== null
                      && address.Country.match(/^(?:US|UK|CA)$/g) !== null
                }
              })
        })
  }

  $scope.relocateMap = function(address) {
    $timeout(function() {
      jQuery('#' + $scope.randId).gmap(
          'search',
          {
            'address' : $filter('address')(address)
          },
          function(result, status) {
            if (status === 'OK') {
              var item = result[0] && result[0].resources
                  && result[0].resources[0] ? result[0].resources[0] : null;

              if (item !== null) {
                var location = new Microsoft.Maps.Location(
                    item.point.coordinates[0], item.point.coordinates[1]);

                jQuery('#' + $scope.randId).gmap('clear', 'markers')
                jQuery('#' + $scope.randId).gmap('set', 'bounds', null);

                jQuery('#' + $scope.randId).gmap('addMarker', {
                  'location' : location,
                  'bounds' : true
                });
              }
            }
          });
    }, 50)
  }

  $scope.initMap = function(address) {
    $timeout(function() {
      jQuery('#' + $scope.randId).gmap({
        'credentials' : $scope.config.keys.bing,
        'height' : 400,
        'width' : jQuery('#' + $scope.randId).parent('div').width()
      }).bind('init', function() {
        $scope.relocateMap(address)
      });
    }, 150)
  }

  $scope.loadContinents = function() {
    $scope.geo.getContinents().then(function(continents) {
      $scope.continents = continents;
    }, function(err) {
      $scope.error.log(err)
    });
  }

  $scope.getCities = function(cityName) {
    var def = $q.defer();

    if (cityName.trim().length >= $scope.config.typeahead.minLength) {
      var addr = $scope[$scope.modelName].Address;

      $scope.geo.findCitiesByName(cityName.trim(), addr.Region, addr.Country)
          .then(function(cities) {
            def.resolve(cities)
          }, function(err) {
            $scope.error.log(err)
          })

    } else {
      def.resolve([])
    }

    return def.promise
  }

  $scope.loadCountries = function(address, reset) {
    var _def = $q.defer()

    if ($scope.countries.length > 0) {
      // delay this a bit so we return the promise first
      $timeout(_def.resolve, 100)
    } else {
      // reset lists
      $scope.countries = [];
      $scope.regions = [];
      $scope.timezones = [];

      // reset address
      if (reset) {
        $scope.Country = null;
        address.City = null, address.AddressLine1 = null,
            address.AddressLine2 = null, address.Timezone = null,
            address.Region = null, address.PostalCode = null;
      }

      $scope.geo.getCountries().then(function(countries) {
        // prepend most used
        var c = [ 'CA', 'US', 'GB' ];
        $scope.countries = $scope.object.prioritizeSort(countries, c, 'ISO');
        _def.resolve()
      }, function(err) {
        _def.reject()
        $scope.error.log(err)
      });
    }

    return _def.promise;
  }

  $scope.loadTimezonesByCountry = function(address) {
    if (angular.isDefined(address.Country)) {
      $scope.geo.getTimezonesByCountry(address.Country).then(
          function(timezones) {
            $scope.timezones = timezones;
          }, function(err) {
            $scope.error.log(err)
          });
    }
  }

  $scope.loadCountry = function(address, triggeredFromCtrl) {
    var def = $q.defer()

    if (angular.isDefined(address) && angular.isDefined(address.Country)) {
      $scope.geo
          .loadCountry(address.Country)
          .then(
              function(country) {
                // anytime we change country, reset address
                if (triggeredFromCtrl) {
                  address.City = null, address.AddressLine1 = null,
                      address.AddressLine2 = null, address.Region = null,
                      address.Timezone = null, address.PostalCode = null;
                  address.Latitude = null, address.Longitude = null,
                      address.County = null, address.District = null,
                      $scope.regions = [], $scope.timezones = [];

                  // countries with additional behavior
                  $scope.isSpecialCountry = $scope[$scope.modelName].Address.Country
                      .match(/^(?:US|UK|CA)$/g) !== null
                }

                $scope.Country = country;
                address.tmpContinentIso = country.ContinentISO;

                if ($scope.countries.length === 0) {
                  $scope.loadCountries(address)
                }
                if ($scope.timezones.length === 0) {
                  $scope.loadTimezonesByCountry(address)
                }

                if (!country.HasPostalCodes || $scope.regions.length === 0) {
                  $scope.loadRegionsByCountry(address).then(
                      $scope.addressChange)
                } else {
                  $scope.addressChange();
                }

                def.resolve()
              }, function(err) {
                def.reject()
                $scope.error.log(err)
              });
    } else {
      def.resolve()
    }

    return def.promise
  }

  $scope.loadRegionsByCountry = function(address) {
    var def = $q.defer();

    if (angular.isDefined(address.Country)) {
      $scope.geo.getRegionsByCountry(address.Country).then(function(regions) {
        $scope.regions = regions;

        def.resolve()
      }, function(err) {
        $scope.error.log(err)

        def.reject(err)
      });
    }

    return def.promise;
  }

  $scope.getCityByPostalCode = function(address) {
    if (angular.isDefined(address.Country)
        && angular.isDefined(address.PostalCode) && address.PostalCode !== null
        && address.PostalCode.trim().length >= 3) {
      $scope.geo.getCityByPostalCode(address.Country, address.PostalCode).then(
          function(city) {
            // lookup timezone
            $scope.geo.getCityByName(city.CityName, city.RegionISO,
                city.CountryISO).then(
                function(city) {
                  if (angular.isDefined(city.Name)
                      && angular.isDefined(city.RegionISO)) {
                    address.City = city.Name;
                    address.Region = city.RegionISO;
                    address.Timezone = city.TimezoneName;
                    address.Latitude = city.Latitude
                    address.Longitude = city.Longitude

                    $scope.loadRegionsByCountry(address);
                    $scope.loadTimezonesByCountry(address);

                    $scope.addressChange();
                  }
                }, function(err) {
                  $scope.error.log(err)
                });
          }, function(err) {
            $scope.error.log(err)
          });
    }
  }
}

addressController.$inject = [ '$rootScope', '$scope', '$q', '$timeout',
    '$filter' ];
