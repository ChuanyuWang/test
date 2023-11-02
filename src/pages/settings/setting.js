/**
 * --------------------------------------------------------------------------
 * setting.js setting page main entry module
 * --------------------------------------------------------------------------
 */
var init = require('../../common/init');
var settingsPage = require('./settings.vue').default;

// DOM Ready =============================================================
init(function() {
    new Vue({
        el: '#app',
        components: { settingsPage },
        template: '<settings-page/>'
    });
});

// Functions =============================================================
