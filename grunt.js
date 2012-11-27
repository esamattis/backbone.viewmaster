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
        url: pkg.url,
        themedir: ".yuidoc_theme",
        options: {
          paths: "lib",
          outdir: "docs"
        }
      }
    },

    min: {
      dist: {
        src: ["lib/backbone.viewmaster.js"],
        dest: "lib/backbone.viewmaster.min.js"
      }
    },

    watch: {
      files: "lib/*",
      tasks: "default"
    }

  });

  grunt.registerTask("default", "min yuidoc");
};
