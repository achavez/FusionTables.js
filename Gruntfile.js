module.exports = function(grunt) {

  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),

    jshint: {
      files: ['src/**.js']
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

    connect: {
      testclient: {
        options: {
          port: 5000,
          keepalive: true,
          open: 'http://localhost:5000/node_modules/intern/client.html?config=tests/intern'
        }
      }
    },

    /*
    intern: {
      unittests: {
        options: {
          config: 'tests/intern'
        }
      }
    },
    */

    clean: ['dist']

  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-connect');
  // grunt.loadNpmTasks('intern');

  grunt.registerTask('default', ['jshint', 'clean', 'uglify']);

};