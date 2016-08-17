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
            defaultDate : moment().add(6, 'months')
        });

        $('#member_table').on("page-change.bs.table", function (number, size) {
            //uncheck all the selected rows to fix the radio column only take effects in one page
            var items = $('#member_table').bootstrapTable('getSelections');
            for (var i=0;i<items.length;i++) {
                $('#member_table').bootstrapTable('uncheckBy', {field:'_id', values:[items[i]._id]});
            }
        });

        $('#membership_dlg select[name=card_type]').change(function (event) {
            if ($(this).find('option:selected').val() == 'ALL') {
                $('#membership_dlg #roomlist input').prop('checked', true);
                $('#membership_dlg #roomlist input').prop('disabled', true);
            } else {
                $('#membership_dlg #roomlist input').prop('disabled', false);
            }
        });
        $('#membership_dlg button#ok').click(editMemberShip);
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
        memberInfo.note = modal.find('textarea[name=note]').val().trim();
        
        return hasError;
    };

    function handleAddNewMember(event) {
        var modal = $(this).closest('.modal');
        var newMember = {
            since : moment()
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
        var existMember = {};

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
    
    function editMemberShip(event) {
        var modal = $(this).closest('.modal');
        var member_id = modal.data('id');
        var memberCard = {room : []};
        
        var hasError = false;
        // get credit value
        memberCard.credit = parseFloat(modal.find('input[name=credit]').val());
        if (isNaN(memberCard.credit)) {
            modal.find('input[name=credit]').closest(".form-group").addClass("has-error");
            hasError = true;
        } else {
            modal.find('input[name=credit]').closest(".form-group").removeClass("has-error");
        }
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
        modal.find('#roomlist input:checked').each(function(index, element){
            memberCard.room.push($(this).val());
        });

        if (hasError) {
            return;
        }
        $.ajax("api/members/" + member_id, {
            type : "PUT",
            contentType : "application/json; charset=utf-8",
            data : JSON.stringify({"membership" : [memberCard]}),
            success : function (res) {
                if (res.ok == 1 && res.nModified == 1) {
                    var row = $('#member_table').bootstrapTable('getRowByUniqueId', member_id);
                    row.membership = row.membership || [];
                    row.membership[0] = memberCard;
                    $('#member_table').bootstrapTable('updateByUniqueId', {id: member_id, row: row});
                } else {
                    console.error(res);
                    console.error("Update %s member's card fails", member_id);
                }
                modal.modal('hide');
            },
            error : function (jqXHR, status, err) {
                bootbox.dialog({
                    message : jqXHR.responseJSON ? jqXHR.responseJSON.message : jqXHR.responseText,
                    title : "修改会员卡失败",
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
    
    // event handler defined in home.jade file for removing booking item
    window.editMembership = {
        'click .membership' : function (e, value, row, index) {
            var modal = $('#membership_dlg').data('id', row._id);

            if (row.membership && row.membership.length > 0) {
                var membership = row.membership[0];
            } else {
                // ghost card
                var membership = {
                    credit : 10,
                    // the default expire date is 6 months later
                    expire : moment().add(6, 'months'),
                    room : [],
                    type : null
                };
            }
            //modal.find('h4').text("添加会员");
            modal.find('#name').text(row.name);
            modal.find('input[name=credit]').val(membership.credit).closest(".form-group").removeClass("has-error");
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
        }
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
