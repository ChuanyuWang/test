/**
 * --------------------------------------------------------------------------
 * contract_create.js creating contract page main entry module
 * --------------------------------------------------------------------------
 */
import init from '../../common/init';
import contractCreate from './contract-create.vue';

// DOM Ready =============================================================
init(function() {
    new Vue({
        el: '#app',
        components: { 'app': contractCreate }
    });
});

// Functions =============================================================
