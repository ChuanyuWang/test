/**
 * --------------------------------------------------------------------------
 * members.js provide API for /api/members service
 * --------------------------------------------------------------------------
 */

var util = require('./util');

var service = {};

service.update = function(memberID, fields) {
    var request = $.ajax("/api/members/" + memberID, {
        type: "PATCH",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(fields),
        dataType: "json"
    });

    request.fail(function(jqXHR, textStatus, errorThrown) {
        util.showAlert("更新会员失败", jqXHR);
    })
    return request;
}

service.addComment = function(memberID, fields) {
    var request = $.ajax("/api/members/" + memberID + '/comments', {
        type: "POST",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(fields),
        dataType: "json"
    });
    request.fail(function(jqXHR, textStatus, errorThrown) {
        util.showAlert("添加会员备忘失败", jqXHR);
    });
    return request;
}

service.editComment = function(memberID, index, fields) {
    var request = $.ajax('/api/members/' + memberID + '/comments/' + index, {
        type: "PATCH",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(fields),
        dataType: "json"
    });
    request.fail(function(jqXHR, textStatus, errorThrown) {
        util.showAlert("修改会员备忘失败", jqXHR);
    });
    return request;
}

service.createCard = function(memberID, fields) {
    var request = $.ajax("/api/members/" + memberID + '/memberships', {
        type: "POST",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(fields),
        dataType: "json"
    });

    request.fail(function(jqXHR, textStatus, errorThrown) {
        util.showAlert("创建会员卡失败", jqXHR);
    });
    return request;
}

service.updateCard = function(memberID, index, fields) {
    var request = $.ajax("/api/members/" + memberID + '/memberships/' + index, {
        type: "PATCH",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(fields),
        dataType: "json"
    });
    request.fail(function(jqXHR, textStatus, errorThrown) {
        util.showAlert("修改会员卡失败", jqXHR);
    });
    return request;
}

service.getMemberInfo = function(id) {
    var request = $.getJSON("/api/members/" + id, '');
    request.fail(function(jqXHR, textStatus, errorThrown) {
        util.showAlert("获取会员信息失败", jqXHR);
    });
    return request;
}

service.getMemberComments = function(id) {
    var request = $.getJSON("/api/members/" + id + '/comments', '');
    request.fail(function(jqXHR, textStatus, errorThrown) {
        util.showAlert("获取会员备忘失败", jqXHR);
    });
    return request;
}

service.getMemberSummary = function(id) {
    var request = $.getJSON("/api/members/" + id + '/summary', '');
    request.fail(function(jqXHR, textStatus, errorThrown) {
        util.showAlert("获取会员参与的班级失败", jqXHR);
    });
    return request;
}

module.exports = service;