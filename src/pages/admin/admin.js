/**
 * --------------------------------------------------------------------------
 * admin.js
 * --------------------------------------------------------------------------
 */

var i18nextplugin = require('../../locales/i18nextplugin');
var adminConsole = require('./admin-console.vue').default;

// DOM Ready =============================================================
$(function() {
    init();

    // bootstrap the admin console
    new Vue({
        el: '#admin-app',
        //data: {cls:data},
        components: { 'admin-console': adminConsole }
    });

    $('.nav-tabs a').click(function(e) {
        //e.preventDefault();
        //$(this).tab('show');
    });
});

// Functions =============================================================

function init() {
    console.log("welcome~~~ chuanyu");
    //moment.locale('zh-CN');
    bootbox.setLocale('zh_CN');
    // load the i18next plugin to Vue
    Vue.use(i18nextplugin);
}
