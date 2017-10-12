/**
 * --------------------------------------------------------------------------
 * opportunity.js
 * --------------------------------------------------------------------------
 */

var common = require('./common');

// DOM Ready =============================================================
$(document).ready(function() {
    init();
});

// Functions =============================================================

function init() {
    moment.locale('zh-CN');

    $('#opps_table').bootstrapTable({
        locale: 'zh-CN',
        maintainSelected: true,
        columns: [{
            formatter: statusFormatter,
            events: handleChangeStatus
        }, {}, {}, {
            formatter: common.dateFormatter
        }, {
            formatter: common.dateFormatter
        }, {}, {},
        ]
    });
}

function statusFormatter(value) {
    if (value == 'open') {
        return [
            '<a class="phone text-success" href="javascript:void(0)" title="未联系">',
            '<i class="glyphicon glyphicon-earphone"></i>',
            '</a>'
        ].join('');
    } else {
        return [
            '<a class="phone text-danger" href="javascript:void(0)" title="已联系">',
            '<i class="glyphicon glyphicon-earphone"></i>',
            '</a>'
        ].join('');
    }
}

// event handler defined in home.jade file for removing booking item
var handleChangeStatus = {
    'click .phone': function(e, value, row, index) {
        var opportunity = row; // the object of clicked row
        var newStatus = opportunity.status == 'open' ? 'closed' : 'open';

        $.ajax("/api/opportunities/" + opportunity._id, {
            type: "PATCH",
            contentType: "application/json; charset=utf-8",
            data: JSON.stringify({ status: newStatus }),
            success: function(data) {
                row.status = newStatus;
                $('#opps_table').bootstrapTable('updateRow', { index: index, row: row });
            },
            error: function(jqXHR, status, err) {
                console.error(jqXHR.responseJSON ? jqXHR.responseJSON.message : jqXHR.responseText);
            },
            complete: function(jqXHR, status) {
                //TODO
            },
            dataType: "json"
        });
    }
};