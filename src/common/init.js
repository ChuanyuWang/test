/**
 * --------------------------------------------------------------------------
 * init.js
 * --------------------------------------------------------------------------
 */
var i18nextPlugin = require('../locales/i18nextplugin');
var formatPlugin = require('./format');

module.exports = {
    /**
     * call funciton fn when document tree is loaded
     * compy from https://youmightnotneedjquery.com/?support=ie11#ready
     */
    ready(fn) {
        if (
            document.attachEvent
                ? document.readyState === 'complete'
                : document.readyState !== 'loading'
        ) {
            fn();
        } else {
            document.addEventListener('DOMContentLoaded', fn);
        }
    },
    /**
     * initialize modules
     */
    initialize(msg, options) {
        console.log(msg);

        // MUST listen to the "languageChanged" event before loading i18nextplugin
        i18next.on('languageChanged', lng => {
            console.log(`language changed to ${lng}`);
            moment.locale(lng);
        });

        // load the i18next plugin to Vue, and detect the language of browser
        Vue.use(i18nextPlugin);
        Vue.use(formatPlugin);
    }
};
