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
        updateObjectProp : function(storeKey, model, propName, relModel, remove) {
          var def = $q.defer();
          
          if (!angular.isDefined(remove) || !remove) {
            BWL.Services.ModelService.AddAsync(storeKey, model.Type, model.Key,
              propName, relModel.Type, relModel.Key, function() {
                $rootScope.$apply(def.resolve);
              }, function(err) {
                $rootScope.$apply(function() {
                  def.reject(err);
                })
              });
          } else {
          	BWL.Services.ModelService.RemoveAsync(storeKey, model.Type, model.Key,
              propName, relModel.Type, relModel.Key, function() {
                $rootScope.$apply(def.resolve);
              }, function(err) {
                $rootScope.$apply(function() {
                  def.reject(err);
                })
              });
          }
          
          return def.promise;
        },
        associateSingleDatatypePropList : function(storeKey, model, propNameList) {
          var def = $q.defer(),
              _this = this;
          
          if (angular.isArray(propNameList) && propNameList.length) {
          	// BWL API seems to have problem with $q.all(promiseArr)
          	// when promiseArr.length > 2
          	// so use this as an alternative method
          	// to addAsync data of a list of properties of the same object
            var addAsyncPropertiesData = function(i, propNameListLength) {
              _this.updateObjectProp(storeKey, model, propNameList[i], model[propNameList[i]]).then(
                function() {
                  if (i + 1 < propNameListLength) {
                    addAsyncPropertiesData(i + 1, propNameListLength);
                  }
            	  	
                  if (i + 1 == propNameListLength) {
                    def.resolve();
                  }
                }, function(err) {
                  def.reject(err);
                }
              )
            }
            
            addAsyncPropertiesData(0, propNameList.length);
          }
          
          return def.promise;
        },
        associateListDataTypeProp : function(storeKey, model, propName) {
        	var def = $q.defer(),
              _this = this;
          
          if (model[propName] && angular.isArray(model[propName]) && model[propName].length) {
            var addAsyncPropertyData = function(i, propDataLength) {
              _this.updateObjectProp(storeKey, model, propName, model[propName][i]).then(
                function() {
                  if (i + 1 < propDataLength) {
                    addAsyncPropertyData(i + 1, propDataLength);
                  }
            	  	
                  if (i + 1 == propDataLength) {
                    def.resolve();
                  }
                }, function(err) {
                  def.reject(err);
                }
              )
            }
            
            addAsyncPropertyData(0, model[propName].length);
          }
          
          return def.promise;
        },
        updateListDataTypeProp : function(storeKey, oldModel, newModel, propName) {
        	var def = $q.defer(),
              _this = this;
          
          var addAsyncPropertyData = function(i, propDataLength) {
            _this.updateObjectProp(storeKey, newModel, propName, newModel[propName][i]).then(
              function() {
                if (i + 1 < propDataLength) {
                  addAsyncPropertyData(i + 1, propDataLength);
                }
            	  
                if (i + 1 == propDataLength) {
                  def.resolve();
                }
              }, function(err) {
                def.reject(err);
              }
            )
          }
          
          var removeAsyncPropertyData = function(i, propDataLength) {
            _this.updateObjectProp(storeKey, oldModel, propName, oldModel[propName][i], true).then(
              function() {
                if (i + 1 < propDataLength) {
                  removeAsyncPropertyData(i + 1, propDataLength);
                }
            	  
                if (i + 1 == propDataLength) {
                  if (angular.isArray(newModel[propName]) && newModel[propName].length) {
                    addAsyncPropertyData(0, newModel[propName].length);
                  } else {
                  	def.resolve();
                  }
                }
              }, function(err) {
                def.reject(err);
              }
            )
          }
          
          if (oldModel[propName] && angular.isArray(oldModel[propName]) && oldModel[propName].length) {
            removeAsyncPropertyData(0, oldModel[propName].length);
          } else {
          	if (newModel[propName] && angular.isArray(newModel[propName]) && newModel[propName].length) {
          	  addAsyncPropertyData(0, newModel[propName].length);
          	} else {
          		def.resolve();
          	}
          }
          
          return def.promise;
        },
        checkUniqueURI : function(storeKey, URI) {
        	var def = $q.defer();
        	
        	BWL.Services.StoreService.FindCustomURIInfoFromURIAsync(
        	  storeKey, URI,
        	  function(returnedURI) {
        	  	$rootScope.$apply(function() {
        	  	  def.resolve(returnedURI);
        	    })
        	  }, function(err) {
        	  	$rootScope.$apply(function() {
        	  	  def.reject(err);
        	  	})
        	  }
        	)
        	
        	return def.promise;
        },
        updateCustomURI : function(storeKey, CustomURI) {
        	var def = $q.defer();
        	
        	BWL.Services.ModelService.UpdateAsync(storeKey,
        	  BWL.Model.CustomURI.Type, CustomURI.Key, CustomURI,
        	  function(returnedCustomURI) {
        	    $rootScope.$apply(function() {
        	      def.resolve(returnedCustomURI);
        	    })
        	  }, function(err) {
        	    $rootScope.$apply(function() {
        	      def.reject(err);
        	    })
        	  }
        	)
        	
        	return def.promise;
        }
      }
    } ]);