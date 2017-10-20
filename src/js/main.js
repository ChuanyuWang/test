/**
 * --------------------------------------------------------------------------
 * main.js Home page main entry module
 * --------------------------------------------------------------------------
 */
var i18nextplugin = require('./locales/i18nextplugin');
var calendar = require('./components/class-calendar.vue');

// DOM Ready =============================================================
$(document).ready(function() {
    init();

    /* global _getClassrooms */
    // bootstrap the class calendar page
    var app = new Vue({ extends: calendar, el: '#app', propsData: { classrooms: _getClassrooms() } });
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