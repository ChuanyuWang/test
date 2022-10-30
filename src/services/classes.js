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
    var request = $.ajax('/api/classes/' + classID, {
        type: "GET",
        //contentType : "application/x-www-form-urlencoded; charset=UTF-8",
        dataType: "json",
        data: '',
        cache: false // disable browser cache
    });
    request.fail(function(jqXHR, textStatus, errorThrown) {
        util.showAlert('获取课程失败', jqXHR);
    });
    return request;
};

service.getClasses = function(fields, showError) {
    var request = $.ajax('/api/classes', {
        type: "GET",
        //contentType : "application/x-www-form-urlencoded; charset=UTF-8",
        dataType: "json",
        data: fields
    });
    if (showError === true) {
        request.fail(function(jqXHR, textStatus, errorThrown) {
            util.showAlert('获取课程失败', jqXHR);
        });
    }
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

service.addReservation = function(fields, showError) {
    var request = $.ajax("/api/booking", {
        type: "POST",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(fields),
        dataType: "json"
    });
    if (showError === true) {
        request.fail(function(jqXHR, textStatus, errorThrown) {
            util.showAlert("预约失败", jqXHR);
        });
    }
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
        util.showAlert("取消学员预约失败", jqXHR);
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
    var request = $.ajax('/api/booking', {
        type: "GET",
        //contentType : "application/x-www-form-urlencoded; charset=UTF-8",
        dataType: "json",
        data: { 'classid': classID },
        cache: false // disable browser cache
    });
    request.fail(function(jqXHR, textStatus, errorThrown) {
        util.showAlert('获取课程预约失败', jqXHR);
    });
    return request;
};

service.flag = function(classID, memberID, flag) {
    var request = $.ajax("/api/classes/" + classID + "/flag", {
        type: "PUT",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify({ "memberid": memberID, "flag": flag }),
        dataType: "json"
    });
    request.fail(function(jqXHR, textStatus, errorThrown) {
        util.showAlert("标旗失败", jqXHR);
    });
    return request;
}

service.comment = function(classID, memberID, comment) {
    var request = $.ajax("/api/classes/" + classID + "/comment", {
        type: "PUT",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify({ "memberid": memberID, "comment": comment }),
        dataType: "json"
    });
    request.fail(function(jqXHR, textStatus, errorThrown) {
        util.showAlert("备注失败", jqXHR);
    });
    return request;
}

function putCheckinStatus(classID, memberID, status) {
    var request = $.ajax("/api/classes/" + classID + "/checkin", {
        type: "PUT",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify({ "memberid": memberID, "status": status || "checkin" }),
        dataType: "json"
    });
    request.fail(function(jqXHR, textStatus, errorThrown) {
        util.showAlert("会员签到失败", jqXHR);
    });
    return request;
}

service.checkin = function(classID, memberID) {
    return putCheckinStatus(classID, memberID, 'checkin');
};

service.absent = function(classID, memberID) {
    return putCheckinStatus(classID, memberID, 'absent');
};

module.exports = service;
