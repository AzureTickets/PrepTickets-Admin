'use strict';
var lrSnippet = require('grunt-contrib-livereload/lib/utils').livereloadSnippet;
var mountFolder = function(connect, dir) {
  return connect.static(require('path').resolve(dir));
};

module.exports = function(grunt) {
  // load all grunt tasks
  require('matchdep').filterDev('grunt-*').concat([ 'gruntacular' ]).forEach(
      grunt.loadNpmTasks);

  // configurable paths & app variables
  var atConfig = {};
  try {
    atConfig.app = require('./package.json').path.app || null;
    atConfig.dist = require('./package.json').path.dist || null;
    atConfig.test = require('./package.json').path.test || null;
    atConfig.scripts = require('./package.json').path.js || null;
    atConfig.styles = require('./package.json').path.styles || null;
    atConfig.config = require('./package.json').path.config || null;
    atConfig.components = require('./package.json').path.lib || null;
    atConfig.name = require('./package.json').siteName || null;
    atConfig.logo = require('./package.json').url.logo || null;
    atConfig.urlApi = require('./package.json').url.api || null;
    atConfig.urlGeo = require('./package.json').url.geo || null;
  } catch (e) {
    throw new Error(e).stack;
  }

  grunt
      .initConfig({
        at : atConfig,
        watch : {
          'static' : {
            files : [ '<%= at.app %>/**/*.html',
                '<%= at.app %>/styles/**/*.less',
                '{.tmp,<%= at.app %>}/' + atConfig.styles + '/{,*/}*.css',
                '{.tmp,<%= at.app %>}/' + atConfig.scripts + '/**/*.js',
                '<%= at.app %>/images/{,*/}*.{png,jpg,jpeg}' ],
            tasks : [ 'less', '_internal' ]
          },
          livereload : {
            files : [ '<%= at.app %>/**/*.html',
                '{.tmp,<%= at.app %>}/' + atConfig.styles + '/{,*/}*.css',
                '{.tmp,<%= at.app %>}/' + atConfig.scripts + '/**/*.js',
                '<%= at.app %>/images/{,*/}*.{png,jpg,jpeg}' ],
            tasks : [ '_internal', 'livereload' ]
          }
        },
        connect : {
          livereload : {
            options : {
              port : 9001,
              // Change this to '0.0.0.0' to access the server
              // from outside.
              hostname : 'localhost',
              middleware : function(connect) {
                return [ lrSnippet, mountFolder(connect, '.tmp'),
                    mountFolder(connect, atConfig.dist) ];
              }
            }
          },
          'static' : {
            options : {
              port : 9003,
              hostname : 'localhost',
              middleware : function(connect) {
                return [ mountFolder(connect, '.tmp'),
                    mountFolder(connect, atConfig.dist) ];
              }
            }
          },
          test : {
            options : {
              port : 9002,
              middleware : function(connect) {
                return [ mountFolder(connect, '.tmp'),
                    mountFolder(connect, atConfig.test) ];
              }
            }
          }
        },
        less : {
          css : {
            options : {
              paths : [ '<%= at.app %>/<%= at.components %>/bootstrap/less/' ]
            },
            files : {
              '<%= at.dist %>/styles/main.css' : [ '<%= at.app %>/'
                  + atConfig.styles + '/less/main.less' ]
            }
          }
        },
        open : {
          server : {
            url : 'http://localhost:<%= connect.livereload.options.port %>/#/admin'
          },
          serverStatic : {
            url : 'http://localhost:<%= connect.static.options.port %>/#/admin'
          }
        },
        clean : {
          dist : [ '.tmp', '<%= at.dist %>/*' ],
          server : '.tmp'
        },
        jshint : {
          options : {
            jshintrc : '.jshintrc'
          },
          all : [
          // 'Gruntfile.js',
          '<%= at.app %>/' + atConfig.scripts + '/{,*/}*.js' ]
        },
        testacular : {
          unit : {
            configFile : atConfig.config + '/testacular.conf.js',
            singleRun : true
          },
          continuous : {
            configFile : atConfig.config + '/testacular.conf.js',
            autoWatch : true
          }
        },
        concat : {
          dist : {
            options : {
              stripBanners : {
                block : true,
                line : true
              },
              process : true
            },
            files : {
              '<%= at.dist %>/scripts/main.js' : [
                  '.tmp/' + atConfig.scripts + '/*.js',
                  '<%= at.app %>/' + atConfig.scripts + '/api/**/*.js',
                  '<%= at.app %>/' + atConfig.scripts + '/angular/**/*.js' ]
            }
          }
        },
        useminPrepare : {
          html : '<%= at.app %>/index.html',
          options : {
            dest : '<%= at.dist %>'
          }
        },
        usemin : {
          html : [ '<%= at.dist %>/{,*/}*.html' ],
          css : [ '<%= at.dist %>/styles/{,*/}*.css' ],
          options : {
            dirs : [ '<%= at.dist %>' ]
          }
        },
        cssmin : {
          dist : {
            files : {
              '<%= at.dist %>/styles/main.css' : [
                  '.tmp/<%= at.styles %>/**/*.css',
                  '<%= at.dist %>/styles/main.css',
                  '<%= at.app %>/styles/*.css' ]
            }
          }
        },
        htmlmin : {
          dist : {
            options : {
              collapseWhitespace : false,
              removeComments : false,
              collapseBooleanAttributes : true,
              removeRedundantAttributes : true,
              useShortDoctype : true
            },
            files : [ {
              expand : true,
              cwd : '<%= at.app %>',
              src : [ '*.html', 'views/**/*.html' ],
              dest : '<%= at.dist %>'
            } ]
          }
        },
        ngmin : {
          dist : {
            files : [ {
              expand : true,
              cwd : '<%= at.dist %>/' + atConfig.scripts,
              src : 'main.js',
              dest : '<%= at.dist %>/' + atConfig.scripts
            } ]
          }
        },
        uglify : {
          dist : {
            files : {
              '<%= at.dist %>/scripts/main.js' : [ '<%= at.dist %>/'
                  + atConfig.scripts + '/main.js' ],
            }
          }
        },
        copy : {
          dist : {
            files : [ {
              expand : true,
              dot : true,
              cwd : '<%= at.app %>',
              dest : '<%= at.dist %>',
              src : [
                  '*.{ico,txt,php}',
                  '<%= at.components %>/**/*.{ico,txt,php,js,png,jpg,gif,css,less,json,eot,svg,ttf,woff,otf}',
                  'assets/**/*.*' ]
            } ]
          },
          // patch for Bootstrap to use Font-Awesome sprites
          replaceBootstrapLess : {
            files : [ {
              dot : true,
              expand : true,
              flatten : true,
              cwd : '<%= at.app %>/patches',
              dest : '<%= at.app %>/<%= at.components %>/bootstrap/less',
              src : [ 'bootstrap/*.less' ]
            } ]
          },
          replaceFontAwesomePath : {
            files : [ {
              dot : true,
              expand : true,
              flatten : true,
              cwd : '<%= at.app %>/patches',
              dest : '<%= at.app %>/<%= at.components %>/font-awesome/less',
              src : [ 'font-awesome/*.less' ]
            } ]
          },
          // TinyMCE patch and fix
          replaceUIModule : {
            files : [ {
              dot : true,
              expand : true,
              flatten : true,
              cwd : '<%= at.app %>/patches',
              dest : '<%= at.app %>/<%= at.components %>/angular-ui/build',
              src : [ 'angular-ui/build/*.js' ]
            } ]
          },
          replaceTinyMCESource : {
            files : [ {
              dot : true,
              expand : true,
              flatten : true,
              cwd : '<%= at.app %>/patches',
              dest : '<%= at.app %>/<%= at.components %>/tinymce',
              src : [ 'tinymce/*.js' ]
            } ]
          },
          replaceTinyMCEModule : {
            files : [ {
              dot : true,
              expand : true,
              flatten : true,
              cwd : '<%= at.app %>/patches',
              dest : '<%= at.app %>/<%= at.components %>/angular-ui-tinymce/src',
              src : [ 'angular-ui-tinymce/src/*.js' ]
            } ]
          },
          replaceTinyMCEThemeFile : {
            files : [ {
              dot : true,
              expand : true,
              flatten : true,
              cwd : '<%= at.app %>/patches',
              dest : '<%= at.app %>/<%= at.components %>/tinymce/themes/modern',
              src : [ 'tinymce/themes/modern/*.js' ]
            } ]
          }
          
        },
        compress : {
          wordpress : {
            options : {
              archive : '<%= at.dist %>/wp-azuretickets.zip'
            },
            files : [ {
              expand : true,
              cwd : '<%= at.dist %>/',
              src : [ '**' ]
            } ]
          }
        },
        shell : {
          // retrieve git submodules, including dist/ folder used for publishing
          // project on azure's site
          gitSubmodules : {
            command : 'git submodule update --init && cd dist && git checkout master',
            options : {
              stdout : true,
              stderr : true,
            }
          },
          // push dist to azure's repo
          publish : {
            command : 'cd dist && git add . && git commit -m "publishing" && git push -f origin master',
            options : {
              stdout : true,
              stderr : true,
            }
          }
        }
      });

  grunt.renameTask('regarde', 'watch');

  grunt.registerTask('server', [ 'clean:server', 'livereload-start',
      'connect:livereload', 'open:server', 'watch' ]);
  grunt.registerTask('serverStatic', [ 'clean:server', 'connect:static',
      'watch:static' ]);

  grunt.registerTask('test', [ 'clean:server', 'less', 'concat', /*
                                                                   * 'connect:test' ,
                                                                   * 'testacular:unit'
                                                                   */
  ]);
  grunt.registerTask('test:continuous', [ 'clean:server', 'less', 'concat',
      'connect:test', 'testacular:continuous' ]);

  grunt.registerTask('build', [ 'clean:dist', 'shell:gitSubmodules', /* 'jshint', */
  'test', 'useminPrepare', 'copy', 'cssmin', 'htmlmin', 'usemin', 'concat',
      'ngmin', /* 'uglify' */
  ]);

  grunt.registerTask('_internal', [ 'useminPrepare', 'htmlmin', 'usemin',
      'concat', 'ngmin' ]);

  grunt.registerTask('publish', [ 'shell:publish' ]);

  grunt.registerTask('wp', [ 'build', 'compress:wordpress' ]);

  grunt.registerTask('default', [ 'build' ]);
};
