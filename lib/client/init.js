'use strict';
(function() {

    var async = require('async');
    var chalk = require('chalk');
    var fs = require('fs');
    var path = require('../util/path.js');
    var prompt = require('prompt');
    var getDirName = require('path').dirname;
    var mkdirp = require('mkdirp');
    var inquirer = require("inquirer");

    var mkdir = function(dir) {
        return function(callback) {
            process.stdout.write('Make ' + dir + '/ ... ');
            if (!fs.existsSync(dir)) {
                fs.mkdir(dir, function(err) {
                    if (err) {
                        console.log(err.message.red);
                    } else {
                        console.log(chalk.green('OK'));
                    }
                    callback(err);
                });
            } else {
                console.log(chalk.green('OK'));
                callback();
            }
        };
    };

    var writefile = function(filename, data) {
        return function(callback) {
            process.stdout.write('Write ' + filename + ' ... ');

            var tmpl = fs.readFileSync(path.join(__dirname, 'template/' + filename.replace('.gitignore', 'gitignore')), {
                encoding: 'utf8'
            });
            tmpl = tmpl.replace(/\{\{(.+?)\}\}/g, function(str, p) {
                return data[p];
            });
            var dir = getDirName(filename);

            if (dir) {
                mkdirp(dir, function(err) {
                    if (err) {
                        console.log(chalk.red(err.message));
                        return;
                    }

                    fs.writeFile(filename, tmpl, function(err) {
                        if (err) {
                            console.log(chalk.red(err.message));
                        } else {
                            console.log(chalk.green('OK'));
                        }
                        callback(err);
                    });
                });
                return;
            }

            fs.writeFile(filename, tmpl, function(err) {
                if (err) {
                    console.log(chalk.red(err.message));
                } else {
                    console.log(chalk.green('OK'));
                }
                callback(err);
            });
        };
    };

    var scaffolding = function(projectInfo, globalCallback) {
        async.waterfall([
            mkdir('js'),
            mkdir('css'),
            mkdir('img'),
            writefile('js/main.js'),
            writefile('css/main.css'),
            writefile('index.html'),
            writefile('.eslintrc'),
            writefile('.csslintrc'),
            writefile('.fehooksconfig', projectInfo),
            writefile('.gitignore')
        ], globalCallback);
    };

    exports.init = function(options, projectInfo) {
        process.chdir(options.base);

        if (!projectInfo) {
            console.log('This command will create several directries and files in the current');
            console.log('directory for a fe-hooks project, based on the answers to a few questions.');
            console.log('A fe-hooks project means it contains a ' + chalk.bold('.fehooksconfig') + ' file for interacting');
            console.log('with fe-hooks, and also some config files for concat, lint, test and so on.');
            projectInfo = {};
        }

        if (!options.force && fs.readdirSync(options.base).length) {
            console.log(chalk.yellow('\nWarning: Existing files may be overwritten! Use --force(-f) to continue.'));
            console.log(chalk.red('\nAborted due to warnings.'));
            return;
        }

        console.log(chalk.bold('\nPlease answer the following:'));
        var schema1 = [{
            'name': 'name',
            'message': 'Project name',
            'default': projectInfo.name || path.basename(options.base)
        }, {
            'name': 'description',
            'message': 'Project description',
            'default': projectInfo.description || '',
            'required': true
        }];
        var schema2 = [{
            'name': 'id',
            'message': 'Unique repository id',
            'default': projectInfo.id || '',
            'required': true
        }, {
            'name': 'publishUrl',
            'message': 'Publish Url',
            'default': projectInfo.publishUrl || ''
        }, {
            'name': 'devUrl',
            'message': 'Development Url',
            'default': projectInfo.publishUrl || '',
            'required': true
        }];
        var schema3 = [{
            'type': 'checkbox',
            'name': 'check',
            'message': 'turn on/off check item',
            'choices': [{
                'name': 'lint',
                checked: true
            }, {
                'name': 'pageSpeed',
                checked: true
            }],
            'default': true,
            'required': true
        }];

        var schemaEnd = [{
            'name': 'confirm',
            'message': chalk.green('Do you need to make any changes to the above before continuing'),
            'default': 'y/N'
        }];

        prompt.message = chalk.green('[?]');
        prompt.delimiter = ' ';
        prompt.start();
        prompt.get(schema1, function(error, res) {
            schema2[0].default = schema2[0].default || res.name;
            schema2[1].default = schema2[1].default || 'http://h5.edaijia.cn/' + res.name;
            schema2[2].default = schema2[2].default || 'http://h5.d.edaijia.cn/' + res.name;
            prompt.get(schema2, function(error, result) {
                result.name = res.name;
                result.description = res.description;

                inquirer.prompt(schema3, function(answers) {

                    result.checkLint = answers.check.indexOf('lint')!== -1;
                    result.checkPageSpeed = answers.check.indexOf('pageSpeed')!==-1;

                    prompt.get(schemaEnd, function(error, endResult) {
                        var continuing = endResult.confirm.toLowerCase() !== 'y';
                        delete endResult.confirm;
                        if (continuing) {
                            console.log('');
                            scaffolding(result, function(error) {
                                if (error) {
                                    console.log(chalk.red('\nAborted due to warnings.'));
                                } else {
                                    console.log(chalk.green('\nDone, without errors.'));
                                }
                            });
                        } else {
                            exports.init(options, result);
                        }
                    });
                });

            });
        });
    };

})();
