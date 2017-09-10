/* Copyright 2016-2017 Chuanyu Wang */
(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * --------------------------------------------------------------------------
 * add-multi-class-modal.js component for add multi classes modal dailog
 * --------------------------------------------------------------------------
 */

module.exports = {
    template: '#add-multi-class-modal-template',
    props: {
        classrooms: Object // list of available classrooms
    },
    data: function() {
        return {
            date: moment(),
            begin: moment(),
            end: moment(),
            room: '',
            cost: 0,
            weekdays: [],
            isRepeated: false
        };
    },
    watch: {
        isRepeated: function(newValue) {
            var vm = this;
            if (newValue) {
                $(vm.$el).find('#class_date').data("DateTimePicker").format('LT');
            } else {
                $(vm.$el).find('#class_date').data("DateTimePicker").format('lll');
            }
        }
    },
    computed: {
        validation: function() {
            return {
                cost: typeof (this.cost) === 'number' && this.cost >= 0,
                date: this.date && this.date.isValid(),
                room: typeof(this.room) === 'string' && this.room.length > 0,
                weekdays: !this.isRepeated || this.weekdays.length > 0,
                begin: !this.isRepeated || (this.begin && this.begin.isValid()),
                end: !this.isRepeated || (this.end && this.end.isValid())
            }
        },
        isValid: function() {
            var validation = this.validation
            return Object.keys(validation).every(function(key) {
                return validation[key]
            })
        }
    },
    filters: {},
    methods: {
        show: function(value) {
            // TODO, clear error
            $('#add-multi-class-modal').modal('show')
        },
        handleOK: function() {
            if (this.isValid) {
                this.$emit("ok", this.$data);
                $('#add-multi-class-modal').modal('hide');
            }
        }
    },
    mounted: function() {
        // 'this' is refer to vm instance
        var vm = this;
        $(vm.$el).find('#class_date').datetimepicker({
            defaultDate: moment(),
            locale: 'zh-CN',
            format: 'lll'
        });
        $(vm.$el).find('#class_begin').datetimepicker({
            defaultDate: moment(),
            locale: 'zh-CN',
            format: 'll'
        });
        $(vm.$el).find('#class_end').datetimepicker({
            defaultDate: moment().add(1, 'week'),
            locale: 'zh-CN',
            format: 'll'
        });

        $(vm.$el).find('#class_date').on('dp.change', function(e) {
            // when user clears the input box, the 'e.date' is false value
            vm.date = e.date === false ? null : e.date;
        });
        $(vm.$el).find('#class_begin').on('dp.change', function(e) {
            // when user clears the input box, the 'e.date' is false value
            vm.begin = e.date === false ? null : e.date;
        });
        $(vm.$el).find('#class_end').on('dp.change', function(e) {
            // when user clears the input box, the 'e.date' is false value
            vm.end = e.date === false ? null : e.date;
        });
    }
};
},{}],2:[function(require,module,exports){
/**
 * --------------------------------------------------------------------------
 * show-booking-result-modal.js component for display the booking result
 * --------------------------------------------------------------------------
 */

module.exports = {
    template: '#show-booking-result-modal-template',
    props: {
    },
    data: function() {
        return {
            result: {} // the result of adding members/classes into course
        };
    },
    watch: {
    },
    computed: {
        newBookingCount: function() {
            var count = 0;
            var classSummary = this.result.classSummary || {};
            Object.keys(classSummary).forEach(function(classID) {
                var res = classSummary[classID];
                count += res.newbookings.length;
            });
            return count;
        },
        failBookingCount: function() {
            var count = 0;
            var memberSummary = this.result.memberSummary || {};
            Object.keys(memberSummary).forEach(function(memberID) {
                var res = memberSummary[memberID];
                count += res.errors.length;
            });
            return count;
        }
    },
    filters: {
        getMemberName: function(value, result) {
            var memberSummary = result.memberSummary || {};
            if (!value) return ''
            return memberSummary[value].name;
        }
    },
    methods: {
        show: function(result) {
            this.result = result || {};
            $(this.$el).modal('show');
        }
    },
    mounted: function() {
    }
};
},{}],3:[function(require,module,exports){
/**
 * --------------------------------------------------------------------------
 * view-member-course-modal.js modal dailog for view member's classes of one course
 * --------------------------------------------------------------------------
 */

// the element ID of modal dialog
var elementID = '#view-member-course-modal';

module.exports = {
    template: '#view-member-course-modal-template',
    props: {
        courseid: String // course id
    },
    data: function() {
        return {
            name: '' // member name
        };
    },
    watch: {},
    computed: {},
    filters: {},
    methods: {
        show: function(value) {
            // TODO, clear error
            $(elementID).modal('show');
        },
        handleOK: function() {
            if (this.isValid) {
                this.$emit("ok", this.$data);
                $(elementID).modal('hide');
            }
        }
    },
    mounted: function() {
        // 'this' is refer to vm instance
        //var vm = this;
    }
};
},{}],4:[function(require,module,exports){
/**
 * --------------------------------------------------------------------------
 * course_view.js 
 * Entry module of view course page
 * --------------------------------------------------------------------------
 */

var course_service = require('./services/courses');
var add_multi_class_modal = require('./components/add-multi-class-modal');
var view_member_course_modal = require('./components/view-member-course-modal');
var show_booking_result_modal = require('./components/show-booking-result-modal');

var viewData = {
    course: {},
    error: null,
    classrooms: {}
}

// DOM Ready =============================================================
$(document).ready(function() {
    init();

    //get list of classroom
    $('#roomList option').each(function(index, element) {
        viewData.classrooms[element.value] = element.text;
    });

    var request = course_service.getCourse($('#course_app').data('course-id'));
    request.done(function(data, textStatus, jqXHR) {
        viewData.course = data || {};

        // bootstrap the course view page
        new Vue({ extends: courseApp, data: viewData, el: '#course_app' });
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
}

var courseApp = {
    components: {
        'add-multi-class-modal': add_multi_class_modal,
        'view-member-course-modal': view_member_course_modal,
        'show-booking-result-modal': show_booking_result_modal
    },
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
        showAddClassDlg: function() {
            this.$refs.modal.room = this.course.classroom;
            this.$refs.modal.show();
        },
        genClassNames: function(count) {
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
        },
        genRepeatClass: function(datetime, startdate, enddate, days) {
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
            var names = this.genClassNames(dates.length);
            return names.map(function(value, index, array) {
                return {
                    name: value,
                    date: dates[index].toISOString()
                }
            });
        },
        addClass: function(options) {
            var vm = this;
            var datetime = options.date;
            var result = [];
            if (options.isRepeated) {
                var startdate = options.begin;
                var enddate = options.end;
                var days = options.weekdays || [];
                if (enddate.diff(startdate, 'days') > 180) return bootbox.alert('开始和结束日期不能超过180天');
                result = this.genRepeatClass(datetime, startdate, enddate, days);
            } else {
                result.push({
                    name: this.genClassNames(1)[0],
                    date: datetime.toISOString()
                });
            }
            if (result.length === 0) return bootbox.alert('没有符合所选条件的课程');
            // assign classroom
            result.forEach(function(value, index, array) {
                value.classroom = options.room;
                value.cost = options.cost;
            })
            // create classes
            var request = course_service.addCourseClasses(viewData.course._id, result);
            request.done(function(data, textStatus, jqXHR) {
                var addedClasses = data.addedClasses || [];
                addedClasses.forEach(function(value, index, array) {
                    vm.course.classes.push(value);
                });
                vm.$refs.summaryDlg.show(data.result || {});
                //bootbox.alert('班级课程添加成功');
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
        },
        showMemberCourse: function(member) {
            //TODO
            //alert(member)
            this.$refs.assignClassDlg.name = member.name;
            this.$refs.assignClassDlg.show();
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
}

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
            viewData.course.classes = data.updateClasses || [];
            //bootbox.alert('添加班级成员成功');
        });
    }
    modal.modal('hide');
}

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
}
},{"./components/add-multi-class-modal":1,"./components/show-booking-result-modal":2,"./components/view-member-course-modal":3,"./services/courses":5}],5:[function(require,module,exports){
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
},{"./util":6}],6:[function(require,module,exports){
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

},{}]},{},[4]);
