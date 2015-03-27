'use strict';

var vfs = require('vinyl-fs');
var fs = require('graceful-fs');
var through2 = require('through2');
var cheerio = require('cheerio');
var mkdirp = require('mkdirp');
var path = require('path');
var _ = require('lodash');

var opt;
var defaults = {
    src: false,
    out: false,
    extension: 'css'
};

function writeFiles (file, enc, cb) {
    var stream = this;
    mkdirp(opt.out, function () {
        var identifier = path.basename(file.path, path.extname(file.path));
        var destination = path.join(opt.out, identifier + '.' + opt.extension);
        if (file.contents) {
            fs.writeFile(destination, file.contents, function () {
                stream.push(file);
                cb();
            });
        }
    });
}

function format (file, enc, cb) {
    this.push(file);
    cb();
}

function extractStyles (file, enc, cb) {
    var $ = cheerio.load(file.contents);
    var styleBlocks = $('style');
    var extractedStyle = styleBlocks.text();
    file.contents = extractedStyle ? new Buffer(extractedStyle) : null;
    this.push(file);
    cb();
}

module.exports = function (options) {
    
    opt = _.assign(defaults, options);

    vfs.src(opt.src)
    .pipe(through2.obj(extractStyles))
    .pipe(through2.obj(writeFiles));
};