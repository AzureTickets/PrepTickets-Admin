/**
 * Binds a TinyMCE widget to <textarea> elements.
 */
angular.module('ui.tinymce', [])
  .value('uiTinymceConfig', {
  	'theme' : 'modern',
    'theme_url': 'components/tinymce/themes/modern/theme.js',
    'skin' : 'lightgray',
    'skin_url' : 'components/tinymce/skins/lightgray',
    'external_plugins': {
      "advlist" : "components/tinymce/plugins/advlist/plugin.min.js",
      "anchor" : "components/tinymce/plugins/anchor/plugin.min.js",
      "autolink" : "components/tinymce/plugins/autolink/plugin.min.js",
      "charmap" : "components/tinymce/plugins/charmap/plugin.min.js",
      "code" : "components/tinymce/plugins/code/plugin.min.js",
      "contextmenu" : "components/tinymce/plugins/contextmenu/plugin.min.js",
      "directionality" : "components/tinymce/plugins/directionality/plugin.min.js",
      "hr" : "components/tinymce/plugins/hr/plugin.min.js",
      "image" : "components/tinymce/plugins/image/plugin.min.js",
      "insertdatetime" : "components/tinymce/plugins/insertdatetime/plugin.min.js",
      "layer" : "components/tinymce/plugins/layer/plugin.min.js",
      "media" : "components/tinymce/plugins/media/plugin.min.js",
      "link" : "components/tinymce/plugins/link/plugin.min.js",
      "lists" : "components/tinymce/plugins/lists/plugin.min.js",
      "paste" : "components/tinymce/plugins/paste/plugin.min.js",
      "print" : "components/tinymce/plugins/print/plugin.min.js",
      "preview" : "components/tinymce/plugins/preview/plugin.min.js",
      "searchreplace" : "components/tinymce/plugins/searchreplace/plugin.min.js",
      "tabfocus" : "components/tinymce/plugins/tabfocus/plugin.min.js",
      "table" : "components/tinymce/plugins/table/plugin.min.js",
      "textcolor" : "components/tinymce/plugins/textcolor/plugin.min.js",
      "visualblocks" : "components/tinymce/plugins/visualblocks/plugin.min.js",
      "visualchars" : "components/tinymce/plugins/visualchars/plugin.min.js",
      "wordcount" : "components/tinymce/plugins/wordcount/plugin.min.js"
    },
    'height' : 200
  })
  .directive('uiTinymce', ['uiTinymceConfig', function (uiTinymceConfig) {
    uiTinymceConfig = uiTinymceConfig || {};
    var generatedIds = 0;
    return {
      require: 'ngModel',
      link: function (scope, elm, attrs, ngModel) {
        var expression, options, tinyInstance,
          updateView = function () {
            ngModel.$setViewValue(elm.val());
            if (!scope.$$phase) {
              scope.$apply();
            }
          };
        // generate an ID if not present
        if (!attrs.id) {
          attrs.$set('id', 'uiTinymce' + generatedIds++);
        }

        if (attrs.uiTinymce) {
          expression = scope.$eval(attrs.uiTinymce);
        } else {
          expression = {};
        }
        options = {
          // Update model when calling setContent (such as from the source editor popup)
          setup: function (ed) {
            var args;
            ed.on('init', function(args) {
              ngModel.$render();
            });
            // Update model on button click
            ed.on('ExecCommand', function (e) {
              ed.save();
              updateView();
            });
            // Update model on keypress
            ed.on('KeyUp', function (e) {
              ed.save();
              updateView();
            });
            // Update model on change, i.e. copy/pasted text, plugins altering content
            ed.on('SetContent', function (e) {
              if(!e.initial){
                ed.save();
                updateView();
              }
            });
            if (expression.setup) {
              scope.$eval(expression.setup);
              delete expression.setup;
            }
          },
          mode: 'exact',
          elements: attrs.id
        };
        // extend options with initial uiTinymceConfig and options from directive attribute value
        angular.extend(options, uiTinymceConfig, expression);
        setTimeout(function () {
          tinymce.init(options);
        });


        ngModel.$render = function() {
          if (!scope.tinyInstance) {
            scope.tinyInstance = tinymce.get(attrs.id);
          }
          if (scope.tinyInstance) {
            scope.tinyInstance.setContent(ngModel.$viewValue || '');
          }
        };
        
      }
    };
  }]);
