module.exports = function(grunt) {

  grunt.loadNpmTasks("grunt-rollup");
  grunt.loadNpmTasks("grunt-contrib-clean");
  grunt.loadNpmTasks("grunt-contrib-copy");

  grunt.initConfig({
    "rollup": {
      "options": {
        "module": "iife",
        "plugins": [
          require("rollup-plugin-typescript")({
            "strictNullChecks": true,
            "typescript": require("typescript") // little hack to enforce typescript 2.x
          })
        ]
      },
      "bundle-index": {
        "files": {
          "./dist/bundle-index.js": "./src/index.ts"
        }
      },
      "bundle-worker": {
        "files": {
          "./dist/bundle-worker.js": "./src/worker/ai-worker.ts"
        }
      }
    },
    "clean": {
      "dist": "./dist/**"
    },
    "copy": {
      "dist": {
        "files": [{
          "dest": "./dist", "cwd": "./src", "src": "**/*.html", "expand": true
        }]
      }
    }
  });

  grunt.registerTask("build", ["clean", "rollup", "copy"]);

  grunt.registerTask("default", ["build"]);

};
