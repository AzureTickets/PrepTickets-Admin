function venueController($rootScope, $scope, $timeout, $cookieStore, $filter,
    $q, $modal) {
  $scope.name = 'venue';
  
  // initialize wizard for Venue
  $scope.wizardVenue = $scope.form.getWizard($scope);
  
  // Pagination setup
  $scope.pagination = {
    pageSize : 20,
    startRange : 0,
    predicates : ['Name'],
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
  // Largeimages property pagination
  $scope.paginationLI = angular.copy($scope.pagination);
  
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
        // Create new place
        // API claims not null properties
        $scope.model.nonNull($scope.Place.Address);

        var newPlace = {
          Public : true,
          Name : $scope.Place.Name,
          Description : $scope.Place.Description,
          Address : $scope.Place.Address
        }
        
        $scope.place.createPlace($scope.storeKey, newPlace).then(
            function(placeKey) {
              if (angular.isString(placeKey)) {
                $scope.Place.Key = placeKey;
                
                if ($scope.Place.Icon || $scope.Place.SmallImage || $scope.Place.Image) {
                  var imagePropNameList = [];
                  if ($scope.Place.Icon && $scope.Place.Icon.Key) {
                    imagePropNameList.push('Icon');
                  }
                  if ($scope.Place.SmallImage && $scope.Place.SmallImage.Key) {
                    imagePropNameList.push('SmallImage');
                  }
                  if ($scope.Place.Image && $scope.Place.Image.Key) {
                    imagePropNameList.push('Image');
                  }
                	    
                  if (imagePropNameList.length) {
                    $scope.model.associateSingleDatatypePropList($scope.storeKey, $scope.Place, imagePropNameList).then(
                      function() {
                        if ($scope.Place.LargeImages && angular.isArray($scope.Place.LargeImages) && $scope.Place.LargeImages.length) {
                          $scope.model.updateListDataTypeProp($scope.storeKey, {}, $scope.Place, 'LargeImages').then(
                            function() {
                              $scope.wizardVenue.saved = true;
                              
                              // Reload list
                              $scope.init();
                            }, function(err) {
                              $scope.error.log(err);
                            }
                          )
                        } else {
                          $scope.wizardVenue.saved = true;
                          
                          // Reload list
                          $scope.init();
                        }
                      }, function(err) {
                        $scope.error.log(err);
                      }
                    )
                  }
                } else {
                  if ($scope.Place.LargeImages && angular.isArray($scope.Place.LargeImages) && $scope.Place.LargeImages.length) {
                    $scope.model.updateListDataTypeProp($scope.storeKey, {}, $scope.Place, 'LargeImages').then(
                      function() {
                        $scope.wizardVenue.saved = true;
                        
                        // Reload list
                        $scope.init();
                      }, function(err) {
                        $scope.error.log(err);
                      }
                    )
                  } else {
                    $scope.wizardVenue.saved = true;
                    
                    // Reload list
                    $scope.init();
                  }
                }
              }
            }, function(err) {
              $scope.error.log(err)
            })
      } else {
      	// Update existing Place (Venue)
      	// Function to update Address (remove then add new)
        var _updateAddress = function(place, oldAddress, newAddress) {
          $scope.geo.updateAddress($scope.storeKey, place, oldAddress, newAddress).then(
            function() {
              $scope.wizardVenue.saved = true;
              
              // Reload list
              $scope.init();
            }, function(err) {
              $scope.error.log(err);
            }
          )
        }
        
        // Update place
        $scope.place.updatePlace($scope.storeKey, $scope.Place).then(
          function(place) {
            if ($scope.Place.Icon || $scope.Place.SmallImage || $scope.Place.Image) {
              var imagePropNameList = [];
              if ($scope.Place.Icon && $scope.Place.Icon.Key) {
                if (!angular.isDefined($scope._tempPlace.Icon) || $scope.Place.Icon.Key != $scope._tempPlace.Icon.Key) {
                  imagePropNameList.push('Icon');
                }
              }
              if ($scope.Place.SmallImage && $scope.Place.SmallImage.Key) {
                if (!angular.isDefined($scope._tempPlace.SmallImage) || $scope.Place.SmallImage.Key != $scope._tempPlace.SmallImage.Key) {
                  imagePropNameList.push('SmallImage');
                }
              }
              if ($scope.Place.Image && $scope.Place.Image.Key) {
                if (!angular.isDefined($scope._tempPlace.Image) || $scope.Place.Image.Key != $scope._tempPlace.Image.Key) {
                  imagePropNameList.push('Image');
                }
              }
              
              if (imagePropNameList.length) {
                $scope.model.associateSingleDatatypePropList($scope.storeKey, $scope.Place, imagePropNameList).then(
                  function() {
                    $scope.model.updateListDataTypeProp($scope.storeKey, $scope._tempPlace, $scope.Place, 'LargeImages').then(
                      function() {
                        _updateAddress(place, $scope._tempPlace.Address, $scope.Place.Address);
                      }, function(err) {
                        $scope.error.log(err);
                      }
                    )
                  }, function(err) {
                    $scope.error.log(err);
                  }
                )
              } else {
                $scope.model.updateListDataTypeProp($scope.storeKey, $scope._tempPlace, $scope.Place, 'LargeImages').then(
                  function() {
                    _updateAddress(place, $scope._tempPlace.Address, $scope.Place.Address);
                  }, function(err) {
                    $scope.error.log(err);
                  }
                )
              }
            } else {
              $scope.model.updateListDataTypeProp($scope.storeKey, $scope._tempPlace, $scope.Place, 'LargeImages').then(
                function() {
                  _updateAddress(place, $scope._tempPlace.Address, $scope.Place.Address);
                }, function(err) {
                  $scope.error.log(err);
                }
              )
            }
          }, function(err) {
            $scope.error.log(err);
          }
        );
      }
    }
  }
}

venueController.$inject = [ '$rootScope', '$scope', '$timeout', '$cookieStore',
    '$filter', '$q', '$modal' ];