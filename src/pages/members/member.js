/**
 * --------------------------------------------------------------------------
 * member.js members page main entry module
 * --------------------------------------------------------------------------
 */

var i18nextplugin = require('../../locales/i18nextplugin');
var membersPage = require('./member-overview.vue').default;

// DOM Ready =============================================================
$(document).ready(function() {
    init();

    new Vue({
        el: '#app',
        components: { membersPage },
        template: '<members-page/>'
    });
});

// Functions =============================================================

function init() {
    moment.locale('zh-CN');
    //bootbox.setLocale('zh_CN');
    Vue.use(i18nextplugin);
}
