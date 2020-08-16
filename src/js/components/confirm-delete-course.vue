<style>

</style>

<template lang="pug">
div.modal.fade(tabindex='-1',data-backdrop='static')
  div.modal-dialog(onselectstart="return false")
    div.modal-content
      div.modal-header
        button.close(type="button",data-dismiss="modal",aria-label="Close")
          span(aria-hidden="true") &times
        h4.modal-title 确定删除班级吗？
      div.modal-body
        p 班级中所有课程，包括已经开始的课程都将被删除，不保留记录
        form.form-horizontal
          div.form-group
            div.col-sm-12
              input.form-control(type='text',v-model.trim='value',placeholder='请输入并确认')
              span.help-block {{'请输入"' + confirmation + '"后点击确认按钮'}}
      div.modal-footer
        button.btn.btn-default(type="button",data-dismiss="modal") 取消
        button.btn.btn-danger(type="button",@click='handleOk',:disabled='notConfirmed') 确认
</template>

<script>
/**
 * --------------------------------------------------------------------------
 * confirm-delete-course.vue component to confirm delete course
 * --------------------------------------------------------------------------
 */

module.exports = {
  props: {},
  data: function() {
    return {
      value: '',
      confirmation: '我确认删除此班级和所有相关课程'
    };
  },
  watch: {
  },
  computed: {
    notConfirmed: function() {
      return this.value !== this.confirmation;
    }
  },
  filters: {
  },
  methods: {
    show: function() {
      this.value = '';
      $(this.$el).modal('show');
    },
    handleOk: function() {
      this.$emit("ok");
      $(this.$el).modal('hide');
    }
  }
};
</script>
