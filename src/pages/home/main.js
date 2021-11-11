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

    /* global _getClassrooms */
    // bootstrap the class calendar page
    var app = new Vue({ el: '#app', extends: calendar, propsData: { classrooms: _getClassrooms() } });
    app.updateSchedule();
});

// Functions =============================================================

function init() {
    console.log("welcome~~~");
    // load the i18next plugin to Vue
    Vue.use(i18nextplugin);

    moment.locale('zh-CN');
    bootbox.setLocale('zh_CN');
}
