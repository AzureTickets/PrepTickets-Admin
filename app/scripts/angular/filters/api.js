/**
 * API filter
 */
azureTicketsApp.filter('api', [ '$window', 'modelService',
    function($window, modelService) {

      var ret = null;

      return function(t, action, arg0, arg1) {
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
          return t
          break;
        // t: Key
        // 1st arg: model for Key
        // 2nd arg: property to display
        case 'modelReplace':
          var pp = arg1.split('.')

          if (ret === null) {
            modelService.read(BWL.Model[arg0].Type, t, 2).then(function(m) {
              ret = pp.length > 1 ? m[pp[0]][pp[1]] : m[pp[0]]
            }, function(err) {

            })

            return t
          } else {
            return ret;
          }
          break;
        }
      };
    } ]);