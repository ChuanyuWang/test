/**
 * --------------------------------------------------------------------------
 * teachers.js provide API for /api/teachers service
 * --------------------------------------------------------------------------
 */

var util = require('./util');

var service = {};

service.getAll = function() {
    var request = $.getJSON("/api/teachers/", '');
    request.fail(function(jqXHR, textStatus, errorThrown) {
        util.showAlert("获取老师失败", jqXHR);
    });
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

module.exports = service;