/**
 * --------------------------------------------------------------------------
 * class_view.js 
 * Entry module of view class page
 * --------------------------------------------------------------------------
 */

var viewData = {
    cls: {},
    date: null,
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

    var request = getClass($('#class_app').data('class-id'));
    request.done(function(data, textStatus, jqXHR) {
        initPage(data);
    });
    request.done(function(data, textStatus, jqXHR) {
        //loadCourseClasses(data);
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
    $('#newBook_dlg #add_pictureBook').click(handleAddNewBook);
    $('#newBook_dlg').on('show.bs.modal', function(event) {
        $(this).find('.form-group').removeClass('has-error');
    });

    // event listener of adding new comment
    $('#member_dlg #add_member').click(handleClickAddMember);
    $('#member_dlg').on('shown.bs.modal', function(event) {
        // check booked members
        var members = viewData.cls.booking || [];
        var checkedItems = members.map(function(value, index, array) {
            return value.member;
        });
        $(this).find('table').bootstrapTable('checkBy', { field: '_id', values: checkedItems });
    });
};

function initPage(cls) {
    viewData.cls = cls || {};

    // bootstrap the class view page
    var classViewer = new Vue({
        el: '#class_app',
        data: viewData,
        computed: {
            membersCount: function() {
                return this.cls.booking ? this.cls.booking.length : 0;
            },
            booksCount: function() {
                return this.cls.books ? this.cls.books.length : 0;
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
        watch: {
            'cls.date': function() {
                console.log('set cls.date');
                $('#class_date').data('DateTimePicker').date(this.cls.date ? moment(this.cls.date) : null);
                // only update the birth in dp.change event
                //this.birth = this.memberData.birthday ? moment(this.memberData.birthday) : null;
            }
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
            deleteClass: function() {
                var vm = this;
                bootbox.confirm({
                    title: "确定要删除课程吗？",
                    message: "删除班级中所有课程，包括已经开始的课程？",
                    buttons: {
                        confirm: {
                            className: "btn-danger"
                        }
                    },
                    callback: function(ok) {
                        if (ok) {
                            var request = removeCourse(vm.course._id);
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
                        var request = removeCourseClasses(vm.course._id, { 'id': item._id });
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
                        var request = removeCourseMember(vm.course._id, { 'id': item.id });
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
            var vm = this, datepicker = $(vm.$el).find('#class_date');
            datepicker.datetimepicker({
                format: 'lll',
                locale: 'zh-CN',
                sideBySide: true
            });
            datepicker.data('DateTimePicker').date(this.cls.date ? moment(this.cls.date) : null);

            datepicker.on('dp.change', function(e) {
                // when user clears the input box, the 'e.date' is false value
                vm.date = e.date === false ? null : e.date;
            });
        }
    });
};

function loadCourseClasses(course) {
    if (!course) return;
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

function handleAddNewBook(e) {
    var modal = $(this).closest('.modal');
    var book= {};
    book.title = modal.find('input[name=book_name]').val().trim();
    if (!book.title) {
        markError(modal, 'input[name=book_name]', true);
        return;
    } else {
        markError(modal, 'input[name=book_name]', false);
    }
    book.teacher = modal.find('input[name=book_teacher]').val().trim();
    if (!book.teacher) {
        markError(modal, 'input[name=book_teacher]', true);
        return;
    } else {
        markError(modal, 'input[name=book_teacher]', false);
    }
    book.info = modal.find('input[name=book_info]').val().trim();
    //TODO, 
    modal.modal('hide');
};

function handleClickAddMember() {
    var modal = $(this).closest('.modal');
    var selections = modal.find('table').bootstrapTable('getAllSelections');

    var members = viewData.cls.booking || [];
    var addedOnes = selections.filter(function(element, index, array) {
        // filter the new added member
        return !members.some(function(value, index, array) {
            // find one matched member and return true
            return value.member == element._id;
        });
    });

    if (addedOnes.length > 0) {
        // initialize booking property
        if (!viewData.cls.hasOwnProperty('booking')) {
            Vue.set(viewData.course, 'booking', [])
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


/**
 * Retrieve classID object according to ID
 * 
 * @param {String} classID 
 */
function getClass(classID) {
    var request = $.getJSON('/api/classes/' + classID, null);
    request.fail(function(jqXHR, textStatus, errorThrown) {
        showAlert('获取课程失败', jqXHR);
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

function removeCourse(coureID, fields) {
    var request = $.ajax("/api/courses/" + coureID, {
        type: "DELETE",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(fields),
        dataType: "json"
    });
    request.fail(function(jqXHR, textStatus, errorThrown) {
        showAlert("删除班级失败", jqXHR);
    })
    return request;
};

function getCourseClasses(coureID) {
    var request = $.getJSON('/api/classes', { 'courseID': coureID });
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