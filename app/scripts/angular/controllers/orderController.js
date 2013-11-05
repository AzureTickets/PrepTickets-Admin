function orderController($scope, $cookieStore, $filter, $window, $routeParams) {
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
  
  $scope.viewOrder = function(order) {
  	$window.location.href = '#/order/' + order.Key;
  }
  
  $scope.orderDetailInit = function() {
  	if (angular.isDefined($routeParams.orderKey)) {
      $scope.model.read(BWL.Model.Order.Type, $routeParams.orderKey, 5)
  	    .then(function(returnedOrder) {
  	  	  $scope.Order = returnedOrder;
  	    }, function(err) {
  	  	  $scope.error.log(err)
  	  });
    }
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

orderController.$inject = [ '$scope', '$cookieStore', '$filter', '$window', '$routeParams' ];