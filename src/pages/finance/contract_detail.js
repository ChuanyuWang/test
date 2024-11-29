/**
 * --------------------------------------------------------------------------
 * contract_detail.js contract detail page main entry module
 * --------------------------------------------------------------------------
 */
import init from '../../common/init';
import contractDetail from './contract-detail.vue';

// DOM Ready =============================================================
init(function() {
    new Vue({
        el: '#app',
        components: { 'app': contractDetail }
    });
});

// Functions =============================================================
