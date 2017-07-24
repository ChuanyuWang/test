/* Copyright 2016-2017 Chuanyu Wang */
(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * --------------------------------------------------------------------------
 * common.js
 * --------------------------------------------------------------------------
 */

module.exports = {
    /**
     * get the tenat name of current page, e.g.
     * return 'bqsq' from http://localhost:3000/t/bqsq/course/1/view
     */
    getTenantName: function() {
        var pathname = window.location.pathname;
        if (pathname.length == 0) return "";
        if (pathname.charAt(0) == '/') pathname = pathname.substring(1);
        if (pathname.charAt(0) == 't') pathname = pathname.substring(1);
        if (pathname.charAt(0) == '/') pathname = pathname.substring(1);
        return pathname.split('/')[0];
    },
    /**
     * Data fomatter function of bootstrap-table to format date localized string by 'll'
     * 
     * @param {Object} value the field value
     * @param {Object} row the row record data
     * @param {Number} index the row index
     */
    dateFormatter: function(value, row, index) {
        if (value) {
            return moment(value).format('ll');
        } else {
            return undefined;
        }
    },
    /**
     * Calculate the remaining capacity of class object
     * 
     * @cItem {Object} cItem class object
     */
    classRemaining: function(cItem) {
        if (cItem) {
            var booking = cItem.booking || [];
            if (booking.length === 0) return cItem.capacity || 0;
            else {
                var reservation = 0;
                booking.forEach(function(val, index, array) {
                    reservation += (val.quantity || 0);
                });
                return (cItem.capacity || 0) - reservation;
            }
        } else {
            return undefined;
        }
    }
};
},{}],2:[function(require,module,exports){
/**
 * --------------------------------------------------------------------------
 * course.js
 * --------------------------------------------------------------------------
 */

var common = require('./common');
var util = require('./services/util');

// only display the active course by default
var courseStatus = 'active';

// DOM Ready =============================================================
$(document).ready(function() {
    init();
});

// Functions =============================================================

function init() {
    console.log("welcome~~~");
    //TODO, localization 
    moment.locale('zh-CN');
    bootbox.setLocale('zh_CN');

    $('#course_dlg').on('shown.bs.modal', function(event) {
        // focus on the course name input control
        $(this).find('input[name=name]').focus();
    });
    $('#add_course').click(handleAddNewCourse);

    $('div.status-filter li>a').click(function(event) {
        var label = this.innerText;
        $('div.status-filter button').html(label + '<span class="caret"/>');
        courseStatus = $(this).data('status') || null;
        //updateSchedule($("this"));
        $('#course_table').bootstrapTable('refresh');
    });

    $('#course_table').bootstrapTable({
        locale: 'zh-CN',
        queryParams: customQuery,
        columns: [{}, {
            formatter: common.dateFormatter
        }, {
            formatter: statusFormatter
        }, {
            formatter: membersFormatter
        }, {
            formatter: actionFormatter,
            events: handleActionClicks
        }]
    });
};

/**
 * event handler of clicking end course button 
 * 
 * @param {Object} e the jQuery event
 * @param {Object} value the field value
 * @param {Object} row the row record data
 * @param {Number} index the row index
 * @public
 */
function handleEndCourse(e, value, row, index) {
    //TODO
};

/**
 * event handler of clicking end course button 
 * 
 * @param {Object} e the jQuery event
 * @param {Object} value the field value
 * @param {Object} row the row record data
 * @param {Number} index the row index
 * @public
 */
function handleViewCourse(e, value, row, index) {
    window.location.href = window.location.pathname + '/' + row._id;
};

// global event handler for table inline action
var handleActionClicks = {
    'click .end': handleEndCourse,
    'click .view': handleViewCourse,
};

function membersFormatter(value, row, index) {
    return value && value.length ? value.length : 0;
};

function statusFormatter(value, row, index) {
    if (value == "active") return '进行中';
    if (value == "closed") return '结束';
    return value;
};

function actionFormatter(value, row, index) {
    return [
        '<button type="button" class="end btn btn-danger btn-xs">',
        '  <span class="glyphicon glyphicon-ban-circle"></span> 结束',
        '</button>',
        '<button type="button" style="margin-left:6px" class="view btn btn-primary btn-xs">',
        '  <span class="glyphicon glyphicon-expand"></span> 查看',
        '</button>'
    ].join('');
};

function customQuery(params) {
    // params : {search: "", sort: undefined, order: "asc", offset: 0, limit: 15}
    params.status = courseStatus;
    return params;
};

function handleAddNewCourse(event) {
    var modal = $(this).closest('.modal');
    var course = {
        createDate: moment()
    };

    var hasError = false;

    course.name = modal.find('input[name=name]').val();
    if (!course.name || course.name.length == 0) {
        modal.find('input[name=name]').closest(".form-group").addClass("has-error");
        hasError = true;
    } else {
        modal.find('input[name=name]').closest(".form-group").removeClass("has-error");
    }

    course.classroom = modal.find('select[name=classroom]').val();
    course.remark = modal.find('textarea[name=remark]').val().trim();

    // validate the input
    if (!hasError) {
        modal.modal('hide');
        var request = addCourse(course);
        request.done(function(data, textStatus, jqXHR) {
            window.location.href = window.location.pathname + '/' + data._id;
        });
    }
};

function addCourse(course) {
    var request = $.ajax("/api/courses", {
        type: "POST",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(course),
        dataType: "json"
    });

    request.fail(function(jqXHR, textStatus, errorThrown) {
        util.showAlert("创建班级失败", jqXHR);
    })

    return request;
};
},{"./common":1,"./services/util":3}],3:[function(require,module,exports){
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
    //console.error(jqXHR);
    bootbox.alert({
        message: jqXHR.responseJSON ? jqXHR.responseJSON.message : jqXHR.responseText,
        title: title || '错误',
        buttons: {
            ok: {
                label: "确定",
                // alert dialog with danger button by default
                className: className || "btn-danger"
            }
        }
    });
};

module.exports = util;

},{}]},{},[2]);
