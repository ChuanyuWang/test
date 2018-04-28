/**
 * --------------------------------------------------------------------------
 * courses.js provide API for courses service
 * --------------------------------------------------------------------------
 */

var util = require('./util');

var service = {};

/**
 * Retrieve course object according to ID
 * 
 * @param {String} courseID 
 */
service.getCourse = function(courseID) {
    var request = $.getJSON('/api/courses/' + courseID, null);
    request.fail(function(jqXHR, textStatus, errorThrown) {
        util.showAlert('获取班级失败', jqXHR);
    })
    return request;
};

service.updateCourse = function(courseID, fields) {
    var request = $.ajax("/api/courses/" + courseID, {
        type: "PATCH",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(fields),
        dataType: "json"
    });
    request.fail(function(jqXHR, textStatus, errorThrown) {
        util.showAlert("更新班级失败", jqXHR);
    })
    return request;
};

service.getCourseMembers = function(courseID, fields) {
    var request = $.ajax("/api/courses/" + courseID + '/members', {
        type: "GET",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(fields),
        dataType: "json"
    });
    request.fail(function(jqXHR, textStatus, errorThrown) {
        util.showAlert("获取班级成员失败", jqXHR);
    })
    return request;
};

service.addCourseMembers = function(courseID, fields) {
    var request = $.ajax("/api/courses/" + courseID + '/members', {
        type: "POST",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(fields),
        dataType: "json"
    });
    request.fail(function(jqXHR, textStatus, errorThrown) {
        util.showAlert("添加班级成员失败", jqXHR);
    })
    return request;
};

service.removeCourseMember = function(courseID, fields) {
    var request = $.ajax("/api/courses/" + courseID + '/members', {
        type: "DELETE",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(fields),
        dataType: "json"
    });
    request.fail(function(jqXHR, textStatus, errorThrown) {
        util.showAlert("删除班级成员失败", jqXHR);
    })
    return request;
};

service.addCourseClasses = function(courseID, fields) {
    var request = $.ajax("/api/courses/" + courseID + '/classes', {
        type: "POST",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(fields),
        dataType: "json"
    });
    request.fail(function(jqXHR, textStatus, errorThrown) {
        util.showAlert("添加课程失败", jqXHR);
    })
    return request;
};

service.removeCourseClasses = function(courseID, fields) {
    var request = $.ajax("/api/courses/" + courseID + '/classes', {
        type: "DELETE",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(fields),
        dataType: "json"
    });
    request.fail(function(jqXHR, textStatus, errorThrown) {
        util.showAlert("删除班级课程失败", jqXHR);
    })
    return request;
};

service.removeCourse = function(courseID, fields) {
    var request = $.ajax("/api/courses/" + courseID, {
        type: "DELETE",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(fields),
        dataType: "json"
    });
    request.fail(function(jqXHR, textStatus, errorThrown) {
        util.showAlert("删除班级失败", jqXHR);
    })
    return request;
};

service.getCourseClasses = function(courseID) {
    var request = $.getJSON('/api/classes', { 'courseID': courseID });
    request.fail(function(jqXHR, textStatus, errorThrown) {
        util.showAlert('获取班级课程失败', jqXHR);
    })
    return request;
};

module.exports = service;