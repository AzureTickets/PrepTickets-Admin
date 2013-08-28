function ticketController($scope, $cookieStore, $filter, $routeParams, $timeout) {
  $scope.name = 'ticket';

  // initialize wizard for GeneralAdmissionTicketItemInfo
  $scope.wizard = $scope.form.getWizard($scope);

  $scope.$watch('wizard.open', function(v) {
    if (v) {
      $('#formTicket').modal({
        show : true,
        backdrop : 'static'
      });
    }
  })

  // load event
  $scope.loadEvent = function() {
    if (angular.isDefined($routeParams.eventKey)) {
      $scope.Event = $scope.object.grep($scope.events, 'Key',
          $routeParams.eventKey);
    }
  }

  $scope.init = function(resetEvent) {
    if (!angular.isDefined(resetEvent) || resetEvent) {
      $scope.loadEvent();
    }
    $scope.ticket.loadTickets($scope);
  }

  $scope.filterByEvent = function(ticket) {
    var t = $scope.object.grep($scope.Event.Items, 'Key', ticket.Key);
    return angular.isObject(t) && angular.equals(t.Key, ticket.Key);
  }

  $scope.update = function(_ticket) {
    $scope.GeneralAdmissionTicketItemInfo = angular.copy(_ticket);

    $scope.wizard.open = true;
    $scope.wizard.reset();
  }

  $scope.create = function() {
    $scope.GeneralAdmissionTicketItemInfo = $scope.model
        .getInstanceOf('GeneralAdmissionTicketItemInfo');

    // set defaults
    $scope.GeneralAdmissionTicketItemInfo.Price = $scope.model
        .getInstanceOf('Price');
    $scope.GeneralAdmissionTicketItemInfo.Price.Currency = $scope.Store.Currency;

    /**
     * We don't use 'tmp' prefix here so the property will be visible on atmodel
     * display.
     */
    $scope.GeneralAdmissionTicketItemInfo.Stock = 0;

    $scope.wizard.open = true;
    $scope.wizard.reset();
  }

  $scope.deleteTicket = function(ticket) {
    if (confirm($filter('t')('Common.Text_RemoveProduct'))) {
      $scope.ticket.deleteTicket($scope.storeKey, ticket.Key).then(function() {
        $scope.init(true);
      }, function(err) {
        $scope.error.log(err)
      });
    }
  }

  $scope.updateItemStock = function(ev, ui) {
    $scope.$apply(function() {
      $scope.GeneralAdmissionTicketItemInfo.Stock = ui.value
    });
  }

  $scope.save = function() {
    if ($scope.wizard.finished) {
      $scope.wizard.saved = false;

      // format price
      if (angular.isDefined($scope.GeneralAdmissionTicketItemInfo.Price)) {
        $scope.GeneralAdmissionTicketItemInfo.Price.ItemPrice = parseFloat($scope.GeneralAdmissionTicketItemInfo.Price.ItemPrice);
      }

      if ($scope.GeneralAdmissionTicketItemInfo.Key === null) {
        // go on and create
        $scope.ticket
            .createTicket(
                $scope.storeKey,
                {
                  Public : true,
                  Name : $scope.GeneralAdmissionTicketItemInfo.Name,
                  Policy : $scope.GeneralAdmissionTicketItemInfo.Policy,
                  Price : $scope.GeneralAdmissionTicketItemInfo.Price.ItemPrice,
                  MaxPurchaseQuantity : $scope.GeneralAdmissionTicketItemInfo.MaxPurchaseQuantity,
                  OnSaleDateTimeStart : $scope.GeneralAdmissionTicketItemInfo.OnSaleDateTimeStart,
                  OnSaleDateTimeEnd : $scope.GeneralAdmissionTicketItemInfo.OnSaleDateTimeEnd
                }).then(
                function(ticketKey) {
                  // attach ticket to current event
                  $scope.event.addTicket($scope.storeKey, $scope.Event,
                      ticketKey).then(
                      function() {
                        $scope.GeneralAdmissionTicketItemInfo.Key = ticketKey;

                        // update stock (inventory)
                        $scope.ticket.updateStock($scope.storeKey,
                            $scope.GeneralAdmissionTicketItemInfo).then(
                            function() {
                              $scope.wizard.saved = true;

                              // refresh Event.Items
                              $scope.event.initEvent($scope.storeKey,
                                  $scope.Event.Key).then(function(event) {
                                $scope.Event = event;
                                // reload list
                                $scope.init(false);
                              }, function(err) {
                                $scope.error.log(err)
                              })
                            }, function(err) {
                              $scope.error.log(err)
                            });
                      }, function(err) {
                        $scope.error.log(err)
                      });
                }, function(err) {
                  $scope.error.log(err)
                });
      } else {
        // update ticket
        $scope.ticket.updateTicket($scope.storeKey,
            $scope.GeneralAdmissionTicketItemInfo).then(
            function() {
              // update stock (inventory)
              $scope.ticket.updateStock($scope.storeKey,
                  $scope.GeneralAdmissionTicketItemInfo).then(function() {
                $scope.wizard.saved = true;

                // reload list
                $scope.init(false);
              }, function(err) {
                $scope.error.log(err)
              });
            }, function(err) {
              $scope.error.log(err)
            });
      }
    }
  }
}

ticketController.$inject = [
    '$scope', '$cookieStore', '$filter', '$routeParams', '$timeout'
];