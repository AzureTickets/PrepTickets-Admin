'use strict';

var azureTicketsApp = angular.module('azureTicketsApp', [
    'ui', 'ngCookies'
]);

/**
 * Apply additional logic on any route request. Order is important.
 * 
 * @property {array} routeFilters
 */
var routeFilters = {
  rememberUrl : [
      '$location', '$cookieStore', 'configService',
      function($location, $cookieStore, configService) {
        if ($location.$$path !== '/auth/login') {
          $cookieStore.put(configService.cookies.lastPath, $location.$$path);
        }
      }
  ],
  redirectLogin : [
      '$rootScope',
      '$location',
      '$cookieStore',
      'authService',
      'configService',
      function($rootScope, $location, $cookieStore, authService, configService) {
        var lc = $cookieStore.get(configService.cookies.loggedStatus);

        // direct access to store, don't redirect
        var isStoreVisitor = /^\/store\/[\w\-\d]+$/g.test($location.$$path);

        if ((lc === null || !lc) && $location.$$path !== '/auth/login'
            && !isStoreVisitor) {
          $location.path('/auth/login');
        }
      }
  ]
}

// initialize routes
azureTicketsApp.config([
    '$routeProvider',
    function($routeProvider) {
      $routeProvider.when('/', {
        templateUrl : 'views/dashboard.html',
        controller : adminController,
        resolve : routeFilters
      }).when('/auth/login', {
        controller : adminController,
        templateUrl : 'views/auth.html',
        resolve : routeFilters
      }).when(
          '/auth/logoff',
          {
            controller : adminController,
            templateUrl : 'views/auth.html',
            resolve : {
              logoff : [
                  'authService',
                  '$rootScope',
                  '$timeout',
                  '$location',
                  '$cookieStore',
                  'configService',
                  function(authService, $rootScope, $timeout, $location,
                      $cookieStore, configService) {
                    authService.logoffAsync().then(
                        function() {
                          // clear cookies
                          $cookieStore
                              .remove(configService.cookies.loggedStatus);
                          $cookieStore.remove(configService.cookies.lastPath);
                          $cookieStore
                              .remove(configService.cookies.paymentSessionKey);

                          // reset store & profile
                          authService.setDomainProfile(null);
                          $rootScope.$broadcast('initStore', null);
                          $rootScope.$broadcast('resetDomainProfile');

                          $timeout(function() {
                            $rootScope.$apply(function() {
                              $location.path('/');
                            })
                          }, 250)
                        });
                  }
              ]
            }
          }).when('/front', {
        templateUrl : 'views/front.html',
        controller : frontController,
        resolve : routeFilters
      }).otherwise({
        redirectTo : '/'
      }).when('/store', {
        templateUrl : 'views/store.html',
        resolve : routeFilters
      }).when('/store/:storeURI', {
        templateUrl : 'views/storeVisitor.html',
        // controller : storeController,
        resolve : routeFilters
      }).when('/cart', {
        templateUrl : 'views/cart.html',
        controller : cartController,
        resolve : routeFilters
      }).when('/checkout', {
        templateUrl : 'views/checkout.html',
        controller : cartController,
        resolve : routeFilters
      }).when('/venue', {
        templateUrl : 'views/venue.html',
        controller : venueController,
        resolve : routeFilters
      }).when('/event', {
        templateUrl : 'views/event.html',
        controller : eventController,
        resolve : routeFilters
      }).when('/ticket/:eventKey', {
        templateUrl : 'views/ticket.html',
        controller : ticketController,
        resolve : routeFilters
      }).when('/scanners', {      ///:eventKey
        templateUrl : 'views/scanners.html',
        controller : scannerController,
        resolve : routeFilters
      }).when('/scanners/:eventKey', {
        templateUrl : 'views/scanners.html',
        controller : scannerController,
        resolve : routeFilters
      }).when('/order', {
        templateUrl : 'views/order.html',
        controller : orderController,
        resolve : routeFilters
      }).when('/dashboard', {
        redirectTo : '/'
      });
    }
]);
