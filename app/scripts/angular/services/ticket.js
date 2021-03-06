// ticket service
azureTicketsApp
    .factory(
        'ticketService',
        [
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
              var _tickets = [], _uiDateFormat = 'MM/dd/yyyy hh:mm tt', _isTicketsLoading = false;

              // format dates to be ISO 8601 as expected by API
              var _formatDates = function(tmpTicket) {
                tmpTicket.OnSaleDateTimeStart = objectService
                    .dateToISO8601(tmpTicket.OnSaleDateTimeStart);
                tmpTicket.OnSaleDateTimeEnd = objectService
                    .dateToISO8601(tmpTicket.OnSaleDateTimeEnd);
              }

              return {
                getTickets : function() {
                  return _tickets;
                },
                getTicket : function() {
                  return modelService
                      .getInstanceOf('GeneralAdmissionTicketItemInfo');
                },
                listTicketsAsync : function(storeKey, pages) {
                  var def = $q.defer();

                  BWL.Services.ModelService.ListAsync(storeKey,
                      BWL.Model.GeneralAdmissionTicketItemInfo.Type, pages,
                      function(tickets) {
                        if (angular.isArray(tickets)) {
                          _tickets = tickets;
                        } else {
                          _tickets = [];
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
                /**
                 * To be used from any controller, so it updates the
                 * $scope.tickets array without requiring us to do complex DI.
                 * 
                 * @param $scope
                 *          Scope to refresh
                 * @returns
                 */
                loadTickets : function($scope) {
                  var def = $q.defer();

                  if (!_isTicketsLoading) {
                    _isTicketsLoading = true;

                    $scope.storeKey = $scope.storeKey
                        || $cookieStore.get($scope.config.cookies.storeKey);
                    var _this = this;

                    _this.listTicketsAsync($scope.storeKey, 0).then(
                        function() {
                          $scope.tickets = _this.getTickets();

                          if ($scope.tickets.length > 0) {
                            angular.forEach($scope.tickets,
                                function(ticket, i) {
                                  _this.initTicket($scope.storeKey, ticket.Key)
                                      .then(function(ticket) {
                                        $scope.tickets[i] = ticket;

                                        if (!$scope.$$phase) {
                                          $scope.$apply();
                                        }
                                      })
                                });
                          }

                          _isTicketsLoading = false;

                          def.resolve();
                        }, function(err) {
                          _isTicketsLoading = false;
                          $scope.error.log(err)

                          def.reject();
                        });
                  }

                  return def.promise;
                },
                initTicket : function(storeKey, ticketKey) {
                  var def = $q.defer(), _this = this;

                  BWL.Services.ModelService.ReadAsync(storeKey,
                      BWL.Model.GeneralAdmissionTicketItemInfo.Type, ticketKey,
                      10, function(_ticket) {
                        _ticket.OnSaleDateTimeStart = objectService
                            .dateToUIPicker(_ticket.OnSaleDateTimeStart);
                        _ticket.OnSaleDateTimeEnd = objectService
                            .dateToUIPicker(_ticket.OnSaleDateTimeEnd);

                        // retrieve stock (inventory) totals
                        BWL.Services.InventoryService.GetInventoryStatsAsync(
                            storeKey,
                            BWL.Model.GeneralAdmissionTicketItemInfo.Type,
                            _ticket.Key, function(stats) {
                              _ticket.Stock = 0;

                              // initialize PricingTiers (if any)
                              if (false
                                  && angular.isDefined(_ticket.PricingTiers)
                                  && _ticket.PricingTiers.length > 0) {
                                _this.initPricingTiers(storeKey, _ticket).then(
                                    function(updatedTicket) {
                                      $rootScope.$apply(function() {
                                        def.resolve(updatedTicket)
                                      });
                                    }, function(err) {
                                      $rootScope.$apply(function() {
                                        def.reject(err)
                                      })
                                    })
                              } else {
                                $rootScope.$apply(function() {
                                  def.resolve(_ticket)
                                });
                              }
                            }, function(err) {
                              $rootScope.$apply(function() {
                                def.reject(err)
                              })
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
                initPricingTiers : function(storeKey, ticket) {
                  var def = $q.defer(), _this = this, ticketCopy = angular
                      .copy(ticket);

                  // get PricingTiers keys
                  var pricingTiersKeys = ticket.PricingTiers.map(function(v) {
                    return v.Key
                  });

                  // reset tiers
                  ticketCopy.PricingTiers = [];

                  // execute initTicket for each PricingTier's key
                  $q.all(
                      pricingTiersKeys.map(function(k) {
                        var _def = $q.defer();

                        _this.initTicket(storeKey, k).then(
                            function(updatedPricingTier) {
                              // replace PricingTier on parent's ticket
                              ticketCopy.PricingTiers.push(updatedPricingTier);

                              // $timeout(function() {
                              _def.resolve();
                              // }, 50);
                            }, function(err) {
                              $timeout(function() {
                                _def.reject(err)
                              }, 50);
                            });

                        return _def.promise;
                      })).then(function() {
                    // $timeout(function() {
                    def.resolve(ticketCopy);
                    // }, 150);
                  }, function(err) {
                    $timeout(function() {
                      def.reject(err);
                    }, 150);
                  })

                  return def.promise;
                },
                createTicket : function(storeKey, ticket) {
                  var def = $q.defer();
                  var tmpTicket = angular.copy(ticket);

                  delete tmpTicket.Stock;

                  _formatDates(tmpTicket);
                  modelService.nonNull(tmpTicket);

                  BWL.Services.ModelService.CreateAsync(storeKey,
                      BWL.Model.GeneralAdmissionTicketItemInfo.Type, tmpTicket,
                      function(ticketKey) {
                        $rootScope.$apply(function() {
                          def.resolve(ticketKey)
                        });
                      }, function(err) {
                        $rootScope.$apply(function() {
                          def.reject(err)
                        })
                      });

                  return def.promise;
                },
                deleteTicket : function(storeKey, ticketKey) {
                  var def = $q.defer();

                  BWL.Services.ModelService.DeleteAsync(storeKey, this
                      .getTicket().Type, ticketKey, function() {
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
                updateTicket : function(storeKey, ticket) {
                  var def = $q.defer();
                  var tmpTicket = angular.copy(ticket);

                  delete tmpTicket.$$hashKey;
                  delete tmpTicket.Type;
                  delete tmpTicket.Stock;

                  _formatDates(tmpTicket);

                  BWL.Services.ModelService.UpdateAsync(storeKey,
                      BWL.Model.GeneralAdmissionTicketItemInfo.Type,
                      ticket.Key, tmpTicket, function(ret) {
                        $rootScope.$apply(function() {
                          def.resolve(ticket)
                        });
                      }, function(err) {
                        $rootScope.$apply(function() {
                          def.reject(err)
                        })
                      });

                  return def.promise;
                },
                // @todo move to a new inventoryService and make it work with
                // other item types.
                updateStock : function(storeKey, ticket) {
                  var def = $q.defer();

                  if (angular.isDefined(ticket.Stock)) {
                    var _addStock = function(stock) {
                      var _def = $q.defer();

                      if (stock === 0)
                        _def.resolve();

                      BWL.Services.InventoryService.AddInventoryItemsAsync(
                          storeKey,
                          BWL.Model.GeneralAdmissionTicketItemInfo.Type,
                          ticket.Key, stock, function() {
                            $timeout(function() {
                              _def.resolve();
                            }, 50);
                          }, function(err) {
                            $timeout(function() {
                              _def.reject(err)
                            }, 50);
                          });

                      return _def.promise;
                    }

                    // split stock by portions according to API limits
                    // (500)
                    var stockParts = [];
                    var _allAdd = null;

                    if (ticket.Stock > configService.api.stockLimit) {
                      var parts = Math.ceil(ticket.Stock
                          / configService.api.stockLimit);
                      var c = Math.ceil(ticket.Stock / parts);

                      for (i = 1; i <= parts; i++) {
                        stockParts.push(c);
                      }
                      // fix last part's number difference
                      if (ticket.Stock > c * parts) {
                        stockParts[stockParts.length - 1] = stockParts[stockParts.length - 1]
                            + ticket.Stock - c * parts;
                      } else if (ticket.Stock < c * parts) {
                        stockParts[stockParts.length - 1] = stockParts[stockParts.length - 1]
                            - (c * parts - ticket.Stock);
                      }
                    } else {
                      stockParts.push(ticket.Stock);
                    }

                    // should we remove some?
                    var rem = ticket.Stock > ticket.NumberTotal ? parseInt((ticket.NumberTotal - ticket.Stock))
                        : 0;

                    if (rem > 0) {
                      // remove & add
                      BWL.Services.InventoryService.RemoveInventoryItemsAsync(
                          storeKey,
                          BWL.Model.GeneralAdmissionTicketItemInfo.Type,
                          ticket.Key, rem, function() {
                            // add
                            _allAdd = $q.all(stockParts.map(_addStock));

                            _allAdd.then(function() {
                              $timeout(function() {
                                def.resolve();
                              }, 150);
                            }, function(err) {
                              $timeout(function() {
                                def.reject(err);
                              }, 150);
                            });
                          }, function(err) {
                            $rootScope.$apply(function() {
                              def.reject(err)
                            })
                          });
                    } else {
                      // just add
                      _allAdd = $q.all(stockParts.map(_addStock));

                      _allAdd.then(function() {
                        $timeout(function() {
                          def.resolve();
                        }, 150);
                      }, function(err) {
                        $timeout(function() {
                          def.reject(err);
                        }, 150);
                      });
                    }
                  } else {
                    def.resolve();
                  }

                  return def.promise;
                }
              }
            } ]);