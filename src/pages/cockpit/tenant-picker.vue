<template lang="pug">
v-autocomplete(:items="tenantList" dense item-text="tenantName" item-value="tenantId" 
  clearable @focus.once="fetchTenantList" :value="value" @input="$emit('input', $event)"
  hide-details :label="label" prepend-icon="mdi-store" @change="$emit('change', $event)")
</template>

<script>
/**
 * --------------------------------------------------------------------------
 * tenant-picker.vue component for select one tenant
 * --------------------------------------------------------------------------
 */

export default {
  name: "tenant-picker",
  props: {
    label: {
      default: "",
      required: false
    },
    value: {
      required: false
    }
  },
  data: function() {
    return {
      tenantList: []
    };
  },
  mounted: function() { },
  beforeDestroy: function() { },
  watch: {},
  methods: {
    fetchTenantList() {
      var request = axios.get("/api/dlktlogs/tenant/list");
      request.then((response) => {
        this.tenantList = (response.data || []).map((value, index, array) => {
          return {
            tenantName: value.tenantName,
            tenantId: value._id
          }
        });
      });
      // TODO, catch the exception
    }
  }
};
</script>

<style lang='less'></style>
