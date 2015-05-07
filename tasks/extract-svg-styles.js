'use strict';

var extractor = require('../index');
var path = require('path');

module.exports = function(grunt) {

  grunt.registerMultiTask('extract-svg-styles', 'Grunt task for extacting <style> tags from SVGs.', function () {

    var done = this.async();

    var options = this.options();
    options.src = this.data.src;

    options.out = {
      svg: this.data.dest,
      style: options.styleDest
    };

    extractor.extract(options, done);

  });

};