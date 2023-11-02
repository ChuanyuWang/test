/**
 * --------------------------------------------------------------------------
 * contract_detail.js contract detail page main entry module
 * --------------------------------------------------------------------------
 */
var init = require('../../common/init');
var contractDetail = require('./contract-detail.vue').default;

// DOM Ready =============================================================
init(function() {
    new Vue({
        el: '#app',
        components: { 'app': contractDetail }
    });
});

// Functions =============================================================
