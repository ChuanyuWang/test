/**
 * --------------------------------------------------------------------------
 * i18nextplugin.js is Vue plugin provide global function t (i18next) to Vue
 * --------------------------------------------------------------------------
 */

var i18nextBrowserLanguageDetector = require('./i18nextBrowserLanguageDetector');

var resources = {
    'en': { translation: require('./en') },
    'zh': { translation: require('./zh_CN') }
};

module.exports = {
    install: function(Vue, options) {
        if (i18next) {
            // more options refer to https://www.i18next.com/configuration-options.html
            i18next.use(i18nextBrowserLanguageDetector).init({
                //lng: "zh", // remove this line to enable auto language detection, and also clean key "i18nextLng" from Local Storage
                fallbackLng: "zh",
                resources: resources,
                detection: { lookupQuerystring: 'lang' } // look for "?lang=LANGUAGE" in URL to change language
            }, function(err, t) {
                if (err) return console.error('init i18next with error' + err);
                Vue.i18next = i18next; // append the global function 'i18next' to Vue
                Vue.prototype.$t = t; // add method '$t' to Vue instance
            });
        } else {
            console.error('i18next is not found');
        }
    }
};
