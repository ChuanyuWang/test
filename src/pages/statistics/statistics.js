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
        el: '#app',
        render: function(h) { return h(statisticsPage) }
    });
});

// Functions =============================================================
