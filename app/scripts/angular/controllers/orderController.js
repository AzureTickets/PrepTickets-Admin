function orderController($scope, $cookieStore, $filter) {
  $scope.name = 'order';
  
  // pagination setup
  $scope.pagination = {
    pageSize: 20,
    predicates: ['Placed', 'OrderId', 'Total.ItemPrice', 'State'],
    filters: ['OrderId', 'Total.ItemPrice', 'State', 'Placed__Date'],
    pageItems: function() {},
    textFilter: '',
    propFilter: '*',
    filteringObj: {},
    sort: function() {},
    currentPageIndex: 0,
    results: [],
    numberOfPages: 0,
    advancedSearchScope: {}
  };

  $scope.init = function() {
    $scope.order.loadOrders($scope).then(function() {
      // Do nothing
    });
  }

  $scope.deleteOrder = function(order) {
    if (confirm($filter('t')('Common.Text_RemoveProduct'))) {
    	var orderKey = order.Key;
      $scope.order.deleteOrder($scope.storeKey, order.Key).then(function() {
        // Maybe re-load 100 items or update the $scope.orders array so it will reflect the change (reduce 1) in ngPagination too
        $scope.init();
      }, function(err) {
        $scope.error.log(err)
      });
    }
  }
}

orderController.$inject = [ '$scope', '$cookieStore', '$filter' ];