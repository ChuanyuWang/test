/**
 * --------------------------------------------------------------------------
 * course_view.js 
 * Entry module of view course page
 * --------------------------------------------------------------------------
 */
var init = require('../../common/init');
var courseView = require('./course-view.vue').default;

// DOM Ready =============================================================
init(function() {
    // bootstrap the course view page
    new Vue({
        el: '#app',
        components: { 'app': courseView }
    });
});
