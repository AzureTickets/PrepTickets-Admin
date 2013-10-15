function mediaController($scope, $cookieStore, $filter, $routeParams, $timeout,
    $modal) {
  $scope.name = 'media';

  $scope.wizardMedia = $scope.form.getWizard($scope), $scope.mediaPreview = {
    open : false
  };
  
  // Pagination setup
  $scope.pagination = {
    pageSize: 20,
    predicates: [],
    pageItems: function() {},
    textFilter: '',
    sort: function() {},
    currentPageIndex: 0,
    results: [],
    numberOfPages: 0
  };
  
  // Image selecting function for the new media selector
  $scope.selectImage = function($index) {
  	if ($index != undefined && $index != null) {
  	  $scope[$scope.modelName].Image = $scope.images[$index];
    };
  };

  $scope.$watch('mediaPreview.open', function(v) {
    if (v) {
      $scope.mediaPreview.modal = $modal.open({
        templateUrl : 'formMediaPreview.html',
        scope : $scope,
        backdrop : 'static'
      });
    } else if (angular.isDefined($scope.mediaPreview.modal)) {
      $scope.mediaPreview.modal.close();
    }
  })

  $scope.$watch('wizardMedia.open', function(v) {
    if (v) {
      $scope.wizardMedia.modal = $modal.open({
        templateUrl : '/views/elements/store/formMedia.html',
        scope : $scope,
        backdrop : 'static'
      });
    } else if (angular.isDefined($scope.wizardMedia.modal)) {
      $scope.wizardMedia.modal.close();
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
    '$routeParams', '$timeout', '$modal' ];