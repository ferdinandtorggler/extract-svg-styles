# extract-svg-styles

[![npm version](https://badge.fury.io/js/extract-svg-styles.svg)](http://badge.fury.io/js/extract-svg-styles)

> Extract &lt;style&gt; definitions from an SVG file to a CSS file.

For each SVG file a CSS file will be generated, containing the CSS-rules
defined inside the SVG file.

## Install

Install with [npm](https://npmjs.org/package/extract-svg-styles)

```
npm install extract-svg-styles --save
```

## Usage

```javascript
var extractSvg = require(‘extract-svg-styles’);
extractSvg.extract(options);
```

### Options
- **src**: Glob string with path to source SVGs
- **out**: Output directories
  - **svg**: Output directory for SVGs (optional)
  - **style**: Output directory for Stylesheets
- **extension**: File name extension for Stylesheets (default is ‘css’, useful for ’scss’)
- **classPrefix**: Prefix for class names to target SVGs
- **idHandling**: `none` Avoid ID collisions when using multiple SVGs in a page. `class` will transform the IDs to a class, `remove` will get rid of the IDs, `prefix` will keep the IDs but prefix them with the file name.

### Example

Usage with an exapmle configuration object:
```javascript
extractSvg.extract({
    src: './test/src/**/*.svg',
    out: {
        style: './test/dest/css',
        svg: './test/dest/svg'
    },
    classPrefix: 'icon-'
});
```

## Usage with [Grunt](http://gruntjs.com)

This module can also be used in automated tasks using Grunt.

```javascript
module.exports = function(grunt) {

    grunt.initConfig({
        'extract-svg-styles': {
            options: {
                styleDest: './test/dest/css',
                classPrefix: 'icon-',
            },
            all: {
                src: './test/src/**/*.svg',
                dest: './test/dest/svg'
            }
        }
    });

    grunt.loadNpmTasks('extract-svg-styles');

    grunt.registerTask('default', ['extract-svg-styles']);
}
```

Options to use `extract-svg-styles` with [Grunt](http://gruntjs.com) are the same as for the `extract` function with the exception of `src` and `out`.

`out.style` is `styleDest` in Grunt, `out.svg` is the regular Grunt `dest` property.
If `dest` is omitted, only the stylesheets will be generated.

## Usage with [Gulp](http://gulpjs.com/)

This module can also be used in automated tasks using Gulp. Make sure to require the `stream` object of the plugin as in the example below:

```javascript
var gulp = require('gulp');
var extractSvg = require('./index.js').stream;

gulp.task('extract-svg-styles', function () {
    gulp.src('./test/src/**/*.svg')
    .pipe(extractSvg.extract({
        styleDest: './test/dest/css',
        classPrefix: 'icon-',
        idHandling: 'class'
    }))
    .pipe(gulp.dest('./test/dest/svg'));
});

gulp.task('default', ['extract-svg-styles']);
```

Options to use with [Gulp](http://gulpjs.com/) are the same as for the extract method with the exception of `src` and `out`. 
Use `gulp.src` and `gulp.dest` instead, `styleDest` is used to specify the output directory for the stylesheets. 