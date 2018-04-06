/**
 * --------------------------------------------------------------------------
 * class_view.js 
 * Entry module of view class page
 * --------------------------------------------------------------------------
 */

var i18nextplugin = require('./locales/i18nextplugin');
var class_service = require('./services/classes');
var date_picker = require('./components/date-picker.vue');
var teacher_service = require('./services/teachers');
var member_select_modal = require('./components/member-select-modal.vue');
var add_book_modal = require('./components/add-book-modal.vue');

var viewData = {
    cls: {},
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
    console.log("class_view moudle init...");
    // load the i18next plugin to Vue
    Vue.use(i18nextplugin);
    //TODO, localization 
    moment.locale('zh-CN');
    bootbox.setLocale('zh_CN');
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
            'date-picker': date_picker,
            'member-select-modal': member_select_modal,
            'add-book-modal': add_book_modal
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
                if (!this.cls.date) errors.date = '日期/时间未指定';
                if (this.cls.date && !moment(this.cls.date).isValid()) errors.date = '日期/时间格式不正确';
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
        watch: {},
        methods: {
            saveBasicInfo: function() {
                if (this.hasError) return false;

                var vm = this;
                var request = class_service.updateClass(this.cls._id, {
                    name: this.cls.name,
                    date: this.cls.date && moment(this.cls.date).toISOString(),
                    classroom: this.cls.classroom,
                    teacher: this.cls.teacher,
                    capacity: this.cls.capacity || 0, // default value take effect if capacity is ""
                    age: this.age
                });
                request.done(function(data, textStatus, jqXHR) {
                    bootbox.alert('课程基本资料更新成功');
                    vm.cls = data;
                    vm.cls.age = data.age || {};
                    vm.cls.books = data.books || [];
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
                            classid: vm.cls._id,
                            contact: value.contact,
                            name: value.name,
                            quantity: vm.quantity
                        };
                    });
                    // add one member's reservation
                    var request = class_service.addReservation(result[0]);
                    request.done(function(data, textStatus, jqXHR) {
                        var newAdded = vm.findReservation(data['class'], data['member']);
                        if (newAdded) vm.reservations.push(newAdded);
                        bootbox.alert('预约成功');
                    });
                } else {
                    bootbox.alert('所选会员已经预约');
                }
            },
            findReservation: function(cls, member) {
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
            },
            addNewBook: function(newBook) {
                var vm = this;
                var request = class_service.addBooks(vm.cls._id, newBook);
                request.done(function(data, textStatus, jqXHR) {
                    vm.cls.books = data.books;
                });
            }
        },
        created: function() {
            // Load all teachers for selection
            var vm = this;
            var request = teacher_service.getAll({status:'active'});
            request.done(function(data, textStatus, jqXHR) {
                var all = data || [];
                // all the unassigned option with null as id
                all.push({name:'<未指定>',_id:null});
                vm.teachers = all;
            });
        },
        mounted: function() {
            // 'this' is refer to vm instance
            //var vm = this;
        }
    });
}