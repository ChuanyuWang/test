/**
 * --------------------------------------------------------------------------
 * statistics.js page main entry module
 * --------------------------------------------------------------------------
 */
var init = require('../../common/init');
var statisticsPage = require('./statistics-page.vue').default;

// DOM Ready =============================================================
init(function() {
    new Vue({
        el: '#statistics-app',
        components: { 'statistics-page': statisticsPage }
    });
});

// Functions =============================================================
