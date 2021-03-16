<style>
</style>

<template lang="pug">
div.modal.fade(tabindex='-1',data-backdrop='static')
  div.modal-dialog
    div.modal-content
      div.modal-header
        button.close(type="button",data-dismiss="modal",aria-label="Close")
          span(aria-hidden="true") &times
        h4.modal-title Create User
      div.modal-body
        form.form-horizontal
          div.form-group(:class='{"has-error": errors.tenant}',:title='errors.tenant')
            label.control-label.col-sm-4 Tenant:
            div.col-sm-5
              input.form-control(type='text',v-model.trim='tenant',disabled)
          div.form-group(:class='{"has-error": errors.user}',:title='errors.user')
            label.control-label.col-sm-4 User Name:
            div.col-sm-5
              input.form-control(type='text',v-model.trim='user',autoComplete='nope')
          div.form-group(:class='{"has-error": errors.password}',:title='errors.password')
            label.control-label.col-sm-4 Password:
            div.col-sm-5
              input.form-control(type='password',v-model.trim='password',autoComplete='new-password')
          div.form-group(:class='{"has-error": errors.display}',:title='errors.display')
            label.control-label.col-sm-4 Display Name:
            div.col-sm-5
              input.form-control(type='text',v-model.trim='display',placeholder='')
          div.form-group
            label.control-label.col-sm-4 Role:
            div.col-sm-5
              select.form-control(v-model.trim='role')
                option(value='admin') admin
                option(value='user') user
      div.modal-footer
        button.btn.btn-default(type="button",data-dismiss="modal") Cancel
        button.btn.btn-success(type="button",@click='handleOk',:disabled='hasError') Create
</template>

<script>
/**
 * --------------------------------------------------------------------------
 * create-user-modal.vue component to create new user of tenant
 * --------------------------------------------------------------------------
 */

module.exports = {
  props: {},
  data: function() {
    return {
      user: '',
      password: '',
      tenant: '',
      display: '',
      role: 'admin'
    };
  },
  watch: {
  },
  computed: {
    errors: function() {
      var errors = {};
      if (!this.user)
        errors.user = 'user is empty';
      if (!this.password)
        errors.password = 'password is empty';
      if (!this.tenant)
        errors.tenant = 'tenant is empty';
      if (!this.display)
        errors.display = 'display name is empty';
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
    show: function(tenant) {
      this.tenant = tenant;
      $(this.$el).modal('show');
    },
    handleOk: function() {
      var res = {
        user: this.user,
        password: this.password,
        tenant: this.tenant,
        display: this.display,
        role: this.role || undefined
      };
      this.$emit("ok", res);
      $(this.$el).modal('hide');
    }
  }
};
</script>
