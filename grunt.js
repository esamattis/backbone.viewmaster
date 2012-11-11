/*jshint node:true*/

module.exports = function(grunt) {

  grunt.initConfig({
    min: {
      dist: {
        src: ["backbone.viewmaster.js"],
        dest: "backbone.viewmaster.min.js"
      }
    }
  });

  grunt.registerTask("default", "min");
};
