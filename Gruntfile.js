module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jshint: {
      files: ['fusiontables.js', 'backbone.fusiontables.js']
    },
    uglify: {
      options: {
        report: 'gzip',
        sourceMap: true,
        preserveComments: 'some',
        sourceMapName: function(name) {
          var filename = name.split('.')
          filename[filename.length - 1] = 'map';
          return filename.join('.');
        }
      },
      fusiontables: {
        files: {
          'dist/fusiontables.min.js': ['fusiontables.js']
        }
      },
      'backbone.fusiontables': {
        files: {
          'dist/backbone.fusiontables.min.js': ['backbone.fusiontables.js']
        }
      }
    },
    clean: ['dist']
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-clean');

  grunt.registerTask('default', ['jshint', 'clean', 'uglify']);

};