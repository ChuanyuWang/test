/**
 * --------------------------------------------------------------------------
 * mybooking.js
 * --------------------------------------------------------------------------
 */
var i18nextplugin = require('../../locales/i18nextplugin');
var myBooking = require('./my-booking.vue').default;

// open id of Weichat user
//var _openid = undefined;

// DOM Ready =============================================================
$(document).ready(function() {
    init();

    // load the i18next plugin to Vue
    Vue.use(i18nextplugin);
    new Vue({
        el: '#app',
        render: function(h) { return h(myBooking) }
    });
});

// Functions =============================================================

function init() {
    console.log("welcome~~~");
    moment.locale('zh-CN');
    //bootbox.setLocale('zh_CN');
}
