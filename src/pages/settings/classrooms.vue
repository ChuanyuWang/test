<template lang="pug">
div
  div#toolbar.btn-group(role='group')
    button.btn.btn-success(type='button',@click='addClassroom()') 添加
  bootstrap-table(ref='classroomTable',:columns='columns',:options='options')
  p.small(style='margin-top:14px') 
    |*内部教室不对外开放，会员在自助预约时无法选择内部教室
  modal-dialog(ref='classroomEditDlg',buttonStyle="success") {{newClassroom ? "添加教室" : "修改教室"}}
    template(v-slot:body)
      form.form-horizontal
        div.form-group(:class='{"has-error": errors.id}')
          label.control-label.col-sm-2(for='classroom_id') 教室ID:
          div.col-sm-10
            input#classroom_id.form-control(type='text',name='id',:disabled='!newClassroom',placeholder='英文字母或数字',v-model='classroomID')
        div.form-group(:class='{"has-error": errors.name}')
          label.control-label.col-sm-2(for='classroom_name') 教室名字:
          div.col-sm-10
            input#classroom_name.form-control(type='text',name='name',placeholder='教室名字',v-model='classroomName')
          div.col-sm-offset-2.col-sm-10
            div.checkbox
              label
                input(type='checkbox',name='visibility',value='internal',v-model='internal')
                |内部教室*
    template(v-slot:footer)
      p.small(style='color:#777;float:left;margin-top:7px') *内部教室不对外开放，会员在自助预约时无法选择内部教室
      button.btn.btn-default(type="button",data-dismiss="modal") 取消
      button.btn.btn-success(type="button",:disabled='hasError',v-if='newClassroom',@click='addNewClassroom') 添加
      button.btn.btn-primary(type="button",:disabled='hasError',v-else,@click='editClassroom') 修改
</template>

<script>
/**
 * --------------------------------------------------------------------------
 * classrooms setting component
 * --------------------------------------------------------------------------
 */

var util = require('../../services/util');
var modalDialog = require("../../components/modal-dialog.vue").default;

module.exports = {
  name: "classroom-setting",
  props: {},
  data: function() {
    return {
      classroomID: "",
      classroomName: "",
      internal: false,
      newClassroom: true,
      columns: [
        {
          field: "id",
          title: "教室ID",
          sortable: true
        }, {
          field: "name",
          title: "教室名称"
        }, {
          field: "visibility",
          title: "内部教室*",
          formatter: this.visibilityFormatter
        }, {
          title: "操作",
          align: "center",
          formatter: this.actionFormatter,
          events: {
            'click .remove-room': this.removeClassroom,
            'click .edit-room': this.openEditClassroomDialog
          }
        }
      ],
      options: {
        locale: "zh-CN",
        toolbar: '#toolbar',
        url: "/api/setting/classrooms",
        showRefresh: true,
        striped: true,
        uniqueId: "id"
      }
    };
  },
  components: {
    "modal-dialog": modalDialog,
    "BootstrapTable": BootstrapTable
  },
  computed: {
    errors: function() {
      var errors = {};
      if (!this.classroomID || this.classroomID.length === 0)
        errors.id = 'ID不能为空';
      if (!this.classroomName || this.classroomName.length === 0)
        errors.name = '名称不能为空';
      return errors;
    },
    hasError: function() {
      var errors = this.errors;
      return Object.keys(errors).some(function(key) {
        return true;
      })
    }
  },
  filters: {},
  methods: {
    addClassroom(event) {
      this.classroomID = null;
      this.classroomName = "";
      this.internal = false;
      this.newClassroom = true;
      this.$refs.classroomEditDlg.show();
    },
    removeClassroom(e, value, row, index) {
      var vm = this;
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
                vm.$refs.classroomTable.removeByUniqueId(row.id);
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
    openEditClassroomDialog(e, value, row, index) {
      // edit a classroom
      this.classroomID = row.id;
      this.classroomName = row.name;
      this.internal = row.visibility === 'internal';
      this.newClassroom = false;
      this.$refs.classroomEditDlg.show();
    },
    visibilityFormatter(value, row, index) {
      if (value == 'internal') return '是';
      else return '否';
    },
    actionFormatter(value, row, index) {
      return [
        '<button type="button" class="edit-room btn btn-primary btn-xs">',
        '  <span class="glyphicon glyphicon-edit"></span> 修改',
        '</button>',
        '<button type="button" style="margin-left:6px" class="remove-room btn btn-danger btn-xs">',
        '  <span class="glyphicon glyphicon-trash"></span> 删除',
        '</button>'
      ].join('');
    },
    addNewClassroom() {
      var vm = this;
      var room = {};
      room.id = this.classroomID;
      room.name = this.classroomName;
      if (this.internal) {
        room.visibility = "internal";
      }
      // close the dialog
      this.$refs.classroomEditDlg.hide();
      $.ajax("/api/setting/classrooms", {
        type: "POST",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(room),
        success: function(data) {
          vm.$refs.classroomTable.insertRow({ index: 0, row: room });
        },
        error: function(jqXHR, status, err) {
          util.showAlert("添加教室失败", jqXHR);
        },
        dataType: "json"
      });
    },
    editClassroom() {
      var vm = this;
      var room = {};
      room.id = this.classroomID;
      room.name = this.classroomName;
      if (this.internal) {
        room.visibility = "internal";
      }
      // close the dialog
      this.$refs.classroomEditDlg.hide();
      var request = $.ajax("/api/setting/classrooms/" + room.id, {
        type: "PATCH",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(room),
        dataType: "json"
      });
      request.fail(function(jqXHR, textStatus, errorThrown) {
        util.showAlert("修改教室失败", jqXHR);
      });
      request.done(function(data, textStatus, jqXHR) {
        vm.$refs.classroomTable.refresh();
      });
    }
  },
  created: function() { },
  mounted: function() { }
};
</script>

<style lang="less">
</style>
