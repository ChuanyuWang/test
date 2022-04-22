/**
 * --------------------------------------------------------------------------
 * portal.js
 * --------------------------------------------------------------------------
 */
var i18nextplugin = require('../../locales/i18nextplugin');
var mobilePortal = require('./portal.vue').default;
var schedule = require('./schedule.vue').default;
var appointment = require('./myappointments.vue').default;
var trial = require('./trial.vue').default;

// DOM Ready =============================================================
$(document).ready(function() {
    init();

    var routes = [
        { path: '/', component: schedule, meta: { title: '课程表' } },
        { path: '/trial', component: trial, meta: { title: '报名试听' } },
        { path: '/appointment', component: appointment, meta: { title: '我的预约' } }
    ];
    var router = new VueRouter({
        routes // short for `routes: routes`
    });

    // update the title of document
    router.beforeEach(function(to, from, next) {
        if (to.meta.title) {
            document.title = to.meta.title;
        }
        next();
    });

    var vuetify = new Vuetify({
        // https://material.io/resources/color/#!/?view.left=0&view.right=1&primary.color=2196F3&secondary.color=FFEE58
        theme: {
            themes: {
                light: {
                    primary: "#2196f3",
                    secondary: "#ffee58",
                    //accent: "#3F51B5"
                }
            },
        },
    })

    // load the i18next plugin to Vue
    Vue.use(i18nextplugin);

    // Invalid way to mount root vue component
    // Refer to https://github.com/yinxin630/blog/issues/1
    //new Vue({ el: '#app', extends: mobilePortal, router, vuetify });

    // Either way is ok in below to mount root component
    /*
    new Vue({
        render: h => h(mobilePortal),
        router,
        vuetify
    }).$mount('#app');
    */
    new Vue({
        el: '#app',
        components: { mobilePortal },
        template: '<mobile-portal/>',
        router,
        vuetify
    });
});

// Functions =============================================================

function init() {
    console.log("welcome~~~");
    moment.locale('zh-CN');
    //bootbox.setLocale('zh_CN');
}
