/**
 * --------------------------------------------------------------------------
 * main.js Home page main entry module
 * --------------------------------------------------------------------------
 */
var init = require('../../common/init');
var calendar = require('./class-calendar.vue').default;

// DOM Ready =============================================================
init(function() {

    // bootstrap the class calendar page
    new Vue({
        el: '#app',
        components: { calendar },
        template: '<calendar/>'
    });
});

// Functions =============================================================
