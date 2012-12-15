/*jshint node:true*/

var fs = require("fs");
var version = fs.readFileSync("./lib/backbone.viewmaster.js")
  .toString().match(/VERSION.*\"(.+)\"/)[1];

module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-contrib-yuidoc');
  grunt.loadNpmTasks('grunt-exec');
  grunt.loadNpmTasks('grunt-templater');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-mocha');
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

    exec: {
      publish: {
        command: "cd public && git init && git add . && git commit -m publish && git push -f  git@github.com:epeli/backbone.viewmaster.git master:gh-pages"
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
      doc: {
        options: {
          basePath: "public_source"
        },
        files: {
          "./public/": ["./lib/*.js", "./public_source/**"]
        }
      },
      dist: {
        files: {
          "./public/": ["./lib/*.js", "./examples/**", "./tests/**"]
        }
      }
    },

    min: {
      dist: {
        src: ["lib/backbone.viewmaster.js"],
        dest: "lib/backbone.viewmaster.min.js"
      }
    },

    mocha: {
      client: {
        src: [ "tests/index.html" ],
        options: {
          run: true
        }
      }
    },

    watch: {
      files: ["lib/*", "README.md"],
      tasks: "default"
    }

  });

  grunt.registerTask("default", "min yuidoc template copy");
};
