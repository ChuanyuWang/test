(function($) {

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
                modal.find('#birth_date').data('DateTimePicker').date(user.birthday ? moment(user.birthday) : null);
                modal.find('textarea[name=note]').val(user.note);

                modal.find('#add_member').hide();
                modal.find('#view_history').show();
                modal.find('#edit_member').show();
                modal.find('#edit_member').data('id', user._id);
            }
        });

        $('#member_dlg').on('shown.bs.modal', function(event) {
            $(this).find('input[name=name]').focus(); // focus on the member name input control
        });

        $('#add_member').click(handleAddNewMember);
        $('#edit_member').click(handleEditMember);
        $('#dea_member').click(handleDeactivateMember);
        $('#act_member').click(handleActivateMember);
        $('#view_history').click(handleMemberHistory);
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

    function editMember(id, member) {
        $.ajax("/api/members/" + id, {
            type: "PATCH",
            contentType: "application/json; charset=utf-8",
            data: JSON.stringify(member),
            success: function(doc) {
                $('#member_table').bootstrapTable('updateByUniqueId', { id: id, row: doc });
            },
            error: function(jqXHR, status, err) {
                bootbox.dialog({
                    message: jqXHR.responseJSON ? jqXHR.responseJSON.message : jqXHR.responseText,
                    title: "修改会员失败",
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
            url: '/api/classes',
            query: {
                memberid: member_id,
                from: begin.toISOString(),
                to: end.toISOString(),
                order: 'desc'
            }
        });

        history_dlg.modal('show');
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
        // show/hide activate buttons
        if (btn.data('filter') == 'active') {
            $('#toolbar button[data-action=add]').show();
            $('#dea_member').show();
            $('#act_member').hide();
        } else {
            $('#toolbar button[data-action=add]').hide();
            $('#dea_member').hide();
            $('#act_member').show();
        }
    };

    function updateMemberStatus(memberID, status) {
        return $.ajax("/api/members/" + memberID, {
            type: "PATCH",
            contentType: "application/json; charset=utf-8",
            data: JSON.stringify({ 'status': status }),
            complete: function(jqXHR, status) {
                //TODO
            },
            dataType: "json"
        });
    };

    function handleActivateMember(event) {
        var items = $('#member_table').bootstrapTable('getSelections');

        if (items.length != 1) {
            bootbox.alert('请选择一个会员');
            return;
        }

        bootbox.confirm({
            message: "确定激活选中会员吗？",
            callback: function(result) {
                if (!result) { // user cancel
                    return;
                }
                // activate all selected members one by one, and update the table
                $.each(items, function(index, item) {
                    var request = updateMemberStatus(item._id, 'active');
                    request.done(function(data, textStatus, jqXHR) {
                        $('#member_table').bootstrapTable('removeByUniqueId', data._id);
                    }).fail(function(jqXHR, textStatus, errorThrown) {
                        // alert dialog with danger button
                        bootbox.dialog({
                            message: jqXHR.responseJSON ? jqXHR.responseJSON.message : jqXHR.responseText,
                            title: "激活会员失败",
                            buttons: {
                                danger: {
                                    label: "确定",
                                    className: "btn-danger"
                                }
                            }
                        });
                    });
                });
            },
            buttons: {
                confirm: {
                    className: "btn-primary"
                }
            }
        });
    };

    function handleDeactivateMember(event) {
        var items = $('#member_table').bootstrapTable('getSelections');

        if (items.length != 1) {
            bootbox.alert('请选择一个会员');
            return;
        }

        bootbox.confirm({
            message: "确定停用选中会员吗？<br><small>停用后，此会员将无法进行自助预约</small>",
            callback: function(result) {
                if (!result) { // user cancel
                    return;
                }
                // deactivate all selected members one by one, and update the table
                $.each(items, function(index, item) {
                    var request = updateMemberStatus(item._id, 'inactive');
                    request.done(function(data, textStatus, jqXHR) {
                        $('#member_table').bootstrapTable('removeByUniqueId', data._id);
                    }).fail(function(jqXHR, textStatus, errorThrown) {
                        // alert dialog with danger button
                        bootbox.dialog({
                            message: jqXHR.responseJSON ? jqXHR.responseJSON.message : jqXHR.responseText,
                            title: "停用会员失败",
                            buttons: {
                                danger: {
                                    label: "确定",
                                    className: "btn-danger"
                                }
                            }
                        });
                    });
                });
            },
            buttons: {
                confirm: {
                    className: "btn-danger"
                }
            }
        });
    };
})(jQuery);