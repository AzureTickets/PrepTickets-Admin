//
// Check URI uniqueness (category name, event name,...)
// Ex: <input name="Category_Name" type="text"
//       ng-model="Category.Name"
//       check-uniqueuri="Category"
//       required />
//
// Available error pointers:
// - modelCtrl.$setValidity('uniqueURI', false)	       : URI is already used
// - modelCtrl.$setValidity('finishGettingURI', false) : not yet done checking URI uniqueness
// - modelCtrl.$setValidity('startGettingURI', false)  : start checking URI (for "Checking..." message display)
//
// This directive will work with objects having "CustomURI" property
// like "Category, Event, Ticket,..."
//

azureTicketsApp
  .directive(
    'checkUniqueuri',
    ['modelService', '$parse',
    function(modelService, $parse) {
      return {
        restrict: 'A',
        require: 'ngModel',
        link: function($scope, $element, $attr, modelCtrl) {
        	
        	var objToCheckURI = $parse($attr.checkUniqueuri)($scope);
        	// If we are updating an object, get a URI copy for later comparison
        	if (objToCheckURI && objToCheckURI.Key) {
        		var oldURI = objToCheckURI.CustomURI.URI;
        	}
        	
        	// These functions will fire
        	// for every input change
        	modelCtrl.$viewChangeListeners.push(function() {
        	  $scope.$eval(function() {
        	  	// Notify that the system needs to check URI uniqueness
        	  	modelCtrl.$setValidity('finishGettingURI', false);
        	  	
        	  	// If input is empty
        	  	// Not use 'blur' event for this
        	  	// because there's no name/URI to check
        	  	// And system needs to respond right away
        	  	if (!$element.val()) {
        	  	  modelCtrl.$setValidity('uniqueURI', true);
        	  	  modelCtrl.$setValidity('finishGettingURI', true);
        	    }
        	  })
        	})
        	
        	// When users loose focus on the input, check URI uniqueness
        	// If input is empty (URI == ''), leave the control to the above viewChangeListener
        	$element.bind('blur', function (event) {
        	  if (!$scope.storeKey || !modelCtrl) return;
        	  
        	  var objName = $element.val(),
        	      URI = objName != null
        	        ? angular.lowercase(objName.replace(/[^a-z0-9\-]{1,}/gi, '-'))
        	        : '';
        	  
        	  $scope.$apply(function() {
        	  	if (URI) {
        	      modelCtrl.$setValidity('startGettingURI', false);
        	    } else {
        	    	modelCtrl.$setValidity('startGettingURI', true);
        	    }
        	  })
        	  
        	  // Start getting URI
        	  if (URI) {
          	  modelService.checkUniqueURI($scope.storeKey, URI).then(
        	      function(returnedURI) {
        	        // Ensure value that being checked hasn't changed
        	        if (objName == $element.val()) {
        	        	// If there's already an existing URI
        	          if (returnedURI && returnedURI.ItemKey) {
        	          	if (oldURI && oldURI == returnedURI.URI) {
        	          	  modelCtrl.$setValidity('uniqueURI', true);
        	          	} else {
        	          		modelCtrl.$setValidity('uniqueURI', false);
        	          	}
        	          // Or not yet
        	          } else {
        	          	modelCtrl.$setValidity('uniqueURI', true);
        	          }
        	        }
        	        
        	        // Notify that getting URI is done
        	        modelCtrl.$setValidity('finishGettingURI', true);
        	        modelCtrl.$setValidity('startGettingURI', true);
        	      }, function(err) {
        	        $scope.error.log(err);
        	      }
          	  )
        	  }
        	})
        }
      }
    }]
  );