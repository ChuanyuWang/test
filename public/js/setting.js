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
            //TODO, remove a classroom
            alert("暂不支持，可能影响相关课程和预订");
        }
    };
})(jQuery);
