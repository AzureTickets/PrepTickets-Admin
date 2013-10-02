function orderController($scope, $cookieStore, $filter) {
  $scope.name = 'order';

  $scope.init = function() {
    $scope.order.loadOrders($scope);
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
}

orderController.$inject = [ '$scope', '$cookieStore', '$filter' ];