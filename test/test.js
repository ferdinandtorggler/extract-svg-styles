var extract = require('../index.js');

extract({
    src: './test/src/**/*.svg',
    out: {
        style: './test/dest/css',
        svg: './test/dest/svg'
    },
    classPrefix: 'icon-'
});