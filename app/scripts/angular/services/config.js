// config service
azureTicketsApp.factory('configService', function() {
  return {
    appName : '<%= at.name %>',
    appStage : '<%= at.urlStage %>',
    appLogo : '<%= at.logo %>',
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
      paymentSessionKey : 'paymentSessionKey',
      initPages : 'initPages'
    },
    api : {
      stockLimit : 500
    },
    keys : {
      bing : '<%= at.keys.bing %>'
    },
    media : {
      imagePreview : {
        maxW : 1024,
        maxH : 768
      }
    },
    paginator : {
      pageSizes : [ 10, 25, 50, 100 ],
      currentPageSize : 10,
      currentPage : 1
    }
  }
});