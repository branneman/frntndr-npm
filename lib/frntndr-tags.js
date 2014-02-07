'use strict';

var git = require('git-node');

module.exports = function getGitTags(cb) {

    console.log('  Discovering tags...');

    var remote = git.remote('https://github.com/branneman/frontend-library.git');

    remote.discover(function(err, refs) {

        if (err) return cb(err);

        // Grab tags
        var tags = [];
        Object.keys(refs).forEach(function(ref) {
            if (ref.substr(0, 10) === 'refs/tags/') tags.push(ref.substr(10));
        });

        // Return array of tags, from new to old
        cb(null, tags.reverse());

        // Close connection
        remote.close();
    });
};
