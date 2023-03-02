/**
 * --------------------------------------------------------------------------
 * cockpit.js
 * --------------------------------------------------------------------------
 */
var i18nextplugin = require('../../locales/i18nextplugin');
var cockpit = require('./cockpit.vue').default;
var home = require('./home.vue').default;
var store = require('./store.vue').default;
var query = require('./query.vue').default;

// copy from https://youmightnotneedjquery.com/?support=ie11
function ready(fn) {
    if (
        document.attachEvent
            ? document.readyState === 'complete'
            : document.readyState !== 'loading'
    ) {
        fn();
    } else {
        document.addEventListener('DOMContentLoaded', fn);
    }
}

// DOM Ready =============================================================
ready(function() {
    init();

    var routes = [
        { path: '/', component: home, meta: { title: '光影故事屋片源统计' } },
        { path: '/store', component: store, meta: { title: '光影故事屋门店统计' } },
        { path: '/query', component: query, meta: { title: '光影故事屋数据查询' } }
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

// Functions =============================================================

function init() {
    console.log("welcome~~~");
    moment.locale('zh-CN');

    // backend needs this flag to distinguish ajax request from request by req.xhr
    // but makes the request "unsafe" (as defined by CORS), and will trigger a preflight request, which may not be desirable.
    // See https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS#Simple_requests for more details
    axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
    // Add a response interceptor
    axios.interceptors.response.use(function(response) {
        // Any status code that lie within the range of 2xx cause this function to trigger
        // Do something with response data
        return response;
    }, function(error) {
        // Any status codes that falls outside the range of 2xx cause this function to trigger
        if (error.response) {
            // The request was made and the server responded with a status code
            // the returned json body should have a message property to indicate the error
            console.error(error.response.data.message);
        } else if (error.request) {
            // The request was made but no response was received
            console.error(error.request);
        } else {
            // Something happened in setting up the request that triggered an Error
            console.error("Error", error.message);
        }
        return Promise.reject(error);
    });
}
