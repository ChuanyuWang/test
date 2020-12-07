/**
 * --------------------------------------------------------------------------
 * mybooks.js
 * --------------------------------------------------------------------------
 */
var books_app = require('./components/my-read-books.vue').default;
// open id of Weichat user
//var _openid = undefined;

// DOM Ready =============================================================
$(document).ready(function() {
    init();
    // register the root component globally
    Vue.component('my-read-books', books_app);
    new Vue({ el: '#app' });
});

// Functions =============================================================

function init() {
    console.log("welcome~~~");
    moment.locale('zh-CN');
    //bootbox.setLocale('zh_CN');
}
