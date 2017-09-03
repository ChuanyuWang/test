module.exports = {
    options: {
        spawn: true,
        livereload: true
    },
    server: {
        files: [
            'bin/www',
            'app.js',
            'helper.js',
            'util.js',
            'locales/*.json',
            'routes/**/*.js',
            'models/*.js'
        ],
        tasks: ['develop'], //, 'delayed-livereload']
        options: {
            spawn: false
        }
    },
    public: {
        files: ['public/js/*.js', 'public/css/*.css']
    },
    less: {
        files: [
            'public/css/*.less'
        ],
        tasks: ['less'],
        options: {
            livereload: false
        }
    },
    views: {
        files: ['views/*.jade', 'views/**/*.jade']
    }
};