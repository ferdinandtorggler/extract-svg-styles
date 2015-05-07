var extractSvg = require('../index.js');

extractSvg.extract({
    src: './test/src/**/*.svg',
    out: {
        style: './test/dest/css',
        svg: './test/dest/svg'
    },
    classPrefix: 'icon-'
});