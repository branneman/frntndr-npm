#!/usr/bin/env node

'use strict';

process.title = 'frntndr';

var giturl = 'https://github.com/branneman/frntndr.git';

// Core dependencies
var fs = require('fs');
var child_process = require('child_process');

// External dependencies
require('colors');
var parseArgs    = require('minimist');
var existsInPath = require('fs-exists-in-path');
var async        = require('async');
var rmrf         = require('rimraf');

// Local dependencies
var pkg = require('../package.json');

//
// Control flow
//
async.waterfall([
    parseArguments,
    checkPrerequisites,
    gitClone,
    gitTag,
    gitInit,
    npmInstall
], reporter);

//
// Option parsing
//
function parseArguments(cb) {

    // Parse given arguments
    var argv = parseArgs(process.argv.slice(2), {
        string: ['t', 'tag']
    });

    // Exit with error if unknown arguments are passed
    var allowedArguments = 'v version h help t tag'.split(' ');
    Object.keys(argv).forEach(function(key) {
        if (key !== '_' && !~allowedArguments.indexOf(key)) {
            _printUsage('Unknown option: ' + key);
            process.exit(-1);
        }
    });

    // If requested: Print version and exit
    if (argv.v || argv.version) {
        console.log(pkg.version);
        process.exit();
    }

    // If incorrect args: Print usage statement and exit
    if (argv._.length !== 1 || argv.t === true || argv.tag === true) {
        _printUsage();
        process.exit(); // @todo -1?
    }

    // Grab target directory, and version tag if specified
    var optDir = argv._[0];
    var optTag = argv.t || argv.tag;
    console.log('');

    cb(null, optDir, optTag);
}

//
// Check the prerequisites
//
function checkPrerequisites(optDir, optTag, cb) {

    async.series([

        // Git must be installed
        function(cb) {
            async.parallel([
                function(cb) { existsInPath('git', cb); },
                function(cb) { existsInPath('git.exe', cb); },
            ], function(err, results) {
                if (!~results.indexOf(true)) {
                    return cb('Git not found, is it installed and in your PATH?');
                }
                cb();
            });
        },

        // Target directory can't exist
        function(cb) {
            fs.exists(optDir, function(exists) {
                if (exists) {
                    return cb('Specified target directory already exists');
                }
                cb();
            });
        },

        // Git tag must be available
        function(cb) {

            console.log('  Discovering tags...');

            var cmd = 'git ls-remote --tags ' + giturl;
            child_process.exec(cmd, function(err, stdout) {

                if (err) {
                    return cb('Git returned an error while reading remote tags.');
                }

                // Parse git's output to an array with only the tag names
                var tags = stdout.trim().split('\n').map(function(value) {
                    return value.split('\t')[1].split('/')[2];
                });

                if (!~tags.indexOf(optTag)) {
                    return cb('Specified tag not found. Available tags: ' + tags.join(', '));
                }

                cb();
            });
        }

    ], function(err) {
        cb(err, optDir, optTag);
    });
}

//
// Run `git clone`
//
function gitClone(optDir, optTag, cb) {

    console.log('  Cloning repository...');

    // Run git clone
    var cmd = 'git clone ' + giturl + ' ' + optDir;
    child_process.exec(cmd, function(err) {

        if (err) {
            return cb('Git returned an error, download & clone failed.');
        }

        // Change into new directory
        process.chdir(optDir);

        cb(null, optTag);
    });
}

//
// Run `git checkout tag`
//
function gitTag(optTag, cb) {

    console.log('  Checking out tag...');

    child_process.exec('git checkout ' + optTag, function(err) {
        if (err) {
            return cb('Git returned an error, a new repository has not been initialised.');
        }
        cb();
    });
}

//
// Init new git repo
//
function gitInit(cb) {

    console.log('  Initialising repository...');

    var tasks = [

        // Remove .git dir
        function(cb) {
            rmrf('.git', function(err) {
                if (err) {
                    return cb('Could not remove .git directory, remove it manually.');
                }
                cb();
            });
        },

        // Run git init
        function(cb) {
            child_process.exec('git init', function(err) {
                if (err) {
                    return cb('Git returned an error, a new repository has not been initialised.');
                }
                cb();
            });
        }

    ];

    async.series(tasks, function() {
        cb();
    });
}

//
// Run `npm i` inside the directory
//
function npmInstall(cb) {

    console.log('  Installing dependencies... (this may take a while)');

    child_process.exec('npm i', function(err) {
        if (err) {
            return cb('npm returned an error, see ' + 'npm-debug.log'.bold + '. Then run `npm install` manually.');
        }
        cb();
    });
}

//
// Report results to CLI
//
function reporter(err) {

    if (err) {
        console.log('  Error:'.red.bold, err);
    } else {
        console.log('  Finished.'.green.bold, 'You can now start the development server.');
    }
    console.log('');
}

//
// Print usage information (and optionally an error) to CLI
//
function _printUsage(err) {

    console.log('');
    if (err) {
        console.log('  Error: '.red + err);
        console.log('');
    }
    console.log('  Usage: '.bold + 'frntndr [options] <target>');
    console.log('');
    console.log('  Options:'.bold);
    console.log('');
    console.log('    -t [tag], --tag [tag]    install specified older version');
    console.log('    -h,       --help         output usage information');
    console.log('    -v,       --version      output the version number');
    console.log('');
}
