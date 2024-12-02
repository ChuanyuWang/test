/**
 * --------------------------------------------------------------------------
 * admin.js
 * --------------------------------------------------------------------------
 */

import init from '../../common/init';
import adminConsole from './admin-console.vue';

// DOM Ready =============================================================
init(function() {
    // bootstrap the admin console
    new Vue({
        el: '#app',
        //data: {cls:data},
        render: function(h) { return h(adminConsole) }
    });
});

// Functions =============================================================
