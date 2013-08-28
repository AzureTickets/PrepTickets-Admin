function orderController($scope, $cookieStore, $filter) {
  $scope.name = 'order';

  // initialize wizard for Order
  $scope.wizard = $scope.form.getWizard($scope);

  $scope.$watch('wizard.open', function(v) {
    if (v) {
      $('#formOrder').modal({
        show : true,
        backdrop : 'static'
      });
    }
  })

  $scope.init = function() {
    $scope.order.loadOrders($scope);
  }

  $scope.update = function(order) {
    $scope.Order = order;
    $scope.wizard.open = true;
    $scope.wizard.reset();
  }

  $scope.create = function() {
    $scope.Order = $scope.model.getInstanceOf('Order');
    $scope.wizard.open = true;
    $scope.wizard.reset();
  }

  $scope.deleteOrder = function(order) {
    if (confirm($filter('t')('Common.Text_RemoveProduct'))) {
      $scope.order.deleteOrder($scope.storeKey, order.Key).then(function() {
        $scope.init(true);
      }, function(err) {
        $scope.error.log(err)
      });
    }
  }

  $scope.save = function() {
    if ($scope.wizard.finished) {
      $scope.wizard.saved = false;

      if ($scope.Order.Key === null) {
        // go on and create
        $scope.order.createOrder($scope.storeKey, {
          Public : true,
          Name : $scope.Order.Name,
          Description : $scope.Order.Description,
          Places : $scope.Order.tmpVenues.filter(Boolean).map(function(v) {
            return {
              Key : v
            }
          }),
          StartTime : $scope.Order.StartTime,
          EndTime : $scope.Order.EndTime,
          OnSaleDateTimeStart : $scope.Order.OnSaleDateTimeStart,
          OnSaleDateTimeEnd : $scope.Order.OnSaleDateTimeEnd
        }).then(function(orderKey) {
          $scope.wizard.saved = true;

          // reload list
          $scope.init();
        }, function(err) {
          $scope.error.log(err)
        });
      } else {
        // update order
        $scope.order.updateOrder($scope.storeKey, $scope.Order).then(
            function(order) {
              $scope.wizard.saved = true;

              // reload list
              $scope.init();
            }, function(err) {
              $scope.error.log(err)
            });
      }
    }
  }
}

orderController.$inject = [
    '$scope', '$cookieStore', '$filter'
];