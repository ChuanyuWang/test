(function ($) {

    // DOM Ready =============================================================
    $(document).ready(function () {
        init();
    });

    // Functions =============================================================

    function init() {
        //moment.locale('zh-CN');
        bootbox.setLocale('zh_CN');
        
        $('#clsroom_dlg').on('show.bs.modal', function (event) {
            var button = $(event.relatedTarget); // Button that triggered the modal
            if (button.data('action') == "add") {
                // create a new classroom
                var modal = $(this);
                modal.find('.modal-title').text("添加教室");
                modal.find('input[name=id]').val("").closest(".form-group").removeClass("has-error");
                modal.find('input[name=name]').val("").closest(".form-group").removeClass("has-error");
                
                modal.find('#add_room').show();
            } else if (button.data('action') == "edit") {
                //TODO
            }
        });
        
        $('#add_room').click(handleAddNewClassRoom);
    };
    
    function handleAddNewClassRoom(event) {
        var modal = $(this).closest('.modal');
        var newRoom = {};
        
        // validate the input
        var hasError = false;
        // get the classroom id
        newRoom.id = modal.find('input[name=id]').val().trim();
        if (!newRoom.id || newRoom.id.length == 0) {
            modal.find('input[name=id]').closest(".form-group").addClass("has-error");
            hasError = true;
        } else {
            modal.find('input[name=id]').closest(".form-group").removeClass("has-error");
        }
        // get the classroom name
        newRoom.name = modal.find('input[name=name]').val().trim();
        if (!newRoom.name || newRoom.name.length == 0) {
            modal.find('input[name=name]').closest(".form-group").addClass("has-error");
            hasError = true;
        } else {
            modal.find('input[name=name]').closest(".form-group").removeClass("has-error");
        }

        if (!hasError) {
            modal.modal('hide');
            addNewClassroom(newRoom);
        }
    };
    
    function addNewClassroom(room) {
        $.ajax("api/setting/classrooms", {
            type : "POST",
            contentType : "application/json; charset=utf-8",
            data : JSON.stringify(room),
            success : function (data) {
                $('#classroom_table').bootstrapTable('insertRow', {index: 0, row: room});
            },
            error : function (jqXHR, status, err) {
                bootbox.dialog({
                    message : jqXHR.responseJSON.message,
                    title : "添加教室失败",
                    buttons : {
                        danger : {
                            label : "确定",
                            className : "btn-danger",
                        }
                    }
                });
            },
            dataType : "json"
        });
    };

    // event handler defined in setting.jade file for removing classroom
    window.handleDeleteClassroom = {
        'click .remove' : function (e, value, row, index) {
            bootbox.confirm({ 
                message : "确定永久删除此教室吗？<br><small>删除后，教室中的课程将无法显示或预约，并且已经预约的课时也不会返还到会员卡中</small>", 
                callback : function(result) {
                    if (!result) { // user cancel
                        return ;
                    }

                    $.ajax("api/setting/classrooms/" + row.id, {
                        type : "DELETE",
                        contentType : "application/json; charset=utf-8",
                        data : {},
                        success : function (data) {
                            if (data && data.n == 1 && data.ok == 1) {
                                $('#classroom_table').bootstrapTable('removeByUniqueId', row.id);
                            } else {
                                console.error("remove class room " + row.id + " fails");
                            }
                        },
                        error : function (jqXHR, status, err) {
                            bootbox.dialog({
                                message : jqXHR.responseJSON.message,
                                title : "删除教室失败",
                                buttons : {
                                    danger : {
                                        label : "确定",
                                        className : "btn-danger",
                                    }
                                }
                            });
                        },
                        dataType : "json"
                    });
                },
                buttons : {
                    confirm : {
                        className : "btn-danger"
                    }
                }
            });
        }
    };
})(jQuery);
