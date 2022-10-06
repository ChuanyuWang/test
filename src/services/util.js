/**
 * --------------------------------------------------------------------------
 * util.js provide common utils for all services
 * --------------------------------------------------------------------------
 */

var util = {};

/**
 * 
 * @param {String} title error dialog title
 * @param {Object} jqXHR XHR object of jQuery ajax call
 * @param {String} className default is 'btn-danger'
 */
util.showAlert = function(title, jqXHR, className) {
    var errorMsg = jqXHR.responseJSON ? jqXHR.responseJSON.message : jqXHR.responseText;
    console.error(errorMsg);
    //if (bootbox) {// still throw error via vue.eval
    if (typeof bootbox !== "undefined") {
        bootbox.alert({
            message: errorMsg,
            title: title || '错误',
            buttons: {
                ok: {
                    label: "确定",
                    // alert dialog with danger button by default
                    className: className || "btn-danger"
                }
            }
        });
    } else {
        console.error("bootbox is not defined");
    }
};

module.exports = util;
