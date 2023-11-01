/**
 * --------------------------------------------------------------------------
 * cockpit.js
 * --------------------------------------------------------------------------
 */
var init = require('../../common/init');
var cockpit = require('./cockpit.vue').default;
var home = require('./home.vue').default;
var store = require('./store.vue').default;
var query = require('./query.vue').default;
var notice = require('./notice.vue').default;
var statistics = require('./statistics.vue').default;
var pricing = require('./pricing.vue').default;
var deposit = require('./deposit.vue').default;

// Translation provided by Vuetify (javascript)
var zhHans = require('../../locales/vuetify/zh-Hans');

// DOM Ready =============================================================
init(function() {

    var routes = [
        { path: '/', component: home, meta: { title: '光影故事屋片源统计' } },
        { path: '/store', component: store, meta: { title: '光影故事屋门店统计' } },
        { path: '/query', component: query, meta: { title: '光影故事屋数据查询' } },
        { path: '/notice', component: notice, meta: { title: '公告管理' } },
        { path: '/statistics', component: statistics, meta: { title: '光影故事屋播放统计' } },
        { path: '/pricing', component: pricing, meta: { title: '片源定价' } },
        { path: '/deposit', component: deposit, meta: { title: '门店充值' } }
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

    vuetify_lang = "en";
    if (i18next.language > 0) {
        var lang = i18next.language.split("-")[0];
        // zhHans indicate Chinese simplified in vuetify; zhHant indicate Chinese Traditional
        vuetify_lang = lang === "zh" ? "zhHans" : lang;
    }

    var vuetify = new Vuetify({
        lang: {
            locales: { zhHans },
            current: vuetify_lang
        },
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
    //new Vue({ el: '#app', extends: cockpit, router, vuetify });

    // Either way is ok in below to mount root component
    /*
    new Vue({
        render: h => h(cockpit),
        router,
        vuetify
    }).$mount('#app');
    */
    new Vue({
        el: '#app',
        components: { app: cockpit },
        router,
        vuetify
    });
});
