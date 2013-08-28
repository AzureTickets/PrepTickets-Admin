// cart service
azureTicketsApp.factory('cartService', [
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
      var _uiDateFormat = 'MM/dd/yyyy hh:mm tt';

      // format dates to be ISO 8601 as expected by API
      var _formatDates = function(tmpCart) {
        tmpCart.StartTime = new Date(tmpCart.StartTime).toString('s');
        tmpCart.EndTime = new Date(tmpCart.EndTime).toString('s');
        tmpCart.OnSaleDateTimeStart = new Date(tmpCart.OnSaleDateTimeStart)
            .toString('s');
        tmpCart.OnSaleDateTimeEnd = new Date(tmpCart.OnSaleDateTimeEnd)
            .toString('s');
      }

      return {
        getCart : function() {
          return modelService.getInstanceOf('Cart');
        },
        initCart : function(storeKey) {
          var def = $q.defer();

          BWL.Services.CartService.GetCartAsync(storeKey, function(_cart) {
            $rootScope.$apply(function() {
              def.resolve(_cart)
            });
          }, function(err) {
            $rootScope.$apply(function() {
              def.reject(err)
            })
          });

          return def.promise;
        },
        clearCart : function(storeKey) {
          var def = $q.defer();

          BWL.Services.CartService.ClearCartAsync(storeKey, function() {
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
        addItem : function(storeKey, type, itemKey, qty) {
          var def = $q.defer();

          BWL.Services.CartService.AddItemsAsync(storeKey, type, itemKey, qty,
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
        removeItem : function(storeKey, type, itemKey, qty) {
          var def = $q.defer();

          BWL.Services.CartService.RemoveItemsAsync(storeKey, type, itemKey,
              qty, function() {
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
        beginPayment : function(storeKey, paymentProvider, redirectURL) {
          var def = $q.defer();

          BWL.Services.PaymentService.BeginPaymentAsync(storeKey,
              paymentProvider.ProviderType, 'HTML', redirectURL, function(
                  paymentInfo) {
                $rootScope.$apply(function() {
                  def.resolve(paymentInfo)
                });
              }, function(err) {
                $rootScope.$apply(function() {
                  def.reject(err)
                })
              });

          return def.promise;
        },
      }
    }
]);