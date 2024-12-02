/**
 * --------------------------------------------------------------------------
 * main.js Home page main entry module
 * --------------------------------------------------------------------------
 */
import init from '../../common/init';
import calendar from './class-calendar.vue';

// DOM Ready =============================================================
init(function() {

    // bootstrap the class calendar page
    new Vue({
        el: '#app',
        render: function(h) { return h(calendar) }
    });
});

// Functions =============================================================
