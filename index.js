'use strict';

var vfs = require('vinyl-fs');
var fs = require('graceful-fs');
var through2 = require('through2');
var cheerio = require('cheerio');
var mkdirp = require('mkdirp');
var path = require('path');
var css = require('css');
var _ = require('lodash');

var opt;
var defaults = {
    src: false,
    out: {
        svg: false,
        style: false
    },
    extension: 'css',
    classPrefix: 'svg-'
};


function fileName (fullPath) {
    return path.basename(fullPath, path.extname(fullPath));
}

function writeFile (name, contents, cb) {
    mkdirp(path.dirname(name), function () {
        fs.writeFile(name, contents, cb());
    });
}

function writeCSS (file, enc, cb) {
    var stream = this;
    mkdirp(opt.out.style, function () {
        var destination = path.join(opt.out.style, fileName(file.path) + '.' + opt.extension);
        stream.push(file);
        if (file.contents) {
            writeFile(destination, file.contents, cb);
        }
    });
}

function cssPrefix (prefix, contents) {
    var parsed = css.parse(contents);
    _.forEach(parsed.stylesheet.rules, function (rule) {
        rule.selectors = _.map(rule.selectors, function (selector) {
            return prefix + ' ' + selector;
        });
    });
    return css.stringify(parsed);
}

function format (file, enc, cb) {
    this.push(file);
    cb();
}

function extractStyles (file, enc, cb) {
    var $ = cheerio.load(file.contents);
    var styleBlocks = $('style');
    var extractedStyle = styleBlocks.text();
    var className = opt.classPrefix + fileName(file.path);
    $('svg').addClass(className);
    var destination = path.join(opt.out.svg, path.basename(file.path));
    writeFile(destination, new Buffer($.html()), cb);
    extractedStyle = cssPrefix('.' + className, extractedStyle);
    file.contents = extractedStyle ? new Buffer(extractedStyle) : null;
    this.push(file);
}

module.exports = function (options) {
    
    opt = _.assign(defaults, options);

    vfs.src(opt.src)
    .pipe(through2.obj(extractStyles))
    .pipe(through2.obj(writeCSS));
};