'use strict';

var vfs = require('vinyl-fs');
var fs = require('graceful-fs');
var through2 = require('through2');
var cheerio = require('cheerio');
var juice = require('juice');
var mkdirp = require('mkdirp');
var path = require('path');
var css = require('css');
var _ = require('lodash');

var opt;
var streaming = false;
var defaults = {
    src: false,
    out: {
        svg: false,
        style: false
    },
    extension: 'css',
    prefix: '',
    classPrefix: '',
    styledSelectorPrefix: '',
    idHandling: 'none', // 'none', 'class', 'remove', 'prefix'
    removeStyleTags: false,
    inlineURLStyles: true
};

var cheerioOpts = {
    xmlMode: false,
    lowerCaseTags: false,   // don't change the camelCase tag- and attribute names, since chrome only respects camels!
    lowerCaseAttributeNames: false, // s.a.
    recognizeCDATA: true
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
    var destination = path.join(opt.out.svg, path.basename(name));
    writeFile(destination, contents, cb);
}

function writeCSS (svgPath, contents, cb) {
    var destination = path.join(opt.out.style, opt.prefix + identifier(svgPath) + '.' + opt.extension);
    if (contents) {
        writeFile(destination, contents, cb);
    } else {
        cb();
    }
}

function nestCSS (prefix, contents) {
    var parsed = css.parse(contents);
    _.forEach(parsed.stylesheet.rules, function (rule) {
        rule.selectors = _.map(rule.selectors, function (selector) {
            return opt.styledSelectorPrefix + prefix + ' ' + selector;
        });
    });
    return css.stringify(parsed);
}

function prefixIdOfElem ($elem, id, file, replacedIds) {
    var prefixedId = identifier(file.path) + '-' + id;
    $elem.attr('id', prefixedId);
    replacedIds[id] = prefixedId;
}

function handleIDs (file) {
    if (opt.idHandling === 'none') return;
    var referencedIds = file.contents.toString().match(/url\(('|")*#.+('|")*\)/g) || [];
    var replacedIds = {};
    var editedFileContent;
    var $ = cheerio.load(file.contents, cheerioOpts);
    referencedIds.forEach(function (elem, idx, arr) {
        elem =  elem.replace(/url\(('|")*#/g, '');
        arr[idx] = elem.replace(/('|")*\)/g, '');
    });
    $('[id]').each(function (index, item) {
        var $item = $(item);
        var id = $item.attr('id');
        switch (opt.idHandling) {
            case 'class' :
                // do not remove ids that are targeted from styles via "url(#id)"
                if (referencedIds.indexOf(id) >= 0) {
                    prefixIdOfElem($item, id, file, replacedIds);
                }
                else{
                    $item.addClass(id);
                    $item.removeAttr('id');
                }
                break;
            case 'remove' :
                $item.removeAttr('id');
                break;
            case 'prefix' :
                prefixIdOfElem($item, id, file, replacedIds);
                break;
        }
    });

    editedFileContent = $.html();
    for(var oldId in replacedIds) {
        editedFileContent = editedFileContent.replace('#' + oldId, '#' + replacedIds[oldId]);
    }


    if (referencedIds.length >= 0 && opt.inlineURLStyles) {
        // inline styles referencing ids
        var regExForSelectorsWithUrls = /(.)*\{((\s)*(\w)*(\s)*:(\s)*url\(('|")*#.+('|")*\)(\s)*;)*(\s)*\}/g;
        var selectorsWithUrls = editedFileContent.match(regExForSelectorsWithUrls);
        editedFileContent = editedFileContent.replace(regExForSelectorsWithUrls, '');
        if (selectorsWithUrls) {
            selectorsWithUrls.forEach(function (elem, idx) {
                console.log('inline styles', selectorsWithUrls[idx]);
                editedFileContent = juice.inlineContent(editedFileContent, selectorsWithUrls[idx], {xmlMode: true});
            });
        }
    }


    file.contents = new Buffer(editedFileContent);
}

function extractStyle (file, classNamePrefix) {
    var $ = cheerio.load(file.contents, cheerioOpts);
    var styleBlocks = $('style');

    var styleToClassname = {};//todo: handle cases like 'constructor' or 'toString'
    var freeClassNumber = 0;
    $('[style]').each(function (index, item) {
        var $item = $(item);
        var style = $item.attr('style');
        if(!styleToClassname.hasOwnProperty(style)){
            styleToClassname[style]= classNamePrefix + freeClassNumber++;
        }
        var componentClassName = styleToClassname[style];
        $item.removeAttr('style');
        $item.addClass(componentClassName);
    });
    file.contents = new Buffer($.html());
    return styleBlocks.text().replace(/<!\[CDATA\[([^\]]+)]\]>/ig, "$1")+_.map(styleToClassname,function(className,style){
        return '.' + className + '{' + style + '}';
    }).join('\n');
}

function classedSVG (file, styles, removeStyleTags) {
    var $ = cheerio.load(file.contents, cheerioOpts),
        styleTags = $('style');
    $('svg').addClass(className(file.path));

    removeStyleTags ? styleTags.remove() : styleTags.text(styles);
    return $.html();
}

function extractStyles (file, enc, cb) {
    var finished = _.after(2, cb);
    handleIDs(file);
    var iconClassName = className(file.path);
    var styleText = nestCSS('.' + iconClassName, extractStyle(file,iconClassName + '--'));//todo: make -- configurable

    if (opt.out.svg) {
        writeSVG(file.path, new Buffer(classedSVG(file, styleText, opt.removeStyleTags)), finished);
    } else {
        file.contents = new Buffer(classedSVG(file, styleText, opt.removeStyleTags));
        finished();
    }

    if(opt.out.style) {
        writeCSS(file.path, (styleText ? new Buffer(styleText) : null), finished);
    } else {
        finished();
    }

    this.push(file);
}

function prepareOptions (options) {
    return _.assign(defaults, options);
}

var stream = {
    extract: function (options) {
        streaming = true;
        opt = prepareOptions(options);
        opt.out.style = options.styleDest;
        return through2.obj(extractStyles);
    }
};

var run = function (options, done) {
    opt = prepareOptions(options);

    vfs.src(opt.src)
        .pipe(through2.obj(extractStyles, done));
};

module.exports = {
    extract: run,
    stream: stream
};
