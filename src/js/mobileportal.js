/**
 * --------------------------------------------------------------------------
 * portal.js
 * --------------------------------------------------------------------------
 */
var i18nextplugin = require('./locales/i18nextplugin');
var portal_app = require('./components/portal.vue').default;

// DOM Ready =============================================================
$(document).ready(function() {
    init();

    // load the i18next plugin to Vue
    Vue.use(i18nextplugin);
    new Vue({ el: '#app', extends: portal_app, vuetify: new Vuetify() });
});

// Functions =============================================================

function init() {
    console.log("welcome~~~");
    //moment.locale('zh-CN');
    //bootbox.setLocale('zh_CN');
}
