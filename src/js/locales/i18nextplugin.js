/**
 * --------------------------------------------------------------------------
 * i18nextplugin.js is Vue plugin provide global function t (i18next) to Vue
 * --------------------------------------------------------------------------
 */

var i18nextBrowserLanguageDetector = require('./i18nextBrowserLanguageDetector.min');

var resources = {
    'en': { translation: require('./en') },
    'zh': { translation: require('./zh_CN') }
};

var i18nextPlugin = {
    install: function(Vue, options) {
        if (i18next) {
            i18next.use(i18nextBrowserLanguageDetector).init({
                fallbackLng: "zh",
                resources: resources,
                detection: { lookupQuerystring: 'lang' }
            }, function(err, t) {
                if (err) return console.error('init i18next with error' + err);
                Vue.i18next = i18next; // append the global function 'i18next' to Vue
                Vue.prototype.$t = t; // an instance method 't'
            });
        } else {
            console.error('i18next is not found');
        }
    }
};

module.exports = i18nextPlugin;
