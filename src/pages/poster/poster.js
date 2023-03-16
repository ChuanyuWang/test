/**
 * --------------------------------------------------------------------------
 * poster.js
 * --------------------------------------------------------------------------
 */
var i18nextplugin = require('../../locales/i18nextplugin');
var poster = require('./poster.vue').default;

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
        components: { poster },
        template: '<poster/>',
        vuetify
    });
});

// Functions =============================================================

function init() {
    console.log("welcome~~~");
    //moment.locale('zh-CN');
    //bootbox.setLocale('zh_CN');
}
