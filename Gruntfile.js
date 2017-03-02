'use strict';

module.exports = function (grunt) {
  // show elapsed time at the end
  require('time-grunt')(grunt);
  // load all grunt tasks and their config
  require('load-grunt-config')(grunt);

  grunt.registerTask('build', [
    'less',
    'browserify'
  ]);

  grunt.registerTask('default', [
    'less',
    'browserify',
    'develop',
    'watch'
  ]);
};
