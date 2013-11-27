// model service
azureTicketsApp.factory('modelService', [
    '$q',
    '$rootScope',
    '$timeout',
    function($q, $rootScope, $timeout) {
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
        read : function(type, key, level) {
          var def = $q.defer();

          BWL.Services.ModelService.ReadAsync('BWL', type, key, level,
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
        update : function(type, key, values) {
          var def = $q.defer();

          BWL.Services.ModelService.UpdateAsync('BWL', type, key, values,
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
        },
        associate : function(model, modelProp, relModel) {
          var def = $q.defer(), _this = this;

          BWL.Services.ModelService.AddAsync('BWL', model.Type, model.Key,
              modelProp, relModel.Type, relModel.Key, function(ret) {
                $rootScope.$apply(def.resolve)
              }, function(err) {
                $rootScope.$apply(function() {
                  def.reject(err)
                })
              });
          
          return def.promise;
        },
        associateObjectProp : function(storeKey, model, modelProp, relModel) {
          var def = $q.defer();

          BWL.Services.ModelService.AddAsync(storeKey, model.Type, model.Key,
              modelProp, relModel.Type, relModel.Key, function() {
                $rootScope.$apply(def.resolve);
              }, function(err) {
                $rootScope.$apply(function() {
                  def.reject(err);
                })
              });
          
          return def.promise;
        },
        associateList : function(storeKey, model, modelPropNameList) {
          var def = $q.defer(),
              _this = this;
          
          if (angular.isArray(modelPropNameList) && modelPropNameList.length) {
          	// BWL API seems to have problem with $q.all(promiseArr)
          	// when promiseArr.length > 2
          	// so use this as an alternative method
          	// to addAsync data of a list of properties of the same object
            var addAsyncPropertiesData = function(i, modelPropNameListLength) {
              _this.associateObjectProp(storeKey, model, modelPropNameList[i], model[modelPropNameList[i]]).then(
                function() {
                  if (i + 1 < modelPropNameListLength) {
                    addAsyncPropertiesData(i + 1, modelPropNameListLength);
                  }
            	  	
                  if (i + 1 == modelPropNameListLength) {
                    def.resolve();
                  }
                }, function(err) {
                  def.reject(err);
                }
              )
            }
            
            addAsyncPropertiesData(0, modelPropNameList.length);
          }
          
          return def.promise;
        }
      }
    } ]);