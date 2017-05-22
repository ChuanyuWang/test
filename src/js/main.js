/**
 * --------------------------------------------------------------------------
 * main.js Home page main entry module
 * --------------------------------------------------------------------------
 */
var common = require('./common');
var locales = require('./locales');
var initClassCell = require('./components/class-cell');
var class_service = require('./services/classes');
var LngDetector = require('./locales/i18nextBrowserLanguageDetector.min');

var classTableData = {
    monday: null, // moment date object
    columns: ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'],
    sections: [{ name: "上午", startTime: 0, duration: 12 }, { name: "下午", startTime: 12, duration: 6 }, { name: "晚上", startTime: 18, duration: 6 }],
    classes: []
};

// DOM Ready =============================================================
$(document).ready(function() {
    init();

    initClassCell();
    // bootstrap the class table
    var clsTable = new Vue({
        el: '#cls_table',
        data: classTableData,
        computed: {
            sortedClasses: function() {
                return this.classes.sort(function(a, b) {
                    if (moment(a.date).isSameOrBefore(b.date)) return -1;
                    else return 1;
                });
            }
        },
        filters: {
            displayWeekDay: function(dayOffset, monday) {
                return moment(monday).add(dayOffset, 'days').format('MMMDo');
            }
        },
        methods: {
            getClassess: function(dayOffset, startTime, duration) {
                var result = [];
                var theDay = moment(this.monday).add(dayOffset, 'days').hours(startTime);
                for (var i = 0; i < this.sortedClasses.length; i++) {
                    var classItem = this.classes[i];
                    if (moment(classItem.date).isSameOrAfter(theDay)) {
                        if (moment(classItem.date).diff(theDay, 'hours') >= duration) break;
                        else result.push(classItem);
                    }
                }
                return result;
            },
            viewClass: function(classItem) {
                window.location.href = './class/' + classItem._id;
            },
            deleteClass: function(classItem) {
                var vm = this;
                if (classItem.courseID) {
                    return bootbox.confirm({
                        title: "确定删除班级中的课程吗？",
                        message: "课程<strong>" + classItem.name + "</strong>是固定班的课程<br/>请先查看班级，并从班级管理界面中删除相关课程",
                        buttons: {
                            confirm: {
                                label: '查看班级',
                                className: "btn-success"
                            }
                        },
                        callback: function(ok) {
                            if (ok) {
                                window.location.href = './course/' + classItem.courseID;
                            }
                        }
                    });
                }
                bootbox.confirm({
                    title: "确定删除课程吗？",
                    message: "只能删除没有会员预约的课程，如果有预约，请先取消预约",
                    buttons: {
                        confirm: {
                            className: "btn-danger"
                        }
                    },
                    callback: function(ok) {
                        if (ok) {
                            var request = class_service.removeClass(classItem._id);
                            request.done(function(data, textStatus, jqXHR) {
                                vm.removeClasses(classItem);
                                showSuccessMsg("删除成功");
                            });
                        }
                    }
                });
            },
            removeClasses: function(oldClass) {
                var found = false;
                for (var i = 0; i < this.classes.length; i++) {
                    if (this.classes[i]._id == oldClass._id) {
                        // remove the old one
                        this.classes.splice(i, 1);
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    console.error("can't find the oldClass");
                }
            },
            addClass: function(dayOffset, startTime) {
                // the first class should start from 8:00 in the morning
                showAddNewClassDlg(moment(this.monday).add(dayOffset, 'days').hours(startTime == 0 ? 8 : startTime));
            }
        }
    });

    $('#cls_dlg').on('shown.bs.modal', function(event) {
        $(this).find('#cls_name').focus(); // focus on the class name input control
    });

    // listen to the action button on modal dialogs
    $('#create_cls').click(handleAddNewClass);

    // listen to the previous week and next week button
    $('#previous_week').click(function(event) {
        classTableData.monday.subtract(7, 'days');
        // update the datetimepicker control
        $('#weekPicker').data('DateTimePicker').date(classTableData.monday);
    });

    $('#next_week').click(function(event) {
        classTableData.monday.add(7, 'days');
        // update the datetimepicker control
        $('#weekPicker').data('DateTimePicker').date(classTableData.monday);
    });

    $('#current_week').click(function(event) {
        classTableData.monday = getMonday(moment());
        // update the datetimepicker control
        $('#weekPicker').data('DateTimePicker').date(classTableData.monday);
    });

    // handle user change the classroom
    $('#chooseRoom').change(function(event) {
        updateSchedule();
    });
});

// Functions =============================================================

function init() {
    console.log("welcome~~~");
    // initialize the i18n module
    if (i18next) {
        i18next.use(LngDetector).init({
            fallbackLng: "en",
            resources: locales
        });
    }

    moment.locale('zh-CN');
    bootbox.setLocale('zh_CN');
    $('#cls_time').datetimepicker({
        locale: 'zh-CN',
        format: 'LT'
    });
    $('#weekPicker').datetimepicker({
        showTodayButton: false,
        locale: 'zh-CN',
        format: 'll',
        defaultDate: moment()
    });
    classTableData.monday = getMonday(moment());
    $('#weekPicker').data('DateTimePicker').date(classTableData.monday);
    // listen to the date change event after setting date !!!
    $('#weekPicker').on('dp.change', function(e) {
        // when user clears the input box, the 'e.date' is false value
        if (e.date && e.date.isValid()) {
            classTableData.monday = getMonday(e.date);
            updateSchedule();
        }
    });
    initClassRoomList();
    // manual update the page so that page is able to be updated in "back" case
    updateSchedule();
};

function initClassRoomList() {
    if (!getCurrentClassRoom()) {
        // show a single button to create class room
        $('#create_cls_panel').show();
    } else {
        // show class schedule according to the first classroom
        $('#cls_table').show();
    }
};

function getCurrentClassRoom() {
    var classroom = $('#chooseRoom option:selected');
    if (classroom.length == 1) {
        return classroom.val();
    }
    return null;
};

// Get the Monday of specific date, each week starts from Monday
function getMonday(date) {
    var _date = moment(date);
    var dayofweek = _date.day();
    // the Monday of this week
    if (dayofweek == 0) { // today is Sunday
        _date.day(-6);
    } else {
        _date.day(1);
    }
    //set the time to the very beginning of day
    _date.hours(0).minutes(0).seconds(0).milliseconds(0);
    return _date;
};

function showAddNewClassDlg(startDateTime) {
    // reset dialog status when add a new class
    var modal = $('#cls_dlg');

    modal.find('#cls_name').val("").closest(".form-group").removeClass("has-error");
    modal.find('input[name=cost]').val(1).closest(".form-group").removeClass("has-error");
    modal.find('#cls_capacity').val(8).closest(".form-group").removeClass("has-error");
    modal.find('input[name=age_min]').val(24).closest(".form-group").removeClass("has-error");
    modal.find('input[name=age_max]').val(48).closest(".form-group").removeClass("has-error");
    modal.find('#cls_date').text(startDateTime.format('ll'));
    modal.find('#cls_time').data('DateTimePicker').date(startDateTime);
    modal.modal('show');
}

function handleAddNewClass(event) {
    var modal = $(this).closest('.modal');
    var hasError = false;
    // validate the input
    var classItem = {};
    classItem.name = modal.find('#cls_name').val();
    if (!classItem.name || classItem.name.length == 0) {
        modal.find('#cls_name').closest(".form-group").addClass("has-error");
        hasError = true;
    } else {
        modal.find('#cls_name').closest(".form-group").removeClass("has-error");
    }
    // get date/time
    classItem.date = moment(modal.find('#cls_date').text(), 'll');
    var time = modal.find('#cls_time').data("DateTimePicker").date();
    classItem.date.hours(time.hours());
    classItem.date.minutes(time.minutes());
    // get cost
    classItem.cost = parseFloat(modal.find('input[name=cost]').val());;
    if (isNaN(classItem.cost) || classItem.cost < 0) {
        modal.find('input[name=cost]').closest(".form-group").addClass("has-error");
        hasError = true;
    } else {
        modal.find('input[name=cost]').closest(".form-group").removeClass("has-error");
    }
    // get capacity
    classItem.capacity = parseInt(modal.find('#cls_capacity').val());
    if (isNaN(classItem.capacity) || classItem.capacity < 0) {
        modal.find('#cls_capacity').closest(".form-group").addClass("has-error");
        hasError = true;
    } else {
        modal.find('#cls_capacity').closest(".form-group").removeClass("has-error");
    }
    // get age limitation
    classItem.age = { min: null, max: null };
    var input = modal.find('input[name=age_min]');
    if (input.val()) {
        classItem.age.min = parseInt(input.val());
        if (isNaN(classItem.age.min) || classItem.age.min < 0) {
            input.closest(".form-group").addClass("has-error");
            hasError = true;
        } else {
            input.closest(".form-group").removeClass("has-error");
        }
    }

    var input = modal.find('input[name=age_max]');
    if (input.val()) {
        classItem.age.max = parseInt(input.val());
        if (isNaN(classItem.age.max) || classItem.age.max < 0) {
            input.closest(".form-group").addClass("has-error");
            hasError = true;
        } else {
            input.closest(".form-group").removeClass("has-error");
        }
    }

    // get classroom
    classItem.classroom = getCurrentClassRoom();

    if (!hasError) {
        // switch the age.min and age.max if min is bigger than max
        if (classItem.age.min != null && classItem.age.max != null && classItem.age.min > classItem.age.max) {
            var temp = classItem.age.max;
            classItem.age.max = classItem.age.min;
            classItem.age.min = temp;
        }
        $.ajax("/api/classes", {
            type: "POST",
            contentType: "application/json; charset=utf-8",
            data: JSON.stringify(classItem),
            success: function(data) {
                updateClasses(data);
                modal.modal('hide');
                // jump to new class page
                //window.location.href = './class/' + data._id;
            },
            error: function(jqXHR, status, err) {
                showErrorMsg(jqXHR.responseJSON ? jqXHR.responseJSON.message : jqXHR.responseText);
            },
            dataType: "json"
        });
    }
};

function updateClasses(newClass) {
    var found = false;
    for (var i = 0; i < classTableData.classes.length; i++) {
        if (classTableData.classes[i]._id == newClass._id) {
            // remove existed and replace by update one
            classTableData.classes.splice(i, 1, newClass);
            var found = true;
            break;
        }
    }
    if (!found) {
        // add as a new class item
        classTableData.classes.push(newClass);
    }
};

function updateSchedule(control) {
    var begin = moment(classTableData.monday);
    var end = moment(classTableData.monday).add(7, 'days');
    $.ajax('/api/classes', {
        type: "GET",
        //contentType : "application/x-www-form-urlencoded; charset=UTF-8",
        data: {
            from: begin.toISOString(),
            to: end.toISOString(),
            classroom: getCurrentClassRoom(),
            tenant: common.getTenantName()
        },
        success: function(data) {
            classTableData.classes = data || [];
        },
        error: function(jqXHR, status, err) {
            console.error(jqXHR.responseJSON ? jqXHR.responseJSON.message : jqXHR.responseText);
        },
        complete: function(jqXHR, status) {
            if (control) {
                control.prop("disabled", false);
            }
        },
        dataType: "json"
    });
};

function showSuccessMsg(msg) {
    var alert_bar = $('#alert_bar').removeClass('alert-danger').addClass("alert-success");
    alert_bar.find('span').text(msg);
    alert_bar.finish().show().fadeOut(2000);
};

function showErrorMsg(msg) {
    var alert_bar = $('#alert_bar').removeClass('alert-success').addClass("alert-danger");
    alert_bar.find('span').text(msg);
    alert_bar.finish().show().fadeOut(2000);
};