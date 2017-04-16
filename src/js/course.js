/**
 * --------------------------------------------------------------------------
 * course.js
 * --------------------------------------------------------------------------
 */

var common = require('./common');

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

    $('#course_table').bootstrapTable({
        locale: 'zh-CN',
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
function handleEditCourse(e, value, row, index) {
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
    window.location.href = window.location.pathname + '/' + row._id + '/view';
};

// global event handler for table inline action
var handleActionClicks = {
    'click .end': handleEndCourse,
    'click .edit': handleEditCourse,
    'click .view': handleViewCourse,
};

function membersFormatter(value, row, index) {
    return value && value.length ? value.length : 0;
};

function statusFormatter(value, row, index) {
    if (value == "inprogress") return '进行中';
    if (value == "closed") return '结束';
    return value;
};

function actionFormatter(value, row, index) {
    return [
        '<button type="button" class="end btn btn-danger btn-xs">',
        '  <span class="glyphicon glyphicon-ban-circle"></span> 结束',
        '</button>',
        '<button type="button" style="margin:0px 3px" class="edit btn btn-warning btn-xs">',
        '  <span class="glyphicon glyphicon-edit"></span> 修改',
        '</button>',
        '<button type="button" class="view btn btn-primary btn-xs">',
        '  <span class="glyphicon glyphicon-expand"></span> 查看',
        '</button>'
    ].join('');
};
