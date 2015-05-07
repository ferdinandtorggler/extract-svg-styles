var gulp = require('gulp');
var extractor = require('./index.js').stream;

gulp.task('default', function () {
    gulp.src('./test/src/**/*.svg')
    .pipe(extractor.extract({
        styleDest: './test/dest/css',
        classPrefix: 'icon-',
        idHandling: 'class'
    }))
    .pipe(gulp.dest('./test/dest/svg'));
});