/**
 * --------------------------------------------------------------------------
 * view-member-course-modal.js modal dailog for view member's classes of one course
 * --------------------------------------------------------------------------
 */
<template lang="pug">
div.modal.fade(tabindex='-1',data-backdrop='static')
  div.modal-dialog
    div.modal-content
      div.modal-header
        button.close(type="button",data-dismiss="modal",aria-label="Close")
          span(aria-hidden="true") &times
        h4.modal-title {{$t('view_member_course_title')}}
      div.modal-body
        form.form-horizontal
          div.form-group
            label.control-label.col-sm-2 {{$t('member_name')}}
            div.col-sm-6
              p.form-control-static {{name}}
        div
          ul.nav.nav-tabs(role='tablist')
            li.active
              a(data-toggle='tab',href='#notstarted') {{$t('not_started')}}
            li
              a(data-toggle='tab',href='#completed') {{$t('completed')}}
          div.tab-content
            div.tab-pane.active(id='notstarted')
              p abc
            div.tab-pane(id='completed')
              p 456
      div.modal-footer
        button.btn.btn-default(type="button",data-dismiss="modal") {{$t('dialog_cancel')}}
        button.btn.btn-success(type="button",@click='handleOK') {{$t('dialog_ok')}}
</template>

<script>

module.exports = {
  props: {
    courseid: String // course id
  },
  data: function() {
    return {
      name: '' // member name
    };
  },
  watch: {},
  computed: {
    errors: function() {
      var errors = {};
      return errors;
    },
    hasError: function() {
      var errors = this.errors
      return Object.keys(errors).some(function(key) {
        return true;
      })
    }
  },
  filters: {},
  methods: {
    show: function(value) {
      // TODO, clear error
      $(this.$el).modal('show');
    },
    handleOK: function() {
      if (this.hasError) return;

      this.$emit("ok", this.$data);
      $(this.$el).modal('hide');
    }
  },
  mounted: function() {
    // 'this' is refer to vm instance
    //var vm = this;
  }
};
</script>

<style lang='less'>
</style>