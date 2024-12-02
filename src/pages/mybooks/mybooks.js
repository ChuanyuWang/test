/**
 * --------------------------------------------------------------------------
 * mybooks.js
 * --------------------------------------------------------------------------
 */
import init from '../../common/init';
import readBooks from './my-read-books.vue';
// open id of Weichat user
//var _openid = undefined;

// DOM Ready =============================================================
init(function() {
    new Vue({
        el: '#app',
        render: function(h) { return h(readBooks) }
    });
});

// Functions =============================================================
