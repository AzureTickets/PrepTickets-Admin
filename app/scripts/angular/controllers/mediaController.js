function mediaController($scope, $cookieStore, $filter, $routeParams, $timeout,
    $modal) {
  $scope.name = 'media';

  $scope.wizardMedia = $scope.form.getWizard($scope), $scope.mediaPreview = {
    open : false
  };
  $scope.updateImageWizard = $scope.form.getWizard($scope);
  
  // Pagination setup
  $scope.pagination = {
    pageSize: 20,
    predicates: [],
    pageItems: function() {},
    textFilter: '',
    propFilter: ['Name'],
    filteringObj: {},
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
  
  // Update image form
  $scope.$watch('updateImageWizard.open', function(v) {
    if (v) {
      $scope.updateImageWizard.modal = $modal.open({
        templateUrl : 'updateImageForm.html',
        scope : $scope,
        backdrop : 'static'
      });
    } else if (angular.isDefined($scope.updateImageWizard.modal)) {
      $scope.updateImageWizard.modal.close();
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
  
  // Open update image form
  $scope.update = function(image) {
  	$scope.Image = angular.copy(image);
    $scope.updateImageWizard.open = true;
    $scope.updateImageWizard.reset();
  }
  
  // Save edited image function
  $scope.saveUpdate = function(image) {
  	$scope.media.updateImage($scope.storeKey, image).then(function() {
  	  $scope.init();
  	  $scope.updateImageWizard.saved = true;
  	}, function(err) {
  	  $scope.error.log(err)
  	});
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
        $scope.updateImageWizard.open = false;
      }, function(err) {
        $scope.error.log(err)
      });
    }
  }
}

mediaController.$inject = [ '$scope', '$cookieStore', '$filter',
    '$routeParams', '$timeout', '$modal' ];