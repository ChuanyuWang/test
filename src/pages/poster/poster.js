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
        components: { app: poster },
        vuetify
    });
});

// Functions =============================================================

function init() {
    console.log("welcome~~~");
    // MUST listen to the "languageChanged" event before loading i18nextplugin
    i18next.on('languageChanged', lng => {
        console.log(`language changed to ${lng}`);
        moment.locale(lng);
    });
    // load the i18next plugin to Vue, and detect the language of browser
    Vue.use(i18nextplugin);
}
