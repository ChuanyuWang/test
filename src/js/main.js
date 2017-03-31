/**
 * --------------------------------------------------------------------------
 * main.js Home page main entry module
 * --------------------------------------------------------------------------
 */
var common = require('./common');
var initClassCell = require('./components/class-cell');
// local cache for class or event
var cls_cache = {};
var classTableData = {
    monday: null,
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
                    if (moment(a.date).isBefore(b.date)) return -1;
                    else return 1;
                })
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
            getDateTime: function(section, dayOffset) {
                return moment(this.monday).add(dayOffset, 'days').toDate();
            },
            viewClass: function(classItem) {
                handleViewClass(classItem);
            },
            deleteClass: function(classItem) {
                handleRemoveClass(classItem);
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
    $('#modify_cls').click(handleModifyClass);
    $('#add_reservation').click(handleAddReservation);
    $('#add_books').click(handleAddBooks);

    // listen to the previous week and next week button
    $('#previous_week').click(function(event) {
        $("this").prop("disabled", true);
        classTableData.monday.subtract(7, 'days');
        updateSchedule($("this"));
    });

    $('#next_week').click(function(event) {
        $("this").prop("disabled", true);
        classTableData.monday.add(7, 'days');
        updateSchedule($("this"));
    });

    $('#current_week').click(function(event) {
        $("this").prop("disabled", true);
        classTableData.monday = getMonday(moment());
        updateSchedule($("this"));
    });

    // handle user change the classroom
    $('#chooseRoom').change(function(event) {
        updateSchedule();
    });
});

// Functions =============================================================

function init() {
    console.log("welcome~~~");
    moment.locale('zh-CN');
    bootbox.setLocale('zh_CN');
    $('#cls_time').datetimepicker({
        locale: 'zh-CN',
        format: 'LT'
    });
    classTableData.monday = getMonday(moment());
    initClassRoomList();
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
    var classItem = {
        reservation: 0
    };
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
                // update the cache
                cls_cache[data._id] = data;
                updateClasses(data);
                modal.modal('hide');
            },
            error: function(jqXHR, status, err) {
                showErrorMsg(jqXHR.responseJSON ? jqXHR.responseJSON.message : jqXHR.responseText);
            },
            dataType: "json"
        });
    }
};

function handleViewClass(class_item) {
    if (!class_item) {
        console.error("class_item is null");
        return;
    }

    var class_id = class_item._id;

    var modal = $('#view_dlg');
    modal.find('#cls_name').val(class_item.name).closest(".form-group").removeClass("has-error");
    modal.find('#cls_cost').text(class_item.cost);
    modal.find('#cls_date').text(moment(class_item.date).format('lll'));
    modal.find('#cls_capacity').val(class_item.capacity).closest(".form-group").removeClass("has-error");
    if (class_item.age) {
        modal.find('input[name=age_min]').val(class_item.age.min).closest(".form-group").removeClass("has-error");
        modal.find('input[name=age_max]').val(class_item.age.max).closest(".form-group").removeClass("has-error");
    }

    // cache the class ID on member table
    modal.find('#member_table').data('classid', class_id);
    modal.find('#member_table').bootstrapTable('removeAll');
    modal.find('#member_table').bootstrapTable('refresh', { url: '/api/booking', query: { classid: class_id } });
    $('#view_dlg').modal('show');
};

function handleAddReservation(event) {
    var view_dlg = $(this).closest('.modal');
    var class_id = view_dlg.find('#member_table').data('classid');
    view_dlg.modal('hide');

    var class_item = cls_cache[class_id];
    if (!class_item) {
        console.error("Can't find the class info with id: " + class_id);
        return;
    }

    // set the class id
    var book_dlg = $('#search_member');
    book_dlg.find('table').data('classid', class_id);
    book_dlg.find('#cls_name').text(class_item.name);
    book_dlg.find('#quantity').val(1).closest(".form-group").removeClass("has-error");;
    // refresh the member list (active only)
    book_dlg.find('table').bootstrapTable('refresh', { url: '/api/members', query: { status: 'active' } });

    book_dlg.modal('show');
};

function handleAddBooks(event) {
    var view_dlg = $(this).closest('.modal');
    var class_id = view_dlg.find('#member_table').data('classid');
    view_dlg.modal('hide');

    var class_item = cls_cache[class_id];
    if (!class_item) {
        console.error("Can't find the class info with id: " + class_id);
        return;
    }

    // set the class id
    var dlg_books = $('#dlg_books');

    // clear the previous contents
    dlg_books.find("div input").each(function() {
        $(this).val(null);
    });

    // update the new contents from cache
    var books = class_item.books || [];
    var index = 0;
    dlg_books.find("div.book-item").each(function() {
        if (books[index]) {
            var item = books[index++];
            $(this).find("input[name=book_name]").val(item.title);
            $(this).find("input[name=book_teacher]").val(item.teacher);
            $(this).find("input[name=book_info]").val(item.info);
        }
    });

    // hook up the OK button click event
    $('#btn_modify_books').off("click");
    $('#btn_modify_books').click(function(event) {
        //get the update content of books
        var books = [];
        var hasError = false;
        dlg_books.find("div.book-item").each(function() {
            var item = {
                title: $(this).find("input[name=book_name]").val().trim(),
                teacher: $(this).find("input[name=book_teacher]").val().trim(),
                info: $(this).find("input[name=book_info]").val().trim()
            };
            // handle error input
            $(this).find("div").removeClass("has-error");
            // both teach and title are mandatory for one book item
            if (item.teacher && !item.title) {
                $(this).find("input[name=book_name]").closest("div").addClass("has-error");
                hasError = true;
            } else if (item.title && !item.teacher) {
                $(this).find("input[name=book_teacher]").closest("div").addClass("has-error");
                hasError = true;
            } else if (item.title && item.teacher) {
                books.push(item);
            }
        });

        if (hasError) {
            return; // Don't dismiss the dialog when there is input error
        }

        $.ajax("/api/classes/" + class_id, {
            type: "PUT",
            contentType: "application/json; charset=utf-8",
            data: JSON.stringify({ "books": books }),
            success: function(data) {
                //close the dialog
                dlg_books.modal('hide');
                //update books cache of the class
                class_item.books = books;
            },
            error: function(jqXHR, status, err) {
                showErrorMsg(jqXHR.responseJSON ? jqXHR.responseJSON.message : jqXHR.responseText);
            },
            complete: function(jqXHR, status) {
                //TODO
            },
            dataType: "json"
        });
    });

    dlg_books.modal('show');
};

function handleModifyClass(event) {
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

    if (!hasError) {
        // switch the age.min and age.max if min is bigger than max
        if (classItem.age.min != null && classItem.age.max != null && classItem.age.min > classItem.age.max) {
            var temp = classItem.age.max;
            classItem.age.max = classItem.age.min;
            classItem.age.min = temp;
        }

        var class_id = modal.find('#member_table').data('classid');
        $.ajax("/api/classes/" + class_id, {
            type: "PUT",
            contentType: "application/json; charset=utf-8",
            data: JSON.stringify(classItem),
            success: function(data) {
                //close the dialog
                modal.modal('hide');
                // update the cache TODO, get new cls from server
                var class_item = cls_cache[class_id];
                class_item.name = classItem.name;
                class_item.capacity = classItem.capacity;
                class_item.age = classItem.age;
            },
            error: function(jqXHR, status, err) {
                showErrorMsg(jqXHR.responseJSON ? jqXHR.responseJSON.message : jqXHR.responseText);
            },
            complete: function(jqXHR, status) {
                //TODO
            },
            dataType: "json"
        });
    }
};

// event handler defined in home.jade file for removing booking item
window.handleDeleteBook = {
    'click .remove': function(e, value, row, index) {
        var class_id = $(e.target).closest('table').data('classid');

        $.ajax("/api/booking/" + class_id, {
            type: "DELETE",
            contentType: "application/json; charset=utf-8",
            data: JSON.stringify({ memberid: row.member }),
            success: function(data) {
                // update the cache
                var class_item = cls_cache[class_id];
                // TODO, check the return 'data' as new class item
                class_item.reservation -= row.quantity;
                $('#member_table').bootstrapTable('removeByUniqueId', row.member);
                showSuccessMsg("成功取消预约");
            },
            error: function(jqXHR, status, err) {
                showErrorMsg(jqXHR.responseJSON ? jqXHR.responseJSON.message : jqXHR.responseText);
            },
            complete: function(jqXHR, status) {
                //TODO
            },
            dataType: "json"
        });
    }
};

function handleRemoveClass(class_item) {
    var item_id = class_item._id;

    //TODO, make this confirm as danger style
    bootbox.confirm("删除此课程吗？", function(result) {
        if (!result) { // user cancel
            return;
        }

        $.ajax("/api/classes/" + item_id, {
            type: "DELETE",
            contentType: "application/json; charset=utf-8",
            data: JSON.stringify({ dummy: 1 }),
            success: function(data) {
                // update the cache
                cls_cache[item_id] = undefined;
                // TODO, check the 'data' and remove class
                removeClasses(class_item);
                showSuccessMsg("删除成功");
            },
            error: function(jqXHR, status, err) {
                showErrorMsg(jqXHR.responseJSON ? jqXHR.responseJSON.message : jqXHR.responseText);
            },
            complete: function(jqXHR, status) {
                //TODO
            },
            dataType: "json"
        });
    });
};

// event handler defined in home.jade file for adding booking item
window.handleAddBook = {
    'click .book': function(e, value, row, index) {
        var class_id = $(e.target).closest('table').data('classid');
        var bookInfo = {
            classid: class_id,
            name: row.name,
            contact: row.contact
        };

        // get quantity
        var modal = $(e.target).closest('.modal');
        bookInfo.quantity = parseInt(modal.find('#quantity').val());
        if (isNaN(bookInfo.quantity) || bookInfo.quantity <= 0) {
            modal.find('#quantity').closest(".form-group").addClass("has-error");
            return;
        } else {
            modal.find('#quantity').closest(".form-group").removeClass("has-error");
        }

        $.ajax("/api/booking/", {
            type: "POST",
            contentType: "application/json; charset=utf-8",
            data: JSON.stringify(bookInfo),
            success: function(data) {
                // update the cache
                var classInfo = data['class'];
                cls_cache[classInfo._id] = classInfo;
                updateClasses(classInfo);
                showSuccessMsg("预约成功");
                $(e.target).closest('tr').hide(600, function() {
                    $('#search_member table').bootstrapTable('removeByUniqueId', row._id);
                });
            },
            error: function(jqXHR, status, err) {
                showErrorMsg(jqXHR.responseJSON ? jqXHR.responseJSON.message : jqXHR.responseText);
            },
            complete: function(jqXHR, status) {
                //TODO
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
}

function removeClasses(oldClass) {
    var found = false;
    for (var i = 0; i < classTableData.classes.length; i++) {
        if (classTableData.classes[i]._id == oldClass._id) {
            // remove the old one
            classTableData.classes.splice(i, 1);
            found = true;
            break;
        }
    }
    if (!found) {
        console.error("can't find the oldClass");
    }
}

// sort the array of class from Monday to Sunday
function sortClass(a, b) {
    if (!a || !b) {
        return 0;
    }

    if (moment(a.date) < moment(b.date)) {
        return -1;
    } else {
        return 1;
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
            if (data && $.isArray(data)) {
                // the data is already sorted in server side as "asc"
                //data.sort(sortClass);
                for (var i = 0; i < data.length; i++) {
                    // update the cache
                    cls_cache[data[i]._id] = data[i];
                }
            }
        },
        error: function(jqXHR, status, err) {
            console.error(jqXHR.responseText);
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