/* Copyright 2016-2017 Chuanyu Wang */
(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * --------------------------------------------------------------------------
 * course_view.js 
 * Entry module of view course page
 * --------------------------------------------------------------------------
 */

var viewData = {
    course: {},
    error: null
}

// DOM Ready =============================================================
$(document).ready(function() {
    init();

    var request = getCourse($('#course_app').data('course-id'));
    request.done(function(data, textStatus, jqXHR) {
        initPage(data);
    });
    request.done(function(data, textStatus, jqXHR) {
        loadCourseClasses(data);
    });
});

// Functions =============================================================

function init() {
    console.log("course_view moudle init...");
    //TODO, localization 
    moment.locale('zh-CN');
    bootbox.setLocale('zh_CN');

    $('#member_table').bootstrapTable({
        url: '/api/members?status=active',
        locale: 'zh-CN',
        columns: [{}, {}, {}, {
            formatter: creditFormatter
        }]
    });
    $('#class_date').datetimepicker({
        locale: 'zh-CN',
        format: 'lll'
    });
    $('#class_begin').datetimepicker({
        locale: 'zh-CN',
        format: 'll'
    });
    $('#class_end').datetimepicker({
        locale: 'zh-CN',
        format: 'll'
    });

    // event listener of adding new comment
    $('#member_dlg #add_member').click(handleClickAddMember);
    $('#member_dlg').on('shown.bs.modal', function(event) {
        //$(this).find('table').bootstrapTable('refresh', { url: '/api/members', query: { status: 'active' } });
        // check selected members
        if (viewData.course.members) {
            var checkedItems = viewData.course.members.map(function(value, index, array) {
                return value.id
            });
            $(this).find('table').bootstrapTable('checkBy', { field: '_id', values: checkedItems });
        }
    });

    // event listener of adding new class
    $('#class_dlg #add_class').click(handleClickAddClass);
    $('#class_dlg').on('shown.bs.modal', resetAddClassDlg);
    $('#class_dlg input[name=recurrence]').on('change', function(e) {
        $('#class_dlg div.recurrence-panel').toggle(250);
        if ($(this).is(':checked')) {
            $('#class_date').data("DateTimePicker").format('LT');
        } else {
            $('#class_date').data("DateTimePicker").format('lll');
        }
    });
};

function initPage(course) {
    viewData.course = course;

    // bootstrap the course view page
    var courseViewer = new Vue({
        el: '#course_app',
        data: viewData,
        computed: {
            membersCount: function() {
                return this.course.members ? this.course.members.length : 0;
            }
        },
        filters: {
            formatDate: function(value) {
                if (!value) return '?';
                return moment(value).format('ll');
            },
            formatDateTime: function(value) {
                if (!value) return '?';
                return moment(value).format('lll');
            }
        },
        watch: {
        },
        methods: {
            saveBasicInfo: function() {
                this.error = null;
                if (this.course.name.length == 0) this.error = '名称不能为空';
                if (!this.error) {
                    var request = updateCourse(this.course._id, {
                        status: this.course.status,
                        name: this.course.name,
                        classroom: this.course.classroom,
                        remark: this.course.remark
                    });
                    request.done(function(data, textStatus, jqXHR) {
                        bootbox.alert('班级基本资料更新成功');
                    });
                }
            },
            removeClass: function(id) {
                var vm = this;
                var request = removeCourseClasses(vm.course._id, { 'id': id });
                request.done(function(data, textStatus, jqXHR) {
                    var classes = vm.course.classes;
                    for (var i = 0; i < classes.length; i++) {
                        if (classes[i]._id == id) {
                            classes.splice(i, 1);
                            break;
                        }
                    }
                    bootbox.alert('删除班级课程成功');
                });
            },
            removeMember: function(id) {
                var vm = this;
                var request = removeCourseMember(vm.course._id, { 'id': id });
                request.done(function(data, textStatus, jqXHR) {
                    var members = vm.course.members;
                    for (var i = 0; i < members.length; i++) {
                        if (members[i].id == id) {
                            members.splice(i, 1);
                            break;
                        }
                    }
                    bootbox.alert('删除班级成员成功');
                });
            },
            closeAlert: function(e) {
                if (this.course.status == 'closed') {
                    bootbox.alert({
                        message: "结束此班级后会删除所有未开始的课程<br><small>确定后，请点击保存进行修改</small>",
                        buttons: {
                            ok: {
                                label: "确定",
                                className: "btn-danger"
                            }
                        }
                    });
                }
            }
        },
        mounted: function() {
            // 'this' is refer to vm instance
            var vm = this;
            $(vm.$el).find('#birth_date').datetimepicker({
                format: 'll',
                locale: 'zh-CN'
            });

            $(vm.$el).find('#birth_date').on('dp.change', function(e) {
                // when user clears the input box, the 'e.date' is false value
                vm.birth = e.date === false ? null : e.date;
            });
        }
    });
};

function loadCourseClasses(course) {
    var request = getCourseClasses(course._id);
    request.done(function(data, textStatus, jqXHR) {
        // initialize classes property
        if (!course.hasOwnProperty('classes')) {
            Vue.set(course, 'classes', [])
        }
        data.forEach(function(value, index, array) {
            course.classes.push(value);
        });
    });
};

function handleClickAddMember() {
    var modal = $(this).closest('.modal');
    var selections = modal.find('table').bootstrapTable('getAllSelections');

    var members = viewData.course.members || [];
    var addedOnes = selections.filter(function(element, index, array) {
        // filter the new added member
        return !members.some(function(value, index, array) {
            // find one matched member and return true
            return value.id == element._id;
        });
    });

    if (addedOnes.length > 0) {
        // initialize members property
        if (!viewData.course.hasOwnProperty('members')) {
            Vue.set(viewData.course, 'members', [])
        }
        var result = addedOnes.map(function(value, index, array) {
            return {
                id: value._id,
                name: value.name
            };
        });

        var request = addCourseMembers(viewData.course._id, result);
        request.done(function(data, textStatus, jqXHR) {
            result.forEach(function(value, index, array) {
                viewData.course.members.push(value);
            });
            bootbox.alert('添加班级成员成功');
        });
    }

    modal.modal('hide');
};

function handleClickAddClass() {
    var modal = $(this).closest('.modal');
    var isRepeated = modal.find('input[name=recurrence]').is(':checked');
    var datetime = modal.find('#class_date').data("DateTimePicker").date();
    if (isRepeated) {
        //TODO
    } else {
        var item = createClass(datetime);
        var request = addCourseClasses(viewData.course._id, item);
        request.done(function(data, textStatus, jqXHR) {
            data.forEach(function(value, index, array) {
                viewData.course.classes.push(value);
            });
            bootbox.alert('班级课程添加成功');
        });
    }
    modal.modal('hide');
};

/**
 * Retrieve course object according to ID
 * 
 * @param {String} coureID 
 */
function getCourse(coureID) {
    var request = $.getJSON('/api/courses/' + coureID, null);
    request.fail(function(jqXHR, textStatus, errorThrown) {
        showAlert('获取班级失败', jqXHR);
    })
    return request;
};

function updateCourse(coureID, fields) {
    var request = $.ajax("/api/courses/" + coureID, {
        type: "PATCH",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(fields),
        dataType: "json"
    });
    request.fail(function(jqXHR, textStatus, errorThrown) {
        showAlert("更新班级失败", jqXHR);
    })
    return request;
};

function addCourseMembers(coureID, fields) {
    var request = $.ajax("/api/courses/" + coureID + '/members', {
        type: "POST",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(fields),
        dataType: "json"
    });
    request.fail(function(jqXHR, textStatus, errorThrown) {
        showAlert("添加班级成员失败", jqXHR);
    })
    return request;
};

function removeCourseMember(coureID, fields) {
    var request = $.ajax("/api/courses/" + coureID + '/members', {
        type: "DELETE",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(fields),
        dataType: "json"
    });
    request.fail(function(jqXHR, textStatus, errorThrown) {
        showAlert("删除班级成员失败", jqXHR);
    })
    return request;
};

function addCourseClasses(coureID, fields) {
    var request = $.ajax("/api/courses/" + coureID + '/classes', {
        type: "POST",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(fields),
        dataType: "json"
    });
    request.fail(function(jqXHR, textStatus, errorThrown) {
        showAlert("添加课程失败", jqXHR);
    })
    return request;
};

function removeCourseClasses(coureID, fields) {
    var request = $.ajax("/api/courses/" + coureID + '/classes', {
        type: "DELETE",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(fields),
        dataType: "json"
    });
    request.fail(function(jqXHR, textStatus, errorThrown) {
        showAlert("删除班级课程失败", jqXHR);
    })
    return request;
};

function getCourseClasses(coureID) {
    var request = $.getJSON('/api/classes', {'courseID': coureID});
    request.fail(function(jqXHR, textStatus, errorThrown) {
        showAlert('获取班级课程失败', jqXHR);
    })
    return request;
};

/**
 * 
 * @param {String} title 
 * @param {Object} jqXHR 
 * @param {String} className default is 'btn-danger'
 */
function showAlert(title, jqXHR, className) {
    //console.error(jqXHR);
    bootbox.dialog({
        message: jqXHR.responseJSON ? jqXHR.responseJSON.message : jqXHR.responseText,
        title: title || '错误',
        buttons: {
            danger: {
                label: "确定",
                // alert dialog with danger button by default
                className: className || "btn-danger"
            }
        }
    });
};

function creditFormatter(value, row, index) {
    var membership = row.membership;
    if (membership && membership[0]) {
        // A better way of 'toFixed(1)'
        if (typeof (membership[0].credit) == 'number') {
            return Math.round(membership[0].credit * 10) / 10;
        } else {
            return membership[0].credit;
        }
    } else {
        return undefined;
    }
};

function resetAddClassDlg(event) {
    var modal = $(this);
    if (!viewData.course.hasOwnProperty('classes')) {
        Vue.set(viewData.course, 'classes', [])
    }
};

function genClassName() {
    var existed = viewData.course.classes || [];
    var suffix = existed.length + 1;
    var name = viewData.course.name + '-' + suffix;
    while (existed.some(function(val, index, array) {
        return val.name == name;
    })) {
        suffix++;
        name = viewData.course.name + '-' + suffix;
    }
    return name;
};

function createClass(datetime) {
    return {
        name: genClassName(),
        date: datetime.toISOString(),
        classroom: viewData.course.classroom
    };
};
},{}]},{},[1]);
