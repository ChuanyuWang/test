/**
 * --------------------------------------------------------------------------
 * mybooks.js
 * --------------------------------------------------------------------------
 */
var i18nextplugin = require('./locales/i18nextplugin');
var books_app = require('./components/my-read-books.vue').default;
// open id of Weichat user
//var _openid = undefined;

// DOM Ready =============================================================
$(document).ready(function() {
    init();
    // load the i18next plugin to Vue
    Vue.use(i18nextplugin);
    new Vue({ el: '#app', extends: books_app });
});

// Functions =============================================================

function init() {
    console.log("welcome~~~");
    moment.locale('zh-CN');
    //bootbox.setLocale('zh_CN');
}
