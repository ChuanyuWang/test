/**
 * --------------------------------------------------------------------------
 * member_detail.js single member view page main entry module
 * --------------------------------------------------------------------------
 */

var i18nextPlugin = require('../../locales/i18nextplugin');
var formatPlugin = require('../../common/format');
var memberDetail = require('./member-detail.vue').default;

// DOM Ready =============================================================
$(document).ready(function() {
    init();

    new Vue({
        el: '#app',
        components: { app: memberDetail }
    });
});

// Functions =============================================================

function init() {
    console.log("init view member ~~~");
    moment.locale('zh-CN');
    //bootbox.setLocale('zh_CN');
    Vue.use(i18nextPlugin);
    Vue.use(formatPlugin);
}
