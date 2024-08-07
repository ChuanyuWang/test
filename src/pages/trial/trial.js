/**
 * --------------------------------------------------------------------------
 * trial.js
 * --------------------------------------------------------------------------
 */

var i18nextplugin = require('../../locales/i18nextplugin');
var trial = require('./trial.vue').default;

// DOM Ready =============================================================
$(document).ready(function() {
    init();

    // load the i18next plugin to Vue
    Vue.use(i18nextplugin);
    new Vue({
        el: '#app',
        render: function(h) { return h(trial) }
    });
});

// Functions =============================================================

function init() {
    console.log("welcome~~~");

    moment.locale('zh-CN');
    //bootbox.setLocale('zh_CN');
}
