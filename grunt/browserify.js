module.exports = {
    options: {
        'watch': true,
        'banner': '/* Copyright 2016-2017 Chuanyu Wang */',
        'transform': [
            'vueify',
            'browserify-shim' // shim should be the last transformer
        ],
        plugin: [
            //['browserify-hmr',{ noServe : false }]
        ]
    },
    app: {
        files: {
            'public/js/main.js': 'src/js/main.js',
            'public/js/class_view.js': 'src/js/class_view.js',
            'public/js/member.js': 'src/js/member.js',
            'public/js/member_view.js': 'src/js/member_view.js',
            'public/js/booking.js': 'src/js/booking.js',
            'public/js/mybooking.js': 'src/js/mybooking.js',
            'public/js/myreadbooks.js': 'src/js/mybooks.js',
            'public/js/trial.js': 'src/js/trial.js',
            'public/js/course.js': 'src/js/course.js',
            'public/js/course_view.js': 'src/js/course_view.js',
            'public/js/setting.js': 'src/js/setting.js',
            'public/js/statistics.js': 'src/js/statistics.js',
            'public/js/opportunity.js': 'src/js/opportunity.js',
            'public/js/admin.js': 'src/js/admin.js'
        }
    }
};