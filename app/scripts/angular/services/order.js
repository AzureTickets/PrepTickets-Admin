// order service
azureTicketsApp.factory('orderService', [
    '$q',
    '$rootScope',
    '$cookieStore',
    'modelService',
    'configService',
    'geoService',
    function($q, $rootScope, $cookieStore, modelService, configService,
        geoService) {
      var _orders = [], _lastAvailableURI = null, _isOrdersLoading = false;

      return {
        listOrdersAsync : function(storeKey, pages) {
          var def = $q.defer();

          BWL.Services.ModelService.ListAsync(storeKey, BWL.Model.Order.Type,
              pages, function(orders) {
                if (angular.isArray(orders)) {
                  _orders = orders;
                } else {
                  _orders = [];
                }

                $rootScope.$apply(function() {
                  def.resolve();
                });
              }, function(err) {
                $rootScope.$apply(function() {
                  def.reject(err);
                })
              });

          return def.promise;
        },
        getOrders : function() {
          return _orders;
        },
        getOrder : function() {
          return modelService.getInstanceOf(BWL.Model.Order.Type);
        },
        initOrder : function(storeKey, orderKey) {
          var def = $q.defer();

          BWL.Services.ModelService
              .ReadAsync(storeKey, BWL.Model.Order.Type, orderKey, 10,
                  function(order) {
                    if (!angular.isDefined(order.ShippingAddress)
                        || order.ShippingAddress === null) {
                      order.ShippingAddress = modelService
                          .getInstanceOf('Address');
                    }
                    $rootScope.$apply(function() {
                      def.resolve(order)
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
        createOrder : function(storeKey, order) {
          var def = $q.defer();

          BWL.Services.ModelService.CreateAsync(storeKey, this.getOrder().Type,
              order, function(orderKey) {
                $rootScope.$apply(function() {
                  def.resolve(orderKey)
                });
              }, function(err) {
                $rootScope.$apply(function() {
                  def.reject(err)
                })
              });

          return def.promise;
        },
        deleteOrder : function(storeKey, venue) {
          var def = $q.defer();

          BWL.Services.ModelService.DeleteAsync(storeKey, this.getOrder().Type,
              venue.Key, function() {
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
        addOrderAddress : function(orderKey, address) {
          var def = $q.defer(), _this = this;

          BWL.Services.ModelService.CreateAsync(orderKey, "Address", address,
              function(addressKey) {
                BWL.Services.ModelService.AddAsync(orderKey,
                    BWL.Model.Order.Type, orderKey, "ShippingAddress",
                    "Address", addressKey, function(ret) {
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
        updateOrder : function(storeKey, order) {
          var def = $q.defer(), tmpOrder = angular.copy(order);
          var _order = angular.copy(order);

          delete tmpOrder.ShippingAddress;

          BWL.Services.ModelService.UpdateAsync(storeKey, BWL.Model.Order.Type,
              _order.Key, tmpOrder, function(ret) {
                $rootScope.$apply(function() {
                  def.resolve(_order)
                });
              }, function(err) {
                $rootScope.$apply(function() {
                  def.reject(err)
                })
              });

          return def.promise;
        },
        findOrdersAsync : function(storeKey, orderState, startDate, endDate) {
          var def = $q.defer();
          
          BWL.Services.OrderService.FindOrdersAsync(storeKey, orderState, startDate, 
              endDate, function(orders) {
                if (angular.isDefined(orders) && angular.isArray(orders) && orders.length) {
                  _orders = orders;
                } else {
                  _orders = [];
                }

                $rootScope.$apply(function() {
                  def.resolve(orders);
                });
              }, function(err) {
                $rootScope.$apply(function() {
                  def.reject(err)
                })
              });

          return def.promise;
        },
        /**
         * To be used from any controller, so it updates the $scope.venues array
         * without requiring us to do complex DI.
         * 
         * @param $scope
         *          Scope to refresh
         * @returns
         */
        loadOrders : function($scope, orderState, startDate, endDate) {
          var def = $q.defer();

          if (!_isOrdersLoading) {
            _isOrdersLoading = true;

            $scope.storeKey = $scope.storeKey
                || $cookieStore.get($scope.config.cookies.storeKey),
                _this = this;

            _this.findOrdersAsync($scope.storeKey, orderState, startDate, endDate).then(
                function() {
                  $scope.orders = _this.getOrders();

                  if ($scope.orders.length > 0) {
                    angular.forEach($scope.orders, function(order, i) {
                      _this.initOrder($scope.storeKey, order.Key).then(
                          function(order) {
                            $scope.orders[i] = order;
                          })
                    });
                  }

                  if (!$scope.$$phase) {
                    $scope.$apply();
                  }

                  _isOrdersLoading = false;
                  
                  def.resolve();
                }, function(err) {
                  _isOrdersLoading = false;
                  $scope.error.log(err);
                  
                  def.reject(err);
                });
          }

          return def.promise;
        }
      }
    } ]);