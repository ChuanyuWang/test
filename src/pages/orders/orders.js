/**
 * --------------------------------------------------------------------------
 * orders.js 
 * --------------------------------------------------------------------------
 */

var i18nextplugin = require('../../locales/i18nextplugin');
var ordersPage = require('./orders.vue').default;

// DOM Ready =============================================================
$(document).ready(function() {
    init();

    new Vue({
        el: '#app',
        components: { ordersPage },
        template: '<orders-page/>'
    });
});

// Functions =============================================================

function init() {
    console.log("welcome~~~");
    //TODO, localization 
    moment.locale('zh-CN');
    Vue.use(i18nextplugin);
}

