function orderController($scope, $cookieStore, $filter) {
  $scope.name = 'order';

  $scope.init = function() {
    $scope.order.loadOrders($scope).then(function() {
      // Broadcast the 'dataLoaded' event to child scopes
      $scope.$broadcast('dataLoaded', $scope.orders);
    });
  }

  $scope.deleteOrder = function(order) {
    if (confirm($filter('t')('Common.Text_RemoveProduct'))) {
    	var orderKey = order.Key;
      $scope.order.deleteOrder($scope.storeKey, order.Key).then(function() {
        // Broadcast the 'itemDeleted' event to child scopes
        $scope.$broadcast('itemDeleted', orderKey);
      }, function(err) {
        $scope.error.log(err)
      });
    }
  }
}

orderController.$inject = [ '$scope', '$cookieStore', '$filter' ];