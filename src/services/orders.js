/**
 * --------------------------------------------------------------------------
 * orders.js provide API for /api/orders service
 * --------------------------------------------------------------------------
 */

var service = {};

/**
 * 
 * @param {Object} fields include 'tenant' if not authenticated
 * @returns 
 */
service.getAll = function(fields) {
    var request = $.getJSON("/api/orders", fields);
    return request;
}

service.add = function(fields) {
    var request = $.ajax("/api/orders", {
        type: "POST",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(fields),
        dataType: "json"
    });
    return request;
}

service.confirmPay = function(fields) {
    var request = $.ajax("/api/orders/confirmPay", {
        type: "POST",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(fields),
        dataType: "json"
    });
    return request;
}

service.update = function(orderID, fields) {
    var request = $.ajax("/api/orders/" + orderID, {
        type: "PATCH",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(fields),
        dataType: "json"
    });
    return request;
}

service.close = function(orderID, fields) {
    var request = $.ajax("/api/orders/" + orderID + "/close", {
        type: "POST",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(fields),
        dataType: "json"
    });
    return request;
}

service.delete = function(orderID, fields) {
    var request = $.ajax("/api/orders/" + orderID, {
        type: "DELETE",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(fields),
        dataType: "json"
    });
    return request;
}

export default service;
