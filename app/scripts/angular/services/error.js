// error service
azureTicketsApp.factory('errorService', [
    '$rootScope', function($rootScope) {
      return {
        /**
         * Displays an error message.
         * 
         * @method log
         * @param modelName
         *          Model instance to retrieve
         */
        log : function(msg) {
          $rootScope.errorMsg = msg;
        }
      }
    }
]);