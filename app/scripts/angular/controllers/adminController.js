function adminController($rootScope, $scope, $location, $window, $cookieStore,
    $filter) {
  $scope.authProviders = [], $scope.name = 'admin', $scope.registerOk = false,
      $scope.resetPasswordOk = false, $scope.passwdOk = true,
      $scope.updateAccountOk = false;

  /**
   * models in play here.
   * 
   * @todo inject models, using array of strings maybe.
   */

  $scope.AccountProfile = $scope.auth.getAccountProfile();
  $scope.RegisterAccountProfile = angular.copy($scope.AccountProfile);

  // Pagination setup
  $scope.paginationPreRegister = {
    pageSize : 20,
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
  };

  $scope.paginationApproval = angular.copy($scope.paginationPreRegister)

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
    var _init = function() {
      $scope.DomainProfile = $scope.auth.getDomainProfile();

      // If DomainProfile.ProfileRole < 20, logout and notify error
      if ($scope.auth.isDomainProfileReady()
          && $scope.DomainProfile.ProfileRole < 20) {
        $scope.auth.logoffAsync().then(function() {
          // There's nothing yet except DomainProfile, so delete it
          delete $scope.DomainProfile;

          $scope.error.log($filter('t')('Login.Error_Auth20Failed'));
          return;
        }, function(err) {
          $scope.error.log(err);
        });
      }

      $location.path($cookieStore.get($scope.config.cookies.lastPath));
      $cookieStore.put($scope.config.cookies.loggedStatus, true);

      // reset store cookie
      $cookieStore.remove($scope.config.cookies.storeKey)

      $scope.init();
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
    if ($scope.passwdOk && $scope.emailOk) {
      $scope.auth.registerAsync(
          {
            FullName : $scope.RegisterAccountProfile.FullName,
            Email : $scope.RegisterAccountProfile.Email,
            FirstName : $scope.RegisterAccountProfile.FirstName,
            LastName : $scope.RegisterAccountProfile.LastName,
            PasswordHash : BWL.Auth
                .HashPassword($scope.RegisterAccountProfile.Password)
          }).then(function() {
        // Clear the fields
        $scope.RegisterAccountProfile = angular.copy($scope.AccountProfile);

        $scope.registerOk = true;
      }, function(err) {
        $scope.error.log(err)
      });
    } else {
      if (!$scope.passwdOk) {
        $scope.error.log($filter('t')('Login.labelConfirmPasswordFail'));
      }
      if (!$scope.emailOk) {
        $scope.error.log($filter('t')('Login.labelConfirmEmailFail'));
      }
    }
  }

  $scope.resetPassword = function() {
    $scope.auth.resetPasswordAsync({
      Email : $scope.ForgotPassword.Email,
    }).then(function() {
      $scope.resetPasswordOk = true;
      $scope.error.log(null);
    }, function(err) {
      $scope.error.log(err)
    });
  }

  $scope.validateEmail = function(model) {
    if (!angular.isDefined(model.Email)
        || !angular.isDefined(model.ConfirmEmail)) {
      $scope.emailOk = false;
    } else {
      $scope.emailOk = model.Email === model.ConfirmEmail;
    }
  }

  $scope.validatePasswords = function(model) {
    $scope.passwdOk = model.Password === model.ConfirmPassword;
  }

  /**
   * Store access request process
   */
  $scope.confirmApproval = function(approval, force) {
    if (force || confirm($filter('t')('Common.Text_Proceed'))) {
      if (!force
          && approval.RequestedItem.Type === BWL.Model.StorePreRegister.Type
          && $scope.hasPendingStoreRequest(approval)) {
        $scope.error.log($filter('t')('Common.Text_ExistingSchoolRequest'))
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
                                                          .getPendingAccessRequests()
                                                          .then(
                                                              function() {
                                                                // auto approve
                                                                // Store request
                                                                var sr = $scope
                                                                    .getStoreByStorePreRegisterRequest(approveItem);
                                                                $scope
                                                                    .confirmApproval(
                                                                        sr,
                                                                        true);
                                                              });
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
                      $scope.account
                          .approveRequest(approveItem.Key)
                          .then(
                              function() {
                                // update StorePreRegister request obj with new
                                // Store
                                // key
                                var spr = $scope
                                    .getStorePreRegisterByStoreRequest(approveItem);
                                var sprKey = spr.RequestedItem.Key;
                                var approveKey = spr.Key;

                                $scope.model
                                    .update(
                                        BWL.Model.StorePreRegister.Type,
                                        sprKey,
                                        {
                                          'StoreKey' : approveItem.RequestedItem.Key
                                        }).then(
                                        function() {
                                          // finally, approve original
                                          // StorePreRegister
                                          // request
                                          $scope.account.approveRequest(
                                              approveKey).then(function() {
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
  }

  $scope.rejectApproval = function(approval) {
    if (confirm($filter('t')('Common.Text_Proceed'))) {
      if (approval.RequestedItem.Type === BWL.Model.StorePreRegister.Type
          && $scope.hasPendingStoreRequest(approval)) {
        $scope.error.log($filter('t')('Common.Text_ExistingSchoolRequest'))
      } else {
        $scope.account.rejectRequest(approval.Key).then(function(ret) {
          $scope.getPendingAccessRequests();
        }, function(err) {
          $scope.error.log(err)
        })
      }
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
          && v.RequestedByKey === sprRequest.RequestedByKey
          && v.RequestedItem.Name === sprRequest.RequestedItem.Name) {
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

  /**
   * Retrieve Store obj based on an already processed StorePreRegister request.
   */
  $scope.getStoreByStorePreRegisterRequest = function(storePreRegisterRequest) {
    var ret = null;

    angular
        .forEach(
            $scope.approvals,
            function(v, k) {
              if (v.RequestedItem.Type === BWL.Model.Store.Type
                  && v.RequestedByKey === storePreRegisterRequest.RequestedByKey
                  && (storePreRegisterRequest.RequestedItem.Name === v.RequestedItem.Name)) {
                ret = v;
                return;
              }
            })

    return ret;
  }

  $scope.updateAccount = function() {
    $scope.error.log(null);

    $scope.DomainProfile.Contact.DateOfBirth = $scope.object.dateToISO8601(
        $scope.DomainProfile.Contact.DateOfBirth, true)
    $scope.DomainProfile.Contact.FullName = $scope.DomainProfile.Contact.FirstName
        + $scope.DomainProfile.Contact.LastName;
    $scope.DomainProfile.Contact.Gender = parseInt($scope.DomainProfile.Contact.Gender);

    var _updateAccount = function() {
      $scope.model.update(BWL.Model.Contact.Type,
          $scope.DomainProfile.Contact.Key, $scope.DomainProfile.Contact).then(
          function() {
            $scope.updateAccountdOk = true;

            $scope.auth.authenticate($scope, true);
          }, function(err) {
            $scope.error.log(err);
          });
    }

    // password update && acct update
    if ($scope.DomainProfile.Password && $scope.DomainProfile.ConfirmPassword) {
      if ($scope.passwdOk) {
        $scope.auth.updatePassword({
          Email : $scope.DomainProfile.Contact.EmailAddress,
          PasswordHash : BWL.Auth.HashPassword($scope.DomainProfile.Password)
        }).then(_updateAccount, function(err) {
          $scope.error.log(err);
        });
      } else {
        $scope.error.log($filter('t')('Login.labelConfirmPasswordFail'))
      }
    } else {
      // account update only
      _updateAccount();
    }
  }
}

adminController.$inject = [ '$rootScope', '$scope', '$location', '$window',
    '$cookieStore', '$filter' ];