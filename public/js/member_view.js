/* Copyright 2016-2017 Chuanyu Wang */
(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * --------------------------------------------------------------------------
 * member_view.js single member view page main entry module
 * --------------------------------------------------------------------------
 */

var memberData = {
    "_id": "5787bac1e0de69928c6ad14c",
    "since": "2016-07-14T16:16:01.604Z",
    "name": "33",
    "contact": "33",
    "birthday": "2015-07-08T16:00:00.000Z",
    "expire": "2019-07-14T16:15:51.750Z",
    "note": "abc notes",
    "membership": [
        {
            "type": "ALL",
            "room": [],
            "expire": "2019-07-14T16:15:51.750Z",
            "credit": 10
        }
    ],
    "status": "active",
    "errors": null
};

var viewData = {
    memberData: {},
    delta: 0,
    errors: null
}

// DOM Ready =============================================================
$(document).ready(function() {
    init();

    // register the class list in table
    Vue.component('card', {
        template: '#card-template',
        props: {
            index: Number, // index of membership card
            item: Object // object of membership card object
        },
        data: function() {
            return {
                delta: 0,
                type: this.item.type,
                expire: this.item.expire ? moment(this.item.expire) : null,
                error: null,
                allRooms: []
            };
        },
        watch: {},
        computed: {
            expireDate: function() {
                return this.expire ? this.expire.format('ll') : null;
            },
            checkAllRooms: function() {
                return this.type === 'ALL';
            }
        },
        filters: {},
        methods: {
            alterCharge: function(value) {
                if (typeof(this.delta) !== 'number') {
                    this.delta = parseFloat(this.delta) || 0;
                }
                this.delta += value;
            },
            autoSelectRooms: function() {
                if (this.type == 'ALL') {
                    // auto select all rooms
                    this.item.room = this.allRooms;
                }
            },
            validteBeforeSave: function() {
                this.error = null;
                if (typeof(this.delta) !== 'number') {
                    this.error = '增加/减少的课时数不正确';
                    return;
                }
                if (!this.expire || !this.expire.isValid()) {
                    this.error = '请指定会员有效期';
                    return;
                }
                if (!this.type) {
                    this.error = '请选择会员卡类型';
                    return;
                }
                var toBeSaved = {
                    "type": this.type,
                    "room": this.item.room,
                    "expire": this.expire && this.expire.toISOString(),
                    "credit": this.item.credit + this.delta
                };
                this.$emit("save", toBeSaved, this.index);
            }
        },
        mounted: function() {
            var vm = this;
            $(this.$el).find('#expire_date').datetimepicker({
                format: 'll',
                locale: 'zh-CN'
            });
            $(this.$el).find('#expire_date').on('dp.change', function(e) {
                // update the expire value from datetimepicker control event
                vm.expire = e.date;
            });
            $(this.$el).find('#roomlist input').each(function(index, el) {
                vm.allRooms.push(el.value);
            });
        }
    });

    // bootstrap the class table
    var memberViewer = new Vue({
        el: '#member_app',
        data: viewData,
        computed: {
            birthDate: function() {
                return this.memberData.birthday && moment(this.memberData.birthday).format('ll');
            }
        },
        filters: {
            formatDate: function(value) {
                if (!value) return '?';
                return moment(value).format('ll');
            }
        },
        watch: {},
        methods: {
            saveBasicInfo: function() {
                this.errors = null;
                if (this.memberData.name.length == 0) this.errors = { basic: '姓名不能为空' };
                if (this.memberData.contact.length == 0) this.errors = { basic: '联系方式不能为空' };
                if (moment(this.memberData.birthday).isValid == false) this.errors = { basic: '生日格式不正确' };
                if (!this.errors) {
                    var request = update({
                        status: this.memberData.status,
                        name: this.memberData.name,
                        contact: this.memberData.contact,
                        note: this.memberData.note,
                        birthday: this.memberData.birthday
                    });
                    request.done(function(data, textStatus, jqXHR) {
                        bootbox.alert('会员基本资料更新成功');
                    });
                }
            },
            saveCardInfo: function(card, index) {
                // TODO, update card
                console.log(card);
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
        },
        mounted: function() {
            // 'this' is refer to vm instance
            var vm = this;
            $(this.$el).find('#birth_date').datetimepicker({
                format: 'll',
                locale: 'zh-CN'
            });
            $(this.$el).find('#birth_date').on('dp.change', function(e) {
                // update the expire value from datetimepicker control event
                vm.memberData.birthday = e.date;
                console.log(vm.memberData.birthday);
            });
        }
    });

    var request = getMemberInfo($('#member_app').data('member-id'));
    request.done(function(data, textStatus, jqXHR) {
        viewData.memberData = data;
    });
});

// Functions =============================================================

function init() {
    console.log("init view member ~~~");
    moment.locale('zh-CN');
};

function update(fields) {
    var request = $.ajax("/api/members/" + viewData.memberData._id, {
        type: "PATCH",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(fields),
        complete: function(jqXHR, status) {
            //TODO
        },
        dataType: "json"
    });

    request.fail(function(jqXHR, textStatus, errorThrown) {
        // alert dialog with danger button
        bootbox.dialog({
            message: jqXHR.responseJSON ? jqXHR.responseJSON.message : jqXHR.responseText,
            title: "更新会员失败",
            buttons: {
                danger: {
                    label: "确定",
                    className: "btn-danger"
                }
            }
        });
    })
    return request;
};

function getMemberInfo(id) {
    var request = $.getJSON("/api/members/" + id, '');

    request.fail(function(jqXHR, textStatus, errorThrown) {
        // alert dialog with danger button
        bootbox.dialog({
            message: jqXHR.responseJSON ? jqXHR.responseJSON.message : jqXHR.responseText,
            title: "更新会员失败",
            buttons: {
                danger: {
                    label: "确定",
                    className: "btn-danger"
                }
            }
        });
    })
    return request;
};
},{}]},{},[1]);
