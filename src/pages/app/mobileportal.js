/**
 * --------------------------------------------------------------------------
 * portal.js
 * --------------------------------------------------------------------------
 */
var i18nextplugin = require('../../locales/i18nextplugin');
var mobilePortal = require('./portal.vue').default;
var schedule = require('./schedule.vue').default;
var appointment = require('./myappointments.vue').default;
var mybooks = require('./mybooks.vue').default;

// DOM Ready =============================================================
$(document).ready(function() {
    init();

    var routes = [
        { path: '/', component: schedule },
        { path: '/mybooks', component: mybooks },
        { path: '/appointment', component: appointment }
    ];
    var router = new VueRouter({
        routes // short for `routes: routes`
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
