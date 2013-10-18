azureTicketsApp
    .directive(
        'atfilter',
        [
            '$compile',
            'objectService',
            'modelService',
            function($compile, objectService, modelService) {
              return {
                restrict : 'EA',
                scope : {
                  atModel : '=atModel',
                  atField : '=atField',
                },
                link : function($scope, $element, $attrs) {
                  // if field is date range
                  var f = /(?:From|To)Date/g.test($scope.atField) ? $scope.atField
                      .replace(/(?:From|To)Date/g, '')
                      : $scope.atField;

                  var fType = BWL.ModelMeta[$scope.atModel.Type][f];
                  var dateTimeScript = null, _el = null;
                  var _attr = {
                    placeholder : $scope.atField.replace(/([A-Z])|\./g, ' $1')
                        .trim(),
                    name : $scope.atModel.Type + '_' + $scope.atField,
                    id : $scope.atModel.Type + '_' + $scope.atField
                  };

                  switch (fType) {
                  case 'DateTime':
                    _attr.type = 'text', _el = jQuery('<input />');
                    dateTimeScript = jQuery('<script type="text/javascript" />');

                    // ensure format is ok
                    $scope.atModel = objectService.dateToUIPicker(new Date());

                    // we're outside angular, so we need to do some tricks here
                    // in order to update the model
                    var js = "function(v, tp){\
              var formScope = angular.element(jQuery('#"
                        + _attr.id
                        + "').parents('form').first()).scope();\
              var ctrlScope = formScope.$parent;\
              ctrlScope.$apply(function(){\
                ctrlScope.filterModel"
                        + "."
                        + $scope.atField
                        + " = v;\
              });\
              }\
              ";

                    dateTimeScript
                        .text("jQuery(function(){jQuery('#"
                            + _attr.id
                            + "').datetimepicker({timeFormat: 'hh:mm tt', onClose: "
                            + js + " });});");

                    break;
                  }

                  if (_el !== null) {
                    // make new element available
                    _el.attr('ng-model', 'atModel');

                    // define new element attributes
                    for (p in _attr) {
                      _el.attr(p, _attr[p]);
                    }

                    $element.append(_el);

                    if (dateTimeScript !== null) {
                      $element.after(dateTimeScript);
                    }

                    $compile(_el)($scope);
                  }
                }
              }
            } ])