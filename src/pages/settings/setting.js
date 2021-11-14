/**
 * --------------------------------------------------------------------------
 * setting.js setting page main entry module
 * --------------------------------------------------------------------------
 */
var i18nextplugin = require('../../locales/i18nextplugin');
var teach_setting = require('./teach-setting.vue').default;
var users_setting = require('./users-setting.vue').default;
var general_setting = require('./general-setting.vue').default;
var classroom_setting = require('./classrooms.vue').default;

// DOM Ready =============================================================
$(document).ready(function() {
    init();
});

// Functions =============================================================

function init() {
    moment.locale('zh-CN');
    bootbox.setLocale('zh_CN');

    // load the i18next plugin to Vue
    Vue.use(i18nextplugin);

    // bootstrap the general setting tab
    new Vue({ el: '#general-setting', extends: general_setting });

    // bootstrap the teacher setting tab
    new Vue({ el: '#teacher-setting', extends: teach_setting });

    // bootstrap the users setting tab
    new Vue({ el: '#users-setting', extends: users_setting });

    // bootstrap the classroom setting tab
    new Vue({ el: '#classroom-setting', extends: classroom_setting });
}
