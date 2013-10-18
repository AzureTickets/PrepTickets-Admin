function filterController($scope, $cookieStore, $filter, $routeParams,
    $timeout, $modal) {
  $scope.name = 'filter', $scope.fields = [], $scope.modelName = null,
      $scope.filterModel = null;

  $scope.$watch('modelName', function(v) {
    if (v !== null) {
      $scope.filterModel = $scope.model.getInstanceOf($scope.modelName);
    }
  });

  $scope.filterDialog = {
    open : false
  };

  $scope.$watch('filterDialog.open', function(v) {
    if (v) {
      $scope.filterDialog.modal = $modal.open({
        templateUrl : 'formFilter.html',
        scope : $scope,
        backdrop : 'static'
      });
    } else if (angular.isDefined($scope.filterDialog.modal)) {
      $scope.filterDialog.modal.close();
    }
  });

  $scope.search = function() {

  }
}
filterController.$inject = [ '$scope', '$cookieStore', '$filter',
    '$routeParams', '$timeout', '$modal' ];
