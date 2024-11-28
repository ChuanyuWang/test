/**
 * --------------------------------------------------------------------------
 * init.js
 * --------------------------------------------------------------------------
 */
import i18nextPlugin from '../locales/i18nextplugin';
import formatPlugin from './format';

/**
 * initialize utility function
 * @param {function} fn callback function when DOM ready
 */
function init(fn) {
    // initialize modules
    function initialize() {
        // MUST listen to the "languageChanged" event before loading i18nextplugin
        i18next.on('languageChanged', lng => {
            console.log(`language changed to ${lng}`);
            var lang = lng.split("-")[0]; // parse the two digit language code, e.g. "en", "fr", "zh"

            if (typeof moment === 'function') {
                // zh_CN indicate Chinese simplified in moment.js; zh_TW indicate Chinese Traditional
                moment.locale(lang === "zh" ? "zh_CN" : lang);
            }

            if (typeof bootbox === 'object') {
                // zh_CN indicate Chinese simplified in bootbox; zh_TW indicate Chinese Traditional
                bootbox.setLocale(lang === "zh" ? "zh_CN" : lang);
            }
        });

        // load the i18next plugin to Vue, and detect the language of browser
        Vue.use(i18nextPlugin);
        Vue.use(formatPlugin);

        if (typeof axios === 'function') {
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
                    console.error(error.response.data && error.response.data.message);
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

        // execute callback after all initialization
        if (typeof fn === 'function') fn();
    }

    /**
     * replace jQuery ready method
     * compy from https://youmightnotneedjquery.com/?support=ie11#ready
     */
    if (
        document.attachEvent
            ? document.readyState === 'complete'
            : document.readyState !== 'loading'
    ) {
        initialize();
    } else {
        document.addEventListener('DOMContentLoaded', initialize);
    }
};

export default init;
