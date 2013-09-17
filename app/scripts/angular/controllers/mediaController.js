function mediaController($scope, $cookieStore, $filter, $routeParams, $timeout) {
  $scope.name = 'media';

  $scope.wizardMedia = $scope.form.getWizard($scope);

  $scope.$watch('wizardMedia.open', function(v) {
    if (v) {
      $('#formMedia').modal({
        show : true,
        backdrop : 'static'
      });
    }
  })

  $scope.create = function() {
    $scope.wizardMedia.open = true;
    $scope.wizardMedia.reset();
  }

  $scope.onImageUpload = function(files) {
    $scope.$apply(function() {
      $scope.init();
    })
  }
  $scope.onError = function(err) {
    $scope.$apply(function() {
      $scope.error.log(err)
    })
  }

  $scope.init = function() {
    $scope.media.loadImages($scope);
  }

  $scope.deleteImage = function(image) {
    if (confirm($filter('t')('Common.Text_RemoveProduct'))) {
      $scope.media.deleteImage($scope.storeKey, image.Key).then(function() {
        $scope.init();
      }, function(err) {
        $scope.error.log(err)
      });
    }
  }
}

mediaController.$inject = [ '$scope', '$cookieStore', '$filter',
    '$routeParams', '$timeout' ];