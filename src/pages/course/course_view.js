/**
 * --------------------------------------------------------------------------
 * course_view.js 
 * Entry module of view course page
 * --------------------------------------------------------------------------
 */
import init from '../../common/init';
import courseView from './course-view.vue';

// DOM Ready =============================================================
init(function() {
    // bootstrap the course view page
    new Vue({
        el: '#app',
        components: { 'app': courseView }
    });
});
