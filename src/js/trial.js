/**
 * --------------------------------------------------------------------------
 * trial.js
 * --------------------------------------------------------------------------
 */

var i18nextplugin = require('./locales/i18nextplugin');
var trial_app = require('./components/trial.vue');

// DOM Ready =============================================================
$(document).ready(function () {
    init();
});

// Functions =============================================================

function init() {
    console.log("welcome~~~");
    // load the i18next plugin to Vue
    Vue.use(i18nextplugin);

    //moment.locale('zh-CN');
    //bootbox.setLocale('zh_CN');

    new Vue({ extends: trial_app, el: '#app' });
}