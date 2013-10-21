function filterController($scope, $cookieStore, $filter, $routeParams,
    $timeout, $modal) {
  $scope.name = 'filter', $scope.fields = [], $scope.modelName = null,
      $scope.filterModel = null;

  $scope.$watch('modelName', function(v) {
    if (v !== null) {
      $scope.filterModel = $scope.model.getInstanceOf($scope.modelName);
      
      // Define data object based on modelName
      // For ex: modelName = 'Order'; dataObj will be $scope.orders ($scope[dataObj])
      // Angular will get $scope.orders from the orderController's scope
      switch (v) {
        case 'Order':
          dataObj = 'orders';
          break;
      };
    }
  });

  $scope.filterDialog = {
    open : false
  };

  $scope.$watch('filterDialog.open', function(v) {
    if (v) {
      $scope.filterDialog.modal = $modal.open({
        templateUrl : 'formFilter.html',
        scope : $scope,
        backdrop : 'static'
      });
    } else if (angular.isDefined($scope.filterDialog.modal)) {
      $scope.filterDialog.modal.close();
    }
  });

  $scope.search = function() {
  	// Get the form inputs
  	var inputs = $( "form[name='advancedFilterForm'] input" ),
  	    propObj = {},
  	    equalSearchPropObj = {},
  	    roofSearchPropObj = {},
  	    floorSearchPropObj = {};
  	
  	// If there are more than 2 input fields having the same objproperty, that means search that objproperty by range
  	// Get only 2 first inputs for the search, abort the rest
  	// Sample propObj: {"Placed": ["PlacedFromDate","PlacedToDate"], "Contact": ["Contact"], "Total.ItemPrice": ["Total.ItemPrice"], "State": ["State"]}
    angular.forEach(inputs, function(input, iIndex) {
    	var BWLModelProp = $(input).attr('objproperty'),
    	    filterModelProp = $(input).attr('id').slice(($scope.modelName + '_').length);
    	
    	if (!propObj.hasOwnProperty(BWLModelProp)) {
        propObj[BWLModelProp] = [filterModelProp];
      } else {
      	propObj[BWLModelProp].push(filterModelProp);
      };
    });
    
    // Get property value of the $scope.filterModel
    // It get the proper property value when receiving property names like 'Total.ItemPrice', 'mainProp.level1Prop.level2Prop.level3Prop'
    var getPropValue = function(prop) {
 			var propValue = null;

 			if (prop.indexOf('.') > -1) {
 				var propParts = prop.split('.');
				
 				var getDeepestPropValue = function(currentPropValue, nextLevelPropName) {
 					if (currentPropValue[nextLevelPropName]) {
 					  return currentPropValue[nextLevelPropName];
 				  } else {
 				  	return null;
 				  };
 				};
 				
 				if (propParts.length >= 2) {
 					if ($scope.filterModel[propParts[0]]) {
 						propValue = $scope.filterModel[propParts[0]];
 					  for (var i = 1; i < propParts.length; i++) {
 						  propValue = getDeepestPropValue(propValue, propParts[i]);
 					  };
 				  } else {
 				  	propValue = null;
 				  };
        };
			} else {
 			  propValue = $scope.filterModel[prop];
 		  };
 		  
 		  return propValue;
    };

    // After users enter something into the fields, the $scope.filterModel is populated.
    // Use its property values to search (by property)
    for (var prop in propObj) {
    	if (propObj.hasOwnProperty(prop)) {
    		// Single property search
    		if (propObj[prop].length == 1) {
          var propValue = getPropValue(prop);
    		  
    		  if (propValue) {
    		  	equalSearchPropObj[prop] = propValue;
    		  };
    		// Search by range
    		} else if (propObj[prop].length > 1) {
    			// Select the first 2 values of one search-by-range object property
    			var twoFirstProps = propObj[prop].slice(0, 2);
    			
    			// Get the smaller and bigger values
    			var prop1Value = getPropValue(propObj[prop][0]),
    			    prop2Value = getPropValue(propObj[prop][1]);
    			
    			if (prop1Value != null || prop2Value != null) {
    				if (prop1Value == null) {
    					roofSearchPropObj[prop] = prop2Value;
    				} else if (prop2Value == null) {
    					roofSearchPropObj[prop] = prop1Value;
    				} else {
    					if (prop1Value <= prop2Value) {
    						roofSearchPropObj[prop] = prop2Value;
    						floorSearchPropObj[prop] = prop1Value;
    					} else {
    						roofSearchPropObj[prop] = prop1Value;
    						floorSearchPropObj[prop] = prop2Value;
    					};
    				};
    			};
    		};
    	};
    };
    
    $scope.pagination.pageItems = function() {
  	  return (// Less-than compare
  	          $filter('filter')(// Bigger-than compare
  	                            $filter('filter')(// Equal compare
  	                                              $filter('filter')($scope[dataObj], equalSearchPropObj, true),
  	                                              floorSearchPropObj,
  	                                              function(obj, text) {
  	                                              	for (var objKey in text) {
  	                                              	  if (obj.objKey < text.objKey) {
  	                                              	    	return false;
  	                                              	  };
  	                                              	};
  	                                              	return true;
  	                           	                  }),
  	                           	roofSearchPropObj,
  	                           	function(expectedVal, actualVal) {
  	                           	  return true;// return expectedVal.Placed <= actualVal;
  	                           	})
  	         ).slice(0, $scope.pagination.pageSize);
    };

    // Test only
    $scope.xxx = equalSearchPropObj;
    $scope.yyy = floorSearchPropObj;
    $scope.zzz = roofSearchPropObj;
    $scope.sss = propObj;
    
  }
}
filterController.$inject = [ '$scope', '$cookieStore', '$filter',
    '$routeParams', '$timeout', '$modal' ];
