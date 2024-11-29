/**
 * --------------------------------------------------------------------------
 * finace.js page main entry module
 * --------------------------------------------------------------------------
 */
import init from '../../common/init';
import financePage from './finance.vue';

// DOM Ready =============================================================
init(function() {
    new Vue({
        el: '#app',
        render: function(h) { return h(financePage) }
    });
});

// Functions =============================================================
