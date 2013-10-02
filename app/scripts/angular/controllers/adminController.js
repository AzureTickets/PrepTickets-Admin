function adminController($scope, $location, $window, $cookieStore, $filter,
    $modal) {
  $scope.authProviders = [], $scope.name = 'admin', $scope.registerOk = false,
      $scope.resetPasswordOk = false, $scope.passwdOk = true,
      $scope.modalLogin = {
        open : false
      }, $scope.modalRegister = angular.copy($scope.modalLogin),
      $scope.modalForgot = angular.copy($scope.modalLogin);

  $scope.path = $location.$$path

  /**
   * models in play here.
   * 
   * @todo inject models, using array of strings maybe.
   */
  $scope.AccountProfile = $scope.auth.getAccountProfile();
  $scope.RegisterAccountProfile = angular.copy($scope.AccountProfile);

  $scope.$on('resetDomainProfile', function() {
    delete $scope.DomainProfile;
  });

  $scope.$watch('modalLogin.open', function(v) {
    if (v) {
      $scope.modalLogin.modal = $modal.open({
        templateUrl : 'formLogin.html',
        scope : $scope,
        backdrop : 'static'
      });
    } else if (angular.isDefined($scope.modalLogin.modal)) {
      $scope.modalLogin.modal.close();
    }
  })
  $scope.$watch('modalRegister.open', function(v) {
    if (v) {
      $scope.modalRegister.modal = $modal.open({
        templateUrl : 'formRegister.html',
        scope : $scope,
        backdrop : 'static'
      });
    } else if (angular.isDefined($scope.modalRegister.modal)) {
      $scope.modalRegister.modal.close();
    }
  })
  $scope.$watch('modalForgot.open', function(v) {
    if (v) {
      $scope.modalForgot.modal = $modal.open({
        templateUrl : 'formForgot.html',
        scope : $scope,
        backdrop : 'static'
      });
    } else if (angular.isDefined($scope.modalForgot.modal)) {
      $scope.modalForgot.modal.close();
    }
  })

  $scope.init = function() {
    // modal switch
    switch ($scope.path) {
    case '/login':
      $scope.modalLogin.open = true, $scope.modalRegister.open = false,
          $scope.modalForgot.open = false
      break;
    case '/register':
      $scope.modalLogin.open = false, $scope.modalRegister.open = true,
          $scope.modalForgot.open = false
      break;
    case '/forgot':
      $scope.modalLogin.open = false, $scope.modalRegister.open = false,
          $scope.modalForgot.open = true
      break;
    }
  }

  $scope.loadAuthProviders = function() {
    $scope.auth.loadAuthProviders().then(function(providers) {
      $scope.authProviders = providers;
    }, function(err) {
      $scope.error.log(err);
    });
  }

  $scope.login = function(provider) {
    var _init = function() {
      $scope.DomainProfile = $scope.auth.getDomainProfile();
      $location.path($cookieStore.get($scope.config.cookies.lastPath));
      $cookieStore.put($scope.config.cookies.loggedStatus, true);

      $scope.modalLogin.open = false;
      $scope.$parent.init();
    }

    if (angular.isDefined(provider) && angular.isString(provider)) {
      // login by provider
      $scope.auth.logonByProviderAsync(provider).then(function() {
        _init();
      }, function(err) {
        $scope.error.log(err)
      });
    } else {
      // login by account
      $scope.auth.logonAsync({
        Email : $scope.AccountProfile.Email,
        PasswordHash : BWL.Auth.HashPassword($scope.AccountProfile.Password)
      }).then(function() {
        _init();
      }, function(err) {
        $scope.error.log(err)
      });
    }
  }

  $scope.register = function() {
    // register account
    if ($scope.passwdOk) {
      $scope.auth.registerAsync(
          {
            FullName : $scope.RegisterAccountProfile.FullName,
            Email : $scope.RegisterAccountProfile.Email,
            FirstName : $scope.RegisterAccountProfile.FirstName,
            LastName : $scope.RegisterAccountProfile.LastName,
            PasswordHash : BWL.Auth
                .HashPassword($scope.RegisterAccountProfile.Password)
          }).then(function() {
        $scope.registerOk = true;
      }, function(err) {
        $scope.error.log(err)
      });
    }
  }

  $scope.resetPassword = function() {
    $scope.auth.resetPasswordAsync({
      Email : $scope.AccountProfile.Email,
    }).then(function() {
      $scope.resetPasswordOk = true;
      $scope.error.log(null);
    }, function(err) {
      $scope.error.log(err)
    });
  }

  $scope.validatePasswords = function() {
    $scope.passwdOk = $scope.RegisterAccountProfile.Password === $scope.RegisterAccountProfile.ConfirmPassword;
  }

  $scope.getPendingAccessRequests = function() {
    $scope.error.log(null);

    $scope.account.getAccessRequests().then(function(pending) {
      $scope.approvals = angular.isArray(pending) ? pending : [];
    }, function(err) {
      $scope.error.log(err)
    })
  }

  /**
   * Store access request process
   */
  $scope.confirmApproval = function(approval) {
    if (approval.RequestedItem.Type === BWL.Model.StorePreRegister.Type
        && $scope.hasPendingStoreRequest(approval)) {
      $scope.error.log($filter('t')('Common.Text_ExistingStoreRequest'))
    } else {
      // get approval item
      $scope.model
          .read(approval.Type, approval.Key, 4)
          .then(
              function(approveItem) {
                if (angular.isObject(approveItem)
                    && angular.isDefined(approveItem.Key)) {
                  if (approveItem.RequestedItem.Type === BWL.Model.StorePreRegister.Type) {
                    /**
                     * StorePreRegister Approval process
                     */
                    // initialize store object
                    var store = {};
                    store.isNew = true; // removed by storeService on save,
                    // temporary
                    store.Public = true;
                    store.Currency = 'USD';
                    store.Name = approveItem.RequestedItem.Name;

                    // get geo info
                    $scope.geo
                        .getCityByName(approveItem.RequestedItem.City,
                            approveItem.RequestedItem.Region,
                            approveItem.RequestedItem.Country)
                        .then(
                            function(city) {
                              if (angular.isObject(city)) {
                                store.Address = {
                                  'AddressLine1' : approveItem.RequestedItem.AddressLine1,
                                  'AddressType' : $scope.enums.AddressTypeEnum.Home,
                                  'City' : approveItem.RequestedItem.City,
                                  'PostalCode' : approveItem.RequestedItem.PostalCode,
                                  'Region' : approveItem.RequestedItem.Region,
                                  'District' : approveItem.RequestedItem.District,
                                  'Country' : approveItem.RequestedItem.Country,
                                  'County' : approveItem.RequestedItem.County,
                                  'Timezone' : city.TimezoneName
                                };

                                // create store
                                $scope.store
                                    .createStore(store)
                                    .then(
                                        function(storeKey) {
                                          // request access to newly created
                                          // store
                                          // for profile
                                          $scope.account
                                              .accessRequestFor(
                                                  BWL.Model.Store.Type,
                                                  storeKey,
                                                  approveItem.RequestedByKey,
                                                  $scope.enums.ModelAccessTypeEnum.FullAccess)
                                              .then(
                                                  function(ret) {
                                                    $scope
                                                        .getPendingAccessRequests();
                                                  }, function(err) {
                                                    $scope.error.log(err)
                                                  })
                                        }, function(err) {
                                          $scope.error.log(err)
                                        })
                              }
                            }, function(err) {
                              $scope.error.log(err)
                            })
                  } else if (approveItem.RequestedItem.Type === BWL.Model.Store.Type) {
                    /**
                     * Store Approval process
                     */
                    $scope.account.approveRequest(approveItem.Key).then(
                        function() {
                          // update StorePreRegister request obj with new
                          // Store
                          // key
                          var spr = $scope
                              .getStorePreRegisterByStoreRequest(approveItem);
                          var sprKey = spr.RequestedItem.Key;
                          var approveKey = spr.Key;

                          $scope.model.update(BWL.Model.StorePreRegister.Type,
                              sprKey, {
                                'StoreKey' : approveItem.RequestedItem.Key
                              }).then(
                              function() {
                                // finally, approve original StorePreRegister
                                // request
                                $scope.account.approveRequest(approveKey).then(
                                    function() {
                                      $scope.getPendingAccessRequests();
                                    }, function(err) {
                                      $scope.error.log(err)
                                    })
                              }, function(err) {
                                $scope.error.log(err)
                              })
                        }, function(err) {
                          $scope.error.log(err)
                        })
                  } else if (approveItem.RequestedItem.Type === BWL.Model.Address.Type) {
                    /**
                     * Address Approval process
                     */
                    $scope.account.approveRequest(approveItem.Key).then(
                        function() {
                          $scope.getPendingAccessRequests();
                        }, function(err) {
                          $scope.error.log(err)
                        })
                  }
                }
              }, function(err) {
                $scope.error.log(err)
              })
    }
  }

  $scope.rejectApproval = function(approval) {
    if (approval.RequestedItem.Type === BWL.Model.StorePreRegister.Type
        && $scope.hasPendingStoreRequest(approval)) {
      $scope.error.log($filter('t')('Common.Text_ExistingStoreRequest'))
    } else {
      $scope.account.rejectRequest(approval.Key).then(function(ret) {
        $scope.getPendingAccessRequests();
      }, function(err) {
        $scope.error.log(err)
      })
    }
  }

  /**
   * Should return true if the provided StorePreRegister request has already a
   * pending Store request on queue.
   */
  $scope.hasPendingStoreRequest = function(sprRequest) {
    var ret = false;

    angular.forEach($scope.approvals, function(v, k) {
      if (v.RequestedItem.Type === BWL.Model.Store.Type
          && v.RequestedByKey === sprRequest.RequestedByKey) {
        ret = true;
        return;
      }
    })

    return ret;
  }

  /**
   * Retrieve StorePreRegister obj based on an already processed Store request.
   */
  $scope.getStorePreRegisterByStoreRequest = function(storeRequest) {
    var ret = null;

    angular
        .forEach(
            $scope.approvals,
            function(v, k) {
              if (v.RequestedItem.Type === BWL.Model.StorePreRegister.Type
                  && v.RequestedByKey === storeRequest.RequestedByKey
                  && (storeRequest.RequestedItem.Address.City === v.RequestedItem.City && storeRequest.RequestedItem.Name === v.RequestedItem.Name)) {
                ret = v;
                return;
              }
            })

    return ret;
  }
}

adminController.$inject = [ '$scope', '$location', '$window', '$cookieStore',
    '$filter', '$modal' ];