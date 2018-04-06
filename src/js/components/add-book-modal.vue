<style>

</style>

<template lang="pug">
div.modal.fade(tabindex='-1',data-backdrop='static')
  div.modal-dialog
    div.modal-content
      div.modal-header
        button.close(type="button",data-dismiss="modal",aria-label="Close")
          span(aria-hidden="true") &times
        h4.modal-title 添加绘本
      div.modal-body
        form.form-horizontal
          div.form-group(:class='{"has-error": errors.title}',:title='errors.title')
            label.control-label.col-sm-2 绘本名称:
            div.col-sm-10
              input.form-control(type='text',v-model.trim='title',placeholder='绘本名称')
          div.form-group(:class='{"has-error": errors.teacher}',:title='errors.teacher')
            label.control-label.col-sm-2 上课老师:
            div.col-sm-10
              input.form-control(type='text',v-model.trim='teacher',placeholder='请输入')
              span.help-block.bg-danger 请在课程中设置相同老师
          div.form-group(:class='{"has-error": errors.info}',:title='errors.info')
            label.control-label.col-sm-2 内容:
            div.col-sm-10
              input.form-control(type='text',v-model.trim='info',placeholder='请输入')
      div.modal-footer
        button.btn.btn-default(type="button",data-dismiss="modal") 取消
        button.btn.btn-success(type="button",@click='handleOk',:disabled='hasError') 添加
</template>

<script>
/**
 * --------------------------------------------------------------------------
 * add-book-modal.vue component to create book
 * --------------------------------------------------------------------------
 */

module.exports = {
  props: {},
  data: function() {
    return {
      title: '',
      teacher: '',
      info: ''
    };
  },
  watch: {
  },
  computed: {
    errors: function() {
      var errors = {};
      if (!this.title || this.title.length == 0)
        errors.title = '绘本名称不能为空';
      if (!this.teacher || this.teacher.length == 0)
        errors.teacher = '老师不能为空';
      if (this.info && this.info.length > 256)
        errors.info = '内容不能超过256个字';
      return errors;
    },
    hasError: function() {
      var errors = this.errors
      return Object.keys(errors).some(function(key) {
        return true;
      })
    }
  },
  filters: {
  },
  methods: {
    show: function() {
      $(this.$el).modal('show');
    },
    handleOk: function() {
      var book = {
        title: this.title,
        teacher: this.teacher,
        info: this.info
      };
      this.$emit("ok", book);
      $(this.$el).modal('hide');
    }
  }
};
</script>