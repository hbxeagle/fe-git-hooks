'use strict';
(function() {

    var async = require('async');
    var chalk = require('chalk');
    var fs = require('fs');
    //var fsp = require('../util/fs');
    var path = require('../util/path.js');
    //var prompt = require('prompt');
    //var inquirer = require("inquirer");
    //var glob = require('glob');

    var addHooks = function(dirname) {

        console.log(chalk.green('Add pre-commit hook to you project.'));
        console.log(chalk.green(dirname));

        var fehooksconfig = path.join(dirname, '.fehooksconfig');
        var hook = path.join(dirname, '.git/hooks/pre-commit');

        if (fs.existsSync(fehooksconfig)) {
            console.log(chalk.yellow('has fehooksconfig'));
            fs.writeFileSync(hook, fs.readFileSync(path.join(__dirname, 'hooks/pre-commit')));
            fs.chmodSync(hook, '751');
        }
    };

    exports.hook = function(options) {
        console.log(options.base);
        addHooks(options.base);
    };

})();
