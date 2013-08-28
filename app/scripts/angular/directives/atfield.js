/**
 * This directive will generate a HTML form field following type definition
 * rules from modelsmeta.js.
 */
azureTicketsApp
    .directive(
        'atfield',
        [
            '$compile',
            function($compile) {
              return {
                restrict : 'EA',
                scope : {
                  atModel : '=ngModel',
                  atLabel : '=label',
                  atTip : '=tip',
                  atChange : '=ngChange',
                  atReadonly : '=ngReadonly',
                  atUiValidate : '&uiValidate',
                  atUiValidateWatch : '&uiValidateWatch',
                  // atPattern : '@ngPattern',
                  atBlur : '=ngBlur',
                  atDataProvider : '=dataProvider',
                  atDataSource : '=dataSource',
                },
                link : function($scope, $element, $attrs) {
                  var ss = $attrs.ngModel.split('.');
                  var m = ss.length === 3 ? ss[1] : ss[0];// model name
                  var f = ss.length === 3 ? ss[ss.length - 1] : ss[1]; // property
                  // name
                  var copyOf = angular.isDefined($attrs.atCopy) ? BWL.ModelMeta[$attrs.atCopy]
                      : null
                  var fieldType = copyOf === null
                      && angular.isDefined(BWL.ModelMeta[m]) ? BWL.ModelMeta[m][f]
                      : copyOf[f];
                  var _el, _label = null, _tip = null;
                  var _attr = {
                    placeholder : f,
                    name : m + '_' + f,
                    id : $attrs.ngModel.replace(/\./g, '-')
                  };
                  var isPass = /Password/g.test(f), dateTimeScript = null;
                  var _req = angular.isDefined($attrs.ngRequired) ? 'ng-required="true"'
                      : '';
                  // set tip if defined
                  if (angular.isDefined($attrs.tip)) {
                    _tip = jQuery('<small />');
                    _tip.addClass('clear').addClass('muted');
                    _tip.text('{{atTip}}');
                  }
                  // set label if defined
                  if (angular.isDefined($attrs.label)) {
                    _label = jQuery('<label />');
                    _label.text('{{atLabel}}');
                    if (angular.isDefined($attrs.labelClass)) {
                      _label.addClass($attrs.labelClass);
                    }
                  } else {
                    _label = jQuery('<label />');
                    _label.text(f.replace(/([A-Z])/g, ' $1'));
                  }

                  // set proper element definition
                  if (/^(?:String|Double|Char)/g.test(fieldType)) {
                    _attr.type = !isPass ? 'text' : 'password',
                        _el = jQuery('<input ' + _req + '/>');
                  } else if (/^(?:Text)/g.test(fieldType)) {
                    _el = jQuery('<textarea />');
                  } else if (/^Int/g.test(fieldType)) {
                    _attr.type = 'number',
                        _el = jQuery('<input ' + _req + '/>');
                  } else if (/^Boolean/g.test(fieldType)) {
                    _attr.type = 'checkbox', _el = jQuery('<input />');
                    if (_label !== null) {
                      _label.addClass('pull-right');
                    }
                  } else if (/^Date|Time/g.test(fieldType)) {
                    _attr.type = 'text', _el = jQuery('<input ' + _req + '/>');
                    dateTimeScript = jQuery('<script type="text/javascript" />');

                    // we're outside angular, so we need to do some tricks here
                    // to update model
                    var js = "function(v, el, format){\
                      var formScope = angular.element(jQuery('#'+el.id).parents('form').first()).scope();\
                      var ctrlScope = formScope.$parent;\
                      ctrlScope.$apply(function(){\
                  		  ctrlScope."
                        + m
                        + "."
                        + f
                        + " = v;\
                  		});\
                      }\
                      ";

                    dateTimeScript
                        .text("jQuery(function(){jQuery('#"
                            + _attr.id
                            + "').datetimepicker({timeFormat: 'hh:mm tt', onClose: "
                            + js + " });});");

                    if ($attrs.uiDateFormat) {
                      _el.attr('ui-date-format', $attrs.uiDateFormat)
                    }
                  } else if (/^.*Enum(?=\b).*$/g.test(fieldType)) {
                    _el = jQuery('<select />');
                    var _enum = BWL.ModelEnum[fieldType.replace(
                        /^(.*Enum)(?=\b).*$/g, '$1')];
                    for ( var e in _enum) {
                      _el.append(jQuery('<option value="' + _enum[e] + '" />')
                          .text(e));
                    }
                  } else {
                    _attr.type = 'text', _el = jQuery('<input ' + _req + '/>');
                  }

                  // define new element attributes
                  for (p in _attr) {
                    _el.attr(p, _attr[p]);
                  }
                  for (p in $attrs) {
                    if (angular.isString($attrs[p])
                        && [
                            'ngModel', 'ngRequired', 'ngChange', 'uiValidate',
                            'uiValidateWatch', 'ngBlur', 'uiEvent',
                            'uiDateFormat', 'ngPattern', 'dataProvider',
                            'dataSource', 'uiJq'
                        ].indexOf(p) === -1) {
                      var pp = p.replace(/([A-Z]+)/g, '-$1').toLowerCase();
                      var v = $scope.$eval($attrs[p]) !== 0 ? $scope
                          .$eval($attrs[p]) : $attrs[p]

                      _el.attr(pp, angular.isDefined(v) ? v : '');
                    }
                  }

                  // make new element available
                  _el.attr('ng-model', 'atModel');

                  if ($attrs.uiValidate) {
                    _el.attr('ui-validate', 'atUiValidate');
                  }
                  if ($attrs.uiValidateWatch) {
                    _el.attr('ui-validate-watch', 'atUiValidateWatch');
                  }
                  if ($attrs.ngPattern) {
                    _el.attr('ng-pattern', $attrs.ngPattern);
                  }
                  if ($attrs.bsTypeahead) {
                    _el.attr('bs-typeahead', 'atTypeahead');
                  }
                  if ($attrs.ngBlur) {
                    _el.attr('ng-blur', 'atBlur');
                  }
                  if ($attrs.ngChange) {
                    _el.attr('ng-change', 'atChange');
                  }
                  if ($attrs.ngReadonly) {
                    _el.attr('ng-readonly', 'atReadonly');
                  }
                  if ($attrs.uiEvent) {
                    _el.attr('ui-event', 'atUiEvent');
                  }
                  if ($attrs.uiJq) {
                    _el.attr('ui-jq', $attrs.uiJq);
                  }
                  if (_label !== null) {
                    $compile(_label)($scope);
                  }
                  if (_tip !== null) {
                    $compile(_tip)($scope);
                  }

                  $element.append(_label).append(_tip).append(_el);

                  if (dateTimeScript !== null) {
                    $element.after(dateTimeScript);
                  }

                  $compile(_el)($scope);
                }
              }
            }
        ]);