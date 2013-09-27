// event service
azureTicketsApp.factory('eventService', [
    '$q',
    '$rootScope',
    '$cookieStore',
    '$timeout',
    'modelService',
    'configService',
    'objectService',
    'geoService',
    function($q, $rootScope, $cookieStore, $timeout, modelService,
        configService, objectService, geoService) {
      var _events = [], _lastAvailableURI = null, _isEventsLoading = false;

      // format dates to be ISO 8601 as expected by API
      var _formatDates = function(tmpEvent) {
        tmpEvent.StartTime = objectService.dateToISO8601(tmpEvent.StartTime);
        tmpEvent.EndTime = objectService.dateToISO8601(tmpEvent.EndTime);
        tmpEvent.OnSaleDateTimeStart = objectService
            .dateToISO8601(tmpEvent.OnSaleDateTimeStart);
        tmpEvent.OnSaleDateTimeEnd = objectService
            .dateToISO8601(tmpEvent.OnSaleDateTimeEnd);
      }

      return {
        listEventsAsync : function(storeKey, pages) {
          var def = $q.defer();

          BWL.Services.ModelService.ListAsync(storeKey, BWL.Model.Event.Type,
              pages, function(events) {
                if (angular.isArray(events)) {
                  _events = events;
                } else {
                  _events = [];
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
        getEvents : function() {
          return _events;
        },
        getEvent : function() {
          return modelService.getInstanceOf('Event');
        },
        initEvent : function(storeKey, eventKey) {
          var def = $q.defer();

          BWL.Services.ModelService.ReadAsync(storeKey, BWL.Model.Event.Type,
              eventKey, 10, function(_event) {
                // prepare tmp var to be used by UI
                _event.tmpVenues = [], _event.tmpCategories = [];

                if (angular.isDefined(_event.Places)
                    && angular.isArray(_event.Places)) {
                  angular.forEach(_event.Places, function(ev) {
                    _event.tmpVenues.push(ev)
                  })
                }

                if (angular.isDefined(_event.Categories)
                    && angular.isArray(_event.Categories)) {
                  angular.forEach(_event.Categories, function(ev) {
                    _event.tmpCategories.push(ev)
                  })
                }

                // used by select2 internally
                _event._tmpVenues = angular.copy(_event.tmpVenues);
                _event._tmpCategories = angular.copy(_event.tmpCategories);

                _event.StartTime = objectService
                    .dateToUIPicker(_event.StartTime);
                _event.EndTime = objectService.dateToUIPicker(_event.EndTime);
                _event.OnSaleDateTimeStart = objectService
                    .dateToUIPicker(_event.OnSaleDateTimeStart);
                _event.OnSaleDateTimeEnd = objectService
                    .dateToUIPicker(_event.OnSaleDateTimeEnd);

                $rootScope.$apply(function() {
                  def.resolve(_event)
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
        createEvent : function(storeKey, event) {
          var def = $q.defer(), tmpEvent = angular.copy(event);

          _formatDates(tmpEvent);

          BWL.Services.ModelService.CreateAsync(storeKey, this.getEvent().Type,
              tmpEvent, function(eventKey) {
                $rootScope.$apply(function() {
                  def.resolve(eventKey)
                });
              }, function(err) {
                $rootScope.$apply(function() {
                  def.reject(err)
                })
              });

          return def.promise;
        },
        deleteEvent : function(storeKey, eventKey) {
          var def = $q.defer();

          BWL.Services.ModelService.DeleteAsync(storeKey, this.getEvent().Type,
              eventKey, function() {
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
        addEventAddress : function(eventKey, address) {
          var def = $q.defer(), _this = this;

          BWL.Services.ModelService.CreateAsync(eventKey,
              BWL.Model.Address.Type, address, function(addressKey) {
                BWL.Services.ModelService.AddAsync(eventKey, "Event", eventKey,
                    "Address", BWL.Model.Address.Type, addressKey,
                    function(ret) {
                      $rootScope.$apply(def.resolve)
                    }, function(err) {
                      $rootScope.$apply(function() {
                        def.reject(err)
                      })
                    });
              }, function(err) {
                $rootScope.$apply(function() {
                  def.reject(err)
                })
              });

          return def.promise;
        },
        updateEvent : function(storeKey, event) {
          var def = $q.defer(), tmpEvent = angular.copy(event);

          delete tmpEvent.tmpVenues;
          delete tmpEvent._tmpVenues;
          delete tmpEvent.tmpCategories;
          delete tmpEvent._tmpCategories;
          delete tmpEvent.Places;
          delete tmpEvent.Categories;
          delete tmpEvent.Image;
          delete tmpEvent.$$hashKey;
          delete tmpEvent.Type;

          _formatDates(tmpEvent);

          BWL.Services.ModelService.UpdateAsync(storeKey, BWL.Model.Event.Type,
              event.Key, tmpEvent, function(ret) {
                $rootScope.$apply(function() {
                  def.resolve(event)
                });
              }, function(err) {
                $rootScope.$apply(function() {
                  def.reject(err)
                })
              });

          return def.promise;
        },
        deleteCategories : function(storeKey, _event) {
          var def = $q.defer();
          var _allRemove = null;

          // remove those Categories which are not present in _tmpCategories
          if (angular.isArray(_event.Categories)
              && _event.Categories.length > 0) {
            var tmpCategories = _event.Categories.map(function(v, k) {
              return v.Key
            });
            // declare remove func
            var _removeCategory = function(categoryKey) {
              var _def = $q.defer();

              if (!angular.isDefined(categoryKey)) {
                _def.resolve();
                return;
              }

              // checks whether the category has been removed or not
              var _existent = _event._tmpCategories ? objectService.grep(
                  _event._tmpCategories, 'Key', categoryKey) : null;

              if (_existent !== null) {
                // category still present, do nothing
                $timeout(function() {
                  _def.resolve();
                }, 50);
              } else {
                // category is not selected anymore, remove
                BWL.Services.ModelService.RemoveAsync(storeKey,
                    BWL.Model.Event.Type, _event.Key, 'Categories',
                    BWL.Model.Category.Type, categoryKey, function() {
                      $timeout(function() {
                        objectService.remove(_event.Categories, 'Key',
                            categoryKey);
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

            _allRemove = $q.all(tmpCategories.map(_removeCategory));
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
        addCategories : function(storeKey, _event) {
          var def = $q.defer();
          var _addCategory = function(categoryKey) {
            var _def = $q.defer();

            if (!angular.isDefined(categoryKey)) {
              _def.resolve();
              return;
            }

            var _existent = _event.Categories ? objectService.grep(
                _event.Categories, 'Key', categoryKey) : false;

            if (_existent !== false && _existent !== null) {
              $timeout(function() {
                _def.resolve();
              }, 50);
            } else {
              BWL.Services.ModelService.AddAsync(storeKey,
                  BWL.Model.Event.Type, _event.Key, 'Categories',
                  BWL.Model.Category.Type, {
                    Key : categoryKey
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

          // select2 has set undefined for _event.tmpCategories, so we
          // restore the backup
          var categories = angular.copy(_event._tmpCategories).filter(Boolean);
          var _allAdd = $q.all(categories.map(function(v) {
            return v.Key;
          }).map(_addCategory));

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
        deleteVenues : function(storeKey, _event) {
          var def = $q.defer();
          var _allRemove = null;

          // remove those Places which are not present in _tmpVenues
          if (angular.isArray(_event.Places) && _event.Places.length > 0) {
            var tmpPlaces = _event.Places.map(function(v, k) {
              return v.Key
            });
            // declare remove func
            var _removeVenue = function(venueKey) {
              var _def = $q.defer();

              if (!angular.isDefined(venueKey)) {
                _def.resolve();
                return;
              }

              // checks whether the venue has been removed or not
              var _existent = _event._tmpVenues ? objectService.grep(
                  _event._tmpVenues, 'Key', venueKey) : null;

              if (_existent !== null) {
                // venue still present, do nothing
                $timeout(function() {
                  _def.resolve();
                }, 50);
              } else {
                // venue is not selected anymore, remove
                BWL.Services.ModelService.RemoveAsync(storeKey,
                    BWL.Model.Event.Type, _event.Key, 'Places',
                    BWL.Model.Place.Type, venueKey, function() {
                      $timeout(function() {
                        objectService.remove(_event.Places, 'Key', venueKey);
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

            _allRemove = $q.all(tmpPlaces.map(_removeVenue));
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
        addVenues : function(storeKey, _event) {
          var def = $q.defer();
          var _addVenue = function(venueKey) {
            var _def = $q.defer();

            if (!angular.isDefined(venueKey)) {
              _def.resolve();
              return;
            }

            var _existent = _event.Places ? objectService.grep(_event.Places,
                'Key', venueKey) : false;

            if (_existent !== false && _existent !== null) {
              $timeout(function() {
                _def.resolve();
              }, 50);
            } else {
              BWL.Services.ModelService.AddAsync(storeKey,
                  BWL.Model.Event.Type, _event.Key, 'Places',
                  BWL.Model.Place.Type, {
                    Key : venueKey
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

          // select2 has set undefined for _event.tmpVenues, so we
          // restore the backup
          var venues = angular.copy(_event._tmpVenues).filter(Boolean);
          var _allAdd = $q.all(venues.map(function(v) {
            return v.Key;
          }).map(_addVenue));

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
        addTicket : function(storeKey, _event, ticketKey) {
          var def = $q.defer();

          BWL.Services.ModelService.AddAsync(storeKey, BWL.Model.Event.Type,
              _event.Key, 'Items',
              BWL.Model.GeneralAdmissionTicketItemInfo.Type, {
                Key : ticketKey
              }, function() {
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
         * To be used from any controller, so it updates the $scope.events array
         * without requiring us to do complex DI.
         * 
         * @param $scope
         *          Scope to refresh
         * @returns
         */
        loadEvents : function($scope) {
          if (!_isEventsLoading) {
            _isEventsLoading = true;

            $scope.storeKey = ($scope.storeKey || $cookieStore
                .get($scope.config.cookies.storeKey));
            var __this = this;

            __this.listEventsAsync($scope.storeKey, 0).then(
                function() {
                  $scope.events = __this.getEvents();

                  if ($scope.events.length > 0) {
                    angular.forEach($scope.events, function(event, i) {
                      __this.initEvent($scope.storeKey, event.Key).then(
                          function(event) {
                            $scope.events[i] = event;

                            if (!$scope.$$phase) {
                              $scope.$apply();
                            }
                          })
                    });
                  }

                  if (!$scope.$$phase) {
                    $scope.$apply();
                  }

                  _isEventsLoading = false;
                }, function(err) {
                  _isEventsLoading = false;
                  $scope.error.log(err)
                });
          }
        }
      }
    } ]);