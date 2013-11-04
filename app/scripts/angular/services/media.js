// media service
azureTicketsApp.factory('mediaService', [
    '$q',
    '$rootScope',
    '$cookieStore',
    '$timeout',
    'modelService',
    'configService',
    'objectService',
    function($q, $rootScope, $cookieStore, $timeout, modelService,
        configService, objectService) {
      var _images = [], _isImagesLoading = false;

      return {
        listImagesAsync : function(storeKey, pages) {
          var def = $q.defer();

          BWL.Services.MediaLibraryService.ListImagesAsync(storeKey, function(
              images) {
            if (angular.isArray(images)) {
              _images = images;
            } else {
              _images = [];
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
        getImages : function() {
          return _images;
        },
        getImage : function() {
          return modelService.getInstanceOf('Image');
        },
        initImage : function(storeKey, imageKey) {
          var def = $q.defer();

          BWL.Services.ModelService.ReadAsync(storeKey, BWL.Model.Image.Type,
              imageKey, 10, function(image) {
                $rootScope.$apply(function() {
                  def.resolve(image)
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
        createUploader : function(storeKey, successCallback, errorCallback) {
          if (successCallback == undefined)
            successCallback = BWL.ServiceSucceededCallback;
          if (errorCallback == undefined)
            errorCallback = BWL.ServiceFailedCallback;

          // uploading can't be done over SSL
          var base = BWL.Server.replace("https://", "http://")
              + '/embed/Plugins/easyXDM/';

          jQuery('#uploader').empty();

          remoteServer = new easyXDM.Rpc({
            local : "name.html",
            swf : base + "easyxdm.swf",
            remote : base + "upload.html",
            remoteHelper : base + "name.html",
            container : "uploader",
            onReady : function() {
            }
          }, {
            remote : {
              startUploader : {}
            },
            local : {
              uploadSuccess : function(files) {
                successCallback(files)
              },
              uploadError : function(error) {
                errorCallback(error)
              }
            }
          });

          remoteServer.startUploader(storeKey, 'image');
        },
        updateImage : function(storeKey, image) {
          var def = $q.defer(), tempImage = angular.copy(image);

          delete tempImage.Type;

          BWL.Services.ModelService.UpdateAsync(storeKey,
              BWL.Model.Image.Type, image.Key, tempImage,
              function(ret) {
                $rootScope.$apply(function() {
                  def.resolve(image)
                });
              }, function(err) {
                $rootScope.$apply(function() {
                  def.reject(err)
                })
              });

          return def.promise;
        },
        deleteImage : function(storeKey, imageKey) {
          var def = $q.defer();

          BWL.Services.MediaLibraryService.DeleteImageAsync(storeKey, imageKey,
              function() {
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
        /**
         * To be used from any controller, so it updates the $scope.images array
         * without requiring us to do complex DI.
         * 
         * @param $scope
         *          Scope to refresh
         * @returns
         */
        loadImages : function($scope) {
          if (!_isImagesLoading) {
            _isImagesLoading = true;

            $scope.storeKey = $scope.storeKey
                || $cookieStore.get($scope.config.cookies.storeKey);
            var __this = this;

            __this.listImagesAsync($scope.storeKey, 0).then(
                function() {
                  $scope.images = __this.getImages();

                  if ($scope.images.length > 0) {
                    angular.forEach($scope.images, function(image, i) {
                      __this.initImage($scope.storeKey, image.Key).then(
                          function(image) {
                            $scope.images[i] = image;

                            if (!$scope.$$phase) {
                              $scope.$apply();
                            }
                          })
                    });
                  }

                  if (!$scope.$$phase) {
                    $scope.$apply();
                  }

                  _isImagesLoading = false;
                }, function(err) {
                  _isImagesLoading = false;
                  $scope.error.log(err)
                });
          }
        }
      }
    } ]);