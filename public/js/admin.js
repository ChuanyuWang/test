(function ($) {

    // DOM Ready =============================================================
    $(document).ready(function () {
        init();

        $('.nav-tabs a').click(function (e) {
            //e.preventDefault();
            //$(this).tab('show');
        });
    });

    // Functions =============================================================

    function init() {
        console.log("welcome~~~ chuanyu");
        //moment.locale('zh-CN');
        //bootbox.setLocale('zh_CN');
        
        $('#tenant_dlg').on('show.bs.modal', function (event) {
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
    };
    
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
    };
    
    window.handleUpgradeTenant = {
        'click .upgrade' : function (e, value, row, index) {
            //alert("暂不支持");
            console.log(value);
            console.log(row);
            var body = {
                tenant : row.name
            }
            $.ajax("api/upgrade", {
                type : "POST",
                contentType : "application/json; charset=utf-8",
                data : JSON.stringify(body),
                success : function (data) {
                    //TODO, refresh the tenant table
                    alert(row.name + " is upgraded successfully");
                },
                error : function (jqXHR, status, err) {
                    alert(jqXHR.responseJSON ? jqXHR.responseJSON.message : jqXHR.responseText);
                },
                dataType : "json"
            });
        }
    };
    
    function createTenant(tenant) {
        $.ajax("api/tenants", {
            type : "POST",
            contentType : "application/json; charset=utf-8",
            data : JSON.stringify(tenant),
            success : function (data) {
                $('#tenant_table').bootstrapTable('insertRow', {index: 0, row: tenant});
            },
            error : function (jqXHR, status, err) {
                alert(jqXHR.responseJSON.message);
            },
            dataType : "json"
        });
    };
    
    // event handler defined in setting.jade file for removing classroom
    window.handleDeleteTenant = {
        'click .remove' : function (e, value, row, index) {
            //TODO, remove a tenant
            alert("暂不支持");
        }
    };
})(jQuery);
