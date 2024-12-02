<template lang="pug">
div
  div.row
    div.col-xs-6
      div.btn-group(role='group',style="margin:7px 0")
        button.btn.btn-success(type='button',@click='beforeCreateType()') 添加
      p.small.ms-3.mb-3 添加至少一种课程类型，用于创建对应的课程；开放预约的课程允许家长自助约课
      template(v-for='(type, index) in types')
        div.panel.panel-default(style="margin-bottom:7px")
          div.panel-heading {{type.name}} 
            div.btn-group.btn-group-xs.pull-right(role="group")
              a.btn(role="button" @click='beforeEditType(type)')
                i.glyphicon.glyphicon-edit.text-primary
              a.btn(role="button" @click='$refs.deleteTypeDialog.show(type)')
                i.glyphicon.glyphicon-remove-sign.text-danger
            span.label.label-default(v-if="type.status === 'closed'") 已完结
            span.label.label-primary(v-else-if="type.visible === true") 开放预约
    div.col-xs-6
      ul.list-group
        li.list-group-item(v-for='(product, index) in products') {{product.name}}
  modal-dialog(ref='createTypeDialog',buttons="confirm",@ok="createType()",:hasError="hasError") 添加课程类型
    template(v-slot:body)
      form.form-horizontal
        div.form-group
          label.control-label.col-sm-2 课程状态:
          div.col-sm-10
            p.form-control-static {{status | statusFilter}}
        div.form-group(:class='{"has-error": errors.name}')
          label.control-label.col-sm-2 课程类型:
          div.col-sm-8
            input.form-control(type='text',placeholder='课程类型',v-model='name')
        div.form-group
          div.col-sm-offset-2.col-sm-10
            div.checkbox
              label
                input(type='checkbox',v-model='visible')
                |开放预约
                span.help-block.small 开放预约的课程类型允许家长自助约课
  modal-dialog(ref='editTypeDialog',buttons="confirm") 修改课程类型
    template(v-slot:body)
      form.form-horizontal
        div.form-group
          label.control-label.col-sm-2 课程状态:
          div.col-sm-10
            p.form-control-static {{status | statusFilter}}
        div.form-group(:class='{"has-error": errors.name}')
          label.control-label.col-sm-2 课程类型:
          div.col-sm-8
            input.form-control(type='text',placeholder='课程类型',v-model='name')
        div.form-group
          div.col-sm-offset-2.col-sm-10
            div.checkbox
              label
                input(type='checkbox',v-model='visible')
                |开放预约
                span.help-block.small 开放预约的课程类型允许家长自助约课
    template(v-slot:footer="slotProps")
      button.btn.btn-default(type="button",data-dismiss="modal") 取消
      button.btn.btn-danger(type="button",data-dismiss="modal",:disabled='hasError',v-if='isEditing && status==="open"',@click='$refs.closeTypeDialog.show(slotProps.param)') 完结课程
      button.btn.btn-success(type="button",data-dismiss="modal",:disabled='hasError',v-if='isEditing && status==="closed"',@click='restoreType(slotProps.param)') 恢复课程
      button.btn.btn-primary(type="button",data-dismiss="modal",:disabled='hasError',@click='editType(slotProps.param)') 确认
  modal-dialog(ref='closeTypeDialog',buttons="confirm" @ok="closeType") 确定完结课程吗?
    template(v-slot:body)
      p 完结课程后，在创建课程或合约时，隐藏此课程类型
  modal-dialog(ref='deleteTypeDialog',buttons="confirm" @ok="deleteType") 确定删除课程吗?
    template(v-slot:body="slotProps")
      p 删除课程类型<strong>{{slotProps.param.name}}</strong>
      p.text-danger.small 不能删除已产生合约的课程类型, 或者已经创建课程的类型
</template>

<script>
/**
 * --------------------------------------------------------------------------
 * type-setting display a panel for type settings
 * --------------------------------------------------------------------------
 */
import util from '../../services/util';
import modalDialog from "../../components/modal-dialog.vue";

export default {
  name: "type-setting",
  props: {},
  data() {
    return {
      name: "",
      status: "open",
      visible: true,
      isEditing: false,
      types: [],
      products: []
    };
  },
  components: {
    "modal-dialog": modalDialog
  },
  computed: {
    errors: function() {
      var errors = {};
      if (!this.name || this.name.length === 0)
        errors.name = '课程名称不能为空';
      return errors;
    },
    hasError: function() {
      var errors = this.errors;
      return Object.keys(errors).some(function(key) {
        return true;
      })
    }
  },
  filters: {
    statusFilter(value) {
      return value === "closed" ? "已完结" : "正常";
    }
  },
  methods: {
    refresh() {
      var vm = this;
      var request = $.getJSON("/api/setting/types");
      request.fail(function(jqXHR, textStatus, errorThrown) {
        console.error(jqXHR.responseJSON ? jqXHR.responseJSON.message : jqXHR.responseText);
      });
      request.done(function(data, textStatus, jqXHR) {
        vm.types = data || [];
      });
    },
    createType() {
      var fields = {
        name: this.name,
        status: this.status,
        visible: this.visible
      };
      var request = $.ajax("/api/setting/types", {
        type: "POST",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(fields),
        dataType: "json"
      });
      request.fail(function(jqXHR, textStatus, errorThrown) {
        util.showAlert("创建课程失败", jqXHR);
      });
      request.done((data, textStatus, jqXHR) => {
        this.types = data && data.types || [];
        this.$messager.showSuccessMessage(`课程类型<strong>${fields.name}</strong>已创建`);
      });
    },
    editType(typeId) {
      var fields = {
        name: this.name,
        status: this.status,
        visible: this.visible
      };
      var request = $.ajax("/api/setting/types/" + typeId, {
        type: "PATCH",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(fields),
        dataType: "json"
      });
      request.fail((jqXHR, textStatus, errorThrown) => {
        util.showAlert("修改课程失败", jqXHR);
      });
      request.done((data, textStatus, jqXHR) => {
        this.types = data && data.types || [];
      });
    },
    closeType(typeId) {
      var fields = {
        name: this.name,
        status: "closed",
        visible: this.visible
      };
      var request = util.patchJSON("/api/setting/types/" + typeId, fields);
      request.fail(function(jqXHR, textStatus, errorThrown) {
        util.showAlert("完结课程失败", jqXHR);
      });
      request.done((data, textStatus, jqXHR) => {
        this.types = data && data.types || [];
      });
    },
    restoreType(typeId) {
      var fields = {
        name: this.name,
        status: "open",
        visible: this.visible
      };
      var request = util.patchJSON("/api/setting/types/" + typeId, fields);
      request.fail(function(jqXHR, textStatus, errorThrown) {
        util.showAlert("恢复课程失败", jqXHR);
      });
      request.done((data, textStatus, jqXHR) => {
        this.types = data && data.types || [];
      });
    },
    deleteType(t) {
      var request = util.deleteJSON("/api/setting/types/" + t.id);
      request.fail((jqXHR, textStatus, errorThrown) => {
        util.showAlert("删除课程失败", jqXHR);
      });
      request.done((data, textStatus, jqXHR) => {
        this.types = data && data.types || [];
        this.$messager.showSuccessMessage(`课程类型<strong>${t.name}</strong>已删除`);
      });
    },
    beforeCreateType() {
      this.name = "";
      this.status = "open";
      this.visible = true;
      this.$refs.createTypeDialog.show();
    },
    beforeEditType(t) {
      this.isEditing = true;
      this.name = t.name;
      this.status = t.status;
      this.visible = t.visible;
      this.$refs.editTypeDialog.show(t.id);
    },
    beforeCloseType(t) {
      this.name = t.name;
      this.status = t.status;
      this.visible = t.visible;
      this.$refs.closeTypeDialog.show(t.id);
    }
  },
  created() {
    this.refresh();
  }
};
</script>

<style lang='less'></style>
