/**
 * --------------------------------------------------------------------------
 * member.js members page main entry module
 * --------------------------------------------------------------------------
 */

var init = require('../../common/init');
var membersPage = require('./member-overview.vue').default;

// DOM Ready =============================================================
init(function() {
    new Vue({
        el: '#app',
        components: { membersPage },
        template: '<members-page/>'
    });
});

// Functions =============================================================

