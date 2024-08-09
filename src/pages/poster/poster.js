/**
 * --------------------------------------------------------------------------
 * poster.js
 * --------------------------------------------------------------------------
 */
var init = require('../../common/init');
var poster = require('./poster.vue').default;

// DOM Ready =============================================================
init(function() {

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
        render: h => h(poster),
        //router,
        vuetify
    });

    /*
    new Vue({
        el: '#app',
        components: { app: poster },
        vuetify
    });
    */
});
