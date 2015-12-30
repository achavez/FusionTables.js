module.exports = function(grunt) {

  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),

    jshint: {
      files: ['src/**.js', 'tests/**/*.js']
    },

    uglify: {
      options: {
        report: 'gzip',
        sourceMap: true,
        preserveComments: 'some',
        sourceMapName: function(name) {
          var filename = name.split('.');
          filename[filename.length - 1] = 'map';
          return filename.join('.');
        }
      },
      fusiontables: {
        files: {
          'dist/fusiontables.min.js': ['src/fusiontables.js']
        }
      },
      'backbone.fusiontables': {
        files: {
          'dist/backbone.fusiontables.min.js': ['src/backbone.fusiontables.js']
        }
      }
    },

    // Start a connect server that serves from our project root, allowing us
    // to access intern.js's client.html and the Istanbul HTML coverage report
    connect: {
      testclient: {
        options: {
          port: 5000,
          keepalive: true
        }
      }
    },

    // Run our intern unit tests, but without any tests that require a browser;
    // also generate junit output and lcov output for our CI services
    intern: {
      options: {
        config: 'tests/intern'
      },
      unittests: {
        options: {
          suites: [ 'tests/unit/fusiontables' ],
          reporters: [{
            id: 'Pretty'
          }, {
            id: 'Lcov'
          }, {
            id: 'LcovHtml'
          }, {
            id: 'JUnit',
            filename: 'junit.xml'
          }],
        }
      }
    },

    // Open the Istanbul coverage report and the Intern browser test client
    // once grunt-contrib-connect has started the server
    open: {
      options: {
        openOn: 'connect.testclient.listening'
      },
      coverage: {
        path: 'http://localhost:5000/html-report/index.html'
      },
      testclient: {
        path: 'http://localhost:5000/node_modules/intern/client.html?config=tests/intern'
      }
    },

    clean: {
      build: ['dist'],
      test: ['lcov.info', 'junit.xml', 'html-report']
    }

  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-open');
  grunt.loadNpmTasks('intern');

  grunt.registerTask('runtests', ['clean:test', 'jshint', 'intern']);
  grunt.registerTask('reporttests', ['open', 'connect:testclient']);
  grunt.registerTask('test', ['runtests', 'reporttests']);
  grunt.registerTask('build', ['clean:build', 'uglify']);

};