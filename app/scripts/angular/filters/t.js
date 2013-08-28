/**
 * Custom locale/translation filter
 */
azureTicketsApp.filter('t', [
        '$window',
        function($window) {

            /**
             * @todo detect client lang and use the appropiate resources file
             * @method t
             * @param {string}
             *            Value to translate
             */
            return function(t) {
                if (!angular.isDefined(t)) {
                    return t;
                }
                var tt = t.split('.');
                var r = tt[0] + 'Resources';

                return angular.isDefined($window[r])
                        && angular.isDefined($window[r][tt[1]]) ? eval(r + '.'
                        + tt[1]) : t;
            };
        }
]);