/**
 * --------------------------------------------------------------------------
 * contract_detail.js contract detail page main entry module
 * --------------------------------------------------------------------------
 */
var i18nextplugin = require('../../locales/i18nextplugin');
var contractDetail = require('./contract-detail.vue').default;

// DOM Ready =============================================================
$(document).ready(function() {
    init();

    new Vue({
        el: '#app',
        components: { app: contractDetail }
    });
});

// Functions =============================================================

function init() {
    moment.locale('zh-CN');
    //bootbox.setLocale('zh_CN');

    // load the i18next plugin to Vue
    Vue.use(i18nextplugin);
}
