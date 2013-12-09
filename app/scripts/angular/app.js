'use strict';

var azureTicketsApp = angular.module('azureTicketsApp', [ 'ui',
    'ui.directives', 'ngCookies', 'ui.bootstrap', 'ui.tinymce', 'ngSanitize' ]);

/**
 * Apply additional logic on any route request. Order is important.
 * 
 * @property {array} routeFilters
 */
var routeFilters = {
  rememberUrl : [ '$location', '$cookieStore', 'configService',
      function($location, $cookieStore, configService) {
      	var lastPath = function() { return $location.$$path; };
        if (!/\/(login|register|forgot)/.test(lastPath()) && $cookieStore.get(configService.cookies.loggedStatus)) {
          $cookieStore.put(configService.cookies.lastPath, lastPath());
        }
      } ],
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
        var re = new RegExp(/\/(?:login|register|forgot)/);

        if (!angular.isArray($location.$$path.match(re))) {
          $cookieStore.remove(configService.cookies.initPages)

          if ((lc === null || !lc) && !isStoreVisitor) {
          	$location.path('/login');
          }
        } else {
          $cookieStore.remove(configService.cookies.loggedStatus);
          $cookieStore.put(configService.cookies.initPages, true);
        }
      } ]
}

// initialize routes
azureTicketsApp.config([
    '$routeProvider',
    function($routeProvider) {
      $routeProvider.when('/dashboard', {
        templateUrl : 'views/dashboard.html',
        controller : adminController,
        resolve : routeFilters
      }).when('/login', {
        controller : adminController,
        templateUrl : 'views/login.html',
        resolve : routeFilters
      }).when('/register', {
        controller : adminController,
        templateUrl : 'views/register.html',
        resolve : routeFilters
      }).when('/forgot', {
        controller : adminController,
        templateUrl : 'views/forgot.html',
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
                              $location.path('/login');
                            })
                          }, 250)
                        });
                  } ]
            }
          }).when('/front', {
        templateUrl : 'views/front.html',
        controller : frontController,
        resolve : routeFilters
      }).otherwise({
        redirectTo : '/dashboard'
      }).when('/accountUpdate', {
        templateUrl : 'views/accountUpdate.html',
        controller : adminController,
        resolve : routeFilters
      }).when('/store', {
        templateUrl : 'views/store.html',
        resolve : routeFilters
      }).when('/storeList', {
        templateUrl : 'views/storeList.html',
        resolve : routeFilters
      }).when('/storeRequest', {
        templateUrl : 'views/storePreRegister.html',
        controller : adminController,
        resolve : routeFilters
      }).when('/approvals', {
        templateUrl : 'views/approvalsList.html',
        controller : adminController,
        resolve : routeFilters
      }).when('/store/:storeURI', {
        templateUrl : 'views/storeVisitor.html',
        // controller : storeController,
        resolve : routeFilters
      }).when('/cart', {
        templateUrl : 'views/cart.html',
        controller : cartController,
        resolve : routeFilters
      }).when('/category', {
        templateUrl : 'views/category.html',
        controller : categoryController,
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
      }).when('/scanner', {
        templateUrl : 'views/scanner.html',
        controller : scannerController,
        resolve : routeFilters
      }).when('/scanner/:eventKey', {
        templateUrl : 'views/scanner.html',
        controller : scannerController,
        resolve : routeFilters
      }).when('/order', {
        templateUrl : 'views/orderList.html',
        controller : orderController,
        resolve : routeFilters
      }).when('/order/:orderKey', {
        templateUrl : 'views/orderDetail.html',
        controller : orderController,
        resolve : routeFilters
      }).when('/order/:orderKey/:ticketKey', {
        templateUrl : 'views/orderTicket.html',
        controller : orderController,
        resolve : routeFilters
      }).when('/media', {
        templateUrl : 'views/media.html',
        controller : mediaController,
        resolve : routeFilters
      });
    } ]);
