/**
 * --------------------------------------------------------------------------
 * class_view.js 
 * Entry module of view class page
 * --------------------------------------------------------------------------
 */

var i18nextplugin = require('../../locales/i18nextplugin');
var classView = require('./class-view.vue').default;

// DOM Ready =============================================================
$(document).ready(function() {
    init();

    new Vue({
        el: '#app',
        components: { 'app': classView }
    });
});

// Functions =============================================================

function init() {
    console.log("class_view moudle init...");
    // load the i18next plugin to Vue
    Vue.use(i18nextplugin);
    //TODO, localization 
    moment.locale('zh-CN');
    //bootbox.setLocale('zh_CN');
}
