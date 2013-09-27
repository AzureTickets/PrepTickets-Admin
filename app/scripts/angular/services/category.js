// category service
azureTicketsApp
    .factory(
        'categoryService',
        [
            '$q',
            '$rootScope',
            '$cookieStore',
            '$timeout',
            'modelService',
            'configService',
            'objectService',
            function($q, $rootScope, $cookieStore, $timeout, modelService,
                configService, objectService) {
              var _categories = [], _lastAvailableURI = null, _isCategoriesLoading = false;

              return {
                listCategoriesAsync : function(storeKey, pages) {
                  var def = $q.defer();

                  BWL.Services.ModelService.ListAsync(storeKey,
                      BWL.Model.Category.Type, pages, function(categories) {
                        if (angular.isArray(categories)) {
                          _categories = categories;
                        } else {
                          _categories = [];
                        }

                        $rootScope.$apply(function() {
                          def.resolve();
                        });
                      }, function(err) {
                        $rootScope.$apply(function() {
                          def.reject(err)
                        })
                      });

                  return def.promise;
                },
                getCategories : function() {
                  return _categories;
                },
                getCategory : function() {
                  return modelService.getInstanceOf('Category');
                },
                initCategory : function(storeKey, categoryKey) {
                  var def = $q.defer();

                  BWL.Services.ModelService.ReadAsync(storeKey,
                      BWL.Model.Category.Type, categoryKey, 10, function(
                          _category) {
                        // prepare tmp var to be used by UI
                        _category.tmpChildCategories = [];
                        if (angular.isDefined(_category.ChildCategories)
                            && angular.isArray(_category.ChildCategories)) {
                          angular.forEach(_category.ChildCategories, function(
                              cc) {
                            _category.tmpChildCategories.push(cc)
                          })
                        }
                        // used by select2 internally
                        _category._tmpChildCategories = angular
                            .copy(_category.tmpChildCategories);

                        $rootScope.$apply(function() {
                          def.resolve(_category)
                        });
                      }, function(err) {
                        $rootScope.$apply(function() {
                          def.reject(err)
                        })
                      }, function(err) {
                        $rootScope.$apply(function() {
                          def.reject(err)
                        })
                      });

                  return def.promise;
                },
                createCategory : function(storeKey, category) {
                  var def = $q.defer(), tmpCategory = angular.copy(category);

                  BWL.Services.ModelService.CreateAsync(storeKey,
                      BWL.Model.Category.Type, tmpCategory, function(
                          categoryKey) {
                        $rootScope.$apply(function() {
                          def.resolve(categoryKey)
                        });
                      }, function(err) {
                        $rootScope.$apply(function() {
                          def.reject(err)
                        })
                      });

                  return def.promise;
                },
                deleteCategory : function(storeKey, categoryKey) {
                  var def = $q.defer();

                  BWL.Services.ModelService.DeleteAsync(storeKey,
                      BWL.Model.Category.Type, categoryKey, function() {
                        $rootScope.$apply(function() {
                          def.resolve()
                        });
                      }, function(err) {
                        $rootScope.$apply(function() {
                          def.reject(err)
                        })
                      });

                  return def.promise;
                },
                updateCategory : function(storeKey, category) {
                  var def = $q.defer(), tmpCategory = angular.copy(category);

                  delete tmpCategory.tmpChildCategories;
                  delete tmpCategory._tmpChildCategories;
                  delete tmpCategory.$$hashKey;
                  delete tmpCategory.Type;

                  BWL.Services.ModelService.UpdateAsync(storeKey,
                      BWL.Model.Category.Type, category.Key, tmpCategory,
                      function(ret) {
                        $rootScope.$apply(function() {
                          def.resolve(category)
                        });
                      }, function(err) {
                        $rootScope.$apply(function() {
                          def.reject(err)
                        })
                      });

                  return def.promise;
                },
                deleteChildCategories : function(storeKey, _category) {
                  var def = $q.defer();
                  var _allRemove = null;

                  // remove those ChildCategories which are not present in
                  // _tmpChildCategories
                  if (angular.isArray(_category.ChildCategories)
                      && _category.ChildCategories.length > 0) {
                    var tmpChildCategories = _category.ChildCategories
                        .map(function(v, k) {
                          return v.Key
                        });
                    // declare remove func
                    var _removeChildCategories = function(childCategoryKey) {
                      var _def = $q.defer();

                      if (!angular.isDefined(childCategoryKey)) {
                        _def.resolve();
                        return;
                      }

                      // checks whether the childCategory has been removed or
                      // not
                      var _existent = _category._tmpChildCategories ? objectService
                          .grep(_category._tmpChildCategories, 'Key',
                              childCategoryKey)
                          : null;

                      if (_existent !== null) {
                        // childCategory still present, do nothing
                        $timeout(function() {
                          _def.resolve();
                        }, 50);
                      } else {
                        // childCategory is not selected anymore, remove
                        BWL.Services.ModelService.RemoveAsync(storeKey,
                            BWL.Model.Category.Type, _category.Key,
                            'ChildCategories', BWL.Model.Category.Type,
                            childCategoryKey, function() {
                              $timeout(function() {
                                objectService.remove(_category.ChildCategories,
                                    'Key', childCategoryKey);
                                _def.resolve();
                              }, 50);
                            }, function(err) {
                              $timeout(function() {
                                _def.reject(err);
                              }, 50);
                            });
                      }

                      return _def.promise;
                    }

                    _allRemove = $q.all(tmpChildCategories
                        .map(_removeChildCategories));
                  }

                  if (_allRemove === null) {
                    $timeout(function() {
                      def.resolve();
                    }, 150);
                  } else {
                    _allRemove.then(function() {
                      $timeout(function() {
                        def.resolve();
                      }, 150);
                    }, function(err) {
                      $timeout(function() {
                        def.reject(err);
                      }, 150);
                    });
                  }

                  return def.promise;
                },
                addChildCategories : function(storeKey, _category) {
                  var def = $q.defer();
                  var _addChildCategories = function(childCategoryKey) {
                    var _def = $q.defer();

                    if (!angular.isDefined(childCategoryKey)) {
                      _def.resolve();
                      return;
                    }

                    var _existent = _category.ChildCategories ? objectService
                        .grep(_category.ChildCategories, 'Key',
                            childCategoryKey) : false;

                    if (_existent !== false && _existent !== null) {
                      $timeout(function() {
                        _def.resolve();
                      }, 50);
                    } else {
                      BWL.Services.ModelService.AddAsync(storeKey,
                          BWL.Model.Category.Type, _category.Key,
                          'ChildCategories', BWL.Model.Category.Type, {
                            Key : childCategoryKey
                          }, function() {
                            $timeout(function() {
                              _def.resolve();
                            }, 50);
                          }, function(err) {
                            $timeout(function() {
                              _def.reject(err);
                            }, 50);
                          });
                    }

                    return _def.promise;
                  }

                  // select2 has set undefined for
                  // _category.tmpChildCategories, so we
                  // restore the backup
                  var childCategories = angular.copy(
                      _category._tmpChildCategories).filter(Boolean);
                  var _allAdd = $q.all(childCategories.map(function(v) {
                    return v.Key;
                  }).map(_addChildCategories));

                  _allAdd.then(function() {
                    $timeout(function() {
                      def.resolve();
                    }, 150);
                  }, function(err) {
                    $timeout(function() {
                      def.reject(err);
                    }, 150);
                  });

                  return def.promise;
                },
                /**
                 * To be used from any controller, so it updates the
                 * $scope.categories array without requiring us to do complex
                 * DI.
                 * 
                 * @param $scope
                 *          Scope to refresh
                 * @returns
                 */
                loadCategories : function($scope) {
                  if (!_isCategoriesLoading) {
                    _isCategoriesLoading = true;

                    $scope.storeKey = ($scope.storeKey || $cookieStore
                        .get($scope.config.cookies.storeKey));
                    var __this = this;

                    __this.listCategoriesAsync($scope.storeKey, 0).then(
                        function() {
                          $scope.categories = __this.getCategories();

                          if ($scope.categories.length > 0) {
                            angular.forEach($scope.categories, function(
                                category, i) {
                              __this
                                  .initCategory($scope.storeKey, category.Key)
                                  .then(function(category) {
                                    $scope.categories[i] = category;

                                    if (!$scope.$$phase) {
                                      $scope.$apply();
                                    }
                                  })
                            });
                          }

                          if (!$scope.$$phase) {
                            $scope.$apply();
                          }

                          _isCategoriesLoading = false;
                        }, function(err) {
                          _isCategoriesLoading = false;
                          $scope.error.log(err)
                        });
                  }
                },
                getParentKey : function($scope, categoryKey) {
                  var ret = null;

                  if (angular.isDefined($scope.categories)
                      && $scope.categories.length > 0) {
                    angular.forEach($scope.categories, function(v, k) {
                      if (angular.isDefined(v.ChildCategories)
                          && v.ChildCategories.length > 0) {
                        angular.forEach(v.ChildCategories, function(vv, kk) {
                          if (vv.Key === categoryKey) {
                            ret = v.Key;
                            return;
                          }
                        })

                        if (ret !== null)
                          return;
                      }
                    })
                  }

                  return ret;
                }
              }
            } ]);