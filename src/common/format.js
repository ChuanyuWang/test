/**
 * --------------------------------------------------------------------------
 * format.js
 * --------------------------------------------------------------------------
 */

function toFixed1(value) {
    return Math.round(value * 10) / 10;
}

function toFixed2(value) {
    return Math.round(value * 100) / 100;
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
     * Add method $toFixed1 and $toFixed2 to Vue instances
     * @param {*} Vue 
     * @param {*} options 
     */
    install(Vue, options) {
        Vue.prototype.$toFixed1 = toFixed1;
        Vue.prototype.$toFixed2 = toFixed2;
    }
};
