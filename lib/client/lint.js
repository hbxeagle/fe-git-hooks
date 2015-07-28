"use strict";
(function() {

    var chalk = require('chalk');
    var childProcess = require('child_process');
    var csslint = require('csslint').CSSLint;
    var jshint = require('eslint').linter;
    var fs = require('fs');
    var path = require('../util/path.js');
    var table = require('text-table');

    var rFileStatus = /^[A-Z]\s+(.+)$/;

    var linters = {
        reporter: function(messages, file) {
            if (!messages.length) {
                return;
            }
            var output = messages.map(function(message) {
                var out = [];
                out.push(message.line);
                out.push(message.col);
                out.push(message.warn ? chalk.yellow('warning') : chalk.red('error'));
                out.push(message.message.slice(0, -1));
                out.push(chalk.grey(message.rule.id));
                return out;
            });
            output = table(output, {
                align: ['r', 'l']
            });
            output = output.split('\n').map(function(el) {
                return el.replace(/(\d+)\s+(\d+)/, function(m, p1, p2) {
                    return chalk.grey(p1 + ':' + p2);
                });
            }).join('\n');
            console.log('\n' + file + '\n');
            console.log(output);
            console.log(chalk.red.bold('\n\u2716 ' + messages.length + ' problems'));
        },
        eslint: function(file, config) {
            console.log(file);
            console.log(config);
            var code = fs.readFileSync(file, {
                encoding: 'utf8'
            });
            var configs = JSON.parse(fs.readFileSync(config, {
                encoding: 'utf8'
            }));
            var messages = jshint.verify(code, configs);
            var errorLen = 0;
            messages = messages.map(function(message) {
                var warn = !message.fatal && message.severity === 1;
                if (!warn) {
                    errorLen += 1;
                }
                return {
                    line: message.line || 0,
                    col: message.column || 0,
                    message: message.message.replace(/\.$/, ''),
                    rule: {
                        id: message.ruleId
                    },
                    warn: warn
                };
            });
            this.reporter(messages, file);
            return errorLen;
        },
        csslint: function(file, config) {
            var code = fs.readFileSync(file, {
                encoding: 'utf8'
            });
            var configs = JSON.parse(fs.readFileSync(config, {
                encoding: 'utf8'
            }));
            var messages = csslint.verify(code, configs).messages;
            var errorLen = 0;
            messages = messages.map(function(message) {
                var warn = message.type === "warning";
                if (!warn) {
                    errorLen += 1;
                }
                return {
                    line: message.line || 0,
                    col: message.col || 0,
                    message: message.message.replace(/\.$/, ''),
                    rule: {
                        id: message.rule.id
                    },
                    warn: warn
                };
            });
            this.reporter(messages, file);
            return errorLen;
        }
    };

    exports.lintFiles = function(files, options) {
        var fehooksconfig = path.join(options.base, '.fehooksconfig');
        if (fs.existsSync(fehooksconfig)) {
            options.lintConfigs = JSON.parse(fs.readFileSync(fehooksconfig)).lint;
            if (!options.lintConfigs) {
                console.log('Lint is not configed.');
                return;
            }
        } else {
            console.log('The .fehooksconfig file is not found.');
            return;
        }
        var filesLinted = 0;
        var lintErrors = files.some(function(filename) {
            console.log(filename);
            var linter = options.lintConfigs[path.extname(filename).slice(1)];
            if (linter) {
                filesLinted += 1;
                return linters[linter.engine](filename, path.join(options.base, linter.config));
            }
        });
        if (filesLinted === 0) {
            console.log('No files needed to be linted');
        } else if (!lintErrors) {
            console.log('\n' + chalk.white.bgGreen.bold(' OKAY ') + ' No lint errors.');
        }
        return lintErrors;
    };

    exports.lint = function(options) {
        console.log('Linting...');
        childProcess.exec('git diff --name-status HEAD', {
            cwd: options.base
        }, function(err, stdout) {
            if (err) {
                console.log(chalk.bold('Exception: ') + 'Not a git repo.');
            } else {
                if (stdout) {
                    stdout = stdout.trim().split('\n');
                    stdout = stdout.filter(function(fileStatus) {
                        return fileStatus.indexOf('D') !== 0;
                    });
                    stdout = stdout.map(function(fileStatus) {
                        return rFileStatus.exec(fileStatus)[1];
                    });
                    if (stdout.length) {
                        exports.lintFiles(stdout, options);
                    } else {
                        console.log('No files changed.');
                    }
                } else {
                    console.log('No files changed.');
                }
            }
        });
    };

})();
