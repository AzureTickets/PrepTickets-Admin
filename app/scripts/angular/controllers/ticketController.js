function ticketController($scope, $cookieStore, $filter, $routeParams,
    $timeout, $modal) {
  $scope.name = 'ticket';

  // initialize wizard for GeneralAdmissionTicketItemInfo
  $scope.wizardTicket = $scope.form.getWizard($scope);
  $scope.wizardPricingTier = $scope.form.getWizard($scope);
  
  // Largeimages property pagination setup
  $scope.paginationLI = {
    pageSize : 5,
    startRange : 0,
    predicates : [],
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
  }

  $scope.$watch('wizardTicket.open', function(v) {
    if (v) {
      $scope.wizardTicket.modal = $modal.open({
        templateUrl : 'formTicket.html',
        scope : $scope,
        backdrop : 'static'
      });
    } else if (angular.isDefined($scope.wizardTicket.modal)) {
      $scope.wizardTicket.modal.close();
    }
  })

  $scope.$watch('wizardPricingTier.open', function(v) {
    if (v) {
      $scope.wizardPricingTier.modal = $modal.open({
        templateUrl : 'formPricingTier.html',
        scope : $scope,
        backdrop : 'static'
      });
    } else if (angular.isDefined($scope.wizardPricingTier.modal)) {
      $scope.wizardPricingTier.modal.close();
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
    $scope.error.info($filter('t')('Common.Text_WaitLoading'))

    if (!angular.isDefined(resetEvent) || resetEvent) {
      $scope.loadEvent();
    }
    $scope.ticket.loadTickets($scope).then(function() {
      $scope.error.info(null)
    }, function() {
      $scope.error.info(null)
    });
  }

  $scope.filterByEvent = function(ticket) {
    var t = $scope.object.grep($scope.Event.Items, 'Key', ticket.Key);
    return angular.isObject(t) && angular.equals(t.Key, ticket.Key);
  }

  $scope.setURI = function(isPricingTier) {
    var ticketType = isPricingTier ? 'PricingTier'
        : BWL.Model.GeneralAdmissionTicketItemInfo.Type;
    $scope[ticketType].URI = angular.lowercase($scope.Event.Name.replace(
        /[^a-z0-9\-]{1,}/gi, '-')
        + '/'
        + (angular.isDefined($scope[ticketType].Name)
            && $scope[ticketType].Name !== null ? $scope[ticketType].Name
            .replace(/[^a-z0-9\-]{1,}/gi, '-') : ''));
  }

  /**
   * @param isPricingTier
   *          This new ticket becomes a Pricing Tier
   * @param ticket
   *          Parent ticket which hols newly created Pricing Tier
   */
  $scope.update = function(isPricingTier, ticket) {
    if (!isPricingTier) {
      $scope.GeneralAdmissionTicketItemInfo = angular.copy(ticket);
      // Temporary Ticket to track image changes
      $scope._tempGeneralAdmissionTicketItemInfo = angular.copy(ticket);
      
      $scope.wizardTicket.open = true;
      $scope.wizardTicket.reset();
    } else {
      $scope.PricingTier = angular.copy(ticket);
      // Temporary PricingTier to track image changes
      $scope._tempPricingTier = angular.copy(ticket);
      
      $scope.wizardPricingTier.open = true;
      $scope.wizardPricingTier.reset();
    }
  }

  /**
   * @param isPricingTier
   *          This new ticket becomes a Pricing Tier
   * @param ticket
   *          Parent ticket which hols newly created Pricing Tier
   */
  $scope.create = function(isPricingTier, ticket) {
    $scope.GeneralAdmissionTicketItemInfo = isPricingTier ? ticket
        : $scope.model.getInstanceOf('GeneralAdmissionTicketItemInfo');

    // set defaults
    if (!isPricingTier) {
      $scope.GeneralAdmissionTicketItemInfo.Price = $scope.model
          .getInstanceOf('Price');
      $scope.GeneralAdmissionTicketItemInfo.Price.Currency = $scope.Store.Currency;
      delete $scope.GeneralAdmissionTicketItemInfo.Price.Display;
      delete $scope.GeneralAdmissionTicketItemInfo.Price.Type;

      /**
       * We don't use 'tmp' prefix here so the property will be visible on
       * atmodel display.
       */
      $scope.GeneralAdmissionTicketItemInfo.Stock = 0;

      // Default ticket's date to event's date
      if ($scope.Event != null) {
        $scope.GeneralAdmissionTicketItemInfo.OnSaleDateTimeStart = $scope.Event.OnSaleDateTimeStart;
        $scope.GeneralAdmissionTicketItemInfo.OnSaleDateTimeEnd = $scope.Event.OnSaleDateTimeEnd;
      } else {
        var date = new Date();
        $scope.GeneralAdmissionTicketItemInfo.OnSaleDateTimeStart = $scope.object
            .dateToUIPicker(new String(new Date(date.getTime())));
        $scope.GeneralAdmissionTicketItemInfo.OnSaleDateTimeEnd = $scope.object
            .dateToUIPicker(new String(new Date(date.getTime() + 7 * 24 * 60
                * 60 * 1000)).slice(0, 15)
                + ' 22:00:00');
      }

      $scope.wizardTicket.open = true;
      $scope.wizardTicket.reset();
    } else {
      $scope.PricingTier = angular.copy(ticket);
      $scope.PricingTier.Key = null;
      $scope.PricingTier.Name = $scope.PricingTier.Name
          + ' #'
          + (angular.isDefined($scope.PricingTier.PricingTiers) ? $scope.PricingTier.PricingTiers.length + 1
              : 1);

      delete $scope.PricingTier.Price.Display;
      delete $scope.PricingTier.Price.Type;
      delete $scope.PricingTier.PricingTiers;
      // Remove inherited images
      delete $scope.PricingTier.Icon;
      delete $scope.PricingTier.SmallImage;
      delete $scope.PricingTier.Image;
      delete $scope.PricingTier.LargeImages;

      $scope.GeneralAdmissionTicketItemInfo.Stock = 0;

      $scope.wizardPricingTier.open = true;
      $scope.wizardPricingTier.reset();
    }
  }

  $scope.deleteTicket = function(ticket) {
    if (confirm($filter('t')('Common.Text_RemoveProduct'))) {
      $scope.ticket.deleteTicket($scope.storeKey, ticket.Key).then(function() {
        $scope.wizardTicket.open = false;
        $scope.init(true);
      }, function(err) {
        $scope.error.log(err)
      });
    }
  }

  $scope.updateTicketStock = function(ev, ui) {
    $scope.$apply(function() {
      $scope.GeneralAdmissionTicketItemInfo.Stock = ui.value
    });
  }

  $scope.updatePricingTierStock = function(ev, ui) {
    $scope.$apply(function() {
      $scope.PricingTier.Stock = ui.value
    });
  }

  $scope.save = function(isPricingTier) {
    if ((!isPricingTier && $scope.wizardTicket.finished)
        || (isPricingTier && $scope.wizardPricingTier.finished)) {
      $scope.wizardTicket.saved = false;
      $scope.wizardPricingTier.saved = false;

      var ticketType = isPricingTier ? 'PricingTier'
          : BWL.Model.GeneralAdmissionTicketItemInfo.Type;
      var _tempTicket = isPricingTier ? '_tempPricingTier'
          : '_tempGeneralAdmissionTicketItemInfo';
      var wizardType = isPricingTier ? 'wizardPricingTier'
          : 'wizardTicket';

      // Format price
      $scope[ticketType].Price.ItemPrice = parseFloat($scope[ticketType].Price.ItemPrice);

      if ($scope[ticketType].Key === null) {
        // Go on and create
        $scope.ticket.createTicket($scope.storeKey, {
          Public : true,
          Name : $scope[ticketType].Name,
          Brief : $scope[ticketType].Brief,
          Policy : $scope[ticketType].Policy,
          Price : $scope[ticketType].Price,
          MaxPurchaseQuantity : $scope[ticketType].MaxPurchaseQuantity,
          OnSaleDateTimeStart : $scope[ticketType].OnSaleDateTimeStart,
          OnSaleDateTimeEnd : $scope[ticketType].OnSaleDateTimeEnd,
          CustomURI : {
            URI : $scope[ticketType].URI
          }
        }).then(
          function(ticketKey) {
          	// Add Key to addAsync images to ticket or pricingTier
          	$scope[ticketType].Key = ticketKey;
          	
            if (!isPricingTier) {
              // Attach ticket to current event
              $scope.event.addTicket($scope.storeKey, $scope.Event, ticketKey).then(
                function() {
                  if ($scope[ticketType].Icon || $scope[ticketType].SmallImage || $scope[ticketType].Image) {
                    var imagePropNameList = [];
                    if ($scope[ticketType].Icon && $scope[ticketType].Icon.Key) {
                      imagePropNameList.push('Icon');
                    }
                    if ($scope[ticketType].SmallImage && $scope[ticketType].SmallImage.Key) {
                      imagePropNameList.push('SmallImage');
                    }
                    if ($scope[ticketType].Image && $scope[ticketType].Image.Key) {
                      imagePropNameList.push('Image');
                    }
                	    
                    if (imagePropNameList.length) {
                      $scope.model.associateSingleDatatypePropList($scope.storeKey, $scope[ticketType], imagePropNameList).then(
                        function() {
                          if ($scope[ticketType].LargeImages && angular.isArray($scope[ticketType].LargeImages) && $scope[ticketType].LargeImages.length) {
                            $scope.model.updateListDataTypeProp($scope.storeKey, {}, $scope[ticketType], 'LargeImages').then(
                              function() {
                                // Update stock (inventory)
                                $scope.ticket.updateStock($scope.storeKey, $scope[ticketType]).then(
                                  function() {
                                    $scope.wizardTicket.saved = true;
                                    
                                    // Refresh Event.Items
                                    $scope.event.initEvent($scope.storeKey, $scope.Event.Key).then(
                                      function(event) {
                                        $scope.Event = event;
                                        
                                        // Reload list
                                        $scope.init(false);
                                      }, function(err) {
                                        $scope.error.log(err);
                                      }
                                    )
                                  }, function(err) {
                                    $scope.error.log(err);
                                  }
                                )
                              }, function(err) {
                                $scope.error.log(err);
                              }
                            )
                          } else {
                            // Update stock (inventory)
                            $scope.ticket.updateStock($scope.storeKey, $scope[ticketType]).then(
                              function() {
                                $scope.wizardTicket.saved = true;
                                
                                // Refresh Event.Items
                                $scope.event.initEvent($scope.storeKey, $scope.Event.Key).then(
                                  function(event) {
                                    $scope.Event = event;
                                    
                                    // Reload list
                                    $scope.init(false);
                                  }, function(err) {
                                    $scope.error.log(err);
                                  }
                                )
                              }, function(err) {
                                $scope.error.log(err);
                              }
                            )
                          }
                        }, function(err) {
                          $scope.error.log(err);
                        }
                      )
                    }
                  } else {
                    if ($scope[ticketType].LargeImages && angular.isArray($scope[ticketType].LargeImages) && $scope[ticketType].LargeImages.length) {
                      $scope.model.updateListDataTypeProp($scope.storeKey, {}, $scope[ticketType], 'LargeImages').then(
                        function() {
                          // Update stock (inventory)
                          $scope.ticket.updateStock($scope.storeKey, $scope[ticketType]).then(
                            function() {
                              $scope.wizardTicket.saved = true;
                              
                              // Refresh Event.Items
                              $scope.event.initEvent($scope.storeKey, $scope.Event.Key).then(
                                function(event) {
                                  $scope.Event = event;
                                  
                                  // Reload list
                                  $scope.init(false);
                                }, function(err) {
                                  $scope.error.log(err);
                                }
                              )
                            }, function(err) {
                              $scope.error.log(err);
                            }
                          )
                        }, function(err) {
                          $scope.error.log(err);
                        }
                      )
                    } else {
                      // Update stock (inventory)
                      $scope.ticket.updateStock($scope.storeKey, $scope[ticketType]).then(
                        function() {
                          $scope.wizardTicket.saved = true;
                          
                          // Refresh Event.Items
                          $scope.event.initEvent($scope.storeKey, $scope.Event.Key).then(
                            function(event) {
                              $scope.Event = event;
                              
                              // Reload list
                              $scope.init(false);
                            }, function(err) {
                              $scope.error.log(err);
                            }
                          )
                        }, function(err) {
                          $scope.error.log(err);
                        }
                      )
                    }
                  }
                }, function(err) {
                  $scope.error.log(err);
                }
              )
            } else {
            	if ($scope[ticketType].Icon || $scope[ticketType].SmallImage || $scope[ticketType].Image) {
            	  var imagePropNameList = [];
            	  if ($scope[ticketType].Icon && $scope[ticketType].Icon.Key) {
            	    imagePropNameList.push('Icon');
            	  }
            	  if ($scope[ticketType].SmallImage && $scope[ticketType].SmallImage.Key) {
            	    imagePropNameList.push('SmallImage');
            	  }
            	  if ($scope[ticketType].Image && $scope[ticketType].Image.Key) {
            	    imagePropNameList.push('Image');
            	  }
            	  
            	  if (imagePropNameList.length) {
            	    $scope.model.associateSingleDatatypePropList($scope.storeKey, $scope[ticketType], imagePropNameList).then(
            	      function() {
            	        if ($scope[ticketType].LargeImages && angular.isArray($scope[ticketType].LargeImages) && $scope[ticketType].LargeImages.length) {
            	          $scope.model.updateListDataTypeProp($scope.storeKey, {}, $scope[ticketType], 'LargeImages').then(
            	            function() {
            	              // Add PricingTier to parent ticket
            	              BWL.Services.ModelService.AddAsync($scope.Store.Key,
            	                BWL.Model.GeneralAdmissionTicketItemInfo.Type,
            	                $scope.GeneralAdmissionTicketItemInfo.Key, 'PricingTiers',
            	                BWL.Model.GeneralAdmissionTicketItemInfo.Type, {
            	                  Key : ticketKey
            	                }, function(ret) {
            	                  $scope.wizardPricingTier.saved = true;
            	                  
            	                  // Reload list
            	                  $scope.init(false);
            	                }, function(err) {
            	                  $scope.error.log(err);
            	                }
            	              )
            	            }, function(err) {
            	              $scope.error.log(err);
            	            }
            	          )
            	        } else {
            	          // Add PricingTier to parent ticket
            	          BWL.Services.ModelService.AddAsync($scope.Store.Key,
            	            BWL.Model.GeneralAdmissionTicketItemInfo.Type,
            	            $scope.GeneralAdmissionTicketItemInfo.Key, 'PricingTiers',
            	            BWL.Model.GeneralAdmissionTicketItemInfo.Type, {
            	              Key : ticketKey
            	            }, function(ret) {
            	              $scope.wizardPricingTier.saved = true;
            	              
            	              // Reload list
            	              $scope.init(false);
            	            }, function(err) {
            	              $scope.error.log(err);
            	            }
            	          )
            	        }
            	      }, function(err) {
            	        $scope.error.log(err);
            	      }
            	    )
            	  }
            	} else {
            	  if ($scope[ticketType].LargeImages && angular.isArray($scope[ticketType].LargeImages) && $scope[ticketType].LargeImages.length) {
            	    $scope.model.updateListDataTypeProp($scope.storeKey, {}, $scope[ticketType], 'LargeImages').then(
            	      function() {
            	        // Add PricingTier to parent ticket
            	        BWL.Services.ModelService.AddAsync($scope.Store.Key,
            	          BWL.Model.GeneralAdmissionTicketItemInfo.Type,
            	          $scope.GeneralAdmissionTicketItemInfo.Key, 'PricingTiers',
            	          BWL.Model.GeneralAdmissionTicketItemInfo.Type, {
            	            Key : ticketKey
            	          }, function(ret) {
            	            $scope.wizardPricingTier.saved = true;
            	            
            	            // Reload list
            	            $scope.init(false);
            	          }, function(err) {
            	            $scope.error.log(err);
            	          }
            	        )
            	      }, function(err) {
            	        $scope.error.log(err);
            	      }
            	    )
            	  } else {
            	    // Add PricingTier to parent ticket
            	    BWL.Services.ModelService.AddAsync($scope.Store.Key,
            	      BWL.Model.GeneralAdmissionTicketItemInfo.Type,
            	      $scope.GeneralAdmissionTicketItemInfo.Key, 'PricingTiers',
            	      BWL.Model.GeneralAdmissionTicketItemInfo.Type, {
            	        Key : ticketKey
            	      }, function(ret) {
            	        $scope.wizardPricingTier.saved = true;
            	        
            	        // Reload list
            	        $scope.init(false);
            	      }, function(err) {
            	        $scope.error.log(err);
            	      }
            	    )
            	  }
            	}
            }
          }, function(err) {
            $scope.error.log(err)
          }
        )
      } else {
        // Update ticket
        $scope.ticket.updateTicket($scope.storeKey, $scope[ticketType]).then(
          function() {
          	if ($scope[ticketType].Icon || $scope[ticketType].SmallImage || $scope[ticketType].Image) {
          	  var imagePropNameList = [];
          	  if ($scope[ticketType].Icon && $scope[ticketType].Icon.Key) {
          	    if (!angular.isDefined($scope[_tempTicket].Icon) || $scope[ticketType].Icon.Key != $scope[_tempTicket].Icon.Key) {
          	      imagePropNameList.push('Icon');
          	    }
          	  }
          	  if ($scope[ticketType].SmallImage && $scope[ticketType].SmallImage.Key) {
          	    if (!angular.isDefined($scope[_tempTicket].SmallImage) || $scope[ticketType].SmallImage.Key != $scope[_tempTicket].SmallImage.Key) {
          	      imagePropNameList.push('SmallImage');
          	    }
          	  }
          	  if ($scope[ticketType].Image && $scope[ticketType].Image.Key) {
          	    if (!angular.isDefined($scope[_tempTicket].Image) || $scope[ticketType].Image.Key != $scope[_tempTicket].Image.Key) {
          	      imagePropNameList.push('Image');
          	    }
          	  }
          	  
          	  if (imagePropNameList.length) {
          	    $scope.model.associateSingleDatatypePropList($scope.storeKey, $scope[ticketType], imagePropNameList).then(
          	      function() {
          	        $scope.model.updateListDataTypeProp($scope.storeKey, $scope[_tempTicket], $scope[ticketType], 'LargeImages').then(
          	          function() {
          	            // Update stock (inventory)
          	            $scope.ticket.updateStock($scope.storeKey, $scope[ticketType]).then(
          	              function() {
          	                $scope[wizardType].saved = true;
          	                
          	                // Reload list
          	                $scope.init(false);
          	              }, function(err) {
          	                $scope.error.log(err);
          	              }
          	            )
          	          }, function(err) {
          	            $scope.error.log(err);
          	          }
          	        )
          	      }, function(err) {
          	        $scope.error.log(err);
          	      }
          	    )
          	  } else {
          	    $scope.model.updateListDataTypeProp($scope.storeKey, $scope[_tempTicket], $scope[ticketType], 'LargeImages').then(
          	      function() {
          	        // Update stock (inventory)
          	        $scope.ticket.updateStock($scope.storeKey, $scope[ticketType]).then(
          	          function() {
          	            $scope[wizardType].saved = true;
          	            
          	            // Reload list
          	            $scope.init(false);
          	          }, function(err) {
          	            $scope.error.log(err);
          	          }
          	        )
          	      }, function(err) {
          	        $scope.error.log(err);
          	      }
          	    )
          	  }
          	} else {
          	  $scope.model.updateListDataTypeProp($scope.storeKey, $scope[_tempTicket], $scope[ticketType], 'LargeImages').then(
          	    function() {
          	      // Update stock (inventory)
          	      $scope.ticket.updateStock($scope.storeKey, $scope[ticketType]).then(
          	        function() {
          	          $scope[wizardType].saved = true;
          	          
          	          // Reload list
          	          $scope.init(false);
          	        }, function(err) {
          	          $scope.error.log(err);
          	        }
          	      )
          	    }, function(err) {
          	      $scope.error.log(err);
          	    }
          	  )
          	}
          }, function(err) {
            $scope.error.log(err);
          }
        )
      }
    }
  }
}

ticketController.$inject = [ '$scope', '$cookieStore', '$filter',
    '$routeParams', '$timeout', '$modal' ];