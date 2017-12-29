/**
 * --------------------------------------------------------------------------
 * class_view.js 
 * Entry module of view class page
 * --------------------------------------------------------------------------
 */

var i18nextplugin = require('./locales/i18nextplugin');
var class_service = require('./services/classes');
var teacher_service = require('./services/teachers');
var member_select_modal = require('./components/member-select-modal.vue');

var viewData = {
    cls: {},
    date: null,
    quantity: 1,
    classrooms: {},
    teachers: [],
    reservations: []
}

// DOM Ready =============================================================
$(document).ready(function() {
    init();
    // load class object
    var request = class_service.getClass($('#class_app').data('class-id'));
    request.done(function(data, textStatus, jqXHR) {
        initPage(data);
    });
    // load class reservations
    var request2 = class_service.getReservations($('#class_app').data('class-id'));
    request2.done(function(data, textStatus, jqXHR) {
        data.forEach(function(value, index, array) {
            viewData.reservations.push(value);
        });
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

    // event listener of adding new book
    $('#newBook_dlg #add_pictureBook').click(handleAddNewBook);
    $('#newBook_dlg').on('show.bs.modal', function(event) {
        $(this).find('.form-group').removeClass('has-error');
        $(this).find('input[type=text]').val(null);
    });
}

function initPage(cls) {
    viewData.cls = cls || {};
    viewData.cls.age = viewData.cls.age || {};
    viewData.cls.books = viewData.cls.books || [];

    // bootstrap the class view page
    new Vue({
        name: 'class-app',
        el: '#class_app',
        data: viewData,
        components: {
            'member-select-modal': member_select_modal
        },
        computed: {
            membersCount: function() {
                var count = 0
                var all = this.reservations || [];
                all.forEach(function(value, index, array) {
                    count += value.quantity || 0;
                });
                return count;
            },
            booksCount: function() {
                return this.cls.books ? this.cls.books.length : 0;
            },
            age: function() {
                return {
                    min: this.cls.age.min ? parseInt(this.cls.age.min) : null,
                    max: this.cls.age.max ? parseInt(this.cls.age.max) : null
                }
            },
            errors: function() {
                var errors = {};
                if (this.cls.name.length == 0) errors.name = '名称不能为空';
                if (!this.date || !this.date.isValid()) errors.date = '日期/时间格式不正确';
                if (this.cls.capacity < 0) errors.capacity = '最大人数不能小于零';
                if (this.age.min < 0) errors.age = '最小年龄不能小于零';
                if (this.age.max < 0) errors.age = '最大年龄不能小于零';
                if (typeof this.age.max === 'number' && typeof this.age.min === 'number' && this.age.max < this.age.min)
                    errors.age = '最大年龄不能小于最小年龄';
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
            }
        },
        watch: {
            'cls.date': function() {
                $('#class_date').data('DateTimePicker').date(this.cls.date ? moment(this.cls.date) : null);
                // only update the birth in dp.change event
                //this.birth = this.memberData.birthday ? moment(this.memberData.birthday) : null;
            }
        },
        methods: {
            saveBasicInfo: function() {
                if (this.hasError) return false;

                var vm = this;
                var request = class_service.updateClass(this.cls._id, {
                    name: this.cls.name,
                    date: this.date.toISOString(),
                    classroom: this.cls.classroom,
                    teacher: this.cls.teacher,
                    capacity: this.cls.capacity || 0, // default value take effect if capacity is ""
                    age: this.age
                });
                request.done(function(data, textStatus, jqXHR) {
                    bootbox.alert('课程基本资料更新成功');
                    // update according to result
                    vm.cls.age = data.age;
                    vm.cls.capacity = data.capacity;
                });
            },
            deleteClass: function() {
                var vm = this;
                if (vm.cls.courseID) {
                    return bootbox.confirm({
                        title: "确定删除班级中的课程吗？",
                        message: "课程<strong>" + vm.cls.name + "</strong>是固定班的课程<br/>请先查看班级，并从班级管理界面中删除相关课程",
                        buttons: {
                            confirm: {
                                label: '查看班级',
                                className: "btn-success"
                            }
                        },
                        callback: function(ok) {
                            if (ok) {
                                window.location.href = '../course/' + vm.cls.courseID;
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
                        if (!ok) return;
                        var request = class_service.removeClass(vm.cls._id);
                        request.done(function(data, textStatus, jqXHR) {
                            window.location.href = '../home';
                        });

                    }
                });
            },
            removeBook: function(item) {
                var vm = this;
                bootbox.confirm({
                    title: "确定删除绘本吗？",
                    message: '从当前课程中删除绘本《' + item.title + '》',
                    buttons: {
                        confirm: {
                            className: "btn-danger"
                        }
                    },
                    callback: function(ok) {
                        if (!ok) return;
                        var request = class_service.deleteBook(vm.cls._id, item);
                        request.done(function(data, textStatus, jqXHR) {
                            vm.cls.books = data.books;
                        });
                    }
                });
            },
            showSelectMemberDlg: function(params) {
                this.$refs.memberSelectDlg.show();
            },
            addReservation: function(selectedItems) {
                // reset the quantity of reservation
                if (this.quantity === '') this.quantity = 1;

                var vm = this;
                if (selectedItems.length == 0) return bootbox.alert('请选择会员');

                var members = vm.reservations || [];
                var addedOnes = selectedItems.filter(function(element, index, array) {
                    // filter the new added member
                    return !members.some(function(value, index, array) {
                        // find one matched member and return true
                        return value.member == element._id;
                    });
                });

                if (addedOnes.length > 0) {
                    var result = addedOnes.map(function(value, index, array) {
                        return {
                            classid: viewData.cls._id,
                            contact: value.contact,
                            name: value.name,
                            quantity: vm.quantity
                        };
                    });
                    // add one member's reservation
                    var request = class_service.addReservation(result[0]);
                    request.done(function(data, textStatus, jqXHR) {
                        var newAdded = findReservation(data['class'], data['member']);
                        if (newAdded) vm.reservations.push(newAdded);
                        bootbox.alert('预约成功');
                    });
                } else {
                    bootbox.alert('所选会员已经预约');
                }
            },
            cancelReservation: function(item) {
                var vm = this;
                bootbox.confirm({
                    title: '确定取消会员预约吗？',
                    message: '取消会员的预约，并且返还扣除的课时，无法在课程开始后取消',
                    buttons: {
                        confirm: {
                            className: "btn-danger"
                        }
                    },
                    callback: function(ok) {
                        if (!ok) return;
                        var request = class_service.deleteReservation(vm.cls._id, { 'memberid': item.member });
                        request.done(function(data, textStatus, jqXHR) {
                            var reservations = vm.reservations;
                            for (var i = 0; i < reservations.length; i++) {
                                if (reservations[i].member == item.member) {
                                    reservations.splice(i, 1);
                                    break;
                                }
                            }
                        });
                    }
                });
            }
        },
        created: function() {
            // Load all teachers for selection
            var vm = this;
            var request = teacher_service.getAll();
            request.done(function(data, textStatus, jqXHR) {
                var all = data || [];
                // all the unassigned option with null as id
                all.push({name:'<未指定>',_id:null});
                vm.teachers = all;
            });
        },
        mounted: function() {
            // 'this' is refer to vm instance
            var vm = this, datepicker = $(this.$el).find('#class_date');
            datepicker.datetimepicker({
                format: 'lll',
                locale: 'zh-CN',
                sideBySide: true
            });
            datepicker.data('DateTimePicker').date(this.cls.date ? moment(this.cls.date) : null);
            vm.date = datepicker.data('DateTimePicker').date();

            datepicker.on('dp.change', function(e) {
                // when user clears the input box, the 'e.date' is false value
                vm.date = e.date === false ? null : e.date;
            });
        }
    });
}

function handleAddNewBook(e) {
    var modal = $(this).closest('.modal');
    var book = {};
    book.title = modal.find('input[name=book_name]').val().trim();
    if (!book.title) {
        return markError(modal, 'input[name=book_name]', true);
    } else {
        markError(modal, 'input[name=book_name]', false);
    }
    book.teacher = modal.find('input[name=book_teacher]').val().trim();
    if (!book.teacher) {
        return markError(modal, 'input[name=book_teacher]', true);
    } else {
        markError(modal, 'input[name=book_teacher]', false);
    }
    book.info = modal.find('input[name=book_info]').val().trim();
    var request = class_service.addBooks(viewData.cls._id, book);
    request.done(function(data, textStatus, jqXHR) {
        viewData.cls.books = data.books;
    });
    modal.modal('hide');
}

function markError(container, selector, hasError) {
    if (hasError) {
        container.find(selector).closest(".form-group").addClass("has-error");
    } else {
        container.find(selector).closest(".form-group").removeClass("has-error");
    }
}

function findReservation(cls, member) {
    if (!cls || !member) return null;
    var booking = cls.booking || [];
    var found = booking.filter(function(value, index, array) {
        return value.member == member._id;
    });
    if (found.length != 1) return null;
    var item = found[0];
    item.userName = member.name;
    item.contact = member.contact;
    return item;
}