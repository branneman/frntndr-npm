'use strict';

/**
 * @todo
 *  - Throw error if the target directory is not empty
 *  - Get latest tag, instead of 'always master'
 *  - Allow downloading of specific tag
 */

var fs     = require('fs');
var path   = require('path');
var https  = require('https');
var AdmZip = require('adm-zip');

var names = {
    url:  'https://codeload.github.com/branneman/frontend-library/zip/master',
    temp: 'frntndr-latest.zip'
};

// Download file
var out = fs.createWriteStream(names.temp);
https.get(names.url, function(res) {
    res.pipe(out);
    res.on('end', unzip);
});

// Unzip file
function unzip() {
    var zip = new AdmZip(names.temp);
    var files = zip.getEntries();

    files.forEach(function(file) {

        var oldPath = file.entryName;
        var newPath = oldPath.substr(24); // remove 'frontend-library-master' prefix
        if (newPath === '' || newPath.substr(-1) === '/') {
            return;
        }
        var newDir = path.dirname(newPath);

        zip.extractEntryTo(oldPath, './' + newDir, false, true);
    });
}
