/**
 * --------------------------------------------------------------------------
 * member_view.js single member view page main entry module
 * --------------------------------------------------------------------------
 */

var i18nextplugin = require('../../locales/i18nextplugin');
var memberView = require('./member-view.vue').default;

// DOM Ready =============================================================
$(document).ready(function() {
    init();

    new Vue({
        el: '#app',
        components: { memberView },
        template: '<member-view/>'
    });
});

// Functions =============================================================

function init() {
    console.log("init view member ~~~");
    moment.locale('zh-CN');
    bootbox.setLocale('zh_CN');
    Vue.use(i18nextplugin);
}
