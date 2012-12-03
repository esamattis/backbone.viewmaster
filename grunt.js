/*jshint node:true*/

var fs = require("fs");
var version = fs.readFileSync("./lib/backbone.viewmaster.js")
  .toString().match(/VERSION.*\"([0-9\.]+)\"/)[1];

module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-contrib-yuidoc');
  grunt.loadNpmTasks('grunt-exec');
  grunt.loadNpmTasks('grunt-templater');
  grunt.loadNpmTasks('grunt-contrib-copy');
  var pkg = require("./package.json");

  grunt.initConfig({

    yuidoc: {
      compile: {
        name: pkg.name,
        description: pkg.description,
        version: version,
        url: pkg.url,
        themedir: "public_source/yuidoc-theme",
        options: {
          paths: "lib",
          outdir: "public"
        }
      }
    },

    template: {
      doc: {
        src: 'public_source/template.html',
        dest: 'public/index.html',
        engine: "underscore",
        variables: {
          version: version,
          body: fs.readFileSync("./README.md").toString()
        }
      }
    },

    copy: {
      dist: {
        files: {
          "./public/": ["./lib/*.js", "./public_source/vendor/**"]
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

  grunt.registerTask("default", "min yuidoc template copy");
};
