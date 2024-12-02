/**
 * --------------------------------------------------------------------------
 * member_detail.js single member view page main entry module
 * --------------------------------------------------------------------------
 */
import init from '../../common/init';
import memberDetail from './member-detail.vue';

// DOM Ready =============================================================
init(function() {
    new Vue({
        el: '#app',
        components: { 'app': memberDetail }
    });
});

// Functions =============================================================
