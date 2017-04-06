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
    memberData : {},
    errors : null
}

// DOM Ready =============================================================
$(document).ready(function() {
    init();

    // bootstrap the class table
    var memberViewer = new Vue({
        el: '#member_app',
        data: viewData,
        computed: {
        },
        filters: {
            test: function(dateString) {
                return moment(dateString);
            }
        },
        methods: {
            saveBasicInfo: function() {
                this.errors = null;
                if (this.memberData.name.length == 0) this.errors = { basic: '姓名不能为空' };
                if (this.memberData.contact.length == 0) this.errors = { basic: '联系方式不能为空' };
                var birth = $(this.$el).find('#birth_date').data('DateTimePicker').date();
                if (birth && birth.isValid() == false) this.errors = { basic: '生日格式不正确' };
                if (!this.errors) {
                    var request = update({
                        status: this.memberData.status,
                        name: this.memberData.name,
                        contact: this.memberData.contact,
                        note: this.memberData.note,
                        birthday: birth
                    });
                    request.done(function(data, textStatus, jqXHR) {
                        bootbox.alert('会员基本资料更新成功');
                    });
                }
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
        },
        mounted: function() {
            // 'this' is refer to vm instance
            $(this.$el).find('#birth_date').datetimepicker({
                format: 'll',
                locale: 'zh-CN',
                defaultDate: this.memberData.birthday
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