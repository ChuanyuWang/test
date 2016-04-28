(function ($) {

    // DOM Ready =============================================================
    $(document).ready(function () {
        // enable jQuery UI tooltip
        //$(document).tooltip();

        // populate task list & initialize table
        //require(['taskManager'], function (taskManager) {
        //    taskManager.populateList('#tasklist');
        //});

        init();
        
        $('#member_dlg').on('show.bs.modal', function (event) {
            var button = $(event.relatedTarget); // Button that triggered the modal
            if (button.data('action') == "add") {
                // create a new member
                var modal = $(this);
                modal.find('h4').text("添加会员");
                modal.find('input[name=name]').val("");
                modal.find('input[name=contact]').val("");
                //TODO, reset the birth date picker
                modal.find('input[name=story_point]').val("10");
                modal.find('input[name=event_point]').val("0");
                //TODO, reset the expire date picker
                modal.find('input[name=note]').val("");
            }
        });
        
        $('#member_dlg').on('shown.bs.modal', function (event) {
            $(this).find('input[name=name]').focus(); // focus on the member name input control
        });
        
        $('#add_member').click(handleAddNewMember);
        $('#del_member').click(handleDeleteMember);
    });

    // Functions =============================================================

    function init() {
        moment.locale('zh-CN');
        bootbox.setLocale('zh_CN');
        $('#birth_date').datetimepicker({
            format : 'll',
            locale : 'zh-CN',
            defaultDate : moment()
        });
        $('#expire_date').datetimepicker({
            format : 'll',
            locale : 'zh-CN',
            defaultDate : moment().add(3, 'years')
        });
    };

    function handleAddNewMember(event) {
        var modal = $(this).closest('.modal');
        var hasError = false;
        // validate the input
        var newMember = {
            since : moment()
        };
        newMember.name = modal.find('input[name=name]').val();
        if (!newMember.name || newMember.name.length == 0) {
            modal.find('input[name=name]').closest(".form-group").addClass("has-error");
            hasError = true;
        } else {
            modal.find('input[name=name]').closest(".form-group").removeClass("has-error");
        }
        
        newMember.contact = modal.find('input[name=contact]').val();
        if (!newMember.contact || newMember.contact.length == 0) {
            modal.find('input[name=contact]').closest(".form-group").addClass("has-error");
            hasError = true;
        } else {
            modal.find('input[name=contact]').closest(".form-group").removeClass("has-error");
        }
        
        // get birth date
        newMember.birthday = modal.find('#birth_date').data("DateTimePicker").date();
        // get type
        newMember.expire = modal.find('#expire_date').data("DateTimePicker").date();
        // get available story point
        newMember.storyPoint = Number.parseInt(modal.find('input[name=story_point]').val());
        // get available event point
        newMember.eventPoint = Number.parseInt(modal.find('input[name=event_point]').val());
        newMember.note = modal.find('textarea[name=note]').val().trim();

        if (!hasError) {
            modal.modal('hide');
            addNewMember(newMember);
        }
    };
    
    function addNewMember(classItem) {
        $.ajax("api/members", {
            type : "POST",
            contentType : "application/json; charset=utf-8",
            data : JSON.stringify(classItem),
            success : function (data) {
                $('#member_table').bootstrapTable('insertRow', {index: 0, row: data});
            },
            error : function (jqXHR, status, err) {
                console.error(jqXHR.responseText);
            },
            dataType : "json"
        });
    };

    function handleDeleteMember(event) {
        var items = $('#member_table').bootstrapTable('getSelections');
        if (items.length == 0) {
            bootbox.alert('请先选择一个会员');
            return;
        }

        bootbox.confirm("删除选中会员吗？", function(result) {
            if (!result) { // user cancel
                return ;
            }
            // delete all selected members one by one, and update the table
            $.each(items, function(index, item){
                $.ajax("api/members/" + item._id, {
                    type : "DELETE",
                    contentType : "application/json; charset=utf-8",
                    data : JSON.stringify({dummy:1}),
                    success : function (data) {
                        $('#member_table').bootstrapTable('removeByUniqueId', item._id);
                    },
                    error : function (jqXHR, status, err) {
                        console.error(jqXHR.responseText);
                    },
                    complete : function(jqXHR, status) {
                        //TODO
                    },
                    dataType : "json"
                });
            });
        });
    };
})(jQuery);
