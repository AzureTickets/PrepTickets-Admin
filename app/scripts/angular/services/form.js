// form service
azureTicketsApp.factory('formService',
    [
        '$q',
        '$rootScope',
        'modelService',
        'configService',
        '$q',
        '$timeout',
        function($q, $rootScope, modelService, configService, $q, $timeout) {
          var _fieldTypes = [ 'input', 'textarea', 'select' ];

          var _validates = function(e) {
            var _renderError = function(n, err) {
              jQuery('.error-' + n).remove();
              var errDiv = jQuery('<div class="error-' + n
                  + ' alert alert-error" />');
              errDiv.text(err).css({
                width : 'auto'
              });
              jQuery(e).after(errDiv);

              // expand collapsible section
              var cs = jQuery(e).parents('dl').first().parent('div[collapse]'); // collapsible
              // section
              var cc = jQuery(cs).prev('.collapser'); // element to click

              if (cc.length !== 0) {
                // get collapse var
                var cv = jQuery(cc).attr('ng-click').replace(
                    /(collapse[^\s]+).*/gi, '$1')
                angular.element(cc).scope()[cv] = false;
              }
            }

            var n = jQuery(e).attr('name') || null;
            var _validationErrors = [];
            var model = angular.element(e).data('$ngModelController');

            if (n !== null) {
              var m = n.split('_')[0];
              var f = n.split('_')[1];

              if (f) {
                var v = jQuery(e).val() || false;
                var req = angular.isDefined(jQuery(e).attr('at-required'));
                var err = null;
                var atValidate = angular.element(e).scope()['atValidate']

                if (!v && req) {
                  // check required
                  err = CommonResources.Text_RequiredField.replace(/\{0\}/g, f
                      .replace(/([A-Z](?:[a-z])|\d+)/g, ' $1').trim());
                  _validationErrors.push(err);
                  _renderError(n, err);
                } else if (angular.isDefined(atValidate) && atValidate.fn
                    && atValidate.opts) {
                  // use cross browser validation library
                  try {
                    Validate[atValidate.fn](v, atValidate.opts);
                  } catch (err) {
                    _validationErrors.push(err.message)
                    _renderError(n, err.message);
                  }
                } else if (angular.isObject(model.$error)) {
                  // pattern error
                  if (model.$error.pattern && model.$error.pattern === true) {
                    var perr = CommonResources.Text_InvalidPattern.replace(
                        /\{0\}/g, f.replace(/([A-Z](?:[a-z])|\d+)/g, ' $1')
                            .trim());
                    _validationErrors.push(perr);
                    _renderError(n, perr);
                  } else {
                    jQuery('.error-' + n).remove();
                  }
                } else {
                  jQuery('.error-' + n).remove();
                }
              }
            }

            return _validationErrors;
          }

          var _wizard = {
            open : false,
            currentStep : 0,
            checkStep : {

            },
            finished : false,
            saved : false,
            /**
             * Validates form given by 1st param and continue to next step if
             * success.
             * 
             * @param {string}
             *          formName
             * @param {boolean}
             *          finish Finishes the wizard (no more steps).
             * @param {function}
             *          Execute this callback on step follow.
             * @returns
             */
            next : function(formName, finish, cbk) {
              var def = $q.defer();

              this.finished = false;
              this.saved = false;
              var errors = [];

              jQuery(angular.element('form[name=' + formName + ']')).find(
                  _fieldTypes.join(',')).each(function(i, e) {
                errors = errors.concat(_validates(e));
              });

              if (errors.length === 0) {
                this.checkStep[this.currentStep] = true;
                this.currentStep++;

                if (angular.isDefined(finish) && finish) {
                  this.finished = true;
                }

                if (angular.isFunction(cbk)) {
                  cbk();
                }

                def.resolve();
              } else {
                def.reject();
              }

              return def.promise;
            },
            /**
             * @param step
             *          (optional) Initialization step
             * @returns
             */
            reset : function(step) {
              this.currentStep = angular.isDefined(step) ? step : 1;
              this.finished = false, this.saved = false, checkStep = {};
            }
          }

          return {
            /**
             * Initializes a new instance of a wizard on the scope defined by
             * first param. Must be called prior to using any of this service's
             * methods.
             * 
             * @param $scope
             * @returns
             */
            getWizard : function($scope) {
              return angular.copy(_wizard);
            }
          }
        } ]);