/*
 * grunt-typescript-simple
 * https://github.com/sorgloomer/grunt-typescript-simple
 *
 * Copyright (c) 2016 Tamas Hegedus
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

  const MSG_PREFIX = "typescript-simple: ";
  
  grunt.registerMultiTask('typescript_simple', 'tsc-like Grunt task', function() {
    const options = this.options({});

    const ts = options.typescript || require("typescript");
    delete options.typescript;

    const sources = collectSourceFiles(this.files);
    const compilerOptions = parseOptions(ts, options);
    
    compile(ts, sources, compilerOptions);
  });

  function parseOptions(ts, options) {
    var parsed = ts.convertCompilerOptionsFromJson(options, process.cwd());
    if (parsed.errors && parsed.errors.length) {
      parsed.errors.forEach(function (error) {
        console.error(MSG_PREFIX + error.messageText);
      });
      throw new Error(MSG_PREFIX + "Couldn't process compiler options");
    }
    return parsed.options;
  }

  function collectSourceFiles(files) {
    return files.map(file => {
      if (file.src.length !== 1) {
        throw new Error(MSG_PREFIX + "File src format not supported: use {expand: true} without dest");
      }
      const srcName = file.src[0];
      /*
      if (file.dest && file.dest !== srcName) {
        throw new Error(MSG_PREFIX + "File dests are not supported: use outDir instead");
      }
      */
      return srcName;
    });
  }

  function compile(ts, fileNames, compilerOptions) {
    let program = ts.createProgram(fileNames, compilerOptions);
    let emitResult = program.emit();
    let allDiagnostics = ts.getPreEmitDiagnostics(program).concat(emitResult.diagnostics);
    reportDiagnostics(ts, allDiagnostics);
    if (!compilerOptions.noEmit && emitResult.emitSkipped) {
      throw new Error(MSG_PREFIX + "Emit skipped due to errors");
    }
  }

  function reportDiagnostics(ts, diagnostics) {
    diagnostics.forEach(diagnostic => {
      let message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
      let prefix = "Typescript: ";
      if (diagnostic.file) {
        let {line, character} = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
        prefix = `${diagnostic.file.fileName} (${line + 1},${character + 1}): `;
      }
      grunt.log.warn(MSG_PREFIX + prefix + message);
    });
  }
};