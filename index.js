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
    classPrefix: '',
    idHandling: 'none' // 'none', 'class', 'remove'
};

// File name without extension
function identifier (fullPath) {
    return path.basename(fullPath, path.extname(fullPath));
}

function className (filepath) {
    return opt.classPrefix + identifier(filepath);
}

function writeFile (name, contents, cb) {
    mkdirp(path.dirname(name), function () {
        fs.writeFile(name, contents, cb);
    });
}

function writeSVG (name, contents, cb) {
    var destination = path.join(opt.out.svg, path.basename(name))
    writeFile(destination, contents, cb);
}

function writeCSS (file, enc, cb) {
    var destination = path.join(opt.out.style, identifier(file.path) + '.' + opt.extension);
    if (file.contents) {
        writeFile(destination, file.contents, cb);
    }
}

function nestCSS (prefix, contents) {
    var parsed = css.parse(contents);
    _.forEach(parsed.stylesheet.rules, function (rule) {
        rule.selectors = _.map(rule.selectors, function (selector) {
            return prefix + ' ' + selector;
        });
    });
    return css.stringify(parsed);
}

function handleIDs (file) {
    if (opt.idHandling === 'none') return;
    var $ = cheerio.load(file.contents);
    $('[id]').each(function (index, item) {
        var $item = $(item);
        var id = $item.attr('id');
        $item.removeAttr('id');
        if (opt.idHandling === 'class') {
            $item.addClass(id);
        }
    });
    file.contents = new Buffer($.html());
}

function extractStyle (file) {
    var $ = cheerio.load(file.contents);
    var styleBlocks = $('style');
    return styleBlocks.text();
}

function classedSVG (file, styles) {
    var $ = cheerio.load(file.contents);
    $('svg').addClass(className(file.path));
    $('style').text(styles);
    return $.html();
}

function extractStyles (file, enc, cb) {
    var finished = _.after(2, cb);

    var styleText = nestCSS('.' + className(file.path), extractStyle(file));
    handleIDs(file);
    if (opt.out.svg) {
        writeSVG(file.path, new Buffer(classedSVG(file, styleText)), finished);
    }

    file.contents = styleText ? new Buffer(styleText) : null;
    writeCSS(file, enc, finished);

    this.push(file);
}

module.exports = function (options, done) {
    opt = _.assign(defaults, options);

    vfs.src(opt.src)
    .pipe(through2.obj(extractStyles, done));
};
