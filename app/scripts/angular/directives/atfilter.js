azureTicketsApp
  .directive(
    'atfilter', [
      '$compile',
      'objectService',
      'modelService',
      '$parse',
      function($compile, objectService, modelService, $parse) {
        return {
          restrict : 'EA',
          scope : {
          	atLabel : '=label',
            atPagination : '=paginationData'
          },
          template: '<div></div>',
          replace: true,
          link : function($scope, $element, $attr) {
          	if (!$attr.atModel) {
          		return;
          	} else {
          		$scope.atModel = modelService.getInstanceOf($attr.atModel);
          	}
          	
          	// Populate the advancedSearchScope for ng-pagination to apply filters
          	$scope.atPagination.advancedSearchScope = $scope;
          	
          	// Object to determine if property is single search or range search
          	$scope.equalSearchPropObj = {};
          	$scope.roofSearchPropObj = [];
          	$scope.floorSearchPropObj = [];
          	
          	if ($scope.atPagination.filters && $scope.atPagination.filters.length) {
          		for (var i = 0; i < $scope.atPagination.filters.length; i++) {
          		  // if field is date range
          		  var f = /(?:From|To)Date/g.test($scope.atPagination.filters[i]) ? $scope.atPagination.filters[i]
          		    .replace(/(?:From|To)Date/g, '')
          		    : $scope.atPagination.filters[i];
          		  
          	    // Property to check if Date is true
          	    var isDate = false,
          	        isRange = false,
          	        propName = '';
          		  
          		  if ($scope.atPagination.filters[i].indexOf('__Date') > -1) {
          		  	isDate = true;
          		  	propName = $scope.atPagination.filters[i].slice(
          		  	             0, 
          		  	             $scope.atPagination.filters[i].indexOf('__Date')
          		  	           );
          		  } else if ($scope.atPagination.filters[i].indexOf('__Range') > -1) {
          		  	isRange = true;
          		  	propName = $scope.atPagination.filters[i].slice(
          		  	             0, 
          		  	             $scope.atPagination.filters[i].indexOf('__Range')
          		  	           );
          		  } else {
          		  	propName = $scope.atPagination.filters[i];
          		  }

          		  var propType = BWL.ModelMeta[$scope.atModel.Type][propName],
          		      label = null,
          		      _el = null,
          		      additionalFields = null,
          		      dateTimeScript = null;
          		  
          		  // Attributes for the generated fields
          		  var _attr = {
          		    placeholder : propName.replace(/([A-Z])|\./g, ' $1')
          		                  .trim(),
          		    name : $scope.atModel.Type + '_' + propName,
          		    id : $scope.atModel.Type + '_' + propName
          		  };
          		  
          		  if (isDate) {
          		  	_el = jQuery('<select></select>');
          		  	label = jQuery('<label class="control-label" for=' + _attr.id + '></label>');
          		  	
          		  	additionalFields = jQuery('<div></div>');
          		  	var dateTimeScriptFrom = jQuery('<script type="text/javascript" />'),
          		  	    dateTimeScriptTo = jQuery('<script type="text/javascript" />');
          		  	
          		  	$scope.atModel[propName + '_From'] = objectService.dateToUIPicker(new Date());
          		  	$scope.atModel[propName + '_To'] = objectService.dateToUIPicker(new Date());
          		  	
          		  	var jsFrom = "function(v, tp){\
          		  	  var formScope = angular.element(jQuery(this)).scope();\
          		  	  formScope.$apply(function(){\
          		  	    formScope.atModel"
          		  	    + "."
          		  	    + propName + '_From'
          		  	    + " = v;\
          		  	    });\
          		  	  }\
          		  	";
          		  	var jsTo = "function(v, tp){\
          		  	  var formScope = angular.element(jQuery(this)).scope();\
          		  	  formScope.$apply(function(){\
          		  	    formScope.atModel"
          		  	    + "."
          		  	    + propName + '_To'
          		  	    + " = v;\
          		  	    });\
          		  	  }\
          		  	";
          		  	
          		  	dateTimeScriptFrom.text(
          		  	  "jQuery(function(){jQuery('#"
          		  	  + $scope.atModel.Type + '_' + propName + '_From'
          		  	  + "').datetimepicker({timeFormat: 'hh:mm tt', onClose: "
          		  	  + jsFrom + " });});"
          		  	);
          		  	dateTimeScriptTo.text(
          		  	  "jQuery(function(){jQuery('#"
          		  	  + $scope.atModel.Type + '_' + propName + '_To'
          		  	  + "').datetimepicker({timeFormat: 'hh:mm tt', onClose: "
          		  	  + jsTo + " });});"
          		  	);
          		  	
          		  	fieldFrom = jQuery(
          		  	  '<label for="' + $scope.atModel.Type + '_' + propName + '_From"' + '>' +
          		  	    'From' +
          		  	  '</label>' +
          		  	  '<input type = "text" id="' + $scope.atModel.Type + '_' + propName + '_From"' +
          		  	    'ng-model="atModel.' + propName + '_From">' +
          		  	    
          		  	  '</input>'
          		  	);
          		  	fieldTo = jQuery(
          		  	  '<label for="' + $scope.atModel.Type + '_' + propName + '_To"' + '>' +
          		  	    'To' +
          		  	  '</label>' +
          		  	  '<input type = "text" id="' + $scope.atModel.Type + '_' + propName + '_To"' +
          		  	    'ng-model="atModel.' + propName + '_To">' +
          		  	    
          		  	  '</input>'
          		  	);
          		  	
          		  	additionalFields.append(fieldFrom);
          		  	additionalFields.append(dateTimeScriptFrom);
          		  	additionalFields.append(fieldTo);
          		  	additionalFields.append(dateTimeScriptTo);
          		  	_el = _el.after(additionalFields);
          		  } else if (isRange) {
          		  	
          		  } else {
          		  	$scope.equalSearchPropObj[propName] = function() { return $scope.atModel[propName]; };
          		  	
          		  	_el = jQuery('<input></input>');

          		  switch (propType) {
                  case 'IContact':
                    _attr.type = 'text';
                    // Attach model to the field.
                    // This model is a property of $scope.atModel which two-way binds to $scope.filterModel in filterController
                    _el.attr('ng-model', 'atModel' + '.' + [propName]);
                    break;
            		  case 'OrderStateEnum':
                    _attr.type = 'number';
                    _el.attr('ng-model', 'atModel' + '.' + [propName]);
                    break;
            		  case 'Price':
                    _attr.type = 'number';
                    _el.attr('ng-model', 'atModel' + '.' + [propName]);
                    break;
            		  case 'Double':
                    _attr.type = 'number';
                    _el.attr('ng-model', 'atModel' + '.' + [propName]);
                    break;
            		  case 'String':
                    _attr.type = 'text';
                    _el.attr('ng-model', 'atModel' + '.' + [propName]);
                    break;
            		  default:
                    _attr.type = 'number';
                    _el.attr('ng-model', 'atModel' + '.' + [propName]);
                }
                }
                
          		  label = jQuery('<label class="control-label" for=' + _attr.id + '></label>');
          		  if (angular.isDefined($attr.label)) {
          		    label.text('{{atLabel}}');
          		    if (angular.isDefined($attr.labelClass)) {
          		      label.addClass($attr.labelClass);
          		    }
          		  } else {
          		    label.text(propName.replace(/([A-Z])|\./g, ' $1').trim());
          		  }

          		  if (_el !== null) {
          		    // make new element available
          		    // _el.attr('ng-model', 'atModel');

          		    // define new element attributes
          		    for (p in _attr) {
            		    _el.attr(p, _attr[p]);
          		    }

                  var controlGroupdiv = jQuery('<div class="control-group"></div>'),
                      controlDiv = jQuery('<div class="controls"></div>');
          		  	_el.append('{{atModel}}');
                  controlDiv.append(_el);
          		    controlGroupdiv.append(label);
          		    controlGroupdiv.append(controlDiv);
          		    if (additionalFields !== null) {
          		      controlGroupdiv.append(additionalFields);
          		    }
          		    
          		    $element.append(controlGroupdiv);

          		    $compile(_el)($scope);
          		  }
          		  
          		  // Populate the single search properties
          		  if (!isDate && !isRange) {
          		  	//$scope.equalSearchPropObj.push();
          		  }
              }
            }
          }
        }
      }
    ]
  )