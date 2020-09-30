/**
 * --------------------------------------------------------------------------
 * course_view.js 
 * Entry module of view course page
 * --------------------------------------------------------------------------
 */
var i18nextplugin = require('./locales/i18nextplugin');
var course_service = require("./services/courses");
var courseView = require('./components/course-view.vue').default;

// DOM Ready =============================================================
$(document).ready(function() {
    init();

    var request = course_service.getCourse($('#course_app').data('course-id'));
    request.done(function(data, textStatus, jqXHR) {
        // bootstrap the course view page
        //new Vue({extends: classApp, el: '#class_app', props: {data: data}, propsData: { classrooms: _getClassrooms() }});
        new Vue({
            el: '#course_app',
            components: { 'course-view': courseView },
            data: { course: data }
        });
    });
});

// Functions =============================================================

function init() {
    console.log("course_view moudle init...");
    // load the i18next plugin to Vue
    Vue.use(i18nextplugin);
    //TODO, localization 
    moment.locale('zh-CN');
    bootbox.setLocale('zh_CN');
}
