/**
 * --------------------------------------------------------------------------
 * contract_create.js creating contract page main entry module
 * --------------------------------------------------------------------------
 */
var i18nextplugin = require('../../locales/i18nextplugin');
var contractCreate = require('./contract-create.vue').default;

// DOM Ready =============================================================
$(document).ready(function() {
    init();

    new Vue({
        el: '#app',
        components: { app: contractCreate }
    });
});

// Functions =============================================================

function init() {
    moment.locale('zh-CN');
    //bootbox.setLocale('zh_CN');

    // load the i18next plugin to Vue
    Vue.use(i18nextplugin);
}
