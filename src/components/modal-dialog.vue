<template lang="pug">
div.modal(tabindex='-1',:data-backdrop='backdrop||"static"',role="dialog",aria-labelledby="Modal Label")
  div.modal-dialog(:class="dialogSize")
    div.modal-content
      div.modal-header
        button.close(type="button",data-dismiss="modal",aria-label="Close")
          span(aria-hidden="true") &times;
        h4.modal-title
          slot 标题
      div.modal-body
        slot(name="body")
      div.modal-footer
        slot(name="footer",v-bind:param="param")
          template(v-if='buttons === "ok"')
            button.btn(type="button",@click='hide(true)',:class='btnStyle') {{ $t('dialog_ok') }}
          template(v-if='buttons === "cancel"')
            button.btn.btn-default(type="button",data-dismiss="modal") {{ $t('dialog_cancel') }}
          template(v-if='buttons === "confirm"')
            button.btn.btn-default(type="button",data-dismiss="modal") {{ $t('dialog_cancel') }}
            button.btn(type="button",:disabled='hasError',@click='hide(true)',:class='btnStyle')
              slot(name="action") {{ $t('dialog_confirm') }}
</template>

<script>
module.exports = {
  name: "modal-dialog",
  props: {
    backdrop: {
      type: Boolean,
      default: false // "true" - close the dialog when clicking
    },
    buttons: {
      type: String,
      default: "ok", // ok, confirm, cancel
      validator: function(value) {
        // must be one of below values
        return ['ok', 'confirm', 'cancel'].indexOf(value) !== -1
      }
    },
    size: {
      type: String,
      default: "medium",
      validator: function(value) {
        // must be one of below values
        return ['small', 'medium', 'large'].indexOf(value) !== -1
      }
    },
    hasError: Boolean,
    buttonStyle: {
      type: String,
      default: "primary", // primary, success, danger
      validator: function(value) {
        // must be one of below values
        return ['primary', 'success', 'danger'].indexOf(value) !== -1
      }
    }
  },
  data: function() {
    return {
      param: {}
    };
  },
  computed: {
    dialogSize: function() {
      return {
        "modal-sm": this.size === "small",
        "modal-lg": this.size === "large"
      }
    },
    btnStyle: function() {
      return {
        "btn-primary": this.buttonStyle === "primary",
        "btn-success": this.buttonStyle === "success",
        "btn-danger": this.buttonStyle === "danger"
      }
    }
  },
  methods: {
    show: function(data) {
      this.param = data;
      $(this.$el).modal('show');
    },
    hide: function(emitOKEvent) {
      $(this.$el).modal('hide');
      if (emitOKEvent) {
        this.$emit('ok', this.param);
      }
    }
  },
  mounted: function() { }
}
</script>
