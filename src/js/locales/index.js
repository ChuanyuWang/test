/**
 * --------------------------------------------------------------------------
 * index.js provide all locale resources loaded by browser
 * --------------------------------------------------------------------------
 */

var resources = {
    'en': { translation: require('./en') },
    'zh': { translation: require('./zh_CN') }
};

module.exports = resources;
