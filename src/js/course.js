/**
 * --------------------------------------------------------------------------
 * course.js
 * --------------------------------------------------------------------------
 */

var common = require('./common');
var util = require('./services/util');

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

    $('div.status-filter input[type=checkbox]').click(function(event) {
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
}

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
}

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
}

// global event handler for table inline action
var handleActionClicks = {
    'click .end': handleEndCourse,
    'click .view': handleViewCourse,
};

function membersFormatter(value, row, index) {
    return value && value.length ? value.length : 0;
}

function statusFormatter(value, row, index) {
    if (value == "active") return '进行中';
    if (value == "closed") return '结束';
    return value;
}

function actionFormatter(value, row, index) {
    return [
        '<button type="button" class="end btn btn-danger btn-xs">',
        '  <span class="glyphicon glyphicon-ban-circle"></span> 结束',
        '</button>',
        '<button type="button" style="margin-left:6px" class="view btn btn-primary btn-xs">',
        '  <span class="glyphicon glyphicon-expand"></span> 查看',
        '</button>'
    ].join('');
}

function customQuery(params) {
    // params : {search: "", sort: undefined, order: "asc", offset: 0, limit: 15}
    var statusEl = $('.status-filter input[type=checkbox]:checked');
    if (statusEl.length > 0) {
        var statusQuery = '';
        for (var i=0;i<statusEl.length;i++) {
            statusQuery += statusEl[i].value + ',';
        }
        params.status = statusQuery.substring(0, statusQuery.length-1);
    }

    return params;
}

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
}

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
}