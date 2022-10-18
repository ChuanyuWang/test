/**
 * --------------------------------------------------------------------------
 * course_view.js 
 * Entry module of view course page
 * --------------------------------------------------------------------------
 */
var i18nextplugin = require('../../locales/i18nextplugin');
var courseView = require('./course-view.vue').default;

// DOM Ready =============================================================
$(document).ready(function() {
    init();

    // bootstrap the course view page
    new Vue({
        el: '#app',
        components: { 'app': courseView }
    });
});

// Functions =============================================================

function init() {
    console.log("course_view moudle init...");
    // load the i18next plugin to Vue
    Vue.use(i18nextplugin);
    //TODO, localization 
    moment.locale('zh-CN');
    //bootbox.setLocale('zh_CN');
}
