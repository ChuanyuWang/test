/**
 * --------------------------------------------------------------------------
 * setting.js setting page main entry module
 * --------------------------------------------------------------------------
 */
import init from '../../common/init';
import settingsPage from './settings.vue';

// DOM Ready =============================================================
init(function() {
    new Vue({
        el: '#app',
        render: function(h) { return h(settingsPage) }
    });
});

// Functions =============================================================
