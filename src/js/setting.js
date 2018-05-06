/**
 * --------------------------------------------------------------------------
 * setting.js setting page main entry module
 * --------------------------------------------------------------------------
 */
var util = require('./services/util');
var i18nextplugin = require('./locales/i18nextplugin');
var teach_setting = require('./components/teach-setting.vue');

// DOM Ready =============================================================
$(document).ready(function() {
    init();
});

// Functions =============================================================

function init() {
    moment.locale('zh-CN');
    bootbox.setLocale('zh_CN');

    // load the i18next plugin to Vue
    Vue.use(i18nextplugin);

    // bootstrap the teacher setting tab
    new Vue({el: '#teacher-setting', render : function(h){
        return h(teach_setting);
    }});

    // initialize the classroom table
    $('#classroom_table').bootstrapTable({
        locale: 'zh-CN',
        url: '/api/setting/classrooms',
        columns: [{}, {}, {
            formatter: visibilityFormatter
        }, {
            formatter: actionFormatter,
            events: handleActions
        }]
    });

    $('#clsroom_dlg').on('show.bs.modal', function(event) {
        var button = $(event.relatedTarget); // Button that triggered the modal
        if (button.data('action') == "add") {
            // create a new classroom
            var modal = $(this);
            modal.find('.modal-title').text("添加教室");
            modal.find('input[name=id]').val("").prop("disabled", false).closest(".form-group").removeClass("has-error");
            modal.find('input[name=name]').val("").closest(".form-group").removeClass("has-error");

            modal.find('#add_room').show();
            modal.find('#edit_room').hide();
        }
    });

    $('#add_room').click(handleAddNewClassRoom);
    $('#edit_room').click(handleEditClassRoom);
    $('#saveBasic').click(handleSaveBasic);
}

function handleSaveBasic(event) {
    var form = $(this).closest('form');
    var basicInfo = {};
    // validate the input
    var hasError = false;

    // get the tenant contact
    basicInfo.contact = form.find('input[name=contact]').val().trim();
    if (!basicInfo.contact || basicInfo.contact.length == 0) {
        form.find('input[name=contact]').closest(".form-group").addClass("has-error");
        hasError = true;
    } else {
        form.find('input[name=contact]').closest(".form-group").removeClass("has-error");
    }

    // get the tenant address
    basicInfo.address = form.find('input[name=address]').val().trim();
    if (!basicInfo.address || basicInfo.address.length == 0) {
        form.find('input[name=address]').closest(".form-group").addClass("has-error");
        hasError = true;
    } else {
        form.find('input[name=address]').closest(".form-group").removeClass("has-error");
    }

    if (hasError) return;

    var request = $.ajax("/api/setting/basic", {
        type: "PATCH",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(basicInfo),
        dataType: "json"
    });
    request.fail(function(jqXHR, textStatus, errorThrown) {
        util.showAlert("更新综合设置失败", jqXHR);
    });
}

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

    // get the classroom visibility
    newRoom.visibility = modal.find('input[name=visibility]:checked').val();

    if (!hasError) {
        modal.modal('hide');
        addNewClassroom(newRoom);
    }
}

function handleEditClassRoom(event) {
    var modal = $(this).closest('.modal');
    var room = {};

    // validate the input
    var hasError = false;
    // get the classroom id
    room.id = modal.find('input[name=id]').val().trim();
    // get the classroom name
    room.name = modal.find('input[name=name]').val().trim();
    if (!room.name || room.name.length == 0) {
        modal.find('input[name=name]').closest(".form-group").addClass("has-error");
        hasError = true;
    } else {
        modal.find('input[name=name]').closest(".form-group").removeClass("has-error");
    }

    // get the classroom visibility
    room.visibility = modal.find('input[name=visibility]:checked').val();

    if (!hasError) {
        modal.modal('hide');
        var request = editClassroom(room);
        request.done(function(data, textStatus, jqXHR) {
            $('#classroom_table').bootstrapTable('refresh');
        });
    }
}

function addNewClassroom(room) {
    $.ajax("/api/setting/classrooms", {
        type: "POST",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(room),
        success: function(data) {
            $('#classroom_table').bootstrapTable('insertRow', { index: 0, row: room });
        },
        error: function(jqXHR, status, err) {
            util.showAlert("添加教室失败", jqXHR);
        },
        dataType: "json"
    });
}

function editClassroom(room) {
    var request = $.ajax("/api/setting/classrooms/" + room.id, {
        type: "PATCH",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(room),
        dataType: "json"
    });
    request.fail(function(jqXHR, textStatus, errorThrown) {
        util.showAlert("修改教室失败", jqXHR);
    });
    return request;
}

function visibilityFormatter(value, row, index) {
    if (value == 'internal') return '是';
    else return '否';
}

function actionFormatter(value, row, index) {
    return [
        '<button type="button" class="edit-room btn btn-primary btn-xs">',
        '  <span class="glyphicon glyphicon-edit"></span> 修改',
        '</button>',
        '<button type="button" style="margin-left:6px" class="remove-room btn btn-danger btn-xs">',
        '  <span class="glyphicon glyphicon-trash"></span> 删除',
        '</button>'
    ].join('');
}

// event handler defined in setting.jade file for removing classroom
var handleActions = {
    'click .remove-room': function(e, value, row, index) {
        bootbox.confirm({
            message: "确定永久删除此教室吗？<br><small>删除后，教室中的课程将无法显示或预约，并且已经预约的课时也不会返还到会员卡中</small>",
            callback: function(ok) {
                if (!ok) return;

                $.ajax("/api/setting/classrooms/" + row.id, {
                    type: "DELETE",
                    contentType: "application/json; charset=utf-8",
                    data: {},
                    success: function(data) {
                        if (data && data.n == 1 && data.ok == 1) {
                            $('#classroom_table').bootstrapTable('removeByUniqueId', row.id);
                        } else {
                            console.error("remove class room " + row.id + " fails");
                        }
                    },
                    error: function(jqXHR, status, err) {
                        util.showAlert("删除教室失败", jqXHR);
                    },
                    dataType: "json"
                });
            },
            buttons: {
                confirm: {
                    className: "btn-danger"
                }
            }
        });
    },
    'click .edit-room': function(e, value, row, index) {
        // edit a classroom
        var modal = $('#clsroom_dlg');
        modal.find('.modal-title').text("修改教室");
        modal.find('input[name=id]').val(row.id).prop("disabled", true).closest(".form-group").removeClass("has-error");
        modal.find('input[name=name]').val(row.name).closest(".form-group").removeClass("has-error");
        modal.find('input[name=visibility]').prop('checked', row.visibility == 'internal');
        modal.find('#add_room').hide();
        modal.find('#edit_room').show();

        modal.modal('show');
    }
};