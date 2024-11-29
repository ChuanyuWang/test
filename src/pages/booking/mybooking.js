/**
 * --------------------------------------------------------------------------
 * mybooking.js
 * --------------------------------------------------------------------------
 */
import init from '../../common/init';
import myBooking from './my-booking.vue';

// open id of Weichat user
//var _openid = undefined;

// DOM Ready =============================================================
init(function() {
    new Vue({
        el: '#app',
        render: function(h) { return h(myBooking) }
    });
});

// Functions =============================================================
