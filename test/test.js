var extractColors = require('../index.js');

extractColors({
    src: './test/src/**/*.svg',
    out: {
        style: './test/dest/css',
        svg: './test/dest/svg'
    },
    classPrefix: 'icon-'
});