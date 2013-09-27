function categoryController($scope, $cookieStore, $filter, $modal) {
  $scope.name = 'category';

  // initialize wizard for Category
  $scope.wizardCategory = $scope.form.getWizard($scope);

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
    $scope.Category.URI = $scope.Category.Name !== null ? angular
        .lowercase($scope.Category.Name.replace(/[^a-z0-9\-]{1,}/gi, '-')) : '';
  }

  $scope.update = function(_category) {
    $scope.Category = angular.copy(_category);
    $scope.wizardCategory.open = true;
    $scope.wizardCategory.reset();
  }

  $scope.create = function() {
    $scope.Category = $scope.model.getInstanceOf('Category');
    $scope.Category.tmpChildCategories = [];
    $scope.Category._tmpChildCategories = angular
        .copy($scope.Category.tmpChildCategories);
    $scope.wizardCategory.open = true;
    $scope.wizardCategory.reset();
  }

  $scope.deleteCategory = function(category) {
    if (confirm($filter('t')('Common.Text_RemoveProduct'))) {
      $scope.category.deleteCategory($scope.storeKey, category.Key).then(
          function() {
            $scope.init(true);
          }, function(err) {
            $scope.error.log(err)
          });
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
    // watch for changes
    jQuery(el).on(
        'change',
        function(c) {
          $scope.$apply(function() {
            var a = c.added || null;
            var r = c.removed || null;

            // adding child cat
            if (a !== null) {
              $scope.Category._tmpChildCategories.push($scope.object
                  .undoFormatSelect2(a, BWL.Model.Category.Type));
            }
            // removing child cat
            if (r !== null) {
              $scope.object.remove($scope.Category._tmpChildCategories, 'Key',
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

      if ($scope.Category.Key === null) {
        // go on and create
        $scope.category.createCategory(
            $scope.storeKey,
            {
              Public : true,
              Name : $scope.Category.Name,
              Description : $scope.Category.Description,
              Brief : $scope.Category.Brief,
              ChildCategories : $scope.Category._tmpChildCategories
                  .map(function(v) {
                    return {
                      Key : v.Key
                    }
                  }),
              CustomURI : {
                URI : $scope.Category.URI
              },
            }).then(function(categoryKey) {
          $scope.Category.Key = categoryKey;
          $scope.wizardCategory.saved = true;

          // reload list
          $scope.init();
        }, function(err) {
          $scope.error.log(err)
        });
      } else {
        // update category

        // update child categories
        var _finishes = function() {
          $scope.category.deleteChildCategories($scope.storeKey,
              $scope.Category).then(
              function() {
                $scope.category.addChildCategories($scope.storeKey,
                    $scope.Category).then(function() {
                  $scope.wizardCategory.saved = true;
                  $scope.init();
                }, function(err) {
                  $scope.error.log(err)
                });
              }, function(err) {
                $scope.error.log(err)
              });
        }

        $scope.category.updateCategory($scope.storeKey, $scope.Category).then(
            _finishes, function(err) {
              $scope.error.log(err)
            });
      }
    }
  }
}

categoryController.$inject = [ '$scope', '$cookieStore', '$filter', '$modal' ];