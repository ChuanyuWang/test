module.exports = {
    options: {
        spawn: true,
        livereload: true
    },
    server: {
        files: [
            'bin/www',
            'app.js',
            'config.js',
            'helper.js',
            'util.js',
            'locales/*.json',
            'routes/**/*.js',
            'models/*.js'
        ],
        tasks: ['eslint:nodeFiles', 'develop'], //, 'delayed-livereload']
        options: {
            spawn: false
        }
    },
    public: {
        files: ['public/js/*.js', 'public/css/*.css', '!public/js/admin.js'],
        tasks: ['eslint:browserFiles']
    },
    style: {
        files: [
            'src/css/*.less'
        ],
        tasks: ['less'],
        options: {
            livereload: false
        }
    },
    views: {
        files: ['views/*.pug', 'views/**/*.pug']
    }
};