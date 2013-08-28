function addressController($scope) {
  $scope.countries = [], $scope.continents = [], $scope.regions = [],
      $scope.timezones = [];

  $scope.$on('loadCountry', function(ev, address) {
    $scope.loadCountry(address);
  });

  $scope.loadContinents = function() {
    $scope.geo.getContinents().then(function(continents) {
      $scope.continents = continents;
    }, function(err) {
      $scope.error.log(err)
    });
  }

  $scope.loadCountriesByContinent = function(address, reset) {
    if (angular.isDefined(address.tmpContinentIso)) {
      var continentIso = address.tmpContinentIso;

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

      $scope.geo.getCountriesByContinent(continentIso).then(
          function(countries) {
            // prepend most used
            var c = [
                'CA', 'US', 'GB'
            ];
            $scope.countries = $scope.object
                .prioritizeSort(countries, c, 'ISO');
          }, function(err) {
            $scope.error.log(err)
          });
    }
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

  $scope.loadCountry = function(address) {
    if (angular.isDefined(address) && angular.isDefined(address.Country)) {
      $scope.geo.loadCountry(address.Country).then(function(country) {
        $scope.Country = country;
        address.tmpContinentIso = country.ContinentISO;

        if (!country.HasPostalCodes) {
          $scope.loadRegionsByCountry(address)
        }
        if ($scope.countries.length === 0) {
          $scope.loadCountriesByContinent(address)
        }
        if ($scope.timezones.length === 0) {
          $scope.loadTimezonesByCountry(address)
        }
      }, function(err) {
        $scope.error.log(err)
      });
    }
  }

  $scope.loadRegionsByCountry = function(address) {
    if (angular.isDefined(address.Country)) {
      $scope.geo.getRegionsByCountry(address.Country).then(function(regions) {
        $scope.regions = regions;
      }, function(err) {
        $scope.error.log(err)
      });
    }
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
                    $scope.loadRegionsByCountry(address);
                    $scope.loadTimezonesByCountry(address);
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

addressController.$inject = [
  '$scope'
];