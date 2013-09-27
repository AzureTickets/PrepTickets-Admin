function eventController($scope, $cookieStore, $filter, $modal) {
  $scope.name = 'event';

  // initialize wizard for Event
  $scope.wizardEvent = $scope.form.getWizard($scope);

  $scope.$watch('wizardEvent.open', function(v) {
    if (v) {
      $scope.wizardEvent.modal = $modal.open({
        templateUrl : 'formEvent.html',
        scope : $scope,
        backdrop : 'static'
      });
    } else if (angular.isDefined($scope.wizardEvent.modal)) {
      $scope.wizardEvent.modal.close();
    }
  })

  $scope.init = function() {
    $scope.event.loadEvents($scope);
    $scope.media.loadImages($scope);
    $scope.category.loadCategories($scope);
  }

  $scope.setURI = function() {
    $scope.Event.URI = $scope.Event.Name !== null ? angular
        .lowercase($scope.Event.Name.replace(/[^a-z0-9\-]{1,}/gi, '-')) : '';
  }

  $scope.update = function(_event) {
    $scope.Event = angular.copy(_event);
    $scope.wizardEvent.open = true;
    $scope.wizardEvent.reset();
  }

  $scope.create = function() {
    $scope.Event = $scope.model.getInstanceOf('Event');
    $scope.Event.tmpCategories = [];
    $scope.Event._tmpCategories = angular.copy($scope.Event.tmpCategories);
    $scope.Event.tmpVenues = $scope.venues.length > 1 ? $scope.venues.splice(0,
        1) : $scope.venues;
    $scope.Event._tmpVenues = angular.copy($scope.Event.tmpVenues);
    $scope.wizardEvent.open = true;
    $scope.wizardEvent.reset();
  }

  $scope.deleteEvent = function(event) {
    if (confirm($filter('t')('Common.Text_RemoveProduct'))) {
      $scope.event.deleteEvent($scope.storeKey, event.Key).then(function() {
        $scope.init(true);
      }, function(err) {
        $scope.error.log(err)
      });
    }
  }

  /**
   * Options for the venue selector widget. select2 doesn't work properly on
   * "multiple" mode, so we need to update model manually and do other hacks.
   */
  // @todo make this part of the atfield directive
  $scope.optsSelVenue = {
    containerCssClass : 'input-xlarge',
    multiple : true,
    initSelection : function(element, callback) {
      var el = jQuery('[name=Event_tmpVenues]').first();
      // watch for changes
      jQuery(el).on(
          'change',
          function(ev) {
            $scope.$apply(function() {
              var a = ev.added || null;
              var r = ev.removed || null;

              // adding venue
              if (a !== null) {
                $scope.Event._tmpVenues.push($scope.object.undoFormatSelect2(a,
                    BWL.Model.Place.Type));
              }
              // removing venue
              if (r !== null) {
                $scope.object.remove($scope.Event._tmpVenues, 'Key', r.id);
              }

              if ($scope.Event._tmpVenues.length === 0) {
                jQuery(el).select2('data', []);
              }
            });
          });

      callback($scope.Event._tmpVenues.map($scope.object.formatSelect2));
    },
    query : function(query) {
      query.callback({
        results : $scope.venues.map($scope.object.formatSelect2)
      });
    },
  }

  /**
   * Options for the categories selector widget. select2 doesn't work properly
   * on "multiple" mode, so we need to update model manually and do other hacks.
   */
  // @todo make this part of the atfield directive
  $scope.evCategories = function() {
    var el = jQuery('[name=Event_tmpCategories]').first();
    // watch for changes
    jQuery(el).on(
        'change',
        function(c) {
          $scope.$apply(function() {
            var push = true;
            var a = c.added || null;
            var r = c.removed || null;

            // adding child cat
            if (a !== null) {
              // if it's a child, remove parent first (if any) or api will throw
              // error
              var pKey = $scope.category.getParentKey($scope, a.id);
              if (pKey !== null) {
                $scope.object.remove($scope.Event._tmpCategories, 'Key', pKey);
                $scope.object.remove($scope.Event.tmpCategories, 'Key', pKey);
              }

              // if it's a parent and at least one of its child has been already
              // selected
              var pCat = $scope.object.grep($scope.categories, 'Key', a.id);
              if (angular.isDefined(pCat.ChildCategories)
                  && pCat.ChildCategories.length > 0) {
                angular.forEach(pCat.ChildCategories, function(v, k) {
                  if ($scope.object.grep($scope.Event._tmpCategories, 'Key',
                      v.Key) !== null) {
                    push = false
                  }
                })
              }

              if (push)
                $scope.Event._tmpCategories.push($scope.object
                    .undoFormatSelect2(a, BWL.Model.Category.Type));
            }
            // removing child cat
            if (r !== null) {
              $scope.object.remove($scope.Event._tmpCategories, 'Key', r.id);
              $scope.object.remove($scope.Event.tmpCategories, 'Key', r.id);
            }

            if ($scope.Event._tmpCategories.length === 0) {
              jQuery(el).select2('data', []);
            }
          });
        });
  }
  $scope.optsSelCategories = {
    containerCssClass : 'input-xlarge',
    multiple : true,
    initSelection : function(element, callback) {
      $scope.evCategories();
      callback($scope.Event._tmpCategories.map($scope.object.formatSelect2));
    },
    query : function(query) {
      query.callback({
        results : $scope.categories.map($scope.object.formatSelect2)
      });
    },
  }

  $scope.save = function() {
    if ($scope.wizardEvent.finished) {
      $scope.wizardEvent.saved = false;

      if ($scope.Event.Key === null) {
        // go on and create
        $scope.event.createEvent($scope.storeKey, {
          Public : true,
          Name : $scope.Event.Name,
          Description : $scope.Event.Description,
          MaximumCapacity : parseInt($scope.Event.MaximumCapacity),
          Places : $scope.Event._tmpVenues.map(function(v) {
            return {
              Key : v.Key
            }
          }),
          Categories : $scope.Event._tmpCategories.map(function(v) {
            return {
              Key : v.Key
            }
          }),
          StartTime : $scope.Event.StartTime,
          EndTime : $scope.Event.EndTime,
          OnSaleDateTimeStart : $scope.Event.OnSaleDateTimeStart,
          OnSaleDateTimeEnd : $scope.Event.OnSaleDateTimeEnd,
          CustomURI : {
            URI : $scope.Event.URI
          },
        }).then(
            function(eventKey) {
              $scope.Event.Key = eventKey;

              // attach event to store
              $scope.store.addEvent($scope.storeKey, eventKey).then(
                  function() {
                    if ($scope.Event.Image && $scope.Event.Image.Key) {
                      $scope.model.associate($scope.Event, 'Image',
                          $scope.Event.Image).then(function() {
                        $scope.wizardEvent.saved = true;

                        // reload list
                        $scope.init();
                      }, function(err) {
                        $scope.error.log(err)
                      })
                    } else {
                      $scope.wizardEvent.saved = true;

                      // reload list
                      $scope.init();
                    }
                  }, function(err) {
                    $scope.error.log(err)
                  });
            }, function(err) {
              $scope.error.log(err)
            });
      } else {
        // update event

        // update venues & categories
        var _finishes = function() {
          $scope.event.deleteVenues($scope.storeKey, $scope.Event).then(
              function() {
                $scope.event.addVenues($scope.storeKey, $scope.Event).then(
                    function() {
                      $scope.event.deleteCategories($scope.storeKey,
                          $scope.Event).then(
                          function() {
                            $scope.event.addCategories($scope.storeKey,
                                $scope.Event).then(function() {
                              $scope.wizardEvent.saved = true;
                              $scope.init();
                            }, function(err) {
                              $scope.error.log(err)
                            });
                          }, function(err) {
                            $scope.error.log(err)
                          });
                    }, function(err) {
                      $scope.error.log(err)
                    });
              }, function(err) {
                $scope.error.log(err)
              });
        }

        if (angular.isArray($scope.Event.Items)) {
          $scope.event.updateEvent($scope.storeKey, $scope.Event).then(
              function() {
                if ($scope.Event.Image && $scope.Event.Image.Key) {
                  $scope.model.associate($scope.Event, 'Image',
                      $scope.Event.Image).then(_finishes, function(err) {
                    $scope.error.log(err)
                  })
                } else {
                  _finishes();
                }
              }, function(err) {
                $scope.error.log(err)
              });
        } else {
          $scope.event.updateEvent($scope.storeKey, $scope.Event).then(
              function() {
                if ($scope.Event.Image && $scope.Event.Image.Key) {
                  $scope.model.associate($scope.Event, 'Image',
                      $scope.Event.Image).then(_finishes, function(err) {
                    $scope.error.log(err)
                  })
                } else {
                  _finishes();
                }
              }, function(err) {
                $scope.error.log(err)
              });
        }
      }
    }
  }
}

eventController.$inject = [ '$scope', '$cookieStore', '$filter', '$modal' ];