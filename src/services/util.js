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
    // the returned json body should have a message property to indicate the error
    var errorMsg = jqXHR.responseJSON ? jqXHR.responseJSON.message : jqXHR.responseText;
    console.error(errorMsg);

    if (!errorMsg) return; // jqXHR is abort by user

    if (typeof Vue.prototype.$messager !== "undefined") {
        Vue.prototype.$messager.showErrorMessage(errorMsg);
    } else if (typeof bootbox !== "undefined") {
        //if (bootbox) {// still throw error via vue.eval
        bootbox.alert({
            message: errorMsg || "Unknown Error",
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

/**
 * Load JSON-encoded data from the server using a GET HTTP request. Print error via `console.error` if any.
 * @param {String} url the URL to which the request is sent.
 * @param {String|Object} data A plain object or string that is sent to the server with the request.
 * @returns the jQuery XHR object
 */
util.getJSON = function(url, data) {
    var request = $.getJSON(url, data);
    request.fail(function(jqXHR, textStatus, errorThrown) {
        // the returned json body should have a message property to indicate the error
        var errorMsg = jqXHR.responseJSON ? jqXHR.responseJSON.message : jqXHR.responseText;
        console.error(errorMsg);
    });
    return request;
};

util.postJSON = function(url, data) {
    return ajax(url, data, "POST");
};

util.patchJSON = function(url, data) {
    return ajax(url, data, "PATCH");
};

util.deleteJSON = function(url, data) {
    return ajax(url, data, "DELETE");
};

function ajax(url, data, method) {
    var request = $.ajax(url, {
        // method: method, // version added: 1.9.0
        type: method, // An alias for method
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(data),
        dataType: "json"
    });

    request.fail(function(jqXHR, textStatus, errorThrown) {
        // the returned json body should have a message property to indicate the error
        var errorMsg = jqXHR.responseJSON ? jqXHR.responseJSON.message : jqXHR.responseText;
        console.error(errorMsg);
    });
    return request;
};

export default util;
