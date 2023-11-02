/**
 * --------------------------------------------------------------------------
 * member_detail.js single member view page main entry module
 * --------------------------------------------------------------------------
 */
var init = require('../../common/init');
var memberDetail = require('./member-detail.vue').default;

// DOM Ready =============================================================
init(function() {
    new Vue({
        el: '#app',
        components: { 'app': memberDetail }
    });
});

// Functions =============================================================
