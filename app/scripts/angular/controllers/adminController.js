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
}

adminController.$inject = [
    '$scope', '$location', '$cookieStore'
];