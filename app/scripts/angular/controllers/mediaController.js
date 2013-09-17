function mediaController($scope, $cookieStore, $filter, $routeParams, $timeout) {
  $scope.name = 'media';

  $scope.wizardMedia = $scope.form.getWizard($scope), $scope.mediaPreview = {
    open : false
  };

  $scope.$watch('mediaPreview.open', function(v) {
    if (v) {
      $('#formMediaPreview').modal({
        show : true,
        backdrop : 'static'
      });
    }
  })

  $scope.$watch('wizardMedia.open', function(v) {
    if (v) {
      $('#formMedia').modal({
        show : true,
        backdrop : 'static'
      });
    }
  })

  $scope.previewMedia = function(media) {
    if (media.Type === BWL.Model.Image.Type) {
      $scope.Image = media;
      $scope.mediaPreview.open = true;
    }
  }

  $scope.create = function() {
    $scope.wizardMedia.open = true;
    $scope.wizardMedia.reset();
  }

  $scope.onImageUpload = function(files) {
    $scope.$apply(function() {
      $scope.init();
      $scope.wizardMedia.open = false;
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