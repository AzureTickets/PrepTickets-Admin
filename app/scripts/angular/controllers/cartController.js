function cartController($scope, $cookieStore, $filter) {
  $scope.name = 'cart', $scope.paymentProvider = $scope.model
      .getInstanceOf('PaymentProvider');

  // initialize wizard for the checkout process
  $scope.wizard = $scope.form.getWizard($scope);

  $scope.init = function() {
    if ($scope.Store && !$scope.Store.IsOwner) {
      $scope.cart.initCart($scope.storeKey).then(
          function(cart) {
            $scope.cartItems = [], $scope.allItems = [];
            $scope.Cart = cart;

            if (angular.isDefined($scope.Cart.InventoryItems)) {
              // join all events items
              angular.forEach($scope.events, function(ev) {
                if (angular.isDefined(ev.Items) && angular.isArray(ev.Items)) {
                  $scope.allItems = $scope.allItems.concat(ev.Items);
                }
              });

              // build cart items array to be displayed
              angular.forEach($scope.Cart.InventoryItems, function(item) {
                var _item = $scope.object.grep($scope.allItems, 'Key',
                    item.ItemInfoKey);

                if (angular.isObject(_item)) {
                  // check for existing
                  var k = $scope.object.getIndex($scope.cartItems, 'Key',
                      _item.Key);

                  if (k === -1) {
                    _item.Qty = 1;
                    $scope.cartItems.push(_item);
                  } else {
                    // update qty
                    $scope.cartItems[k].Qty = $scope.cartItems[k].Qty + 1;
                  }
                }

                $scope.Cart.Items = $scope.cartItems;
              })
            }
          }, function(err) {
            $scope.error.log(err)
          });
    }
  }

  /**
   * Executed once item has been added
   */
  $scope.evAddItem = function(ticket) {
    return function() {
      $scope.$apply(function() {
        ticket.added = false;
      });
    }
  }

  $scope.clearCart = function() {
    if (confirm($filter('t')('ShoppingCart.labelConfirmClear'))) {
      $scope.cart.clearCart($scope.storeKey).then(function() {
        $scope.init();
      }, function(err) {
        $scope.error.log(err)
      });
    }
  }

  $scope.addToCart = function(item) {
    $scope.cart.addItem($scope.storeKey, item.Type, item.Key, 1).then(
        function() {
          item.added = true;
          $scope.init();
        }, function(err) {
          $scope.error.log(err)
        });
  }

  $scope.removeFromCart = function(item) {
    $scope.cart.removeItem($scope.storeKey, item.Type, item.Key, 1).then(
        function() {
          item.added = false;
          $scope.init();
        }, function(err) {
          $scope.error.log(err)
        });
  }

  $scope.checkout = function() {
    if ($scope.wizard.finished) {
      // begin payment
      $scope.cart.beginPayment($scope.storeKey, $scope.paymentProvider,
          'http://nico9.localhost:9001/#/checkout').then(
          function(paymentInfo) {
            // store payment session for later use
            $cookieStore.put($scope.config.cookies.paymentSessionKey,
                paymentInfo.SessionKey);

            if (angular.isDefined(paymentInfo.StartPaymentURL)) {
              // we've got an URL, continue payment process
              window.location.href = paymentInfo.StartPaymentURL;
            } else {
              // no payment URL
              $scope.error.log($filter('t')(
                  'ShoppingCart.msg_PaymentCannotProceed'));
            }
          }, function(err) {
            $scope.error.log(err)
          });
    }
  }
}

cartController.$inject = [
    '$scope', '$cookieStore', '$filter'
];