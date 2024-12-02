/**
 * --------------------------------------------------------------------------
 * member.js members page main entry module
 * --------------------------------------------------------------------------
 */

import init from '../../common/init';
import membersPage from './member-overview.vue';

// DOM Ready =============================================================
init(function() {
    new Vue({
        el: '#app',
        render: function(h) { return h(membersPage) }
    });
});

// Functions =============================================================

