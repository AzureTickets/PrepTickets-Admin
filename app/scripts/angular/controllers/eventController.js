function eventController($scope, $cookieStore, $filter) {
  $scope.name = 'event';

  // initialize wizard for Event
  $scope.wizard = $scope.form.getWizard($scope);

  $scope.$watch('wizard.open', function(v) {
    if (v) {
      $('#formEvent').modal({
        show : true,
        backdrop : 'static'
      });
    }
  })

  $scope.init = function() {
    $scope.event.loadEvents($scope);
  }

  $scope.update = function(_event) {
    $scope.Event = angular.copy(_event);
    $scope.wizard.open = true;
    $scope.wizard.reset();
  }

  $scope.create = function() {
    $scope.Event = $scope.model.getInstanceOf('Event');
    $scope.Event.tmpVenues = $scope.venues.length > 1 ? $scope.venues.splice(0,
        1) : $scope.venues;
    $scope.Event._tmpVenues = angular.copy($scope.Event.tmpVenues);
    $scope.wizard.open = true;
    $scope.wizard.reset();
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

  $scope.save = function() {
    if ($scope.wizard.finished) {
      $scope.wizard.saved = false;

      if ($scope.Event.Key === null) {
        // go on and create
        $scope.event.createEvent($scope.storeKey, {
          Public : true,
          Name : $scope.Event.Name,
          Description : $scope.Event.Description,
          Places : $scope.Event._tmpVenues.map(function(v) {
            return {
              Key : v.Key
            }
          }),
          StartTime : $scope.Event.StartTime,
          EndTime : $scope.Event.EndTime,
          OnSaleDateTimeStart : $scope.Event.OnSaleDateTimeStart,
          OnSaleDateTimeEnd : $scope.Event.OnSaleDateTimeEnd
        }).then(function(eventKey) {
          // attach event to store
          $scope.store.addEvent($scope.storeKey, eventKey).then(function() {
            $scope.wizard.saved = true;

            // reload list
            $scope.init();
          }, function(err) {
            $scope.error.log(err)
          });
        }, function(err) {
          $scope.error.log(err)
        });
      } else {
        // update event

        // update venues
        var _finishes = function() {
          $scope.event.deleteVenues($scope.storeKey, $scope.Event).then(
              function() {
                $scope.event.addVenues($scope.storeKey, $scope.Event).then(
                    function() {
                      $scope.wizard.saved = true;
                      $scope.init(true);
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
                // process items

                _finishes();
              }, function(err) {
                $scope.error.log(err)
              });
        } else {
          $scope.event.updateEvent($scope.storeKey, $scope.Event).then(
              _finishes, function(err) {
                $scope.error.log(err)
              });
        }
      }
    }
  }
}

eventController.$inject = [
    '$scope', '$cookieStore', '$filter'
];