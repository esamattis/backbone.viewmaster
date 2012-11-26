/*jshint node:true*/

module.exports = function(grunt) {

  grunt.initConfig({

    min: {
      dist: {
        src: ["backbone.viewmaster.js"],
        dest: "backbone.viewmaster.min.js"
      }
    },

    watch: {
      files: "lib/*",
      tasks: "default"
    }

  });

  grunt.registerTask("default", "min");
};
