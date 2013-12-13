function categoryController($scope, $cookieStore, $filter, $modal, $timeout) {
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
  
  // Button state, used for displaying "Save" or "Create"
  $scope.buttonSave = true;
  
  $scope.update = function(_category) {
    $scope.Category = angular.copy(_category);
    // This is because the CustomURI may be long-time loaded
    $scope.Category.URI = _category.CustomURI ? _category.CustomURI.URI : '';
    // Temporary Category to track URI and image changes
    $scope._tempCat = angular.copy(_category);
    
    // Parent category choosing
    $scope.getParentCategories(_category);
    $scope.Category.ParentCategoryKey = $scope.parentCategories[$scope.workingCategoryParentIndex];
    
    $scope.changeView('category');
    $scope.buttonSave = true;
  }
  
  $scope.create = function() {
    $scope.Category = $scope.model.getInstanceOf('Category');
    
    // This is for "Parent Category" field
    $scope.getParentCategories();
    $scope.Category.ParentCategoryKey = $scope.parentCategories[$scope.workingCategoryParentIndex];
    
    //$scope.Category.tmpChildCategories = [];
    //$scope.Category._tmpChildCategories = angular.copy($scope.Category.tmpChildCategories);
    $scope.changeView('category');
    $scope.buttonSave = false;
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
  	  })
  	// Or creating a new one
  	} else {
  		categoryList = categoryList.concat($scope.categories);
  	}
  	
  	if (workingCategory && workingCategory.Key) {
  	  angular.forEach(categoryList, function(category01, cateIndex01) {
  		  if (workingCategory.ParentCategoryKey == category01.Key) {
  		    workingCategoryParentIndex = cateIndex01;
  	  	}
  	  })
    }
  	
  	$scope.parentCategories = categoryList;
  	$scope.workingCategoryParentIndex = workingCategoryParentIndex;
  }
  
  $scope.deleteCategory = function(category) {
    if (confirm($filter('t')('Common.Text_RemoveProduct'))) {
      $scope.category.deleteCategory($scope.storeKey, category).then(
        function() {
          $scope.changeView('category', true);
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
  
  $scope.save = function(postAction) {
  	$scope.detailFormStatus.category.startSaving = true;
  	
    //if ($scope.detailFormStatus.category.finished) {
      $scope.detailFormStatus.category.saved = false;

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
          	
          	var _finish = function(categoryKey) {
          		$scope.category.initCategory($scope.storeKey, categoryKey).then(
          		  function(category) {
          		  	
          		  	var _completeLastSteps = function() {
          		  		$scope.category.initCategory($scope.storeKey, categoryKey).then(
          		        function(lastCategory) {
          		        	$scope.Category = angular.copy(lastCategory);
          		        	$scope._tempCat = angular.copy($scope.Category);
          		        	
          		          // Set category URI
          		          $scope.Category.URI = lastCategory.CustomURI ? lastCategory.CustomURI.URI : '';
          		          
          		          // Reload parent category list
          		          $scope.getParentCategories($scope.Category);
          		          $scope.Category.ParentCategoryKey = $scope.parentCategories[$scope.workingCategoryParentIndex];
          		          
          		          $scope.detailFormStatus.category.saved = true;
          		          $scope.buttonSave = true;
          		          
          		          if (postAction && postAction == 'new') {
          		            $timeout(
          		              function() {
          		                $scope.create();
          		              }, 1000
          		            )
          		          } else if (postAction && postAction == 'close') {
          		            $timeout(
          		              function() {
          		                $scope.changeView('category', true);
          		              }, 1000
          		            )
          		          }
          	  	      }, function(err) {
          	  	      	$scope.error.log(err);
          	  	      }
          	  	    )
          		    }
          		  	
          		  	// Add data to this category's parent category
          		  	if (category.ParentCategoryKey && category.ParentCategoryKey.length) {
          		  	  $scope.category.initCategory($scope.storeKey, category.ParentCategoryKey).then(
          		  	    function(parentCategory) {
          		  	      var wasAdded = false;
          		  	      
          		  	      // If parentCategory has a list of child
          		  	      if (parentCategory.ChildCategories && parentCategory.ChildCategories.length) {
          		  	        // Check if the category was already child of this parent
          		  	        for (var i = 0; i < parentCategory.ChildCategories.length; i++) {
          		  	          if (parentCategory.ChildCategories[i].Key == $scope.Category.Key) {
          		  	            wasAdded = true;
          		  	          }
          		  	        }
          		  	      }
          		  	      
          		  	      // Add to parent category
          		  	      if (!wasAdded) {
          		  	        $scope.model.updateObjectProp($scope.storeKey, parentCategory, 'ChildCategories', category).then(
          		  	          function() {
          		  	            _completeLastSteps();
          		  	          }, function(err) {
          		  	            $scope.error.log(err);
          		  	          }
          		  	        )
          		  	      } else {
          		  	        _completeLastSteps();
          		  	      }
          		  	    }, function(err) {
          		  	      $scope.error.log(err);
          		  	    }
          		  	  )
          		  	} else {
          			    _completeLastSteps();
          		  	}
          		  }, function(err) {
          		  	$scope.error.log(err);
          		  }
          		)
          	}
          	
          	if ($scope.Category.Icon || $scope.Category.SmallImage || $scope.Category.Image) {
          	  var imagePropNameList = [];
          	  if ($scope.Category.Icon && $scope.Category.Icon.Key) {
          	    imagePropNameList.push('Icon');
          	  }
          	  if ($scope.Category.SmallImage && $scope.Category.SmallImage.Key) {
          	    imagePropNameList.push('SmallImage');
          	  }
          	  if ($scope.Category.Image && $scope.Category.Image.Key) {
          	    imagePropNameList.push('Image');
          	  }
          	  
          	  if (imagePropNameList.length) {
          	    $scope.model.associateSingleDatatypePropList($scope.storeKey, $scope.Category, imagePropNameList).then(
          	      function() {
          	        _finish(categoryKey);
          	      },
          	      function(err) {
          	        $scope.error.log(err);
          	      }
          	    )
          	  }
          	} else {
          	  _finish(categoryKey);
          	}
          }, function(err) {
            $scope.error.log(err);
          }
        )
      } else {
        // Update existing category
        // Check if ParentCategoryKey was changed
        var parentCategoryHasChanged = false,
            oldParentCategoryKey = '',
            newParentCategoryKey = '';
        if (!$scope._tempCat.ParentCategoryKey) {
        	if ($scope.Category.ParentCategoryKey.Key) {
        		parentCategoryHasChanged = true;
        		newParentCategoryKey = $scope.Category.ParentCategoryKey.Key;
        	}
        } else {
        	if ($scope.Category.ParentCategoryKey.Key) {
        		if ($scope._tempCat.ParentCategoryKey != $scope.Category.ParentCategoryKey.Key) {
        			parentCategoryHasChanged = true;
        			oldParentCategoryKey = $scope._tempCat.ParentCategoryKey;
        			newParentCategoryKey = $scope.Category.ParentCategoryKey.Key;
        		}
        	} else {
        		parentCategoryHasChanged = true;
        		oldParentCategoryKey = $scope._tempCat.ParentCategoryKey;
        	}
        }
        var parentCategoryObjecttoBeChangedLater = $scope.Category.ParentCategoryKey;
        $scope.Category.ParentCategoryKey = $scope.Category.ParentCategoryKey.Key;
        
        // Update child categories
        var _finish = function(parentCategoryHasChanged, oldParentCategoryKey, newParentCategoryKey) {
        	
        	var _completeLastUpdateSteps = function() {
        		$scope.category.initCategory($scope.storeKey, $scope.Category.Key).then(
        		  function(lastCategory) {
        		    $scope.Category = angular.copy(lastCategory);
        		    $scope._tempCat = angular.copy($scope.Category);
        		    
        		    // Set category URI
        		    $scope.Category.URI = lastCategory.CustomURI ? lastCategory.CustomURI.URI : '';
        		    
        		    // Reload parent category list
        		    $scope.getParentCategories($scope.Category);
        		    $scope.Category.ParentCategoryKey = $scope.parentCategories[$scope.workingCategoryParentIndex];
        		    
        		    $scope.detailFormStatus.category.saved = true;
        		    
        		    if (postAction && postAction == 'close') {
        		      $timeout(
        		        function() {
        		          $scope.changeView('category', true);
        		          
        		          // Reload list
        		          $scope.init();
        		        }, 1000
        		      )
        		    }
        		  }, function(err) {
        	  	  $scope.error.log(err);
        		  }
        		)
        	}
        	
        	// Function to add this category to the new parent
        	// and do the last steps on Category update
        	var _addToNewParent = function(newParentCategoryKey) {
        		if (newParentCategoryKey) {
          	  $scope.category.initCategory($scope.storeKey, newParentCategoryKey).then(
          	    function(newParentCategory) {
        	        // This new parent is sure to exist
        	        // since users were able to select it in the parent list
        	        // Check if this category is already listed in the new parent
        	        var isChildAlready = false;
        	        if (newParentCategory.ChildCategories && newParentCategory.ChildCategories.length) {
        	          angular.forEach(newParentCategory.ChildCategories, function(childCate, childIndex) {
        	            if (childCate && childCate.Key) {
        	              if (childCate.Key == $scope.Category.Key) {
        	                isChildAlready = true;
        	              }
        	            }
        	          })
        	        }
        	        
        	        if (!isChildAlready) {
        	          $scope.model.updateObjectProp($scope.storeKey, newParentCategory, 'ChildCategories', $scope.Category).then(
        	            function() {
        	              _completeLastUpdateSteps();
        	            }, function(err) {
        	              $scope.error.log(err);
        	            }
        	          )
        	        } else {
        	          _completeLastUpdateSteps();
        	        }
          	    }, function() {
        	      $scope.error.log(err);
          	    }
          	  )
        	  } else {
        	  	_completeLastUpdateSteps();
        	  }
        	}
        	
        	// Update ChildCategories of the parent category
        	if (parentCategoryHasChanged) {
        		if (oldParentCategoryKey) {
        			// Delete this category in old parent category's ChildCategories list
        			$scope.category.initCategory($scope.storeKey, oldParentCategoryKey).then(
        			  function(oldParentCategory) {
        			    if (oldParentCategory) {
        			      // Check if this category is really listed in parent's ChildCategories
        			      var isChild = false;
        			      if (oldParentCategory.ChildCategories && oldParentCategory.ChildCategories.length) {
        		  	    	angular.forEach(oldParentCategory.ChildCategories, function(childCate, childIndex) {
        		  	    		if (childCate && childCate.Key) {
        		  	    			if (childCate.Key == $scope.Category.Key) {
        		  	    			  isChild = true;
        		  	    			}
        		  	    		}
        		  	    	})
        			      }
        			      
        			      if (isChild) {
        			        $scope.model.updateObjectProp($scope.storeKey, oldParentCategory, 'ChildCategories', $scope.Category, true).then(
        			          function() {
        			            _addToNewParent(newParentCategoryKey);
        			          }, function(err) {
        			            $scope.error.log(err);
        			          }
        			        )
        			      } else {
        			        _addToNewParent(newParentCategoryKey);
        			      }
        			      
        			    // Maybe the old parent category was deleted, then just move on
        			    } else {
        			      _addToNewParent(newParentCategoryKey);
        			    }
        			  }, function(err) {
        		  	  $scope.error.log(err);
        			  }
        			)
        		} else {
        			_addToNewParent(newParentCategoryKey);
        		}
        	} else {
        		_completeLastUpdateSteps();
        	}
        }
        
        // Start updating
        $scope.category.updateCategory($scope.storeKey, $scope.Category).then(
          function() {
          	if ($scope.Category.Icon || $scope.Category.SmallImage || $scope.Category.Image) {
          	  var imagePropNameList = [];
          	  if ($scope.Category.Icon && $scope.Category.Icon.Key) {
          	    if (!angular.isDefined($scope._tempCat.Icon) || $scope.Category.Icon.Key != $scope._tempCat.Icon.Key) {
          	      imagePropNameList.push('Icon');
          	    }
          	  }
          	  if ($scope.Category.SmallImage && $scope.Category.SmallImage.Key) {
          	    if (!angular.isDefined($scope._tempCat.SmallImage) || $scope.Category.SmallImage.Key != $scope._tempCat.SmallImage.Key) {
          	      imagePropNameList.push('SmallImage');
          	    }
          	  }
          	  if ($scope.Category.Image && $scope.Category.Image.Key) {
          	    if (!angular.isDefined($scope._tempCat.Image) || $scope.Category.Image.Key != $scope._tempCat.Image.Key) {
          	      imagePropNameList.push('Image');
          	    }
          	  }
          	  
          	  if (imagePropNameList.length) {
          	    $scope.model.associateSingleDatatypePropList($scope.storeKey, $scope.Category, imagePropNameList).then(
          	      function() {
          	        if ($scope._tempCat.CustomURI.URI != $scope.Category.URI) {
          	          $scope._tempCat.CustomURI.URI = $scope.Category.URI;
          	          
          	          $scope.model.updateCustomURI($scope.storeKey, $scope._tempCat.CustomURI).then(
          	            function() {
          	              _finish(parentCategoryHasChanged, oldParentCategoryKey, newParentCategoryKey);
          	            },
          	            function(err) {
          	              $scope.error.log(err);
          	            }
          	          )
          	        } else {
          	          _finish(parentCategoryHasChanged, oldParentCategoryKey, newParentCategoryKey);
          	        }
          	      }, function(err) {
          	        $scope.error.log(err);
          	      }
          	    )
          	  } else {
          	  	if ($scope._tempCat.CustomURI.URI != $scope.Category.URI) {
          	      $scope._tempCat.CustomURI.URI = $scope.Category.URI;
          	      
          	      $scope.model.updateCustomURI($scope.storeKey, $scope._tempCat.CustomURI).then(
          	        function() {
          	          _finish(parentCategoryHasChanged, oldParentCategoryKey, newParentCategoryKey);
          	        }, function(err) {
          	          $scope.error.log(err);
          	        }
          	      )
          	  	} else {
          	      _finish(parentCategoryHasChanged, oldParentCategoryKey, newParentCategoryKey);
          	  	}
          	  }
          	} else {
          	  if ($scope._tempCat.CustomURI.URI != $scope.Category.URI) {
          	    $scope._tempCat.CustomURI.URI = $scope.Category.URI;
          	    
          	    $scope.model.updateCustomURI($scope.storeKey, $scope._tempCat.CustomURI).then(
          	      function() {
          	        _finish(parentCategoryHasChanged, oldParentCategoryKey, newParentCategoryKey);
          	      }, function(err) {
          	        $scope.error.log(err);
          	      }
          	    )
          	  } else {
          	    _finish(parentCategoryHasChanged, oldParentCategoryKey, newParentCategoryKey);
          	  }
          	}
          }, function(err) {
            $scope.error.log(err);
          }
        )
      }
    //}
  }
  
  // Generate based stage URL for categories
  $scope.generateFrontEndLink = function() {
    if ($scope.Store.URI) {
      return $scope.config.appStage + '#/' + $scope.Store.URI + '/';
    }
  }
}

categoryController.$inject = [ '$scope', '$cookieStore', '$filter', '$modal', '$timeout' ];