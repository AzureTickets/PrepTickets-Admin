function venueController($rootScope, $scope, $timeout, $cookieStore, $filter,
    $q, $modal) {
  $scope.name = 'venue';
  
  // initialize wizard for Venue
  $scope.wizardVenue = $scope.form.getWizard($scope);
  
  // Pagination setup
  $scope.pagination = {
    pageSize : 20,
    startRange : 0,
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
  
  $scope.$watch('wizardVenue.open', function(v) {
    if (v) {
      $scope.wizardVenue.modal = $modal.open({
        templateUrl : 'formVenue.html',
        scope : $scope,
        backdrop : 'static'
      });
    } else if (angular.isDefined($scope.wizardVenue.modal)) {
      $scope.wizardVenue.modal.close();
    }
  })
  
  $scope.$watch('wizardVenue.saved', function(v) {
    if (v) {
      $scope.wizardVenue.checkStep = {}
    }
  })
  
  $scope.init = function() {
    $rootScope.$broadcast('initStore', $scope.Store.Key)
  }
  
  $scope.update = function(venue) {
    $scope.Place = venue;
    // Temporary Place to track image changes
    $scope._tempPlace = angular.copy(venue);
    
    $scope.wizardVenue.open = true;
    $scope.wizardVenue.reset();
  }
  
  $scope.create = function() {
    // initialize props
    $scope.Place = $scope.model.getInstanceOf('Place');
    $scope.Place.Address = $scope.model.getInstanceOf('Address');
    $scope.wizardVenue.open = true;
    $scope.wizardVenue.reset();
  }
  
  $scope.deleteVenue = function(venue) {
    if (confirm($filter('t')('Common.Text_RemoveProduct'))) {
      $scope.place.deletePlace($scope.storeKey, venue)
          .then(
              function() {
                // delete address
                if (angular.isDefined(venue.Address)
                    && venue.Address.Key !== null) {
                  $scope.geo.deleteAddress($scope.storeKey, venue.Address.Key)
                      .then(function() {
                        $scope.wizardVenue.open = false;
                        $scope.init();
                      }, function(err) {
                        $scope.error.log(err)
                      });
                } else {
                  $scope.init();
                }
              }, function(err) {
                $scope.error.log(err)
              });
    }
  }
  
  $scope.save = function() {
    if ($scope.wizardVenue.finished) {
      $scope.wizardVenue.saved = false;

      if ($scope.Place.Key === null) {
        // create place

        // API claims not null properties
        $scope.model.nonNull($scope.Place.Address);

        var newPlace = {
          Public : true,
          Name : $scope.Place.Name,
          Description : $scope.Place.Description,
          Address : $scope.Place.Address
        };

        $scope.place.createPlace($scope.storeKey, newPlace).then(
            function(placeKey) {
              if (angular.isString(placeKey)) {
                $scope.Place.Key = placeKey;

                if ($scope.Place.Image && $scope.Place.Image.Key) {
                  $scope.model.associate($scope.Place, 'Image',
                      $scope.Place.Image).then(function() {
                    $scope.wizardVenue.saved = true;

                    // reload list
                    $scope.init();
                  }, function(err) {
                    $scope.error.log(err)
                  })
                } else {
                  $scope.wizardVenue.saved = true;

                  // reload list
                  $scope.init();
                }
              }
            }, function(err) {
              $scope.error.log(err)
            });
      } else {
        var _updateAddress = function(place) {
          $scope.geo.updateAddress(place.Address).then(function(ret) {
            $scope.wizardVenue.saved = true;

            // reload list
            $scope.init();
          }, function(err) {
            $scope.error.log(err)
          });
        }

        // update place
        $scope.place.updatePlace($scope.storeKey, $scope.Place).then(
            function(place) {
              if ($scope.Place.Image && $scope.Place.Image.Key) {
                $scope.model.associate($scope.Place, 'Image',
                    $scope.Place.Image).then(function() {
                  _updateAddress(place);
                }, function(err) {
                  $scope.error.log(err)
                })
              } else {
                _updateAddress(place);
              }

            });
      }
    }
  }
}

venueController.$inject = [ '$rootScope', '$scope', '$timeout', '$cookieStore',
    '$filter', '$q', '$modal' ];