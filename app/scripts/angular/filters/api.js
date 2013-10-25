/**
 * API filter
 */
azureTicketsApp.filter('api', [ '$window', '$q', '$timeout',
    function($window, $q, $timeout) {

      return function(t, action, arg0, arg1) {
        if (!angular.isDefined(t) || !angular.isDefined(action)) {
          return t;
        }

        var def = $q.defer();

        switch (action) {
        case 'enumReplace':
          if (angular.isDefined(arg0)) {
            var e = BWL.ModelEnum[arg0];
            for ( var p in e) {
              if (e[p] === parseInt(t))
                t = p
            }
          }

//          $timeout(function() {
//            t = 'aasdasdsad';
//          }, 500)
          break;
        // t: Key
        // 1st arg: model for Key
        // 2nd arg: property to display
        case 'modelReplace':
          break;
        }

        return t
      };
    } ]);