/**
 * This directive will display a friendly version of a model object, by parsing
 * and iterating through model's properties and using locale resources to
 * properly display labels.
 */
azureTicketsApp
    .directive(
        'atmodel',
        [
            '$compile',
            '$filter',
            'objectService',
            function($compile, $filter, objectService) {
              var _render = function(obj) {
                var e = jQuery('<div class="clearfix atmodel well well-small" />');
                e.append('<dl />');

                for (label in obj) {
                  var dt = jQuery('<dt />'), dd = jQuery('<dd />');
                  dt.text(label);
                  dd.append((angular.isObject(obj[label]) ? _render(obj[label])
                      : obj[label]));
                  e.find('dl').first().append(dt, dd);
                }

                return e;
              }

              return {
                restrict : 'E',
                scope : {
                  atExtra1 : '=extra1', // usually is instance of geoService,
                  // when
                  // object is or has an Address object.
                  atExtra2 : '=extra2', // PaymentProviders array for objects
                  // containing
                  // a PaymentProvider property
                  atExtra3 : '=extra3',
                  atModel : '=ngModel'
                },
                link : function($scope, $element, $attrs) {
                  var out = {}, resPrefix = 'Common.Label'
                      + $scope.atModel.Type;

                  for (p in $scope.atModel) {
                    // we ignore tmp variables and Places (when dealing with
                    // venues, we use _tmpVenues to store selected Places)
                    if (/^tmp.*|Places$/g.test(p)) {
                      continue
                    }

                    var pp = angular.isArray($scope.atModel[p]) ? $scope.atModel[p]
                        : [
                          $scope.atModel[p]
                        ];
                    var cc = 0;

                    angular
                        .forEach(
                            pp,
                            function(prop, k) {
                              // hide props
                              if (angular.isDefined($attrs.atHide)) {
                                var hide = $scope.$eval($attrs.atHide);
                                if (angular.isArray(hide)
                                    && hide.indexOf(p) !== -1) {
                                  return;
                                }
                              }

                              // suffix added when multiple objects in property
                              var countSuffix = pp.length > 1 ? ' #' + ++cc
                                  : '';

                              if ((angular.isNumber(prop) || angular
                                  .isString(prop))
                                  && prop !== ''
                                  && prop !== 0
                                  && [
                                      // hide these properties
                                      'URI', 'Key', 'Type', 'Currency',
                                      '$$hashKey'
                                  ].indexOf(p) === -1) {
                                out[$filter('t')(resPrefix + p)] = prop;
                              } else if (angular.isString(prop)
                                  && p === BWL.Model.Currency.Type) {
                                // handle Currency property
                                var c = objectService.grep($scope.atExtra2,
                                    'ISO', prop);
                                out[$filter('t')(resPrefix + p)] = c.Name;
                              } else if (angular.isObject(prop) && prop.Type) {
                                switch (prop.Type) {
                                  // handle Address type
                                  case BWL.Model.Address.Type:
                                    var addr = {};
                                    var countries = $scope.atExtra1
                                        .getLoadedCountries();
                                    var regions = $scope.atExtra1
                                        .getLoadedRegions();
                                    var c = objectService.grep(countries,
                                        'ISO', prop.Country);
                                    var r = objectService.grep(regions, 'ISO',
                                        prop.Region);

                                    addr[$filter('t')('Address.LabelCity')] = prop.City;
                                    addr[$filter('t')
                                        ('Address.LabelPostalCode')] = prop.PostalCode;
                                    addr[$filter('t')('Address.LabelCountry')] = angular
                                        .isObject(c) ? c.Name : prop.Country;
                                    var sp = $filter('t')(
                                        'Address.LabelProvince')
                                        + ' / '
                                        + $filter('t')('Address.LabelState');
                                    addr[sp] = angular.isObject(r) ? r.Name
                                        : $scope.atModel[p].Region;
                                    addr[$filter('t')(
                                        'Address.LabelFullAddress')] = [
                                        prop.AddressLine1, prop.AddressLine2,
                                        prop.PostalCode
                                    ].filter(Boolean).join(', ');
                                    addr[$filter('t')('Address.LabelTimezone')] = prop.Timezone;

                                    out[$filter('t')
                                        ('Common.Text_LocationInfo')
                                        + countSuffix] = addr;
                                    break;
                                  // Handle PaymentProvider type
                                  case BWL.Model.PaymentProvider.Type:
                                    out[$filter('t')(
                                        resPrefix + 'PaymentProvider')
                                        + countSuffix] = $filter('t')(
                                        'Common.Text_Paypro_'
                                            + prop.ProviderType);
                                    break;
                                  // Handle StoreURI type
                                  case BWL.Model.StoreURI.Type:
                                    out[$filter('t')('Common.Text_CustomURI')
                                        + countSuffix] = prop.URI;
                                    break;
                                  case BWL.Model.Place.Type:
                                    out[$filter('t')('Common.Text_Venue')
                                        + countSuffix] = prop.Name;
                                    break;
                                  case BWL.Model.Price.Type:
                                    out[$filter('t')('Common.Text_Price')
                                        + ' (' + prop.Currency + ')'
                                        + countSuffix] = prop.ItemPrice;
                                    break;
                                  case BWL.Model.GeneralAdmissionTicketItemInfo.Type:
                                    out[$filter('t')('ShoppingCart.labelItem')
                                        + countSuffix] = prop.Name
                                        + ' <span class="text-success"><b>x '
                                        + prop.Qty + '</b></span>';
                                    break;
                                }
                              }
                            });
                  }

                  $element.append(_render(out));
                }
              }
            }
        ]);