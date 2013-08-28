/**
 * Workaround for IE9, which ignores "required" attribute.
 */
azureTicketsApp.directive('atRequired', [
    '$compile',
    function($compile) {
      return {
        restrict : 'A',
        require : 'ngModel',
        link : function($scope, $element, $attrs, $ctrl) {
          $ctrl.$parsers.unshift(function(viewValue) {
            if (viewValue !== null && angular.isFunction(viewValue.trim)
                && viewValue.trim() !== '') {
              $ctrl.$setValidity('required', true);
              return viewValue;
            } else {
              $ctrl.$setValidity('required', false);
              return undefined;
            }
          });
        }
      }
    }
]);