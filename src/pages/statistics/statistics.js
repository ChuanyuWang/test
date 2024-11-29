/**
 * --------------------------------------------------------------------------
 * statistics.js page main entry module
 * --------------------------------------------------------------------------
 */
import init from '../../common/init';
import statisticsPage from './statistics-page.vue';

// DOM Ready =============================================================
init(function() {
    new Vue({
        el: '#app',
        render: function(h) { return h(statisticsPage) }
    });
});

// Functions =============================================================
