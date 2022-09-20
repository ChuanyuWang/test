<template lang="pug">
div TBD
</template>
<script>

module.exports = {
  name: "contract-create",
  props: {},
  components: {},
  data() {
    return {
      tenantConfig: {}
    }
  },
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
  methods: {},
  created() {
    var vm = this;
    vm.tenantConfig = _getTenantConfig();
  },
  mounted() { }
}
</script>
<style lang="less">
</style>
