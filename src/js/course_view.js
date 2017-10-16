/**
 * --------------------------------------------------------------------------
 * course_view.js 
 * Entry module of view course page
 * --------------------------------------------------------------------------
 */
var i18nextplugin = require('./locales/i18nextplugin');
var course_service = require('./services/courses');
var add_multi_class_modal = require('./components/add-multi-class-modal.vue');
var view_member_course_modal = require('./components/view-member-course-modal.vue');
var show_booking_result_modal = require('./components/show-booking-result-modal');
var member_select_modal = require('./components/member-select-modal');

var viewData = {
    course: {},
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
    // load the i18next plugin to Vue
    Vue.use(i18nextplugin);
    //TODO, localization 
    moment.locale('zh-CN');
    bootbox.setLocale('zh_CN');
}

var courseApp = {
    components: {
        'add-multi-class-modal': add_multi_class_modal,
        'view-member-course-modal': view_member_course_modal,
        'show-booking-result-modal': show_booking_result_modal,
        'member-select-modal': member_select_modal
    },
    computed: {
        membersCount: function() {
            return this.course.members ? this.course.members.length : 0;
        },
        classesCount: function() {
            return this.course.classes ? this.course.classes.length : 0;
        },
        completedClassesCount: function() {
            var now = moment(), count = 0;
            this.sortedClasses.some(function(value, index, array) {
                if (moment(value.date).isBefore(now)) count++;
                else return true;
            });
            return count;
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
                    left: 0,
                    uninvolved: 0,
                    total: vm.sortedClasses.length
                };
                vm.sortedClasses.forEach(function(cls, index, array) {
                    if (vm.isAbsent(cls, member)) {
                        if (moment(cls.date).isSameOrBefore(now)) status.absent++;
                        else status.uninvolved++;
                    } else {
                        if (moment(cls.date).isSameOrBefore(now)) status.done++;
                        else status.left++;
                    }
                })
                //status.total = status.done + status.absent + status.left + status.uninvolved;
                progress[member.id] = status;
            });
            return progress;
        },
        errors: function() {
            var errors = {};
            if (this.course.name.length == 0)
                errors.name = '名称不能为空';
            return errors;
        },
        hasError: function() {
            var errors = this.errors
            return Object.keys(errors).some(function(key) {
                return true;
            })
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
            if (this.hasError) return false;
            var request = course_service.updateCourse(this.course._id, {
                status: this.course.status,
                name: this.course.name,
                classroom: this.course.classroom,
                remark: this.course.remark
            });
            request.done(function(data, textStatus, jqXHR) {
                bootbox.alert('班级基本资料更新成功');
            });
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
        showAddMemberDlg: function(params) {
            var checkedItems = (this.course.members||[]).map(function(value, index, array) {
                return value.id
            });
            this.$refs.memberSelectDlg.show(checkedItems);
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
                message: '删除' + moment(item.date).format('ll dddd') + ' 课程吗?<br><small>同时返还相关课时到预约会员的会员卡中</small>',
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
        addMembers: function(selectedMembers) {
            var vm = this;
            var members = this.course.members || [];
            var addedOnes = selectedMembers.filter(function(element, index, array) {
                // filter the new added member
                return !members.some(function(value, index, array) {
                    // find one matched member and return true
                    return value.id == element._id;
                });
            });
        
            if (addedOnes.length > 0) {
                // initialize members property
                if (!this.course.hasOwnProperty('members')) {
                    Vue.set(this.course, 'members', [])
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
                        vm.course.members.push(value);
                    });
                    vm.course.classes = data.updateClasses || [];
                    vm.$refs.summaryDlg.show(data.result || {});
                    //bootbox.alert('添加班级成员成功');
                });
            }
        },
        removeMember: function(item) {
            var vm = this;
            bootbox.confirm({
                title: "移除班级成员",
                message: '从班级中移除' + item.name + '，并取消此成员所有未开始的课程吗?<br><small>同时返还相关课时到会员卡中</small>',
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