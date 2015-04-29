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

```
var extract = require(‘extract-svg-styles’);
extract(options);
```

### Options
- **src**: Glob string with path to source SVGs
- **out**: Output directories
  - **svg**: Output directory for SVGs (optional)
  - **style**: Output directory for Stylesheets
- **extension**: File name extension for Stylesheets (default is ‘css’, useful for ’scss’)
- **classPrefix**: Prefix for class names to target SVGs

### Example

Usage with an exapmle configuration object:
```
extract({
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

```
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