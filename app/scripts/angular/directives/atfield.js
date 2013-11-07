/**
 * This directive will generate a HTML form field following type definition
 * rules from modelsmeta.js.
 */
azureTicketsApp
    .directive(
        'atfield',
        [
            '$compile',
            'objectService',
            function($compile, objectService) {
              return {
                restrict : 'EA',
                scope : {
                  atModel : '=ngModel',
                  atLabel : '=label',
                  atTip : '=tip',
                  atChange : '=ngChange',
                  atReadonly : '=ngReadonly',
                  atBtnExp : '&appendBtnExp',
                  atBlur : '=ngBlur',
                  atValidate : '=atValidate',
                  atTypeahead : '&typeahead'
                },
                template : '<div></div>',
                replace : true,
                link : function($scope, $element, $attrs) {
                  var ss = $attrs.ngModel.split('.'), isBoolean = false;
                  var m = ss.length === 3 ? ss[1] : ss[0];// model name
                  var f = ss.length === 3 ? ss[ss.length - 1] : ss[1]; // property
                  // name
                  var copyOf = angular.isDefined($attrs.atCopy) ? BWL.ModelMeta[$attrs.atCopy]
                      : null
                  var fieldType = copyOf === null
                      && angular.isDefined(BWL.ModelMeta[m]) ? BWL.ModelMeta[m][f]
                      : copyOf[f];
                  var _el, _label = null, _tip = null, _append = null, _prepend = null;
                  var _attr = {
                    placeholder : f,
                    name : m.replace(/\./g, '_') + '_' + f,
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
                    _label = jQuery('<label></label>');
                    _label.text('{{atLabel}}');
                    if (angular.isDefined($attrs.labelClass)) {
                      _label.addClass($attrs.labelClass);
                    }
                  } else {
                    _label = jQuery('<label></label>');
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
                    isBoolean = true;
                    _attr.type = 'button', _el = jQuery('<button />');
                    _el.attr('btn-checkbox', '');
                    _el.attr('btn-checkbox-true', '1');
                    _el.attr('btn-checkbox-false', '0');
                    _el.text(_label.text());
                    jQuery(_el)
                        .prepend(
                            '<i ui-if="atModel" class="fa fa-check" /><i ui-if="!atModel" class="fa fa-times" />')
                    _label = null;
                  } else if (/^Date|Time/g.test(fieldType)) {
                    _attr.type = 'text', _el = jQuery('<input ' + _req + '/>');
                    dateTimeScript = jQuery('<script type="text/javascript" />');
                    var hasTime = !angular.isDefined($attrs.noTimePicker) ? 'true, timeFormat: \'hh:mm tt\''
                        : 'false';

                    // ensure format is ok
                    $scope.atModel = objectService.dateToUIPicker(
                        $scope.atModel, !(hasTime === 'false'));

                    // we're outside angular, so we need to do some tricks here
                    // in order to update the model
                    var js = "function(v, tp){\
                      var formScope = angular.element(jQuery('#"
                        + _attr.id
                        + "').parents('form').first()).scope();\
                      var ctrlScope = formScope.$parent;\
                      ctrlScope.$apply(function(){\
                  		  ctrlScope."
                        + $attrs.ngModel.replace(/^(.*)\.[^\.]+$/g, '$1')
                        + "."
                        + f
                        + " = v;\
                  		});\
                      }\
                      ";

                    dateTimeScript.text("jQuery(function(){jQuery('#"
                        + _attr.id + "').datetimepicker({showTimepicker : "
                        + hasTime + ", onClose: " + js + " });});");

                    if (angular.isDefined($attrs.uiDateFormat)) {
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
                        && [ 'ngModel', 'ngRequired', 'ngChange', 'ngBlur',
                            'uiEvent', 'appendBtnExp', 'appendBtnIco',
                            'prependBtnIco', 'uiDateFormat', 'atValidate',
                            'ngPattern', 'uiJq' ].indexOf(p) === -1) {
                      var pp = p.replace(/([A-Z]+)/g, '-$1').toLowerCase();
                      var v = $scope.$eval($attrs[p]) !== 0 ? $scope
                          .$eval($attrs[p]) : $attrs[p]

                      _el.attr(pp, angular.isDefined(v) ? v : '');
                    }
                  }

                  // if we should append button
                  if ($attrs.appendBtnExp) {
                    $element.addClass('input-append');
                    _append = jQuery('<button type="button" class="btn" />');
                    _append.html('<i class="' + $attrs.appendBtnIco + '"></i>');

                    _append.click(function() {
                      $scope.$apply(function() {
                        $scope.atBtnExp();
                      })
                    })
                  } else if ($attrs.appendBtnIco) {
                    $element.addClass('input-append');
                    _append = jQuery('<span class="add-on" />');
                    _append.html('<i class="' + $attrs.appendBtnIco + '"></i>');
                    
                    _el.css('position','inherit') // fix for datetimepicker
                  } else if ($attrs.prependBtnIco) {
                    $element.addClass('input-prepend');
                    _prepend = jQuery('<span class="add-on" />');
                    _prepend.html('<i class="' + $attrs.prependBtnIco
                        + '"></i>');
                    
                    _el.css('position','inherit') // fix for datetimepicker
                  }

                  // make new element available
                  _el.attr('ng-model', 'atModel');

                  if ($attrs.ngPattern) {
                    _el.attr('ng-pattern', $attrs.ngPattern);
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
                  if ($attrs.autocomplete) {
                    _el.attr('autocomplete', $attrs.autocomplete);
                  }
                  if ($attrs.uiJq) {
                    _el.attr('ui-jq', $attrs.uiJq);
                  }
                  if ($attrs.min) {
                    _el.attr('min', $attrs.min);
                  }
                  if ($attrs.atValidate) {
                    _el.attr('at-validate', 'atValidate');
                  }
                  if (_label !== null) {
                    $compile(_label)($scope);
                  }
                  if (_tip !== null) {
                    $compile(_tip)($scope);
                  }
                  if (_append !== null) {
                    $compile(_append)($scope);
                  }
                  if (isBoolean) {
                    jQuery(_el).addClass('btn').addClass('btn-inverse')
                  }

                  $element.append(_label).append(_tip).append(_prepend).append(
                      _el).append(_append);
                  $element
                      .removeClass('input-small input-large input-xlarge input-xxlarge')

                  if (dateTimeScript !== null) {
                    $element.after(dateTimeScript);
                  }

                  $compile(_el)($scope);
                }
              }
            } ]);