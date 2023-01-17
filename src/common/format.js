/**
 * --------------------------------------------------------------------------
 * format.js
 * --------------------------------------------------------------------------
 */

function toFixed1(value) {
    var result = Math.round(value * 10);
    // in case result is '-0', e.g. Math.round(-1.4551915228366852e-11)
    return result === 0 ? 0 : result / 10;
}

function toFixed2(value) {
    var result = Math.round(value * 100);
    // in case result is '-0', e.g. Math.round(-1.4551915228366852e-11)
    return result === 0 ? 0 : result / 100;
}

module.exports = {
    /**
     * 3.00001 ===> 3
     * 3.12 ===> 3.1
     */
    toFixed1,
    /**
     * 3.00001 ===> 3
     * 3.12 ===> 3.12
     */
    toFixed2,
    /**
     * Add method $toFixed1 and $toFixed2 to Vue instances, E.g.
     * in <tempalte> tag, span.text-muted {{remainingCredit | toFixed1}}
     * in <script> tag, "合约课时由 <del>" + this.$toFixed1(o);
     * @param {*} Vue 
     * @param {*} options 
     */
    install(Vue, options) {
        Vue.prototype.$toFixed1 = toFixed1;
        Vue.prototype.$toFixed2 = toFixed2;

        Vue.filter('toFixed1', toFixed1);
        Vue.filter('toFixed2', toFixed2);
    }
};
