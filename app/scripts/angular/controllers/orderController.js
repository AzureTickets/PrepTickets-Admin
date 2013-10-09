function orderController($scope, $cookieStore, $filter) {
  $scope.name = 'order';

  $scope.ordersPagination = {
    page : 1,
    count : $scope.config.paginator.currentPageSize,
    total : $scope.orders.length
  }

  $scope.$watch('ordersPagination', function(params) {
    $scope.ordersPaginated = $scope.orders.slice((params.page - 1)
        * params.count, params.page * params.count);
  }, true);

/*
  $scope.init = function() {
    $scope.order.loadOrders($scope).then(function() {
      $scope.ordersPagination.total = $scope.orders.length
    });
  }
*/

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