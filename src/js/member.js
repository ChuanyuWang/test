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

    $('#add_member').click(handleAddNewMember);
    $('#toolbar input[type=checkbox]').click(handleFilterStatus);
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
        sidePagination: "server",
        //rowStyle: highlightExpire,
        queryParams: customQuery,
        columns: [{
            formatter: viewFormatter
        }, {}, {}, {
            formatter: common.dateFormatter
        }, {
            formatter: remainingFormatter,
            cellStyle: remainingStyle
        }, {
            formatter: expireFormatter,
            cellStyle: expireStyle
        }, {
            formatter: creditFormatter
        }, {}, {}
        ]
    });
}

// return true if an error occurs after validation, otherwise return false
function validateInput(modal, memberInfo) {
    var hasError = false;

    memberInfo.name = modal.find('input[name=name]').val().trim();
    if (!memberInfo.name || memberInfo.name.length == 0) {
        modal.find('input[name=name]').closest(".form-group").addClass("has-error");
        hasError = true;
    } else {
        modal.find('input[name=name]').closest(".form-group").removeClass("has-error");
    }

    memberInfo.contact = modal.find('input[name=contact]').val().trim();
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

    var statusEl = $('#toolbar input[type=checkbox]:checked');
    if (statusEl.length > 0) {
        var statusQuery = '';
        for (var i = 0; i < statusEl.length; i++) {
            statusQuery += statusEl[i].value + ',';
        }
        params.status = statusQuery.substring(0, statusQuery.length - 1);
    }
    // Append the field 'unStartedClassCount' to returned members
    params.appendLeft = true;
    return params;
}

function handleFilterStatus(event) {
    // refresh the table when user changes the status filter
    $('#member_table').bootstrapTable('refresh');
}

function getCredit(memberships) {
    var card = memberships && memberships[0];
    if (card) {
        var credit = card.credit || 0;
        var n = Math.round(credit * 10) / 10;
        return n === 0 ? 0 : n; // handle the "-0" case
    } else {
        return undefined;
    }
}

function creditFormatter(value, row, index) {
    return getCredit(row && row.membership);
}

function remainingFormatter(value, row, index) {
    return [
        '<b>',
        // A better way of 'toFixed(1)'
        Math.round(value * 10) / 10,
        '</b> <small>(<i>',
        getCredit(row.membership) || 0,
        ', ',
        row.unStartedClassCount,
        '节</i>)</small>'
    ].join('');
}

function remainingStyle(value, row, index, field) {
    if (row.membership && row.membership[0]) {
        // highlight the cell if remaining credit or classes is zero
        if (value <= 0) {
            return {
                classes: 'danger'
            };
        }
    }
    return {};
}

function expireFormatter(value, row, index) {
    var membership = row.membership;
    if (membership && membership[0]) {
        var expire = membership[0].expire;
        return expire ? moment(expire).format('ll') : null;
    } else {
        return undefined;
    }
}

function expireStyle(value, row, index, field) {
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
    }
    return {};
}

function viewFormatter(value, row, index) {
    var url = window.location.pathname + '/' + row._id;
    return [
        '<a href="' + url + '" title="查看会员详情">',
        '<i class="glyphicon glyphicon-edit"></i>',
        '</a>'
    ].join('');
}
