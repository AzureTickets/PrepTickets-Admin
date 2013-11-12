function orderController($scope, $cookieStore, $filter, $window, $routeParams) {
  $scope.name = 'order';
  
  // pagination setup
  $scope.pagination = {
    pageSize: 20,
    predicates: ['OrderId', 'Placed', 'Contact.FullName', 'Total.ItemPrice', 'State'],
    filters: ['OrderId', 'Total.ItemPrice', 'State', 'Placed__Date'],
    pageItems: function() {},
    textFilter: '',
    propFilter: ['OrderId', 'Total.ItemPrice'],
    filteringObj: {},
    sort: function() {},
    currentPageIndex: 0,
    results: [],
    numberOfPages: 0,
    advancedSearchScope: {}
  };
  
  // Date range property for searching
  $scope.dateRange = [
  	{value: 0, label: $filter('t')('Common.Text_Last1Days')},
  	{value: 1, label: $filter('t')('Common.Text_Last7Days')},
  	{value: 2, label: $filter('t')('Common.Text_Last30Days')},
  	{value: 3, label: $filter('t')('Common.Text_Last60Days')},
    {value: 4, label: $filter('t')('Common.Text_Custom')}
  ];
  $scope.dateFrom = $scope.dateRange[2];
  
  // Order state property for searching
  $scope.orderStateRange = [];
  angular.forEach(BWL.ModelEnum.OrderStateEnum, function(val, index) {
  	$scope.orderStateRange.push(
  	  {value: val, label: index}
  	);
  });
  $scope.orderState = $scope.orderStateRange[0];
  
  // When searching with state selection,
  // this property will be the new state
  $scope.reloadWithChangedState = null;
  
  // Initialize watcher for custom-time order filtering
  // This will be replaced with a 'real' function
  // when using custom "From" and "To" time inputs
  $scope.customTimeWatcher = function(dateFrom, dateTo) {
    // Do nothing
  };
  
  // Enable or disable custom time input fields
  var enableCustom = function(enable) {
    if (!angular.isDefined(enable) || enable) {
      jQuery('#customTime-StartTime').attr('disabled', false);
      jQuery('#customTime-EndTime').attr('disabled', false);
    } else {
      jQuery('#customTime-StartTime').attr('disabled', true);
      jQuery('#customTime-EndTime').attr('disabled', true);
    }
  }
  
  // Watcher for 'State' and fixed 'Order From' properties
  $scope.orderWatcher = function(orderState, dateFrom) {
  	var date = new Date(),
  	    startDate = null,
  	    endDate = null;
  	
  	switch (dateFrom.value) {
  		case 0:
  		  startDate = $scope.object.dateToISO8601(new Date(date.getTime() - 1*86400000));
  		  endDate = $scope.object.dateToISO8601(new Date(date.getTime()));
  		  enableCustom(false);
  		  break;
  		  
  		case 1:
  		  startDate = $scope.object.dateToISO8601(new Date(date.getTime() - 7*86400000));
  		  endDate = $scope.object.dateToISO8601(new Date(date.getTime()));
  		  enableCustom(false);
  		  break;
  		  
  		case 2:
  		  startDate = $scope.object.dateToISO8601(new Date(date.getTime() - 30*86400000));
  		  endDate = $scope.object.dateToISO8601(new Date(date.getTime()));
  		  enableCustom(false);
  		  break;
  		  
  		case 3:
  		  startDate = $scope.object.dateToISO8601(new Date(date.getTime() - 60*86400000));
  		  endDate = $scope.object.dateToISO8601(new Date(date.getTime()));
  		  enableCustom(false);
  		  break;
  		  
  		case 4:
  		  enableCustom();
  		  break;
  	}
  	
  	if (dateFrom.value != 4) {
  		$scope.customTime.StartTime = $scope.object.dateToUIPicker(startDate);
  	  $scope.customTime.EndTime = $scope.object.dateToUIPicker(endDate);
  	  $scope.customTimeWatcher = function(dateFrom, dateTo) {
  	  	// Do nothing
  	  };
  	  
  	  return $scope.order.loadOrders($scope, orderState.value, startDate, endDate).then(function() {
        // Do nothing
      });
    } else {
    	$scope.customTimeWatcher = function(dateFrom, dateTo) {
    	  var convertedFrom = $scope.object.dateToISO8601(dateFrom),
    	      convertedTo = $scope.object.dateToISO8601(dateTo);
  	
    	  return $scope.order.loadOrders($scope, $scope.orderState.value, convertedFrom, convertedTo).then(function() {
    	    // Do nothing
    	  });
    	}
    	
    	// If using order state to filter when custom time is enabled
    	if ($scope.reloadWithChangedState) {
    		var convertedFrom = $scope.object.dateToISO8601($scope.customTime.StartTime),
    	      convertedTo = $scope.object.dateToISO8601($scope.customTime.EndTime);
    		
    		$scope.order.loadOrders($scope, $scope.reloadWithChangedState.value, convertedFrom, convertedTo).then(function() {
    	    // Do nothing
    	  });
    	  
    	  $scope.reloadWithChangedState = null;
    	}
    }
  }
  
  var dateFromWatcher = function(newDateFrom) {
  	$scope.reloadWithChangedState = null;
  	
  	return $scope.orderWatcher($scope.orderState, newDateFrom);
  };
  var orderStateWatcher = function(newOrderState) {
  	$scope.reloadWithChangedState = newOrderState;
  	
  	return $scope.orderWatcher(newOrderState, $scope.dateFrom);
  };
  
  $scope.$watch('dateFrom', dateFromWatcher);
  $scope.$watch('orderState', orderStateWatcher);
  
  // Watcher for custom time input fields
  var customTimeFromWatcher = function(newCustomFrom) {
  	return $scope.customTimeWatcher(newCustomFrom, $scope.customTime.EndTime);
  }
  var customTimeToWatcher = function(newCustomTo) {
  	return $scope.customTimeWatcher($scope.customTime.StartTime, newCustomTo);
  }
  
  $scope.$watch('customTime.StartTime', customTimeFromWatcher);
  $scope.$watch('customTime.EndTime', customTimeToWatcher);
  
  // Show/hide advanced search form block
  $scope.showHideAdvSearch = function() {
  	var orderAdvSearchForm = $('#orderAdvSearchForm');
  	
  	if (orderAdvSearchForm.hasClass('advFormOpened')) {
  		orderAdvSearchForm.slideUp(350);
  		orderAdvSearchForm.removeClass('advFormOpened');
  	} else {
  		orderAdvSearchForm.slideDown(350);
  		orderAdvSearchForm.addClass('advFormOpened');
  	}
  }
  
  // Init order list when visiting orderList.html
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