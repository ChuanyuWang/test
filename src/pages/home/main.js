/**
 * --------------------------------------------------------------------------
 * main.js Home page main entry module
 * --------------------------------------------------------------------------
 */
var i18nextplugin = require('../../locales/i18nextplugin');
var calendar = require('./class-calendar.vue').default;

// DOM Ready =============================================================
$(document).ready(function() {
    init();

    // bootstrap the class calendar page
    new Vue({
        el: '#app',
        components: { calendar },
        template: '<calendar/>'
    });
});

// Functions =============================================================

function init() {
    console.log("welcome~~~");
    // load the i18next plugin to Vue
    Vue.use(i18nextplugin);

    moment.locale('zh-CN');
    bootbox.setLocale('zh_CN');
}
