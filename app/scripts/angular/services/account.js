// account service
azureTicketsApp.factory('accountService', [
    '$q',
    '$rootScope',
    '$cookieStore',
    '$timeout',
    'modelService',
    'configService',
    'objectService',
    'geoService',
    function($q, $rootScope, $cookieStore, $timeout, modelService,
        configService, objectService) {
      return {
        accessRequest : function(type, key, level) {
          var def = $q.defer();

          BWL.Services.AccountService.AccessRequestAsync(type, key, level,
              function(ret) {
                $rootScope.$apply(function() {
                  def.resolve(ret);
                });
              }, function(err) {
                $rootScope.$apply(function() {
                  def.reject(err)
                })
              });

          return def.promise;
        }
      }
    } ]);