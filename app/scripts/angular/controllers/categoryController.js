function categoryController($scope, $cookieStore, $filter, $modal) {
  $scope.name = 'category';

  // Initialize wizard for Category
  $scope.wizardCategory = $scope.form.getWizard($scope);

  // Pagination setup
  $scope.pagination = {
    pageSize : 20,
    startRange : 0,
    predicates : [ 'Name', 'Brief' ],
    pageItems : function() {
    },
    textFilter : '',
    propFilter : '*',
    filteringObj : {},
    sort : function() {
    },
    currentPageIndex : 0,
    results : [],
    numberOfPages : 0
  };

  $scope.$watch('wizardCategory.open', function(v) {
    if (v) {
      $scope.wizardCategory.modal = $modal.open({
        templateUrl : 'formCategory.html',
        scope : $scope,
        backdrop : 'static'
      });
    } else if (angular.isDefined($scope.wizardCategory.modal)) {
      $scope.wizardCategory.modal.close();
    }
  })

  $scope.init = function() {
    $scope.category.loadCategories($scope);
  }

  $scope.setURI = function() {
    $scope.Category.URI = $scope.Category.Name != null
      ? angular.lowercase($scope.Category.Name.replace(/[^a-z0-9\-]{1,}/gi, '-'))
      : '';
  }
  
  $scope.update = function(_category) {
    $scope.Category = angular.copy(_category);
    // This is because the CustomURI may be long-time loaded
    $scope.Category.URI = _category.CustomURI ? _category.CustomURI.URI : '';
    // Temporary Category to track URI and image changes
    $scope._tempCat = angular.copy(_category);
    
    // Parent category choosing
    $scope.getParentCategories(_category);
    $scope.Category.ParentCategoryKey = $scope.parentCategories[$scope.workingCategoryParentIndex];
    
    $scope.wizardCategory.open = true;
    $scope.wizardCategory.reset();
  }

  $scope.create = function() {
    $scope.Category = $scope.model.getInstanceOf('Category');
    
    // This is for "Parent Category" field
    $scope.getParentCategories();
    $scope.Category.ParentCategoryKey = $scope.parentCategories[$scope.workingCategoryParentIndex];
    
    //$scope.Category.tmpChildCategories = [];
    //$scope.Category._tmpChildCategories = angular.copy($scope.Category.tmpChildCategories);
    $scope.wizardCategory.open = true;
    $scope.wizardCategory.reset();
  }
  
  // Retrieve categories for "Parent Category" select field
  $scope.getParentCategories = function(workingCategory) {
  	var categoryList = [{Name: $filter('t')('Common.Text_MainNoParent'), Key: '', Type: 'Category'}]
  	    workingCategoryParentIndex = 0;
  	// If updating a new category
  	if (workingCategory && workingCategory.Key) {
  		angular.forEach($scope.categories, function(category, cateIndex) {
  		  if (workingCategory.Key != category.Key) {
  		  	categoryList.push(category);
  		  }
  		  if (workingCategory.ParentCategoryKey == category.Key) {
  		  	workingCategoryParentIndex = cateIndex + 1;
  		  }
  	  })
  	// Or creating a new one
  	} else {
  		categoryList = categoryList.concat($scope.categories);
  	}
  	
  	$scope.parentCategories = categoryList;
  	$scope.workingCategoryParentIndex = workingCategoryParentIndex;
  }

  $scope.deleteCategory = function(category) {
    if (confirm($filter('t')('Common.Text_RemoveProduct'))) {
      $scope.category.deleteCategory($scope.storeKey, category).then(
        function() {
          $scope.wizardCategory.open = false;
          $scope.init(true);
        }, function(err) {
          $scope.error.log(err);
        }
      )
    }
  }

  /**
   * Options for the child categories selector widget. select2 doesn't work
   * properly on "multiple" mode, so we need to update model manually and do
   * other hacks.
   */
  // @todo make this part of the atfield directive
  $scope.evChildCategories = function() {
    var el = jQuery('[name=Category_tmpChildCategories]').first();
    // Watch for changes
    jQuery(el).on(
        'change',
        function(c) {
          $scope.$apply(function() {
            var a = c.added || null;
            var r = c.removed || null;

            // Adding child cat
            if (a !== null) {
              $scope.Category._tmpChildCategories.push($scope.object
                  .undoFormatSelect2(a, BWL.Model.Category.Type));
            }
            // Removing child cat
            if (r !== null) {
              $scope.object.remove($scope.Category._tmpChildCategories, 'Key',
                  r.id);
              $scope.object.remove($scope.Category.tmpChildCategories, 'Key',
                  r.id);
            }

            if ($scope.Category._tmpChildCategories.length === 0) {
              jQuery(el).select2('data', []);
            }
          });
        });
  }
  $scope.optsSelChildCategories = {
    containerCssClass : 'input-xlarge',
    multiple : true,
    initSelection : function(element, callback) {
      $scope.evChildCategories();
      callback($scope.Category._tmpChildCategories
          .map($scope.object.formatSelect2));
    },
    query : function(query) {
      query.callback({
        results : $scope.categories.map($scope.object.formatSelect2).filter(
            function(el) {
              return el.id !== $scope.Category.Key
            })
      });
    },
  }

  $scope.save = function() {
    if ($scope.wizardCategory.finished) {
      $scope.wizardCategory.saved = false;

      if ($scope.Category.Key == null) {
        // Go on and create
        $scope.category.createCategory($scope.storeKey,
          {
            Public : true,
            Name : $scope.Category.Name,
            Description : $scope.Category.Description,
            Brief : $scope.Category.Brief,
            ParentCategoryKey : $scope.Category.ParentCategoryKey.Key,
            CustomURI : {
              URI : $scope.Category.URI
            }
          }
        ).then(
          function(categoryKey) {
            $scope.Category.Key = categoryKey;
            $scope.wizardCategory.saved = true;
            
            // Reload list
            $scope.init();
          }, function(err) {
            $scope.error.log(err);
          }
        )
      } else {
        // Update existing category
        // Update child categories
        var _finishes = function() {
          $scope.category.deleteChildCategories($scope.storeKey, $scope.Category).then(
            function() {
              $scope.category.addChildCategories($scope.storeKey, $scope.Category).then(
                function() {
                  $scope.wizardCategory.saved = true;
                  $scope.init();
                }, function(err) {
                  $scope.error.log(err);
                }
              )
            }, function(err) {
              $scope.error.log(err);
            }
          )
        }
        
        // Check if ParentCategoryKey was changed
        if ($scope._tempCat.ParentCategoryKey != $scope.Category.ParentCategoryKey.Key) {
        	$scope.Category.ParentCategoryKey = $scope.Category.ParentCategoryKey.Key;
        }
        
        // Start updating
        $scope.category.updateCategory($scope.storeKey, $scope.Category).then(
          function() {
            if ($scope._tempCat.CustomURI.URI != $scope.Category.URI) {
            	$scope._tempCat.CustomURI.URI = $scope.Category.URI;
            	
            	$scope.model.updateCustomURI($scope.storeKey, $scope._tempCat.CustomURI).then(
            	  _finishes,
            	  function(err) {
            	  	$scope.error.log(err);
            	  }
            	)
            } else {
              _finishes();
            }
          }, function(err) {
            $scope.error.log(err);
          }
        )
      }
    }
  }

  // Generate based stage URL for categories
  $scope.generateFrontEndLink = function() {
    if ($scope.Store.URI) {
      return $scope.config.appStage + '#/' + $scope.Store.URI + '/';
    }
  }
}

categoryController.$inject = [ '$scope', '$cookieStore', '$filter', '$modal' ];