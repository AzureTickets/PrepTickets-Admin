/**
 * 
 * This directive will paginate the data array returned from an API call
 * 
 */
azureTicketsApp
    .directive(
        'ngPagination',
        [
            '$filter',
            '$parse',
            function($filter, $parse) {
              return {
                restrict : 'EA',
                scope : {
                  data : '=data',
                  atPagination : '=paginationData'
                },
                replace : true,
                template : '<div class="pagination pagination-centered" ng-cloak>'
                    + '<ul>'
                    + '<li ng-class="loadClass('
                    + '\'previous\''
                    + ', 0)"><a href="" ng-click="loadPrePage()">&laquo;</a></li>'
                    + '<li ng-class="loadClass('
                    + '\'page\''
                    + ', page.index)" ng-repeat="page in displayedNoP"><a href="" ng-click="loadPageContent(page.index + 1)">{{page.index + 1}}</a></li>'
                    + '<li ng-class="loadClass('
                    + '\'next\''
                    + ', 0)"><a href="" ng-click="loadNextPage()">&raquo;</a></li>'
                    + '</ul>' + '</div>',
                link : function($scope, $element, $attr) {

                  // Initialize sort predicate
                  $scope.predicate = '';
                  // Reversing object for orderBy filter
                  $scope.reverse = {};
                  for ( var i = 0; i < $scope.atPagination.predicates.length; i++) {
                    $scope.reverse['' + $scope.atPagination.predicates[i]] = false;
                  };

                  // Initialize number of items which are displayed per page
                  $scope.itemsPerPage = $scope.atPagination.pageSize;
                  // Initialize filtering text
                  $scope.atPagination.textFilter = '';
                  
                  // Generate the filter function
                  //$scope.advancedSearchScope = $scope.atPagination.advancedSearchScope;
                  //if ($scope.atPagination.filters.length) {
                  //  for (var i = 0; i < $scope.atPagination.filters.length; i++) {
                  	  
                  //  }
                  //}

                  // Pagination watcher for changes via filters and predicates
                  var pagesWatcher = function(itemsPerPage, textFilter,
                      predicate, reverse) {
                    if (!angular.isNumber(itemsPerPage)) {
                      $scope.itemsPerPage = $scope.atPagination.pageSize;
                    } else if (parseInt(itemsPerPage) <= 0) {
                      $scope.itemsPerPage = $scope.atPagination.pageSize;
                    } else {
                      $scope.itemsPerPage = parseInt(itemsPerPage);
                    }
                    ;
                    $scope.atPagination.textFilter = textFilter;
                    if (predicate == undefined || predicate == null) {
                      $scope.predicate = '';
                    } else {
                      $scope.predicate = predicate;
                    }
                    ;
                    if (reverse == undefined || reverse == null) {
                      reverse = !$scope.reverse[$scope.predicate];
                    }
                    ;

                    // Current page index
                    $scope.atPagination.currentPageIndex = 0;
                    // Initialize the start index of the pagination
                    $scope.startRange = 0;

                    // First page items
                    // Filter $scope.data directly to get the Angular way of
                    // binding, not attach to any other variables
                    $scope.atPagination.pageItems = function() {
                      return ($filter('orderBy')($filter('filter')($scope.data,
                          $scope.atPagination.textFilter), predicate, reverse)).slice(0,
                          $scope.itemsPerPage);
                    };

                    $scope.atPagination.results = $filter('orderBy')(
                        $filter('filter')($scope.data, $scope.atPagination.textFilter),
                        predicate, reverse);

                    $scope.atPagination.numberOfPages = ($scope.atPagination.results.length % $scope.itemsPerPage) == 0 ? Math
                        .floor($scope.atPagination.results.length / $scope.itemsPerPage)
                        : Math.floor($scope.atPagination.results.length
                            / $scope.itemsPerPage) + 1;
                    $scope.numberOfPagesArrayForm = [];
                    for ( var i = 0; i < $scope.atPagination.numberOfPages; i++) {
                      $scope.numberOfPagesArrayForm.push({
                        index : i
                      });
                    }
                    ;

                    // Displayed pagination
                    $scope.displayedNoP = $scope.numberOfPagesArrayForm.slice(
                        $scope.startRange, $scope.startRange + 10);
                  };
                  // First run of the watcher
                  pagesWatcher($scope.itemsPerPage, $scope.atPagination.textFilter);

                  // Delegating watchers for filter models
                  var itemsPerPageWatcher = function(newValue) {
                    return pagesWatcher(newValue, $scope.atPagination.textFilter,
                        $scope.predicate);
                  };
                  var searchContentWatcher = function(newValue) {
                    return pagesWatcher($scope.itemsPerPage, newValue,
                        $scope.predicate);
                  };
                  $scope.$watch('itemsPerPage', itemsPerPageWatcher);
                  $scope.$watch('atPagination.textFilter', searchContentWatcher);

                  $scope.atPagination.sort = function(predicate) {
                    pagesWatcher($scope.itemsPerPage, $scope.atPagination.textFilter,
                        predicate);

                    // Update predicate reverse property
                    $scope.reverse[predicate] = !$scope.reverse[predicate];
                  };

                  // Content functions
                  // Load page content
                  $scope.loadPageContent = function(realPageIndex) {
                    // realPageIndex equals $scope.atPagination.currentPageIndex + 1;
                    if (realPageIndex && realPageIndex == $scope.atPagination.numberOfPages) {
                      $scope.atPagination.pageItems = function() {
                        return ($filter('orderBy')($filter('filter')(
                            $scope.data, $scope.atPagination.textFilter), $scope.predicate,
                            $scope.reverse[$scope.predicate]))
                            .slice($scope.itemsPerPage * (realPageIndex - 1));
                      };
                    } else {
                      $scope.atPagination.pageItems = function() {
                        return ($filter('orderBy')($filter('filter')(
                            $scope.data, $scope.atPagination.textFilter), $scope.predicate,
                            $scope.reverse[$scope.predicate])).slice(
                            $scope.itemsPerPage * (realPageIndex - 1),
                            $scope.itemsPerPage * realPageIndex);
                      };
                    }
                    ;

                    $scope.atPagination.currentPageIndex = realPageIndex - 1;
                  };

                  // Load next page content
                  $scope.loadNextPage = function() {
                    // When current page index is not the last one on the
                    // pagination
                    if ((parseInt($scope.atPagination.currentPageIndex) < $scope.startRange + 10 - 1)
                        && (parseInt($scope.atPagination.currentPageIndex) < $scope.atPagination.numberOfPages - 1)) {
                      $scope.loadPageContent($scope.atPagination.currentPageIndex + 1 + 1);
                      // When current page index is the last one on the
                      // pagination
                    } else if ((parseInt($scope.atPagination.currentPageIndex) == $scope.startRange + 10 - 1)
                        && (parseInt($scope.atPagination.currentPageIndex) < $scope.atPagination.numberOfPages - 1)) {
                      $scope.loadPageContent($scope.atPagination.currentPageIndex + 1 + 1);
                      $scope.startRange += 10;
                      $scope.displayedNoP = $scope.numberOfPagesArrayForm
                          .slice($scope.startRange, $scope.startRange + 10);
                    }
                  };

                  // Load previous page content
                  $scope.loadPrePage = function() {
                    // When current page index is not the first one on the
                    // pagination
                    if (parseInt($scope.atPagination.currentPageIndex) > $scope.startRange) {
                      $scope.loadPageContent($scope.atPagination.currentPageIndex);
                      // When current page index is the first one on the
                      // pagination
                    } else if (($scope.startRange > 10 - 1)
                        && (parseInt($scope.atPagination.currentPageIndex) == $scope.startRange)) {
                      $scope.loadPageContent($scope.atPagination.currentPageIndex);
                      $scope.startRange -= 10;
                      $scope.displayedNoP = $scope.numberOfPagesArrayForm
                          .slice($scope.startRange, $scope.startRange + 10);
                    }
                  };

                  // Get the class for pagination items
                  $scope.loadClass = function(arg, pageIndex) {
                    switch (arg) {
                    case 'previous':
                      if ($scope.atPagination.currentPageIndex == 0) {
                        return "disabled";
                      } else {
                        return '';
                      }
                      break;
                    case 'page':
                      if (pageIndex == $scope.atPagination.currentPageIndex) {
                        return "active";
                      } else {
                        return '';
                      }
                      break;
                    case 'next':
                      if ($scope.atPagination.currentPageIndex + 1 == $scope.atPagination.numberOfPages
                          || $scope.atPagination.numberOfPages == 0) {
                        return "disabled";
                      } else {
                        return '';
                      }
                      break;
                    default:
                      return '';
                    }
                  };
                }
              }
            } ]);