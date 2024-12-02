/**
 * --------------------------------------------------------------------------
 * portal.js
 * --------------------------------------------------------------------------
 */
import init from '../../common/init';
import mobilePortal from './portal.vue';
import schedule from './schedule.vue';
import appointment from './myappointments.vue';
import trial from './trial.vue';

// DOM Ready =============================================================
init(function() {

    var routes = [
        { path: '/', component: schedule, meta: { title: '预约课程' } },
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

    // Invalid way to mount root vue component
    // Refer to https://github.com/yinxin630/blog/issues/1
    //new Vue({ el: '#app', extends: mobilePortal, router, vuetify });

    // Either way is ok in below to mount root component

    new Vue({
        el: '#app',
        render: h => h(mobilePortal),
        router,
        vuetify
    });

    /*
    new Vue({
        el: '#app',
        components: { app: mobilePortal },
        router,
        vuetify
    });
    */
});
