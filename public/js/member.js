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
    },
    /**
     * Calculate the remaining capacity of class object
     * 
     * @cItem {Object} cItem class object
     */
    classRemaining: function(cItem) {
        if (cItem) {
            var booking = cItem.booking || [];
            if (booking.length === 0) return cItem.capacity || 0;
            else {
                var reservation = 0;
                booking.forEach(function(val, index, array) {
                    reservation += (val.quantity || 0);
                });
                return (cItem.capacity || 0) - reservation;
            }
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

    $('#member_table').bootstrapTable({
        locale: 'zh-CN',
        maintainSelected: true,
        rowStyle: highlightExpire,
        queryParams: customQuery,
        columns: [{}, {}, {}, {
            formatter: common.dateFormatter
        }, {
            formatter: creditFormatter
        }, {
            formatter: expireFormatter
        }, {
            formatter: viewFormatter
        }, {}
        ]
    });
}

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
}

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
}

function addNewMember(member) {
    $.ajax("/api/members", {
        type: "POST",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(member),
        success: function(data) {
            // update the table
            //$('#member_table').bootstrapTable('insertRow', { index: 0, row: data });
            // jump to new member page
            window.location.href = window.location.pathname + '/' + data._id;
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
}

function customQuery(params) {
    // params : {search: "", sort: undefined, order: "asc", offset: 0, limit: 15}
    var filter = $("#filter_dlg input:checked").val();
    params.filter = filter;
    var status = $('div.statusFilter button.btn-info').data('filter');
    params.status = status;
    return params;
}

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

function expireFormatter(value, row, index) {
    var membership = row.membership;
    if (membership && membership[0]) {
        // A better way of 'toFixed(1)'
        var expire = membership[0].expire;
        return expire ? moment(expire).format('ll') : null;
    } else {
        return undefined;
    }
}

function viewMember(membership) {
    console.log('abc');
    var items = $('#member_table').bootstrapTable('getSelections');
    if (items.length != 1) {
        bootbox.alert('请选择一个会员');
        return;
    }
    window.location.href = window.location.pathname + '/' + items[0]._id;
}

function highlightExpire(row, index) {
    var card = row.membership && row.membership[0];
    if (card) {
        var expire = moment(card.expire);
        // skip is expire is not set
        if (!expire.isValid()) return {};
        // highlight the row if member is expired
        if (expire.isBefore(moment())) {
            return {
                classes: 'danger'
            };
        }
        // highlight the row if member has no credit
        if (card.hasOwnProperty('credit') && card.credit < 0) {
            return {
                classes: 'danger'
            };
        }
    }
    return {};
}

function viewFormatter(value, row, index) {
    var url = window.location.pathname + '/' + row._id;
    return [
        '<a href="' + url + '" title="查看会员详情" class="btn btn-primary btn-xs">',
        '<i class="glyphicon glyphicon-expand"></i> 查看',
        '</a>'
    ].join('');
}
},{"./common":1}]},{},[2]);
