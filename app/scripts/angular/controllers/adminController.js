function adminController($scope, $location, $cookieStore) {
  $scope.authProviders = [], $scope.name = 'admin', $scope.loginErr = null,
      $scope.registerErr = null, $scope.registerOk = false,
      $scope.passwdOk = true;

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

  $scope.loadAuthProviders = function() {
    $scope.auth.loadAuthProviders().then(function(providers) {
      $scope.authProviders = providers;
    }, function(err) {
      $scope.error.log(err);
    });
  }

  $scope.login = function(provider) {
    if (angular.isDefined(provider) && angular.isString(provider)) {
      // login by provider
      $scope.auth.logonByProviderAsync(provider).then(function() {
        $scope.DomainProfile = $scope.auth.getDomainProfile();
        $location.path($cookieStore.get($scope.config.cookies.lastPath));
        $cookieStore.put($scope.config.cookies.loggedStatus, true);

        $scope.init();
      }, function(err) {
        $scope.loginErr = err;
      });
    } else {
      // login by account
      $scope.auth.logonAsync({
        Email : $scope.AccountProfile.Email,
        PasswordHash : BWL.oAuth.HashPassword($scope.AccountProfile.Password)
      }).then(function() {
        $scope.auth.authenticate($scope);
      }, function(err) {
        $scope.loginErr = err;
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
            PasswordHash : BWL.oAuth
                .HashPassword($scope.RegisterAccountProfile.Password)
          }).then(function() {
        $scope.registerOk = true;
      }, function(err) {
        $scope.registerErr = err;
      });
    }
  }

  $scope.validatePasswords = function() {
    $scope.passwdOk = $scope.RegisterAccountProfile.Password === $scope.RegisterAccountProfile.ConfirmPassword;
  }

  $scope.getPendingAccessRequests = function() {
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
                                        // request access to newly created store
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
                }
              }
            }, function(err) {
              $scope.error.log(err)
            })
  }

  $scope.rejectApproval = function(approval) {
    $scope.account.rejectRequest(approval.Key).then(function(ret) {
      $scope.getPendingAccessRequests();
    }, function(err) {
      $scope.error.log(err)
    })
  }
}

adminController.$inject = [ '$scope', '$location', '$cookieStore' ];