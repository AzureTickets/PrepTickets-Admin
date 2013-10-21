azureTicketsApp
  .directive(
    'atfilter', [
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
            var dateTimeScript = null, _el = jQuery('<input />');
            var _attr = {
              placeholder : $scope.atField.replace(/([A-Z])|\./g, ' $1')
                .trim(),
              // The objproperty is a property name of $scope.atModel (which is $scope.filterModel in filterController)
              objproperty : f,
              name : $scope.atModel.Type + '_' + $scope.atField,
              id : $scope.atModel.Type + '_' + $scope.atField
            };

            switch (fType) {
              case 'DateTime':
                _attr.type = 'text';
                _el.attr('ng-model', 'atModel');
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
              case 'IContact':
                _attr.type = 'text';
                // Attach model to the field.
                // This model is a property of $scope.atModel which two-way binds to $scope.filterModel in filterController
                _el.attr('ng-model', 'atModel' + '.' + [f]);
                break;
              case 'OrderStateEnum':
                _attr.type = 'number';
                _el.attr('ng-model', 'atModel' + '.' + [f]);
                break;
              case 'Price':
                _attr.type = 'number';
                _el.attr('ng-model', 'atModel' + '.' + [f]);
                break;
              case 'Double':
                _attr.type = 'number';
                _el.attr('ng-model', 'atModel' + '.' + [f]);
                break;
              case 'String':
                _attr.type = 'text';
                _el.attr('ng-model', 'atModel' + '.' + [f]);
                break;
              default:
                _attr.type = 'number';
                _el.attr('ng-model', 'atModel' + '.' + [f]);
            }

            if (_el !== null) {
              // make new element available
              // _el.attr('ng-model', 'atModel');

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
      }
    ]
  )