/**
 *
 * This directive will paginate the data array returned from an API call
 * 
 */
azureTicketsApp.directive('ngPagination', ['$filter', '$parse', '$templateCache', function($filter, $parse, $templateCache) {
  return {
    restrict: 'A',
    replace: true,
    template: '<div class="pagination pagination-centered" ng-show="results.length" ng-cloak>' +
                '<ul>' +
                  '<li ng-class="loadClass(' + '\'previous\'' + ', 0)"><a href="" ng-click="loadPrePage()">&laquo;</a></li>' +
                  '<li ng-class="loadClass(' + '\'page\'' + ', page.index)" ng-repeat="page in displayedNoP"><a href="" ng-click="loadPageContent(page.index + 1)">{{page.index + 1}}</a></li>' +
                  '<li ng-class="loadClass(' + '\'next\'' + ', 0)"><a href="" ng-click="loadNextPage()">&raquo;</a></li>' +
                '</ul>' +
              '</div>',
    link: function($scope, $element, $attrs) {
      // Retrieve the data reference
      var params = $parse($attrs.ngPagination)($scope);

      if (params.length == 0) {
      	return;
      };

      // Initialize sort predicate
      $scope.predicate = '';
      // Reversing object for orderBy filter
      $scope.reverse = {};
      for (var i = 0; i < params.predicates.length; i++) {
        $scope.reverse['' + params.predicates[i]] = false;
      };

      $scope.$on('dataLoaded', function(event, loadedData) {
        // Attach the data from controller's $broadcast call
        $scope.data = loadedData;

        // Initialize number of items which are displayed per page
        $scope.itemsPerPage = params.def;
        // Initialize filtering text
        $scope.textFilter = '';
        
        // Pagination watcher for changes via filters
        var pagesWatcher = function(itemsPerPage, textFilter, predicate, reverse) {
          if (!angular.isNumber(itemsPerPage)) {
            $('#modal_invalid_number').modal();
            $scope.itemsPerPage = params.def;
          } else if (parseInt(itemsPerPage) <= 0) {
            $('#modal_invalid_number').modal();
            $scope.itemsPerPage = params.def;
          } else {
            $scope.itemsPerPage = parseInt(itemsPerPage);
          };
          $scope.textFilter = textFilter;
          if (predicate == undefined || predicate == null) {
            $scope.predicate = '';
          } else {
            $scope.predicate = predicate;
          };
          if (reverse == undefined || reverse == null) {
            reverse = !$scope.reverse[$scope.predicate];
          };

          // Current page index
          $scope.currentPageIndex = 0;
          // Initialize the start index of the pagination
          $scope.startRange = 0;

          // Filter the original data
          $scope.results = $filter('filter')($scope.data, $scope.textFilter);
          $scope.results = $filter('orderBy')($scope.results, predicate, reverse);

          // First page items
          $scope.pageItems = $scope.results.slice(0, $scope.itemsPerPage);

          $scope.numberOfPages = ($scope.results.length % $scope.itemsPerPage) == 0 ? Math.floor($scope.results.length/$scope.itemsPerPage) : Math.floor($scope.results.length/$scope.itemsPerPage) + 1;
          $scope.numberOfPagesArrayForm = [];
          for (var i = 0; i < $scope.numberOfPages; i++) {
            $scope.numberOfPagesArrayForm.push({
              index: i
            });
          };

          // Displayed pagination
          $scope.displayedNoP = $scope.numberOfPagesArrayForm.slice($scope.startRange, $scope.startRange + 10);
        };
        // First run of the watcher
        pagesWatcher($scope.itemsPerPage, $scope.textFilter);
        
        // 'itemDeleted' event received
        $scope.$on('itemDeleted', reLoad);
        function reLoad(event, arg) {
        	var found = false;
        	for (var i = 0; i < $scope.data.length; i++) {
        		if (!found && $scope.data[i].Key === arg) {
        			$scope.data.splice(i, 1);
        			found = true;
        			i = $scope.data.length;
        		};
          };
          
          // Reload the pagination
          pagesWatcher($scope.itemsPerPage, $scope.textFilter, $scope.predicate);
        };

        // Delegating watchers for filter models
        var itemsPerPageWatcher = function(newValue) {
          return pagesWatcher(newValue, $scope.textFilter, $scope.predicate);
        };
        var searchContentWatcher = function(newValue) {
          return pagesWatcher($scope.itemsPerPage, newValue, $scope.predicate);
        };
        $scope.$watch('itemsPerPage', itemsPerPageWatcher);
        $scope.$watch('textFilter', searchContentWatcher);


        $scope.sort = function(predicate) {
          pagesWatcher($scope.itemsPerPage, $scope.textFilter, predicate);
          
          // Update predicate reverse property
          $scope.reverse[predicate] = !$scope.reverse[predicate];
        };

        // Content functions
        // Load page content
        $scope.loadPageContent = function(realPageIndex) {
          // realPageIndex = $scope.currentPageIndex + 1;
          if (realPageIndex && realPageIndex == $scope.numberOfPages) {
            $scope.pageItems = $scope.results.slice($scope.itemsPerPage*(realPageIndex - 1));
          } else {
            $scope.pageItems = $scope.results.slice($scope.itemsPerPage*(realPageIndex - 1), $scope.itemsPerPage*realPageIndex);
          };

          $scope.currentPageIndex = realPageIndex - 1;
        };

        // Load next page content
        $scope.loadNextPage = function() {
          // When current page index is not the last one on the pagination
          if ((parseInt($scope.currentPageIndex) < $scope.startRange + 10 - 1) && (parseInt($scope.currentPageIndex) < $scope.numberOfPages - 1)) {
            $scope.loadPageContent($scope.currentPageIndex + 1 + 1);
          // When current page index is the last one on the pagination
          } else if ((parseInt($scope.currentPageIndex) == $scope.startRange + 10 - 1) && (parseInt($scope.currentPageIndex) < $scope.numberOfPages - 1)) {
            $scope.loadPageContent($scope.currentPageIndex + 1 + 1);
            $scope.startRange += 10;
            $scope.displayedNoP = $scope.numberOfPagesArrayForm.slice($scope.startRange, $scope.startRange + 10);
          }
        };

        // Load previous page content
        $scope.loadPrePage = function() {
          // When current page index is not the first one on the pagination
          if (parseInt($scope.currentPageIndex) > $scope.startRange) {
            $scope.loadPageContent($scope.currentPageIndex);
          // When current page index is the first one on the pagination
          } else if (($scope.startRange > 10 - 1) && (parseInt($scope.currentPageIndex) == $scope.startRange)) {
            $scope.loadPageContent($scope.currentPageIndex);
            $scope.startRange -= 10;
            $scope.displayedNoP = $scope.numberOfPagesArrayForm.slice($scope.startRange, $scope.startRange + 10);
          }
        };

        // Get the class for pagination items
        $scope.loadClass = function(arg, pageIndex) {
          switch (arg) {
            case 'previous':
              if ($scope.currentPageIndex == 0) {
                return "disabled";
              } else {
                return '';
              }
              break;
            case 'page':
              if (pageIndex == $scope.currentPageIndex) {
                return "active";
              } else {
                return '';
              }
              break;
            case 'next':
              if ($scope.currentPageIndex + 1 == $scope.numberOfPages || $scope.numberOfPages == 0) {
                return "disabled";
              } else {
                return '';
              }
              break;
            default:
              return '';
          }
        };
      });
    }
  }
}]);