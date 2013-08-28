// config service
azureTicketsApp.factory('configService', function() {
  return {
    appName : '<%= at.name %>',
    clientKey : 'b31e42d6-9205-417d-a2d9-366abc7d5046',
    multipleStores : false,
    popupAuthWidth : 500,
    popupAuthHeight : 500,
    // containers
    container : {
      store : '<%= at.name %>'
    },
    typeahead : {
      minLength : 3
    },
    cookies : {
      lastPath : 'authLastPath',
      loggedStatus : 'auth',
      storeKey : 'storeKey',
      paymentSessionKey : 'paymentSessionKey'
    },
    api : {
      stockLimit : 500
    }
  }
});