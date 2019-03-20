<style>
</style>

<template lang="pug">
div.container
  div.row
    img.center-block(:src="tenantLogo",style="width:200px")
  form
    div.form-group(style='margin-bottom:auto')
      p.form-control-static(style='color:#808080;text-align:center')
        small 请填写宝宝的姓名和联系方式，客服会在收到申请后第一时间联系您
    div.form-group(:class='{"has-error": errors.name}')
      label.control-label 宝宝姓名:
      input.form-control(type='text',v-model.trim='name',placeholder='宝宝全名',autofocus)
    div.form-group(:class='{"has-error": errors.contact}')
      label.control-label 联系方式:
      input.form-control(type='tel',v-model.trim='contact',placeholder='135xxx')
    div.form-group(:class='{"has-error": errors.birthday}')
      label.control-label 宝宝生日:
      input.form-control(type='date',v-model='birthday')
    div.form-group
      label.control-label 感兴趣的内容:
      textarea.form-control(rows='2',v-model.trim='remark',placeholder='选填')
  button.btn.btn-primary(:disabled='hasError' style="display:block;margin:0 auto" @click="handleSubmit") 提交
</template>

<script>
/**
 * --------------------------------------------------------------------------
 * trial page for collecting opportunity
 * --------------------------------------------------------------------------
 */

var common = require("../common");

module.exports = {
  name: "users-setting",
  props: {},
  data: function() {
    return {
      tenantLogo: common.getTenantLogoPath(),
      name: "",
      contact: "",
      birthday: null,
      remark: ""
    };
  },
  components: {},
  computed: {
    errors: function() {
      var errors = {};
      if (!this.name || this.name.length == 0) errors.name = "姓名不能为空";
      if (!this.contact || this.contact.length == 0)
        errors.contact = "联系方式未指定";
      if (!this.birthday || !moment(this.birthday).isValid())
        errors.birthday = "日期/时间格式不正确";
      return errors;
    },
    hasError: function() {
      var errors = this.errors;
      return Object.keys(errors).some(function(key) {
        return true;
      });
    }
  },
  filters: {},
  methods: {
    handleSubmit(event) {
      var opportunity = {
        since: new Date(),
        status: "open",
        tenant: common.getTenantName(),
        name: this.name,
        contact: this.contact,
        birthday: new Date(this.birthday),
        remark: this.remark,
        source: common.getParam('source')
      };

      $.ajax("/api/opportunities", {
        type: "POST",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(opportunity),
        success: function(data) {
          //show successful message
          $("#success_dlg").modal("show");
        },
        error: function(jqXHR, status, err) {
          $("#error_dlg")
            .find("p#message")
            .text(
              jqXHR.responseJSON
                ? jqXHR.responseJSON.message
                : jqXHR.responseText
            );
          $("#error_dlg").modal("show");
          //console.error(jqXHR);
        },
        dataType: "json"
      });
    }
  },
  created: function() {}
};
</script>