// form service
azureTicketsApp.factory('formService',
    [
        '$q',
        '$rootScope',
        'modelService',
        'configService',
        function($q, $rootScope, modelService, configService) {
          var _scope = null;
          var _wizard = null;
          var _fieldTypes = [
              'input', 'textarea', 'select'
          ];

          var _validates = function(e) {
            var _renderError = function(n, err) {
              jQuery('.error-' + n).remove();
              var errDiv = jQuery('<div class="error-' + n
                  + ' alert alert-error" />');
              errDiv.text(err).css({
                width : 'auto'
              });
              jQuery(e).after(errDiv);
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

                if (!v && req) {
                  // check required
                  err = CommonResources.Text_RequiredField.replace(/\{0\}/g, f
                      .replace(/([A-Z](?:[a-z])|\d+)/g, ' $1').trim());
                  _validationErrors.push(err);
                  _renderError(n, err);
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

          return {
            currentStep : 0,
            checkStep : {

            },
            finished : false,
            saved : false,
            /**
             * Initializes a new instance of a wizard on the scope defined by
             * first param. Must be called prior to using any of this service's
             * methods.
             * 
             * @param $scope
             * @returns
             */
            getWizard : function($scope) {
              _scope = $scope;
              _wizard = this;

              return _wizard;
            },
            /**
             * Validates form given by 1st param and continue to next step if
             * success.
             * 
             * @param {string}
             *          formName
             * @param {boolean}
             *          finish Finishes the wizard (no more steps).
             * @returns
             */
            next : function(formName, finish) {
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
              }
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
        }
    ]);