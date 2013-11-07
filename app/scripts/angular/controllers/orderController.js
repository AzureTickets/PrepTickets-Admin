function orderController($scope, $cookieStore, $filter, $window, $routeParams) {
  $scope.name = 'order';
  
  // pagination setup
  $scope.pagination = {
    pageSize: 20,
    predicates: ['OrderId', 'Placed', 'Contact.FullName', 'Total.ItemPrice', 'State'],
    filters: ['OrderId', 'Total.ItemPrice', 'State', 'Placed__Date'],
    pageItems: function() {},
    textFilter: '',
    propFilter: ['OrderId'],
    filteringObj: {},
    sort: function() {},
    currentPageIndex: 0,
    results: [],
    numberOfPages: 0,
    advancedSearchScope: {}
  };
  
  // Order properties for searching
  $scope.dateRange = [
  	{value: 1, label: 'Last 24 Hours'},
  	{value: 2, label: 'Last 7 Days'},
  	{value: 3, label: 'Last 30 Days'},
  	{value: 4, label: 'Last 60 Days'}
  //	{value: 5, label: 'Custom'}
  ];
  $scope.dateFrom = $scope.dateRange[2];
  
  $scope.orderStateRange = [];
  angular.forEach(BWL.ModelEnum.OrderStateEnum, function(val, index) {
  	$scope.orderStateRange.push(
  	  {value: val, label: index}
  	);
  });
  $scope.orderState = $scope.orderStateRange[0];
  
  $scope.orderWatcher = function(orderState, dateFrom) {
  	var date = new Date(),
  	    startDate = null,
  	    endDate = null;
  	
  	switch (dateFrom.value) {
  		case 1:
  		  startDate = new String(new Date(date.getTime() - 2 * 24 * 60 * 60 * 1000)).slice(0, 15);
  		  endDate = new String(new Date(date.getTime())).slice(0, 15);
  		  break;
  		  
  		case 2:
  		  startDate = new String(new Date(date.getTime() - 7 * 24 * 60 * 60 * 1000)).slice(0, 15);
  		  endDate = new String(new Date(date.getTime())).slice(0, 15);
  		  break;
  		  
  		case 3:
  		  startDate = new String(new Date(date.getTime() - 30 * 24 * 60 * 60 * 1000)).slice(0, 15);
  		  endDate = new String(new Date(date.getTime())).slice(0, 15);
  		  break;
  		  
  		case 4:
  		  startDate = new String(new Date(date.getTime() - 61 * 24 * 60 * 60 * 1000)).slice(0, 15);
  		  endDate = new String(new Date(date.getTime())).slice(0, 15);
  		  break;
  		  
  		case 5:
  		  startDate = new String(new Date(date.getTime() - 365 * 24 * 60 * 60 * 1000)).slice(0, 15);
  		  endDate = new String(new Date(date.getTime())).slice(0, 15);
  		  break;
  	}
  	
  	return $scope.order.loadOrders($scope, orderState.value, startDate, endDate).then(function() {
      // Do nothing
    });
  }
  
  var dateFromWatcher = function(newDateFrom) {
  	return $scope.orderWatcher($scope.orderState, newDateFrom);
  };
  var orderStateWatcher = function(newOrderState) {
  	return $scope.orderWatcher(newOrderState, $scope.dateFrom);
  };
  
  $scope.$watch('dateFrom', dateFromWatcher);
  $scope.$watch('orderState', orderStateWatcher);
  
  $scope.init = $scope.orderWatcher($scope.orderState, $scope.dateFrom);
  
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