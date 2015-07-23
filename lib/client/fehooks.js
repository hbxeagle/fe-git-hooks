"use strict";

(function() {

    var info = require('../info');

    var nopt = require('nopt');
    var path = require('path');


    // This is only executed when run via command line.
    var fehooks = module.exports = function() {
        // Run tasks.
        if (fehooks.tasklist[fehooks.task]) {
            require('./' + fehooks.task)[fehooks.task](fehooks.options);
            return;
        }
        if (fehooks.options.version) {
            info.version();
            return;
        }

        if (fehooks.task.indexOf('help') === 0) {
            info.help('fehooks', fehooks.task[1]);
            return;
        }
        if (fehooks.task.length) {
            info.fatal('\'' + fehooks.task + '\' is not a fehooks command');
            return;
        }
        info.fatal('No command provided');
    };

    // Default options.
    var optlist = fehooks.optlist = {
        base: {
            shorts: 'b',
            info: 'Path to the target dir.',
            type: path
        },
        force: {
            shorts: 'f',
            info: 'Force run command.',
            type: Boolean
        },
        help: {
            shorts: 'h',
            info: 'Display this help text.',
            type: Boolean
        },
        stack: {
            shorts: 's',
            info: 'Show error stack.',
            type: Boolean
        },
        version: {
            shorts: 'v',
            info: 'Print the fehooks version.',
            type: Boolean
        }
    };

    fehooks.tasklist = {
        lint: {
            args: [],
            info: 'Run linter on files changed.'
        },
        init: {
            args: ['force'],
            info: 'Generate project scaffolding.'
        },
        pull: {
            args: [],
            info: 'Clone/update all local git repositories.'
        },
        test: {
            args: [],
            info: 'Run test with Karma.'
        }
    };

    // Parse `optlist` into a form that nopt can handle.
    var aliases = {};
    var known = {};

    Object.keys(optlist).forEach(function(key) {
        var shorts = optlist[key].shorts;
        if (shorts) {
            aliases[shorts] = '--' + key;
        }
        known[key] = optlist[key].type;
    });

    var parsed = nopt(known, aliases, process.argv, 2);
    fehooks.task = parsed.argv.remain;
    fehooks.options = parsed;
    delete parsed.argv;
    if (!fehooks.options.base) {
        fehooks.options.base = process.cwd();
    }
})();
