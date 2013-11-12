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
    propFilter: '*',
    filteringObj: {},
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
          // Active = true to allow the QR to work
          Active : true,
          Description : $scope.ScanDevice.Description
        }).then(
          function(scanDeviceKey) {
            $scope.ScanDevice.Key = scanDeviceKey;
            $scope.wizardScanDevice.saved = true;

            // reload list
            $scope.init();
          }, function(err) {
            $scope.error.log(err)
          });
      } else {
        // update scanDevice
        $scope.scanner.updateScanDevice($scope.storeKey, $scope.ScanDevice)
            .then(
                function() {
                  $scope.wizardScanDevice.saved = true;
                  $scope.init();
                }, function(err) {
                  $scope.error.log(err)
                });
      }
    }
  }
  
  // Get QR image source
  $scope.getQR = function(ScanDevice) {
  	if (ScanDevice) {
  		return BWL.Server + '/scanner.svc/' + ScanDevice.StoreKey + '/config/' + ScanDevice.Key;
  	}
  }
  
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
  
  // Post update action
  $scope.postUpdate = function(successMessage) {
    $scope.successMessage = successMessage;
    	
    // Reload device list
    $scope.init();
	  
    // Hide the message in 1 seconds
    $timeout(function() {
      $scope.successMessage = '';
    }, 1000, false);
  }
  
  // Refresh the QR code after users scan it
  $scope.refreshQR = function(ScanDevice) {
  	if (ScanDevice && ScanDevice.Key) {
  		$scope.successMessage = '';
  		
  		// Reload the scanner then return a fresh copy
  		$scope.scanner.initScanDevice(ScanDevice.StoreKey, ScanDevice.Key)
  		  .then(function(newLoadedScanDevice) {
  		  	// Create a fresh copy
  		  	$scope.ScanDevice = newLoadedScanDevice;
  		  	
  		  	if (!$scope.isInfoEmpty(newLoadedScanDevice.DeviceInfo)) {
  		  	  $scope.postUpdate($filter('t')('Scanner.Text_RegisterSuccess'));
  		  	}
  		  }, function(err) {
  		  	$scope.error.log(err);
  		});
  	}
  }
  
  // Update device properties
  $scope.updateDevice = function(ScanDevice, propObject) {
  	if (ScanDevice && angular.isObject(propObject)) {
  		var propArray = [],
  		    informMessage = '',
  		    tempScanDevice = angular.copy(ScanDevice);
      $scope.successMessage = '';
      
  		for (var prop in propObject) {
  			// DeviceInfo can only be updated through QR scanning
  			if (prop != 'Key' && prop != 'DeviceInfo' && ScanDevice.hasOwnProperty(prop)) {
  				tempScanDevice[prop] = propObject[prop];
  				
  				// Prop changed array to display success message
  				propArray.push(prop);
  			}
  		}
  		
  		if ((propArray.length == 1) && (propArray[0] == 'Active') && (propObject[propArray[0]] == true)) {
  		  informMessage = $filter('t')('Scanner.Text_ActiveDevice');
  		} else if ((propArray.length == 1) && (propArray[0] == 'Active') && (propObject[propArray[0]] == false)) {
  		  informMessage = $filter('t')('Scanner.Text_DeactiveDevice');
  		} else {
  		  informMessage = $filter('t')('Scanner.Text_UpdateDevice');
  		}
  		
      if (propArray.length && confirm(informMessage)) {
    		// Update device
    		$scope.scanner.updateScanDevice($scope.storeKey, tempScanDevice)
    		  .then(function() {
    		  	angular.extend(ScanDevice, tempScanDevice);
    		  	
    		  	$scope.postUpdate($filter('t')('Scanner.Text_UpdateDeviceSuccess'));
    		  }, function(err) {
    		  	$scope.error.log(err);
    		});
      }
  	}
  }
  
  // Unregister device
  $scope.unregisterDevice = function(ScanDevice) {
  	if (ScanDevice) {
  		var tempScanDevice = angular.copy(ScanDevice);
      $scope.successMessage = '';
      
      if (confirm($filter('t')('Scanner.Text_UnregisterDevice'))) {
        tempScanDevice.DeviceInfo = {
          Name : '',
          UniqueID : '',
          Hardware : '',
          OS : '',
          Version : ''
        };
        // Activate the device so we can re-register through QR scanning
        tempScanDevice.Active = true;
        
    		// Unregister
    		$scope.scanner.updateScanDevice($scope.storeKey, tempScanDevice)
    		  .then(function() {
    		    // Reload the scanner
    		    $scope.scanner.initScanDevice(ScanDevice.StoreKey, ScanDevice.Key)
    		      .then(function(newLoadedScanDevice) {
    		        // Create a fresh copy
    		        $scope.ScanDevice = newLoadedScanDevice;
  		  	      
    		        $scope.postUpdate($filter('t')('Scanner.Text_UnRegisterSuccess'));
    		      }, function(err) {
    		        $scope.error.log(err);
    		    });
    		  }, function(err) {
    		  	$scope.error.log(err);
    		});
  		}
  	}
  }
}

scannerController.$inject = [ '$scope', '$cookieStore', '$filter', '$modal',
    '$routeParams', '$timeout' ];