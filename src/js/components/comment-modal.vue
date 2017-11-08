<style>

</style>

<template lang="jade">
div.modal.fade(tabindex='-1',data-backdrop='static')
  div.modal-dialog
    div.modal-content
      div.modal-header
        button.close(type="button",data-dismiss="modal",aria-label="Close")
          span(aria-hidden="true") &times
        h4.modal-title(v-if="edit") 修改备忘
        h4.modal-title(v-else) 添加备忘
      div.modal-body
        form
          div.form-group(:class='{"has-error": errors.memo}',:title='errors.memo')
            label.control-label 备忘:
            textarea.form-control(rows='3', name='comment',style='resize:vertical;max-height:250px;min-height:70px',v-model.trim='memo')
            small(style='color:#777;float:right;margin-top:2px') 不超过256个字
      div.modal-footer
        button.btn.btn-default(type="button",data-dismiss="modal") 取消
        button.btn.btn-success(type="button",v-if='edit',@click='handleOk',:disabled='hasError') 更新
        button.btn.btn-success(type="button",v-else,@click='handleOk',:disabled='hasError') 添加
</template>

<script>
/**
 * --------------------------------------------------------------------------
 * comment-modal.vue component for create and edit comment
 * --------------------------------------------------------------------------
 */
var noop = function () {};

module.exports = {
  props: {},
  data: function() {
    return {
      edit: false,
      memo: '',
      callback: noop // callback function with one string parameter as comment
    };
  },
  watch: {
  },
  computed: {
    errors: function() {
      var errors = {};
      if (!this.memo || this.memo.length == 0)
        errors.memo = '备忘内容不能为空';
      if (this.memo && this.memo.length > 255)
        errors.memo = '备忘内容不能超过256个字';
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
    show: function(memo, callback) {
      if (typeof(memo) === 'function') return this.show(null, memo);
      if (typeof(callback) === 'function') this.callback = callback;
      else this.callback = noop;
      if (typeof(memo) === 'string' && memo.length > 0) {
        this.memo = memo;
        this.edit = true;
      } else {
        this.memo = '';
        this.edit = false;
      }
      $(this.$el).modal('show');
    },
    handleOk: function() {
      $(this.$el).modal('hide');
      this.callback(this.memo);
    }
  }
};
</script>