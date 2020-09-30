/**
 * --------------------------------------------------------------------------
 * statistics.js page main entry module
 * --------------------------------------------------------------------------
 */
var i18nextplugin = require('./locales/i18nextplugin');
var statisticsPage = require('./components/statistics-page.vue').default;

// DOM Ready =============================================================
$(document).ready(function() {
    init();

    // bootstrap the statistics page
    new Vue({
        el: '#statistics-app',
        //data: {cls:data},
        components: { 'statistics-page': statisticsPage }
    });
});

// Functions =============================================================

function init() {
    console.log("statistics page...");
    // load the i18next plugin to Vue
    Vue.use(i18nextplugin);

    moment.locale('zh-CN');
    bootbox.setLocale('zh_CN');
}
