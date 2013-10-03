/**
 * API filter
 */
azureTicketsApp.filter('api', [ '$window', function($window) {

  return function(t, action, arg0) {
    if (!angular.isDefined(t) || !angular.isDefined(action)) {
      return t;
    }

    switch (action) {
    case 'enumReplace':
      if (angular.isDefined(arg0)) {
        var e = BWL.ModelEnum[arg0];
        for ( var p in e) {
          if (e[p] === parseInt(t))
            t = p
        }
      }
      break;
    }

    return t;
  };
} ]);