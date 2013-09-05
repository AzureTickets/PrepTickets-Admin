// model service
azureTicketsApp.factory('modelService', [
    '$q',
    '$rootScope',
    function($q, $rootScope) {
      return {
        /**
         * Returns a new instance of the specified model.
         * 
         * @param modelName
         *          Model instance to retrieve
         * @param tmpAttrs
         *          Additional attributes to add to the new instance.
         * @param alias
         *          Alias used in BWL, used to retrieve loaded instance.
         * @param force
         *          Force to load a new & clean copy of the model.
         * @returns
         */
        getInstanceOf : function(modelName, tmpAttrs, alias, force) {
          var o = {}, force = angular.isDefined(force) ? force : false;
          var a = alias && alias !== null ? alias : modelName;

          if (!force && angular.isDefined(BWL[a]) && BWL[a] !== null) {
            o = BWL[a]
          } else if (angular.isDefined(BWL.Model[modelName])) {
            o = angular.copy(BWL.Model[modelName]);
          }
          if (angular.isDefined(tmpAttrs) && tmpAttrs !== null) {
            angular.extend(o, tmpAttrs);
          }

          return o;
        },
        find : function(model, page) {
          var def = $q.defer();
          var type = model.Type || null;
          delete model.Type;

          this.nonNull(model);

          BWL.Services.ModelService.FindAsync('BWL', type, page, model,
              function(ret) {
                $rootScope.$apply(function() {
                  def.resolve(ret)
                })
              }, function(err) {
                $rootScope.$apply(function() {
                  def.reject(err)
                })
              });

          return def.promise;
        },
        nonNull : function(model) {
          for ( var p in model) {
            if (model[p] === null) {
              delete model[p];
            }
          }
        }
      }
    } ]);