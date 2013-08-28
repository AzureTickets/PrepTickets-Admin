// permission service
azureTicketsApp.factory('permService', [
    'authService',
    function(authService) {
      return {
        canRead : function(model) {
          if (angular.isDefined(model.Type)
              && angular.isDefined(BWL.ModelMeta[model.Type])) {
            var m = BWL.ModelMeta[model];

            if (m.__perms.Read === 0) {
              return true;
            }
            var p = authService.getDomainProfile();
            return p.ProfileRole >= m.__perms.Read;
          }

          return false;
        }
      }
    }
]);