/**
 * 
 * This directive will change mouse style
 * useful when used with ng-click on elements different from '<a>'
 * to show users something different about the element
 * Ex: mousestyle="help", mousestyle="wait",...
 * Default style is 'pointer'
 * 
 */
azureTicketsApp
  .directive(
    'mousestyle',
    function() {
      return {
        restrict : 'EA',
        link : function($scope, $element, $attr) {
        	var cursorStyle = $attr.mousestyle;
        	
        	angular.isString(cursorStyle) && cursorStyle != ''
        	  ? $element.css('cursor', cursorStyle)
        	  : $element.css('cursor', 'pointer');
        }
      }
    }
  );