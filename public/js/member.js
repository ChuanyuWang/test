(function ($) {

    // DOM Ready =============================================================
    $(document).ready(function () {
        init();
        
        $('#member_dlg').on('show.bs.modal', function (event) {
            var button = $(event.relatedTarget); // Button that triggered the modal
            if (button.data('action') == "add") {
                // create a new member
                var modal = $(this);
                modal.find('h4').text("添加会员");
                modal.find('input[name=name]').val("").closest(".form-group").removeClass("has-error");
                modal.find('input[name=contact]').val("").closest(".form-group").removeClass("has-error");
                modal.find('#birth_date').data('DateTimePicker').date(null);
                modal.find('input[name=story_point]').val("10");
                modal.find('input[name=event_point]').val("0");
                modal.find('#expire_date').data('DateTimePicker').date(moment().add(3, 'years'));
                modal.find('textarea[name=note]').val("");
                modal.find('#edit_member').hide();
                modal.find('#view_history').hide();
                modal.find('#add_member').show();
            } else if (button.data('action') == "edit") {
                //Don't show the dialog if user select nothing
                var items = $('#member_table').bootstrapTable('getSelections');
                if (items.length != 1) {
                    bootbox.alert('请选择一个会员');
                    event.preventDefault();
                    return;
                }
                // edit existed member
                var modal = $(this);
                modal.find('h4').text("查看会员");
                
                //get member data
                var user = items[0];
                modal.find('input[name=name]').val(user.name).closest(".form-group").removeClass("has-error");
                modal.find('input[name=contact]').val(user.contact).closest(".form-group").removeClass("has-error");
                modal.find('#birth_date').data('DateTimePicker').date(user.birthday ? moment(user.birthday):null);
                modal.find('input[name=story_point]').val(user.point.story);
                modal.find('input[name=event_point]').val(user.point.event);
                modal.find('#expire_date').data('DateTimePicker').date(user.expire ? moment(user.expire):null);
                modal.find('textarea[name=note]').val(user.note);
                
                modal.find('#add_member').hide();
                modal.find('#view_history').show();
                modal.find('#edit_member').show();
                modal.find('#edit_member').data('id', user._id);
            }
        });
        
        $('#member_dlg').on('shown.bs.modal', function (event) {
            $(this).find('input[name=name]').focus(); // focus on the member name input control
        });
        
        $('#add_member').click(handleAddNewMember);
        $('#edit_member').click(handleEditMember);
        $('#del_member').click(handleDeleteMember);
        $('#view_history').click(handleMemberHistory);
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
    
    function validateInput(modal, memberInfo){
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
        // get type
        memberInfo.expire = modal.find('#expire_date').data("DateTimePicker").date();
        //TODO, handle NaN number
        // get available story point
        memberInfo.point['story'] = parseInt(modal.find('input[name=story_point]').val());
        // get available event point
        memberInfo.point['event'] = parseInt(modal.find('input[name=event_point]').val());
        memberInfo.note = modal.find('textarea[name=note]').val().trim();
        
        return hasError;
    };

    function handleAddNewMember(event) {
        var modal = $(this).closest('.modal');
        var newMember = {
            since : moment(),
            point : {}
        };
        
        // validate the input
        if (!validateInput(modal, newMember)) {
            modal.modal('hide');
            addNewMember(newMember);
        }
    };
    
    function handleEditMember(event) {
        var modal = $(this).closest('.modal');
        var id = modal.find('#edit_member').data('id');
        var existMember = {
            point : {}
        };
        
        // validate the input
        if (!validateInput(modal, existMember)) {
            modal.modal('hide');
            editMember(id, existMember);
        }
    };
    
    function addNewMember(member) {
        $.ajax("api/members", {
            type : "POST",
            contentType : "application/json; charset=utf-8",
            data : JSON.stringify(member),
            success : function (data) {
                $('#member_table').bootstrapTable('insertRow', {index: 0, row: data});
            },
            error : function (jqXHR, status, err) {
                bootbox.dialog({
                    message : jqXHR.responseJSON.message,
                    title : "添加会员失败",
                    buttons : {
                        danger : {
                            label : "确定",
                            className : "btn-danger",
                        }
                    }
                });
                //console.error(jqXHR);
            },
            dataType : "json"
        });
    };
    
    function editMember(id, member) {
        $.ajax("api/members/" + id, {
            type : "PUT",
            contentType : "application/json; charset=utf-8",
            data : JSON.stringify(member),
            success : function (data) {
                $('#member_table').bootstrapTable('updateByUniqueId', {id: id, row: member});
            },
            error : function (jqXHR, status, err) {
                bootbox.dialog({
                    message : jqXHR.responseJSON.message,
                    title : "修改会员失败",
                    buttons : {
                        danger : {
                            label : "确定",
                            className : "btn-danger",
                        }
                    }
                });
                //console.error(jqXHR);
            },
            dataType : "json"
        });
    };

    function handleMemberHistory(event) {
        var view_dlg = $(this).closest('.modal');
        var member_id = view_dlg.find('#edit_member').data('id');
        var member_name = view_dlg.find('input[name=name]').val();
        view_dlg.modal('hide');

        var history_dlg = $('#history_member');
        history_dlg.find('#name').text(member_name);
        // refresh the class list of this member
        var begin = moment(0);
        var end = moment().add(10, 'years');
        history_dlg.find('table').bootstrapTable('refresh', {
            url : 'api/classes',
            query : {
                memberid : member_id,
                from : begin.toISOString(),
                to : end.toISOString(),
                order : 'desc'
            }
        });

        history_dlg.modal('show');
    };

    function handleDeleteMember(event) {
        var items = $('#member_table').bootstrapTable('getSelections');
        if (items.length != 1) {
            bootbox.alert('请选择一个会员');
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
