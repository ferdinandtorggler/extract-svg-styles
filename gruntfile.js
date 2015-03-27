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

    grunt.loadTasks('./tasks');

    grunt.registerTask('default', ['extract-svg-styles']);        
}