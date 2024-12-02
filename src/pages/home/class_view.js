/**
 * --------------------------------------------------------------------------
 * class_view.js 
 * Entry module of view class page
 * --------------------------------------------------------------------------
 */
import init from '../../common/init';
import classView from './class-detail.vue';

// DOM Ready =============================================================
init(function() {
    new Vue({
        el: '#app',
        components: { 'app': classView }
    });
});

// Functions =============================================================
