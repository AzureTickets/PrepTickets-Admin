/**
 * Strip out HTML tags
 */
azureTicketsApp.filter('striptags',
  function() {

    return function(string) {
      if (!angular.isString(string)) {
      	return string;
      } else {
      	return string.replace(/(<([^>]+)>)/ig,"");
      }
    }
    
  }
);