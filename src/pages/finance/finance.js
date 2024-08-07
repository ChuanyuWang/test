/**
 * --------------------------------------------------------------------------
 * finace.js page main entry module
 * --------------------------------------------------------------------------
 */
var init = require('../../common/init');
var financePage = require('./finance.vue').default;

// DOM Ready =============================================================
init(function() {
    new Vue({
        el: '#app',
        render: function(h) { return h(financePage) }
    });
});

// Functions =============================================================
