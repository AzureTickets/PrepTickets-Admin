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
        templateUrl : '/views/elements/store/mediaPreview.html',
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
      $scope.previewedMedia = media;
      $scope.mediaPreview.open = true;
    }
  }
  
  // Open media library function
  $scope.wizardMediaLibrary = $scope.form.getWizard($scope);
  
  $scope.$watch('wizardMediaLibrary.open', function(v) {
    if (v) {
      $scope.wizardMediaLibrary.modal = $modal.open({
        templateUrl : '/views/elements/store/mediaLibrary.html',
        scope : $scope,
        backdrop : 'static'
      });
    } else if (angular.isDefined($scope.wizardMediaLibrary.modal)) {
      $scope.wizardMediaLibrary.modal.close();
    }
  })
  
  $scope.openMediaLibrary = function(modelName, modelProperty) {
  	$scope.mediaLibModelName = modelName;
  	$scope.mediaLibModelProperty = modelProperty;
  	
    $scope.wizardMediaLibrary.open = true;
    $scope.wizardMediaLibrary.reset();
  }
  
  $scope.selectImages = function($index) {
  	if (angular.isDefined($index)) {
  		if (BWL.ModelMeta[$scope.mediaLibModelName] && BWL.ModelMeta[$scope.mediaLibModelName][$scope.mediaLibModelProperty] && BWL.ModelMeta[$scope.mediaLibModelName][$scope.mediaLibModelProperty].indexOf('List') > -1) {
  	    if (angular.isDefined($scope[$scope.mediaLibModelName][$scope.mediaLibModelProperty])) {
  	    	$scope[$scope.mediaLibModelName][$scope.mediaLibModelProperty].push($scope.images[$index]);
  	    } else {
  	    	$scope[$scope.mediaLibModelName][$scope.mediaLibModelProperty] = [];
  	    	$scope[$scope.mediaLibModelName][$scope.mediaLibModelProperty].push($scope.images[$index]);
  	    }
  	  } else if (BWL.ModelMeta[$scope.mediaLibModelName] && BWL.ModelMeta[$scope.mediaLibModelName][$scope.mediaLibModelProperty]) {
  	  	$scope[$scope.mediaLibModelName][$scope.mediaLibModelProperty] = $scope.images[$index];
  	  }
    }
  }
  
  $scope.unselectImageinList = function(image, imageList) {
  	if (imageList.indexOf(image) > -1) {
  		imageList.splice(imageList.indexOf(image), 1);
  	}
  }
  
  $scope.checkSelected = function(image) {
  	if (BWL.ModelMeta[$scope.mediaLibModelName] && BWL.ModelMeta[$scope.mediaLibModelName][$scope.mediaLibModelProperty] && BWL.ModelMeta[$scope.mediaLibModelName][$scope.mediaLibModelProperty].indexOf('List') > -1) {
  		if ($scope[$scope.mediaLibModelName] && $scope[$scope.mediaLibModelName][$scope.mediaLibModelProperty] && angular.isArray($scope[$scope.mediaLibModelName][$scope.mediaLibModelProperty]) && $scope[$scope.mediaLibModelName][$scope.mediaLibModelProperty].length) {
  			for (var i = 0; i < $scope[$scope.mediaLibModelName][$scope.mediaLibModelProperty].length; i++) {
  				if (image.Key == $scope[$scope.mediaLibModelName][$scope.mediaLibModelProperty][i].Key) {
  					return true;
  				}
  			}
  			return false;
  		} else {
  			return false;
  		}
  	} else if (BWL.ModelMeta[$scope.mediaLibModelName] && BWL.ModelMeta[$scope.mediaLibModelName][$scope.mediaLibModelProperty]) {
  		if ($scope[$scope.mediaLibModelName] && $scope[$scope.mediaLibModelName][$scope.mediaLibModelProperty] && $scope[$scope.mediaLibModelName][$scope.mediaLibModelProperty].Key == image.Key) {
  			return true;
  		} else {
  			return false;
  		}
  	} else {
  		return false;
  	}
  }
  
  $scope.getSelectedImageName = function() {
  	if (BWL.ModelMeta[$scope.mediaLibModelName] && BWL.ModelMeta[$scope.mediaLibModelName][$scope.mediaLibModelProperty] && BWL.ModelMeta[$scope.mediaLibModelName][$scope.mediaLibModelProperty].indexOf('List') > -1) {
  		if ($scope[$scope.mediaLibModelName] && $scope[$scope.mediaLibModelName][$scope.mediaLibModelProperty] && angular.isArray($scope[$scope.mediaLibModelName][$scope.mediaLibModelProperty]) && $scope[$scope.mediaLibModelName][$scope.mediaLibModelProperty].length) {
  			var imageNames = '';
  			
  			for (var i = 0; i < $scope[$scope.mediaLibModelName][$scope.mediaLibModelProperty].length; i++) {
  				if (!imageNames) {
  					imageNames = $scope[$scope.mediaLibModelName][$scope.mediaLibModelProperty][i].Name;
  				} else {
  					imageNames += ', ' + $scope[$scope.mediaLibModelName][$scope.mediaLibModelProperty][i].Name;
  				}
  			}
  			return imageNames;
  		} else {
  			return '';
  		}
  	} else if (BWL.ModelMeta[$scope.mediaLibModelName] && BWL.ModelMeta[$scope.mediaLibModelName][$scope.mediaLibModelProperty]) {
  		if ($scope[$scope.mediaLibModelName] && $scope[$scope.mediaLibModelName][$scope.mediaLibModelProperty]) {
  			return $scope[$scope.mediaLibModelName][$scope.mediaLibModelProperty].Name;
  		} else {
  			return '';
  		}
  	} else {
  		return '';
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