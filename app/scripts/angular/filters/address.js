/**
 * Address normalization filter
 */
azureTicketsApp
    .filter(
        'address',
        [
            '$window',
            function($window) {

              return function(t) {
                if (!angular.isDefined(t)
                    || (angular.isDefined(t.Type) && t.Type !== BWL.Model.Address.Type)) {
                  return t;
                }
                var a = [ t.AddressLine1, t.AddressLine2, t.City, t.PostalCode ]
                return a.filter(Boolean).join(', ');
              };
            } ]);