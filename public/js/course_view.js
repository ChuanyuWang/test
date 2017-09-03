/* Copyright 2016-2017 Chuanyu Wang */
(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * --------------------------------------------------------------------------
 * course_view.js 
 * Entry module of view course page
 * --------------------------------------------------------------------------
 */

var course_service = require('./services/courses');

var viewData = {
    course: {},
    error: null,
    classrooms: {}
}

// DOM Ready =============================================================
$(document).ready(function() {
    init();

    //get list of classroom
    $('#class_room option').each(function(index, element) {
        viewData.classrooms[element.value] = element.text;
    });

    var request = course_service.getCourse($('#course_app').data('course-id'));
    request.done(function(data, textStatus, jqXHR) {
        viewData.course = data || {};

        // bootstrap the course view page
        var courseViewer = new Vue({extends: courseApp, data: viewData, el: '#course_app'});
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
    $('#class_dlg').on('show.bs.modal', resetAddClassDlg);
    $('#class_dlg input[name=recurrence]').on('change', function(e) {
        $('#class_dlg div.recurrence-panel').toggle(250);
        if ($(this).is(':checked')) {
            $('#class_date').data("DateTimePicker").format('LT');
        } else {
            $('#class_date').data("DateTimePicker").format('lll');
        }
    });
};

var courseApp = {
    computed: {
        membersCount: function() {
            return this.course.members ? this.course.members.length : 0;
        },
        classesCount: function() {
            return this.course.classes ? this.course.classes.length : 0;
        },
        sortedClasses: function() {
            var classes = this.course.classes || [];
            return classes.sort(function(a, b) {
                if (moment(a.date).isSameOrBefore(b.date)) return -1;
                else return 1;
            });
        },
        progressStatus: function() {
            var progress = {}, vm = this;
            var members = this.course.members || [];
            if (members.length == 0) return progress;
            var now = moment();

            members.forEach(function(member, index, array) {
                var status = {
                    done: 0,
                    absent: 0,
                    left: vm.sortedClasses.length,
                    total: vm.sortedClasses.length
                };
                vm.sortedClasses.some(function(cls, index, array) {
                    if (moment(cls.date).isSameOrBefore(now)) {
                        status.left--;
                        if (vm.isAbsent(cls, member)) status.absent++;
                        else status.done++;
                        return false;
                    } else {
                        return true;
                    }
                })
                //status.total = status.done + status.absent + status.left;
                progress[member.id] = status;
            });
            return progress;
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
        },
        formatClassroom: function(value) {
            return viewData.classrooms[value];
        }
    },
    watch: {},
    methods: {
        isAbsent: function(cls, member) {
            var booking = cls.booking || [];
            var hasReservation = function(value, index, array) {
                return value.member === member.id;
            };
            return !booking.some(hasReservation);
        },
        saveBasicInfo: function() {
            this.error = null;
            if (this.course.name.length == 0) this.error = '名称不能为空';
            if (!this.error) {
                var request = course_service.updateCourse(this.course._id, {
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
        deleteCourse: function() {
            var vm = this;
            bootbox.confirm({
                title: "确定删除班级吗？",
                message: "班级中所有课程，包括已经开始的课程都将被删除，不保留记录",
                buttons: {
                    confirm: {
                        className: "btn-danger"
                    }
                },
                callback: function(ok) {
                    if (ok) {
                        var request = course_service.removeCourse(vm.course._id);
                        request.done(function(data, textStatus, jqXHR) {
                            window.location.href = '../course';
                        });
                    }
                }
            });
        },
        removeClass: function(item) {
            var vm = this;
            bootbox.confirm({
                title: "删除课程",
                message: '删除' + moment(item.date).format('ll dddd') + ' 课程吗?',
                buttons: {
                    confirm: {
                        className: "btn-danger"
                    }
                },
                callback: function(ok) {
                    if (!ok) return;
                    var request = course_service.removeCourseClasses(vm.course._id, { 'id': item._id });
                    request.done(function(data, textStatus, jqXHR) {
                        var classes = vm.course.classes;
                        for (var i = 0; i < classes.length; i++) {
                            if (classes[i]._id == item._id) {
                                classes.splice(i, 1);
                                break;
                            }
                        }
                        //bootbox.alert('删除班级课程成功');
                    });
                }
            });
        },
        removeMember: function(item) {
            var vm = this;
            bootbox.confirm({
                title: "移除班级成员",
                message: '从班级中移除' + item.name + '，并删除此成员所有未开始的课程吗?',
                buttons: {
                    confirm: {
                        className: "btn-danger"
                    }
                },
                callback: function(ok) {
                    if (!ok) return;
                    var request = course_service.removeCourseMember(vm.course._id, { 'id': item.id });
                    request.done(function(data, textStatus, jqXHR) {
                        var members = vm.course.members;
                        for (var i = 0; i < members.length; i++) {
                            if (members[i].id == item.id) {
                                members.splice(i, 1);
                                break;
                            }
                        }
                        //bootbox.alert('删除班级成员成功');
                    });
                }
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
};

function loadCourseClasses(course) {
    if (!course) return;
    var request = course_service.getCourseClasses(course._id);
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

        var request = course_service.addCourseMembers(viewData.course._id, result);
        request.done(function(data, textStatus, jqXHR) {
            result.forEach(function(value, index, array) {
                viewData.course.members.push(value);
            });
            //bootbox.alert('添加班级成员成功');
        });
    }
    modal.modal('hide');
};

function markError(container, selector, hasError) {
    if (hasError) {
        container.find(selector).closest(".form-group").addClass("has-error");
    } else {
        container.find(selector).closest(".form-group").removeClass("has-error");
    }
};

function handleClickAddClass() {
    var modal = $(this).closest('.modal');
    var datetime = modal.find('#class_date').data("DateTimePicker").date();
    if (!datetime || !datetime.isValid()) {
        markError(modal, '#class_date', true);
        return;
    } else {
        markError(modal, '#class_date', false);
    }
    var result = [];
    var isRepeated = modal.find('input[name=recurrence]').is(':checked');
    if (isRepeated) {
        var startdate = modal.find('#class_begin').data("DateTimePicker").date();
        if (!startdate || !startdate.isValid()) {
            markError(modal, '#class_begin', true);
            return;
        } else {
            markError(modal, '#class_begin', false);
        }
        var enddate = modal.find('#class_end').data("DateTimePicker").date();
        if (!enddate || !enddate.isValid()) {
            markError(modal, '#class_end', true);
            return;
        } else {
            markError(modal, '#class_end', false);
        }
        var days = [];
        modal.find('.weekdays input:checked').each(function(index, element) {
            days.push(element.value);
        });
        if (days.length == 0) {
            markError(modal, '.weekdays', true);
            return;
        } else {
            markError(modal, '.weekdays', false);
        }
        if (enddate.diff(startdate, 'days') > 180) return bootbox.alert('开始和结束日期不能超过180天');
        result = genRepeatClass(datetime, startdate, enddate, days);
    } else {
        result.push({
            name: genClassNames(1)[0],
            date: datetime.toISOString()
        });
    }
    if (result.length === 0) return bootbox.alert('没有符合所选条件的课程');
    // assign classroom
    var classroom = modal.find('#class_room').val();
    result.forEach(function(value, index, array) {
        value.classroom = classroom;
    })
    // create classes
    var request = course_service.addCourseClasses(viewData.course._id, result);
    request.done(function(data, textStatus, jqXHR) {
        data.forEach(function(value, index, array) {
            viewData.course.classes.push(value);
        });
        //bootbox.alert('班级课程添加成功');
    });
    modal.modal('hide');
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
    markError(modal, '#class_date', false);
    markError(modal, '#class_begin', false);
    markError(modal, '#class_end', false);
    markError(modal, '.weekdays', false);
    // select the classroom as the same as course
    modal.find('#class_room option[value=' + viewData.course.classroom + ']').prop("selected", true);
};

function genClassNames(count) {
    var count = count || 0;
    var result = [];
    var existed = viewData.course.classes || [];
    var suffix = existed.length + 1;
    for (var i = 0; i < count; i++) {
        var name = viewData.course.name + '-' + suffix;
        while (existed.some(function(val, index, array) {
            return val.name == name;
        })) {
            suffix++;
            name = viewData.course.name + '-' + suffix;
        }
        result.push(name);
        suffix++;
    }
    return result;
};

function genRepeatClass(datetime, startdate, enddate, days) {
    var dates = [];
    var current = moment(startdate);
    while (current.isSameOrBefore(enddate)) {
        if (days.some(function(value, index, array) {
            return value == current.day();
        })) {
            var date = moment(current).set({
                'hours': datetime.hours(),
                'minutes': datetime.minutes(),
                'seconds': datetime.seconds(),
                'milliseconds': datetime.milliseconds()
            });
            dates.push(date);
        }
        current.add(1, 'day');
    }
    var names = genClassNames(dates.length);
    return names.map(function(value, index, array) {
        return {
            name: value,
            date: dates[index].toISOString()
        }
    });
};
},{"./services/courses":2}],2:[function(require,module,exports){
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
},{"./util":3}],3:[function(require,module,exports){
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

},{}]},{},[1]);
