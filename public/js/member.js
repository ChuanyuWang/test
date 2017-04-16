/* Copyright 2016-2017 Chuanyu Wang */
(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * --------------------------------------------------------------------------
 * common.js
 * --------------------------------------------------------------------------
 */

module.exports = {
    /**
     * get the tenat name of current page, e.g.
     * return 'bqsq' from http://localhost:3000/t/bqsq/course/1/view
     */
    getTenantName: function() {
        var pathname = window.location.pathname;
        if (pathname.length == 0) return "";
        if (pathname.charAt(0) == '/') pathname = pathname.substring(1);
        if (pathname.charAt(0) == 't') pathname = pathname.substring(1);
        if (pathname.charAt(0) == '/') pathname = pathname.substring(1);
        return pathname.split('/')[0];
    },
    /**
     * Data fomatter function of bootstrap-table to format date localized string by 'll'
     * 
     * @param {Object} value the field value
     * @param {Object} row the row record data
     * @param {Number} index the row index
     */
    dateFormatter: function(value, row, index) {
        if (value) {
            return moment(value).format('ll');
        } else {
            return undefined;
        }
    }
};
},{}],2:[function(require,module,exports){
/**
 * --------------------------------------------------------------------------
 * member.js members page main entry module
 * --------------------------------------------------------------------------
 */

var common = require('./common');

// DOM Ready =============================================================
$(document).ready(function() {
    init();

    $('#member_dlg').on('show.bs.modal', function(event) {
        var button = $(event.relatedTarget); // Button that triggered the modal
        if (button.data('action') == "add") {
            // create a new member
            var modal = $(this);
            modal.find('h4').text("添加会员");
            modal.find('input[name=name]').val("").closest(".form-group").removeClass("has-error");
            modal.find('input[name=contact]').val("").closest(".form-group").removeClass("has-error");
            modal.find('#birth_date').data('DateTimePicker').date(null);
            modal.find('textarea[name=note]').val("");
            modal.find('#add_member').show();
        }
    });

    $('#member_dlg').on('shown.bs.modal', function(event) {
        $(this).find('input[name=name]').focus(); // focus on the member name input control
    });

    $('#viewMember').click(viewMember);
    $('#add_member').click(handleAddNewMember);
    $('div.statusFilter button').click(handleFilterStatus);
});

// Functions =============================================================

function init() {
    moment.locale('zh-CN');
    bootbox.setLocale('zh_CN');
    $('#birth_date').datetimepicker({
        format: 'll',
        locale: 'zh-CN',
        defaultDate: moment()
    });
    $('#expire_date').datetimepicker({
        format: 'll',
        locale: 'zh-CN',
        defaultDate: moment().add(6, 'months')
    });

    $('#member_table').bootstrapTable({
        locale: 'zh-CN',
        columns: [{}, {}, {}, {
            formatter: common.dateFormatter
        }, {
            formatter: creditFormatter
        }, {}, {
            formatter: common.dateFormatter
        }, {}
        ]
    });

    // Fix for table control, current version 1.11.1
    $('#member_table').on("page-change.bs.table", function(number, size) {
        //uncheck all the selected rows to fix the radio column only take effects in one page
        var items = $('#member_table').bootstrapTable('getSelections');
        for (var i = 0; i < items.length; i++) {
            $('#member_table').bootstrapTable('uncheckBy', { field: '_id', values: [items[i]._id] });
        }
    });

    $('#membership_dlg select[name=card_type]').change(function(event) {
        if ($(this).find('option:selected').val() == 'ALL') {
            $('#membership_dlg #roomlist input').prop('checked', true);
            $('#membership_dlg #roomlist input').prop('disabled', true);
        } else {
            $('#membership_dlg #roomlist input').prop('disabled', false);
        }
    });
    // listen to the action button on modal dialogs
    $('#membership_dlg button#log_btn').click(openChangeLogDlg);
    $('#membership_dlg button#ok').click(updateMemberShip);
};

// return true if an error occurs after validation, otherwise return false
function validateInput(modal, memberInfo) {
    var hasError = false;

    memberInfo.name = modal.find('input[name=name]').val();
    if (!memberInfo.name || memberInfo.name.length == 0) {
        modal.find('input[name=name]').closest(".form-group").addClass("has-error");
        hasError = true;
    } else {
        modal.find('input[name=name]').closest(".form-group").removeClass("has-error");
    }

    memberInfo.contact = modal.find('input[name=contact]').val();
    if (!memberInfo.contact || memberInfo.contact.length == 0) {
        modal.find('input[name=contact]').closest(".form-group").addClass("has-error");
        hasError = true;
    } else {
        modal.find('input[name=contact]').closest(".form-group").removeClass("has-error");
    }

    // get birth date
    memberInfo.birthday = modal.find('#birth_date').data("DateTimePicker").date();
    memberInfo.note = modal.find('textarea[name=note]').val().trim();

    return hasError;
};

function handleAddNewMember(event) {
    var modal = $(this).closest('.modal');
    var newMember = {
        since: moment(),
        membership: []
    };

    // validate the input
    if (!validateInput(modal, newMember)) {
        modal.modal('hide');
        addNewMember(newMember);
    }
};

function addNewMember(member) {
    $.ajax("/api/members", {
        type: "POST",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(member),
        success: function(data) {
            $('#member_table').bootstrapTable('insertRow', { index: 0, row: data });
        },
        error: function(jqXHR, status, err) {
            bootbox.dialog({
                message: jqXHR.responseJSON ? jqXHR.responseJSON.message : jqXHR.responseText,
                title: "添加会员失败",
                buttons: {
                    danger: {
                        label: "确定",
                        className: "btn-danger",
                    }
                }
            });
            //console.error(jqXHR);
        },
        dataType: "json"
    });
};

function updateMemberShip(event) {
    var modal = $(this).closest('.modal');
    var member_id = modal.data('id');
    var member = $('#member_table').bootstrapTable('getRowByUniqueId', member_id);
    var memberCard = { room: [] };

    var hasError = false;

    // get expire date
    memberCard.expire = modal.find('#expire_date').data("DateTimePicker").date();
    memberCard.type = modal.find('select[name=card_type] option:selected').val();
    if (memberCard.type == null) {
        modal.find('select[name=card_type]').closest(".form-group").addClass("has-error");
        hasError = true;
    } else {
        modal.find('select[name=card_type]').closest(".form-group").removeClass("has-error");

    }
    // get limited classrooms
    modal.find('#roomlist input:checked').each(function(index, element) {
        memberCard.room.push($(this).val());
    });

    // get charge value
    var newVal = parseFloat(modal.find('input[name=charge]').val());
    if (isNaN(newVal)) {
        modal.find('input[name=charge]').closest(".form-group").addClass("has-error");
        hasError = true;
    } else {
        modal.find('input[name=charge]').closest(".form-group").removeClass("has-error");
        if (newVal != 0) {
            memberCard.credit = member.membership[0].credit;
            memberCard.credit += newVal;
        }
    }

    if (hasError) return;

    //TODO, support multi membership card in the future
    $.ajax("/api/members/" + member_id + '/memberships/0', {
        type: "PATCH",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(memberCard),
        success: function(doc) {
            $('#member_table').bootstrapTable('updateByUniqueId', { id: member_id, row: doc });
            modal.modal('hide');
        },
        error: function(jqXHR, status, err) {
            bootbox.dialog({
                message: jqXHR.responseJSON ? jqXHR.responseJSON.message : jqXHR.responseText,
                title: "修改会员卡失败",
                buttons: {
                    danger: {
                        label: "确定",
                        className: "btn-danger",
                    }
                }
            });
            //console.error(jqXHR);
        },
        dataType: "json"
    });
};

// event handler defined in home.jade file for removing booking item
window.editMembership = {
    'click .membership': function(e, value, row, index) {
        if (row.membership && row.membership.length > 0) {
            openEditMembershipCardDlg(row);
        } else {
            // confirm to create membership card
            bootbox.confirm('为此会员创建会员卡吗？', function(ok) {
                if (!ok) return;
                var request = $.ajax("/api/members/" + row._id + "/memberships", {
                    type: "POST",
                    contentType: "application/json; charset=utf-8",
                    data: JSON.stringify({
                        credit: 0,
                        // the default expire date is 3 months later
                        expire: moment().add(3, 'months').hours(0).minutes(0).seconds(0).millisecond(0),
                        room: [],
                        type: 'ALL'
                    }),
                    dataType: "json"
                });
                request.done(function(data, textStatus, jqXHR) {
                    $('#member_table').bootstrapTable('updateByUniqueId', { id: row._id, row: data });
                    // show membership card dialog
                    openEditMembershipCardDlg(data);
                }).fail(function(jqXHR, textStatus, errorThrown) {
                    // alert dialog with danger button
                    bootbox.dialog({
                        message: jqXHR.responseJSON ? jqXHR.responseJSON.message : jqXHR.responseText,
                        title: "创建会员卡失败",
                        buttons: {
                            ok: {
                                label: "确定",
                                className: "btn-danger"
                            }
                        }
                    });
                });
            })
        }
    }
};

function openEditMembershipCardDlg(member) {
    if (member.membership && member.membership.length > 0) {
        var membership = member.membership[0];
    }
    if (!membership) return;

    var modal = $('#membership_dlg').data('id', member._id);
    modal.find('#name').text(member.name);
    modal.find('#credit').text(Math.round(membership.credit * 10) / 10 || 0);
    modal.find('input[name=charge]').val(0).closest(".form-group").removeClass("has-error");
    modal.find('#expire_date').data('DateTimePicker').date(moment(membership.expire));
    modal.find('#roomlist input').prop('disabled', false);
    modal.find('#roomlist input').prop('checked', false);
    modal.find('select[name=card_type]').closest(".form-group").removeClass("has-error");
    if (membership.type) {
        modal.find('select[name=card_type] option[value=' + membership.type + ']').prop('selected', true);
        // update classroom check box
        switch (membership.type) {
            case "ALL":
                modal.find('#roomlist input').prop('checked', true);
                modal.find('#roomlist input').prop('disabled', true);
                break;
            case "LIMITED":
                for (var index in membership.room) {
                    modal.find('#roomlist input[value=' + membership.room[index] + ']').prop('checked', true);
                }
                break;
        }
    } else {
        modal.find('select[name=card_type]').prop('selectedIndex', -1);
    }

    $('#membership_dlg').modal('show');
};

function openChangeLogDlg(event) {
    var memberCard_dlg = $(this).closest('.modal');
    var member_id = memberCard_dlg.data('id');
    memberCard_dlg.modal('hide');
    var member = $('#member_table').bootstrapTable('getRowByUniqueId', member_id);

    // set the member id
    var changeLogDlg = $('#changeLog_dlg');
    changeLogDlg.find('#name').text(member.name);
    // refresh the change log
    changeLogDlg.find('table').bootstrapTable('refresh', { url: '/api/members/' + member_id + '/history' });
    // show the dialog in the end
    changeLogDlg.modal('show');
};

window.customQuery = function(params) {
    // params : {search: "", sort: undefined, order: "asc", offset: 0, limit: 15}
    var filter = $("#filter_dlg input:checked").val();
    params.filter = filter;
    var status = $('div.statusFilter button.btn-info').data('filter');
    params.status = status;
    return params;
};

function handleFilterStatus(event) {
    var btn = $(this);
    btn.removeClass('btn-default').addClass('btn-info');
    btn.siblings('button').removeClass('btn-info').addClass('btn-default');
    // refresh the table when user changes the status filter
    $('#member_table').bootstrapTable('refresh');
    // show/hide add new member button
    if (btn.data('filter') == 'active') {
        $('#toolbar button[data-action=add]').show();
    } else {
        $('#toolbar button[data-action=add]').hide();
    }
};

function creditFormatter(membership) {
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

function viewMember(membership) {
    console.log('abc');
    var items = $('#member_table').bootstrapTable('getSelections');
    if (items.length != 1) {
        bootbox.alert('请选择一个会员');
        return;
    }
    window.location.href = window.location.pathname + '/' + items[0]._id;
};
},{"./common":1}]},{},[2]);
