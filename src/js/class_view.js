/**
 * --------------------------------------------------------------------------
 * class_view.js 
 * Entry module of view class page
 * --------------------------------------------------------------------------
 */

var i18nextplugin = require('./locales/i18nextplugin');
var class_service = require('./services/classes');
var classView = require('./components/class-view.vue');

// DOM Ready =============================================================
$(document).ready(function() {
    init();
    // load class object
    var request = class_service.getClass($('#class_app').data('class-id'));
    request.done(function(data, textStatus, jqXHR) {

        // bootstrap the class view page
        //new Vue({extends: classApp, el: '#class_app', props: {data: data}, propsData: { classrooms: _getClassrooms() }});
        new Vue({
            el: '#class_app',
            //template: '<class-view :data="cls"/>',
            data: {cls:data},
            components: { 'class-view' : classView }
        });
    });
});

// Functions =============================================================

function init() {
    console.log("class_view moudle init...");
    // load the i18next plugin to Vue
    Vue.use(i18nextplugin);
    //TODO, localization 
    moment.locale('zh-CN');
    bootbox.setLocale('zh_CN');
}