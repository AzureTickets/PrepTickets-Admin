function scannerController($scope, $cookieStore, $filter, $modal, $routeParams, $timeout) {
  $scope.name = 'scanner';

  // initialize wizard for ScanDevice
  $scope.wizardScanDevice = $scope.form.getWizard($scope);
  
  // Pagination setup
  $scope.pagination = {
    pageSize: 20,
    predicates: [],
    pageItems: function() {},
    textFilter: '',
    sort: function() {},
    currentPageIndex: 0,
    results: [],
    numberOfPages: 0
  };

  $scope.$watch('wizardScanDevice.open', function(v) {
    if (v) {
      $scope.wizardScanDevice.modal = $modal.open({
        templateUrl : 'formScanDevice.html',
        scope : $scope,
        backdrop : 'static'
      });
    } else if (angular.isDefined($scope.wizardScanDevice.modal)) {
      $scope.wizardScanDevice.modal.close();
    }
  })

  $scope.init = function(resetEvent) {
    if (!angular.isDefined(resetEvent) || resetEvent) {
      $scope.loadEvent();
    }

    $scope.scanner.loadScanDevices($scope);
  }

  // load event
  $scope.loadEvent = function() {
    if (angular.isDefined($routeParams.eventKey)) {
      $scope.Event = $scope.object.grep($scope.events, 'Key',
          $routeParams.eventKey);
    }
  }

  $scope.filterByEvent = function(scanDevice) {
    var t = angular.isDefined($scope.Event) && $scope.Event !== null ? $scope.object
        .grep($scope.Event.Items, 'Key', scanDevice.Key)
        : null;

    if (t === null)
      return true;

    return angular.isObject(t) && angular.equals(t.Key, scanDevice.Key);
  }

  $scope.update = function(scanDevice) {
    $scope.ScanDevice = angular.copy(scanDevice);
    $scope.wizardScanDevice.open = true;
    $scope.wizardScanDevice.reset();
  }

  $scope.create = function() {
    $scope.ScanDevice = $scope.model.getInstanceOf('ScanDevice');
    $scope.ScanDevice.tmpEvents = [];
    $scope.ScanDevice._tmpEvents = angular.copy($scope.ScanDevice.tmpEvents);
    $scope.wizardScanDevice.open = true;
    $scope.wizardScanDevice.reset();
  }

  $scope.deleteScanDevice = function(scanner) {
    if (confirm($filter('t')('Common.Text_RemoveProduct'))) {
      $scope.scanner.deleteScanDevice($scope.storeKey, scanner.Key).then(
          function() {
            $scope.init(true);
          }, function(err) {
            $scope.error.log(err)
          });
    }
  }

  /**
   * Options for the events selector widget. select2 doesn't work properly on
   * "multiple" mode, so we need to update model manually and do other hacks.
   */
  // @todo make this part of the atfield directive
  $scope.evEvents = function() {
    var el = jQuery('[name=ScanDevice_tmpEvents]').first();
    // watch for changes
    jQuery(el).on(
        'change',
        function(c) {
          $scope.$apply(function() {
            var a = c.added || null;
            var r = c.removed || null;

            // adding child cat
            if (a !== null) {
              $scope.ScanDevice._tmpEvents.push($scope.object
                  .undoFormatSelect2(a, BWL.Model.ScanDevice.Type));
            }
            // removing child cat
            if (r !== null) {
              $scope.object.remove($scope.ScanDevice._tmpEvents, 'Key', r.id);
              $scope.object.remove($scope.ScanDevice.tmpEvents, 'Key', r.id);
            }

            if ($scope.ScanDevice._tmpEvents.length === 0) {
              jQuery(el).select2('data', []);
            }
          });
        });
  }
  $scope.optsSelEvents = {
    containerCssClass : 'input-xlarge',
    multiple : true,
    initSelection : function(element, callback) {
      $scope.evEvents();
      callback($scope.ScanDevice._tmpEvents.map($scope.object.formatSelect2));
    },
    query : function(query) {
      query.callback({
        results : $scope.events.map($scope.object.formatSelect2)
      });
    },
  }

  $scope.save = function() {
    if ($scope.wizardScanDevice.finished) {
      $scope.wizardScanDevice.saved = false;

      if ($scope.ScanDevice.Key === null) {
        // go on and create
        $scope.scanner.createScanDevice($scope.storeKey, {
          Public : true,
          Name : $scope.ScanDevice.Name,
          Brief : $scope.ScanDevice.Brief,
          Active : ($scope.ScanDevice.Active ? true : false),
          Description : $scope.ScanDevice.Description,
          Events : $scope.ScanDevice._tmpEvents.map(function(v) {
            return {
              Key : v.Key
            }
          })
        }).then(
            function(scanDeviceKey) {
              $scope.ScanDevice.Key = scanDeviceKey;

              if ($scope.ScanDevice.Image && $scope.ScanDevice.Image.Key) {
                $scope.model.associate($scope.ScanDevice, 'Image',
                    $scope.ScanDevice.Image).then(function() {
                  $scope.wizardScanDevice.saved = true;

                  // reload list
                  $scope.init();
                }, function(err) {
                  $scope.error.log(err)
                })
              } else {
                $scope.wizardScanDevice.saved = true;

                // reload list
                $scope.init();
              }
            }, function(err) {
              $scope.error.log(err)
            });
      } else {
        // update scanDevice

        // update events
        var _finishes = function() {
          $scope.scanner.deleteEvents($scope.storeKey, $scope.ScanDevice).then(
              function() {
                $scope.scanner.addEvents($scope.storeKey, $scope.ScanDevice)
                    .then(function() {
                      $scope.wizardScanDevice.saved = true;
                      $scope.init();
                    }, function(err) {
                      $scope.error.log(err)
                    });
              }, function(err) {
                $scope.error.log(err)
              });
        }

        $scope.scanner.updateScanDevice($scope.storeKey, $scope.ScanDevice)
            .then(
                function() {
                  if ($scope.ScanDevice.Image && $scope.ScanDevice.Image.Key) {
                    $scope.model.associate($scope.ScanDevice, 'Image',
                        $scope.ScanDevice.Image).then(_finishes, function(err) {
                      $scope.error.log(err)
                    })
                  } else {
                    _finishes();
                  }
                }, function(err) {
                  $scope.error.log(err)
                });
      }
    }
  }
  
  // Server path for getting QR code
  $scope.serverPath = BWL.Server;
  
  // Function to check if DeviceInfo of a device is empty
  $scope.isInfoEmpty = function(DeviceInfo) {
  	if (DeviceInfo == null || DeviceInfo == {}) {
  		return true;
  	} else {
  		var isEmpty = true;
  		for (var i in DeviceInfo) {
  		  if (i != 'Type' && DeviceInfo[i] != null && DeviceInfo[i] != '') {
  		  	isEmpty = false;
  		  }
    	}
    	
    	return isEmpty;
  	}
  }
  
  // Update device properties
  $scope.updateDevice = function(ScanDevice, propObject) {
  	if (ScanDevice && angular.isObject(propObject)) {
      $scope.updateSuccess = false;
      
  		for (var prop in propObject) {
  			if (prop != 'DeviceInfo' && ScanDevice.hasOwnProperty(prop)) {
  				ScanDevice[prop] = propObject[prop];
  			}
  		}
  		
  		// Update device
  		$scope.scanner.updateScanDevice($scope.storeKey, ScanDevice)
  		  .then(function() {
	  	  	$scope.updateSuccess = true;
	  	  	
	  	  	// Reload device list
	  	  	$scope.init();
	  	  	
	  	  	// Hide the message in 3 seconds
	  	  	$timeout(function() {
	  	  		$scope.updateSuccess = false;
	  	  	}, 1000, false);
  		  }, function() {
  		  	$scope.error.log(err)
  		});
  	}
  }
  
  // Unregister device
  $scope.unregisterDevice = function(ScanDevice) {
  	if (ScanDevice) {
      $scope.updateSuccess = false;
      
      if (confirm($filter('t')('Scanner.Text_UnregisterDevice'))) {
        ScanDevice.DeviceInfo = {
          Name : '',
          UniqueID : '',
          Hardware : '',
          OS : '',
          Version : ''
        };
        ScanDevice.Active = false;
        
    		// Update device
    		$scope.scanner.updateScanDevice($scope.storeKey, ScanDevice)
    		  .then(function() {
	    	  	$scope.updateSuccess = true;
	  	  	  
	    	  	// Reload device list
	    	  	$scope.init();
	  	  	  
  	  	  	// Hide the message in 3 seconds
	    	  	$timeout(function() {
	    	  		$scope.updateSuccess = false;
	    	  	}, 1000, false);
    		  }, function() {
    		  	$scope.error.log(err)
    		});
  		}
  	}
  }
}

scannerController.$inject = [ '$scope', '$cookieStore', '$filter', '$modal',
    '$routeParams', '$timeout' ];