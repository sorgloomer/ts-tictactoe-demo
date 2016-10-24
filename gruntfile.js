module.exports = function(grunt) {

  grunt.loadNpmTasks("grunt-rollup");
  grunt.loadNpmTasks("grunt-contrib-clean");
  grunt.loadNpmTasks("grunt-contrib-copy");
  grunt.loadNpmTasks("grunt-http-server");
  grunt.loadTasks("./tasks");

  grunt.initConfig({
    "typescript_simple": {
      "temp": {
        "options": {
          "outDir": ".tmp/modules",
          "noEmitOnError": true,
          "strictNullChecks": true,
          "target": "es5",
          "module": "es6",
          "lib": ["dom", "es6"]
        },
        "files": [{ src: "src/**/*.ts", expand: true }]
      }
    },
    "rollup": {
      "options": {
        "module": "iife"
      },
      "bundle-index": {
        "files": {
          "./dist/bundle-index.js": "./.tmp/modules/index.js"
        }
      },
      "bundle-worker": {
        "files": {
          "./dist/bundle-worker.js": "./.tmp/modules/worker/ai-worker.js"
        }
      }
    },
    "clean": {
      "dist": "./dist/**"
    },
    "copy": {
      "dist": {
        "files": [
          { "dest": "./dist", "cwd": "./src", "src": "**/*.{html,css,svg}", "expand": true },
          { "dest": "./dist", "cwd": "./src", "src": "lib/**/*", "expand": true }
        ]
      }
    },
    "http-server": {
      "dist": {
        "root": "dist",
        "port": 8082
      }
    }
  });

  grunt.registerTask("build", ["clean", "typescript_simple", "rollup", "copy"]);
  grunt.registerTask("serve", ["http-server"]);
  grunt.registerTask("default", ["build", "serve"]);

};
