//
// Check URI uniqueness (category name, event name,...)
// Ex: <input name="Category_Name" type="text"
//       ng-model="Category.Name"
//       check-uniqueuri
//       required />
//
// Available error pointers:
// - modelCtrl.$setValidity('uniqueURI', false)	       : URI is already used
// - modelCtrl.$setValidity('finishGettingURI', false) : not yet check URI uniqueness
//

azureTicketsApp
  .directive(
    'checkUniqueuri',
    ['modelService',
    function(modelService) {
      return {
        restrict : 'A',
        require: 'ngModel',
        link : function($scope, $element, $attr, modelCtrl) {
        	
        	// These functions will fire
        	// for every input change
        	modelCtrl.$viewChangeListeners.push(function() {
        	  $scope.$eval(function() {
        	  	// Notify that the system needs to check URI uniqueness
        	  	modelCtrl.$setValidity('finishGettingURI', false);
        	  	
        	  	// If input is empty
        	  	// Not use 'blur' event for this
        	  	// because there's no name/URI to check
        	  	// System responds right away
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
        	  
        	  if (URI) {
          	  modelService.checkUniqueURI($scope.storeKey, URI).then(
        	      function(returnedURI) {
        	        // Ensure value that being checked hasn't changed
        	        if (objName == $element.val()) {
        	          if (returnedURI && returnedURI.ItemKey) { 
        	            modelCtrl.$setValidity('uniqueURI', false);
        	            modelCtrl.$setValidity('finishGettingURI', true);
        	          } else {
        	          	modelCtrl.$setValidity('uniqueURI', true);
        	          	modelCtrl.$setValidity('finishGettingURI', true);
        	          }
        	        }
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