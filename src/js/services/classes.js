/**
 * --------------------------------------------------------------------------
 * classes.js provide API for classes service
 * --------------------------------------------------------------------------
 */
 
var util = require('./util');
 
var service = {};

/**
 * Retrieve classID object according to ID
 * 
 * @param {String} classID 
 */
service.getClass = function(classID) {
    var request = $.getJSON('/api/classes/' + classID, null);
    request.fail(function(jqXHR, textStatus, errorThrown) {
        util.showAlert('获取课程失败', jqXHR);
    });
    return request;
};

service.updateClass = function(coureID, fields) {
    var request = $.ajax("/api/classes/" + coureID, {
        type: "PATCH",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(fields),
        dataType: "json"
    });
    request.fail(function(jqXHR, textStatus, errorThrown) {
        util.showAlert("更新课程失败", jqXHR);
    });
    return request;
};

service.addReservation = function(fields) {
    var request = $.ajax("/api/booking", {
        type: "POST",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(fields),
        dataType: "json"
    });
    request.fail(function(jqXHR, textStatus, errorThrown) {
        util.showAlert("预约失败", jqXHR);
    });
    return request;
};

service.deleteReservation = function(classID, fields) {
    var request = $.ajax("/api/booking/" + classID, {
        type: "DELETE",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(fields),
        dataType: "json"
    });
    request.fail(function(jqXHR, textStatus, errorThrown) {
        util.showAlert("取消会员预约失败", jqXHR);
    });
    return request;
};

service.addBooks = function(classID, fields) {
    var request = $.ajax("/api/classes/" + classID + '/books', {
        type: "POST",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(fields),
        dataType: "json"
    });
    request.fail(function(jqXHR, textStatus, errorThrown) {
        util.showAlert("添加绘本失败", jqXHR);
    });
    return request;
};

service.deleteBook = function(classID, fields) {
    var request = $.ajax("/api/classes/" + classID + '/books', {
        type: "DELETE",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(fields),
        dataType: "json"
    });
    request.fail(function(jqXHR, textStatus, errorThrown) {
        util.showAlert("删除绘本失败", jqXHR);
    });
    return request;
};

service.removeClass = function(classID, fields) {
    var request = $.ajax("/api/classes/" + classID, {
        type: "DELETE",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(fields),
        dataType: "json"
    });
    request.fail(function(jqXHR, textStatus, errorThrown) {
        util.showAlert("删除课程失败", jqXHR);
    });
    return request;
};

service.getReservations = function(classID) {
    var request = $.getJSON('/api/booking', { 'classid': classID });
    request.fail(function(jqXHR, textStatus, errorThrown) {
        util.showAlert('获取课程预约失败', jqXHR);
    });
    return request;
};

module.exports = service;