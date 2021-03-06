'use strict';

describe('Controller: adminController', function() {
  var ctrl, scope = null;

  // initialize
  beforeEach(function() {
    module('azureTicketsApp');

    inject(function($rootScope, $controller, $cookieStore, authService,
        configService, modelService) {
      scope = $rootScope.$new();

      ctrl = $controller(adminController, {
        $scope : scope,
        authService : authService,
        configService : configService,
        modelService : modelService,
        $cookieStore : $cookieStore
      });
    });
  });

  iit('should initialize properly', function() {
    expect(scope.config).toBeDefined();
    expect(scope.DomainProfile.Key).toBeNull();
    expect(scope.AccountProfile.Key).toBeNull();
  });

  iit('should be able to retrieve auth providers', function() {
    scope.loadAuthProviders();

    waitsFor(function() {
      return scope.authProviders.length > 0;
    }, 'auth providers not retrieved', 6000);
  });

  iit('should be able register a test account', function() {
    var email = "testaccount" + new Date().getTime() + "@azuretickets.com";
    scope.RegisterAccountProfile = {
      FullName : 'Test Account',
      Email : email,
      Password : '121212',
      ConfirmPassword : '121212'
    }

    scope.register();

    // check for any validation errors, right now only check is password not
    // matching
    waitsFor(function() {
      return scope.registerErr === null && scope.registerOk;
    }, 'failed with error: ' + scope.registerErr, 5000);

    waitsFor(function() {
      return scope.registerMsg !== null;
    }, 'cannot register test account', 5000);

    // @todo
    // for more code coverage, we should be causing it to fail as a test and
    // confirm it did fail
    // for example registering the same account or passwords not matching
  });
});
