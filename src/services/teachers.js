/**
 * --------------------------------------------------------------------------
 * teachers.js provide API for /api/teachers service
 * --------------------------------------------------------------------------
 */

import util from './util';

var service = {};

/**
 * 
 * @param {Object} fields include 'tenant' if not authenticated
 * @returns 
 */
service.getAll = function(fields) {
    var request = $.getJSON("/api/teachers", fields);
    return request;
}

service.add = function(fields) {
    var request = $.ajax("/api/teachers/", {
        type: "POST",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(fields),
        dataType: "json"
    });
    request.fail(function(jqXHR, textStatus, errorThrown) {
        util.showAlert("添加老师失败", jqXHR);
    });
    return request;
}

service.update = function(id, fields) {
    var request = $.ajax("/api/teachers/" + id, {
        type: "PATCH",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(fields),
        dataType: "json"
    });

    request.fail(function(jqXHR, textStatus, errorThrown) {
        util.showAlert("更新老师失败", jqXHR);
    })
    return request;
}

service.remove = function(id, fields) {
    var request = $.ajax("/api/teachers/" + id, {
        type: "DELETE",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(fields),
        dataType: "json"
    });
    request.fail(function(jqXHR, textStatus, errorThrown) {
        util.showAlert("删除老师失败", jqXHR);
    });
    return request;
};

export default service;