// form service
azureTicketsApp
    .factory(
        'formService',
        [
            '$q',
            '$rootScope',
            'modelService',
            'configService',
            '$q',
            '$timeout',
            function($q, $rootScope, modelService, configService, $q, $timeout) {
              var _fieldTypes = [ 'input', 'textarea', 'select' ];

              /**
               * The deferred object always resolve, passing true when no error
               * or an object similar to this when there is an error:
               * 
               * {e : DOMElement, err : 'Error Message'}
               */
              var _validates = function(e) {
                var _def = $q.defer();

                var n = jQuery(e).attr('name') || null;
                var model = angular.element(e).data('$ngModelController');

                if (n !== null) {
                  var m = n.split('_')[0];
                  var f = n.split('_')[1];

                  if (f) {
                    var v = jQuery(e).val() || false;
                    var req = angular.isDefined(jQuery(e).attr('at-required'));
                    var err = null;

                    if (angular.isDefined(jQuery(e).attr('at-validate'))) {
                      var atValidate = angular.element(e).scope()['atValidate']
                          || angular.element(e).scope().$eval(
                              jQuery(e).attr('at-validate')) || undefined
                    }

                    if (!v && req) {
                      // check required
                      err = CommonResources.Text_RequiredField.replace(
                          /\{0\}/g, f.replace(/([A-Z](?:[a-z])|\d+)/g, ' $1')
                              .trim());

                      _def.resolve({
                        e : e,
                        err : err
                      });
                    } else if (angular.isDefined(atValidate) && atValidate.fn
                        && atValidate.opts) {
                      if (atValidate.fn !== 'Custom') {
                        // use cross browser validation library
                        try {
                          Validate[atValidate.fn](v, atValidate.opts);
                          _def.resolve(true);
                        } catch (err) {
                          _def.resolve({
                            e : e,
                            err : err.message
                          });
                        }
                      } else {
                        // if it's a Custom fn, support promises (livevalidation
                        // workaround)
                        atValidate.opts.against(v).then(_def.resolve,
                            function() {
                              _def.resolve({
                                e : e,
                                err : atValidate.opts.failureMessage
                              });
                            })
                      }
                    } else if (angular.isObject(model.$error)) {
                      // pattern error
                      if (model.$error.pattern && model.$error.pattern === true) {
                        var perr = CommonResources.Text_InvalidPattern.replace(
                            /\{0\}/g, f.replace(/([A-Z](?:[a-z])|\d+)/g, ' $1')
                                .trim());
                        _def.resolve({
                          e : e,
                          err : perr
                        });
                      } else {
                        jQuery('.error-' + n).remove();
                        _def.resolve(true);
                      }
                    } else {
                      jQuery('.error-' + n).remove();
                      _def.resolve(true);
                    }
                  }
                } else {
                  _def.resolve(true)
                }

                return _def.promise;
              }

              var _wizard = {
                renderError : function(e, err) {
                  var n = jQuery(e).attr('name') || null

                  jQuery('.error-' + n).remove();
                  var errDiv = jQuery('<div class="error-' + n
                      + ' alert alert-error" />');
                  errDiv.text(err).css({
                    width : 'auto'
                  });
                  jQuery(e).after(errDiv);

                  // if Address widget
                  var addr = angular
                      .isDefined(angular.element(e).scope()['addressEditable']) || false
                  // expand collapsible section
                  var cs = !addr ? jQuery(e).parents('dl').first().parent(
                      'div[collapse]') : jQuery(e).parents('div[collapse]'); // collapsible
                  // section
                  var cc = jQuery(cs).prev('.collapser'); // element to click

                  if (addr) {
                    $timeout(function() {
                      angular.element(e).scope().$parent.addressEditable = true
                    }, 100)
                  }

                  if (cc.length !== 0) {
                    // get collapse var
                    var cv = jQuery(cc).attr('ng-click').replace(
                        /(collapse[^\s]+).*/gi, '$1')
                    angular.element(cc).scope()[cv] = false;
                  }
                },
                open : false,
                currentStep : 0,
                checkStep : {

                },
                finished : false,
                saved : false,
                /**
                 * Validates form given by 1st param and continue to next step
                 * if success.
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
                  var checkAll = null, els = [], _this = this

                  // elements to check
                  jQuery(angular.element('form[name=' + formName + ']')).find(
                      _fieldTypes.join(',')).each(function(i, e) {
                    els.push(e)
                  });

                  checkAll = $q.all(els.map(_validates));

                  checkAll.then(function(validations) {
                    if (validations === 0) {
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
                      validations = validations.filter(function(vv) {
                        return angular.isObject(vv)
                      })

                      if (validations.length === 0) {
                        def.resolve()
                      } else {
                        // render errors
                        angular.forEach(validations, function(v, k) {
                          if (v.err && v.e) {
                            _this.renderError(v.e, v.err)
                          }
                        })

                        def.reject();
                      }
                    }
                  }, function(err) {
                    throw new Error(err)
                  });

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
                 * Initializes a new instance of a wizard on the scope defined
                 * by first param. Must be called prior to using any of this
                 * service's methods.
                 * 
                 * @param $scope
                 * @returns
                 */
                getWizard : function($scope) {
                  _wizard._validationErrors = []
                  return angular.copy(_wizard);
                }
              }
            } ]);