<style>
.bb-alert {
  position: fixed;
  text-align: center;
  bottom: 10%;
  left: 10%;
  right: 10%;
  font-size: 1.2em;
  padding: 1em 1.3em;
  z-index: 2000;
  opacity: 0.8;
}
</style>

<template lang="jade">
div.bb-alert.alert(style='display:none',:class='[isError?"alert-danger":"alert-success"]')
  span {{message}}
</template>

<script>
/**
 * --------------------------------------------------------------------------
 * alert.vue component display a alert message at bottom
 * --------------------------------------------------------------------------
 */

module.exports = {
  props: {},
  data: function() {
    return {
      message: "",
      isError: false
    };
  },
  computed: {},
  filters: {},
  methods: {
    show: function() {
      $(this.$el)
        .finish()
        .show()
        .fadeOut(2000);
    },
    showSuccessMsg: function(msg) {
      this.message = msg;
      this.isError = false;
      this.show();
    },
    showErrorMsg: function(msg) {
      this.message = msg;
      this.isError = true;
      this.show();
    }
  }
};
</script>