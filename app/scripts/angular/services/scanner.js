// scanner service
azureTicketsApp.factory('scannerService', [
    '$q',
    '$rootScope',
    '$cookieStore',
    '$timeout',
    'modelService',
    'configService',
    'objectService',
    function($q, $rootScope, $cookieStore, $timeout, modelService,
        configService, objectService) {
      var _scanDevices = [], _isScanDevicesLoading = false;

      return {
        listScanDevicesAsync : function(storeKey, pages) {
          var def = $q.defer();

          BWL.Services.ScannerService.ListDevicesAsync(storeKey, pages,
              function(scanDevices) {
                if (angular.isArray(scanDevices)) {
                  _scanDevices = scanDevices;
                } else {
                  _scanDevices = [];
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
        getScanDevices : function() {
          return _scanDevices;
        },
        getScanDevice : function() {
          return modelService.getInstanceOf('ScanDevice');
        },
        initScanDevice : function(storeKey, scanDeviceKey) {
          var def = $q.defer();

          BWL.Services.ModelService.ReadAsync(storeKey,
              BWL.Model.ScanDevice.Type, scanDeviceKey, 10, function(
                  _scanDevice) {
                // prepare tmp var to be used by UI
                _scanDevice.tmpEvents = [];

                if (angular.isDefined(_scanDevice.Events)
                    && angular.isArray(_scanDevice.Events)) {
                  angular.forEach(_scanDevice.Events, function(ev) {
                    _scanDevice.tmpEvents.push(ev)
                  })
                }

                // used by select2 internally
                _scanDevice._tmpEvents = angular.copy(_scanDevice.tmpEvents);

                $rootScope.$apply(function() {
                  def.resolve(_scanDevice)
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
        createScanDevice : function(storeKey, scanDevice) {
          var def = $q.defer(), tmpScanDevice = angular.copy(scanDevice);

          BWL.Services.ModelService.CreateAsync(storeKey,
              BWL.Model.ScanDevice.Type, tmpScanDevice,
              function(scanDeviceKey) {
                $rootScope.$apply(function() {
                  def.resolve(scanDeviceKey)
                });
              }, function(err) {
                $rootScope.$apply(function() {
                  def.reject(err)
                })
              });

          return def.promise;
        },
        deleteScanDevice : function(storeKey, scanDeviceKey) {
          var def = $q.defer();

          BWL.Services.ModelService.DeleteAsync(storeKey,
              this.getScanDevice().Type, scanDeviceKey, function() {
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
        updateScanDevice : function(storeKey, scanDevice) {
          var def = $q.defer(), tmpScanDevice = angular.copy(scanDevice);

          delete tmpScanDevice.tmpEvents;
          delete tmpScanDevice._tmpEvents;
          delete tmpScanDevice.Events;
          delete tmpScanDevice.Image;
          delete tmpScanDevice.$$hashKey;
          delete tmpScanDevice.Type;

          _formatDates(tmpScanDevice);

          BWL.Services.ModelService.UpdateAsync(storeKey,
              BWL.Model.ScanDevice.Type, scanDevice.Key, tmpScanDevice,
              function(ret) {
                $rootScope.$apply(function() {
                  def.resolve(scanDevice)
                });
              }, function(err) {
                $rootScope.$apply(function() {
                  def.reject(err)
                })
              });

          return def.promise;
        },
        deleteEvents : function(storeKey, _scanDevice) {
          var def = $q.defer();
          var _allRemove = null;

          // remove those Events which are not present in _tmpEvents
          if (angular.isArray(_scanDevice.Events)
              && _scanDevice.Events.length > 0) {
            var tmpEvents = _scanDevice.Events.map(function(v, k) {
              return v.Key
            });
            // declare remove func
            var _removeEvent = function(eventKey) {
              var _def = $q.defer();

              if (!angular.isDefined(eventKey)) {
                _def.resolve();
                return;
              }

              // checks whether the event has been removed or not
              var _existent = _scanDevice._tmpEvents ? objectService.grep(
                  _scanDevice._tmpEvents, 'Key', eventKey) : null;

              if (_existent !== null) {
                // event still present, do nothing
                $timeout(function() {
                  _def.resolve();
                }, 50);
              } else {
                // event is not selected anymore, remove
                BWL.Services.ModelService.RemoveAsync(storeKey,
                    BWL.Model.ScanDevice.Type, _scanDevice.Key, 'Events',
                    BWL.Model.Event.Type, eventKey, function() {
                      $timeout(function() {
                        objectService.remove(_scanDevice.Events, 'Key',
                            eventKey);
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

            _allRemove = $q.all(tmpEvents.map(_removeEvent));
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
        addEvents : function(storeKey, _scanDevice) {
          var def = $q.defer();
          var _addEvent = function(eventKey) {
            var _def = $q.defer();

            if (!angular.isDefined(eventKey)) {
              _def.resolve();
              return;
            }

            var _existent = _scanDevice.Events ? objectService.grep(
                _scanDevice.Events, 'Key', eventKey) : false;

            if (_existent !== false && _existent !== null) {
              $timeout(function() {
                _def.resolve();
              }, 50);
            } else {
              BWL.Services.ModelService.AddAsync(storeKey,
                  BWL.Model.ScanDevice.Type, _scanDevice.Key, 'Events',
                  BWL.Model.Event.Type, {
                    Key : eventKey
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

          // select2 has set undefined for _scanDevice.tmpEvents, so we
          // restore the backup
          var events = angular.copy(_scanDevice._tmpEvents).filter(Boolean);
          var _allAdd = $q.all(events.map(function(v) {
            return v.Key;
          }).map(_addEvent));

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
         * To be used from any controller, so it updates the $scope.scanDevices
         * array without requiring us to do complex DI.
         * 
         * @param $scope
         *          Scope to refresh
         * @returns
         */
        loadScanDevices : function($scope) {
          if (!_isScanDevicesLoading) {
            _isScanDevicesLoading = true;

            $scope.storeKey = ($scope.storeKey || $cookieStore
                .get($scope.config.cookies.storeKey));
            var __this = this;

            __this.listScanDevicesAsync($scope.storeKey, 0).then(
                function() {
                  $scope.scanDevices = __this.getScanDevices();

                  if ($scope.scanDevices.length > 0) {
                    angular.forEach($scope.scanDevices,
                        function(scanDevice, i) {
                          __this
                              .initScanDevice($scope.storeKey, scanDevice.Key)
                              .then(function(scanDevice) {
                                $scope.scanDevices[i] = scanDevice;

                                if (!$scope.$$phase) {
                                  $scope.$apply();
                                }
                              })
                        });
                  }

                  if (!$scope.$$phase) {
                    $scope.$apply();
                  }

                  _isScanDevicesLoading = false;
                }, function(err) {
                  _isScanDevicesLoading = false;
                  $scope.error.log(err)
                });
          }
        }
      }
    } ]);