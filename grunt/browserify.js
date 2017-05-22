module.exports = {
    options: {
        'watch': true,
        'banner': '/* Copyright 2016-2017 Chuanyu Wang */',
        'transform': [
            //'browserify-shim'
        ]
    },
    home: {
        src: 'src/js/main.js',
        dest: 'public/js/main.js'
    },
    class_view: {
        src: 'src/js/class_view.js',
        dest: 'public/js/class_view.js'
    },
    members: {
        src: 'src/js/member.js',
        dest: 'public/js/member.js'
    },
    members_view: {
        src: 'src/js/member_view.js',
        dest: 'public/js/member_view.js'
    },
    booking: {
        src: 'src/js/booking.js',
        dest: 'public/js/booking.js'
    },
    mybooking: {
        src: 'src/js/mybooking.js',
        dest: 'public/js/mybooking.js'
    },
    mybooks: {
        src: 'src/js/mybooks.js',
        dest: 'public/js/myreadbooks.js'
    },
    trial: {
        src: 'src/js/trial.js',
        dest: 'public/js/trial.js'
    },
    course: {
        src: 'src/js/course.js',
        dest: 'public/js/course.js'
    },
    course_view: {
        src: 'src/js/course_view.js',
        dest: 'public/js/course_view.js'
    },
    setting: {
        src: 'src/js/setting.js',
        dest: 'public/js/setting.js'
    }
};