/**
 * --------------------------------------------------------------------------
 * admin.js
 * --------------------------------------------------------------------------
 */

// DOM Ready =============================================================
$(document).ready(function() {
    init();

    $('.nav-tabs a').click(function(e) {
        //e.preventDefault();
        //$(this).tab('show');
    });
});

// Functions =============================================================

function init() {
    console.log("welcome~~~ chuanyu");
    //moment.locale('zh-CN');
    //bootbox.setLocale('zh_CN');

    $('#tenant_table').bootstrapTable({
        locale: 'zh-CN',
        maintainSelected: true,
        columns: [{}, {}, {}, {
            formatter: objectFormatter
        }, {
            formatter: upgradeFormatter,
            events: handleUpgradeTenant
        }, {
            formatter: deleteFormatter,
            events: handleDeleteTenant
        }]
    });

    $('#tenant_dlg').on('show.bs.modal', function(event) {
        var button = $(event.relatedTarget); // Button that triggered the modal
        if (button.data('action') == "add") {
            // create a new tenant
            var modal = $(this);
            modal.find('.modal-title').text("Create Tenant");
            modal.find('input[name=name]').val("");
            modal.find('input[name=displayName]').val("");

            modal.find('#add_room').show();
        } else if (button.data('action') == "edit") {
            //TODO
        }
    });

    $('#add_tenant').click(handleAddNewTenant);
}

function objectFormatter(value) {
    if (typeof(value) == 'object') {
        return JSON.stringify(value, null, "  ");
    } else {
        value + '';
    }
}

function deleteFormatter(value) {
    return [
        '<a class="remove text-danger" href="javascript:void(0)" title="Delete">',
        '<i class="glyphicon glyphicon-remove"></i>',
        '</a>'
    ].join('');
}
function upgradeFormatter(value) {
    return [
        '<a class="upgrade text-success" href="javascript:void(0)" title="Uprade">',
        '<i class="glyphicon glyphicon-circle-arrow-up"></i>',
        '</a>'
    ].join('');
}

function handleAddNewTenant(event) {
    var modal = $(this).closest('.modal');
    var item = {};

    // validate the input
    var hasError = false;
    // get the tenant name
    item.name = modal.find('input[name=name]').val().trim();
    if (!item.name || item.name.length == 0) {
        modal.find('input[name=name]').closest(".form-group").addClass("has-error");
        hasError = true;
    } else {
        modal.find('input[name=name]').closest(".form-group").removeClass("has-error");
    }

    // get tenant display name
    item.displayName = modal.find('input[name=displayName]').val().trim();
    if (!item.displayName || item.displayName.length == 0) {
        modal.find('input[name=displayName]').closest(".form-group").addClass("has-error");
        hasError = true;
    } else {
        modal.find('input[name=displayName]').closest(".form-group").removeClass("has-error");
    }

    if (!hasError) {
        modal.modal('hide');
        createTenant(item);
    }
}

var handleUpgradeTenant = {
    'click .upgrade': function(e, value, row, index) {
        var body = {
            tenant: row.name
        }
        $.ajax("api/upgrade", {
            type: "POST",
            contentType: "application/json; charset=utf-8",
            data: JSON.stringify(body),
            success: function(data) {
                //TODO, refresh the tenant table
                alert(row.name + " is upgraded successfully");
            },
            error: function(jqXHR, status, err) {
                alert(jqXHR.responseJSON ? jqXHR.responseJSON.message : jqXHR.responseText);
            },
            dataType: "json"
        });
    }
};

function createTenant(tenant) {
    $.ajax("api/tenants", {
        type: "POST",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(tenant),
        success: function(data) {
            $('#tenant_table').bootstrapTable('insertRow', { index: 0, row: tenant });
        },
        error: function(jqXHR, status, err) {
            alert(jqXHR.responseJSON.message);
        },
        dataType: "json"
    });
}

// event handler defined in setting.jade file for removing classroom
var handleDeleteTenant = {
    'click .remove': function(e, value, row, index) {
        //TODO, remove a tenant
        alert("暂不支持");
    }
};