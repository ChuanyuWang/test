/**
 * --------------------------------------------------------------------------
 * class_view.js 
 * Entry module of view class page
 * --------------------------------------------------------------------------
 */
var init = require('../../common/init');
var classView = require('./class-detail.vue').default;

// DOM Ready =============================================================
init(function() {
    new Vue({
        el: '#app',
        components: { 'app': classView }
    });
});

// Functions =============================================================
