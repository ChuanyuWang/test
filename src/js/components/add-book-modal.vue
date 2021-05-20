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
            label.control-label.col-sm-2 名称:
            div.col-sm-10
              input.form-control(type='text',v-model.trim='title',placeholder='绘本名称 (必填，请勿附加书名号)')
          div.form-group(:class='{"has-error": errors.info}',:title='errors.info')
            label.control-label.col-sm-2 内容:
            div.col-sm-10
              textarea.form-control(row='2',v-model.trim='info',placeholder='绘本内容 (选填，最多250个字)',style='resize:vertical;min-height:70px')
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
      this.title = '';
      this.info = '';
      $(this.$el).modal('show');
    },
    handleOk: function() {
      var book = {
        title: this.title,
        info: this.info
      };
      this.$emit("ok", book);
      $(this.$el).modal('hide');
    }
  }
};
</script>
