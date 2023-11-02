/**
 * --------------------------------------------------------------------------
 * contract_create.js creating contract page main entry module
 * --------------------------------------------------------------------------
 */
var init = require('../../common/init');
var contractCreate = require('./contract-create.vue').default;

// DOM Ready =============================================================
init(function() {
    new Vue({
        el: '#app',
        components: { 'app': contractCreate }
    });
});

// Functions =============================================================
