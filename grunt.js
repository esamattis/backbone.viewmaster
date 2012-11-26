/*jshint node:true*/

module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-contrib-yuidoc');
  grunt.loadNpmTasks('grunt-exec');
  var pkg = require("./package.json");

  grunt.initConfig({
    exec: {
      pushdoc: {
        command: "git push -f origin master:gh-pages"
      }
    },
    yuidoc: {
      compile: {
        name: pkg.name,
        description: pkg.description,
        version: pkg.version,
        logo: "../../assets/logo.png",
        url: "https://github.com/epeli/backbone.viewmaster",
        options: {
          paths: "lib",
          outdir: "docs"
        }
      }
    },

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

  grunt.registerTask("default", "min yuidoc");
};
