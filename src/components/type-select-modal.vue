<template lang="pug">
modal-dialog(ref='dialog',buttons="confirm",@ok="clickOK",:hasError="hasError") 选择课程
  template(v-slot:body)
    a.btn.btn-sm.btn-success(href='../setting?activetab=types',target='_blank') 添加课程
    template(v-for='item in types')
      div.radio
        label
          input(type="radio",name="typeOptions",:value="item.id",v-model="selectedTypeId")
          |{{item.name}} 
          span.label.label-primary(v-show="item.visible!==false") 开放预约
</template>

<script>
module.exports = {
  name: "type-dialog",
  props: {},
  components: {
    "modal-dialog": require("./modal-dialog.vue").default
  },
  data() {
    // type: {id, name, status, visible}
    return {
      types: [],
      selectedTypeId: ""
    };
  },
  computed: {
    errors() {
      var errors = {};
      if (!this.selectedTypeId)
        errors.selectedTypeId = "请选择课程";
      return errors;
    },
    hasError() {
      var errors = this.errors
      return Object.keys(errors).some(function(key) {
        return true;
      })
    },
    selectedType() {
      if (this.selectedTypeId) {
        for (let i = 0; i < this.types.length; i++) {
          var item = this.types[i];
          if (item.id === this.selectedTypeId) {
            return item;
          }
        }
      }
      return null;
    }
  },
  methods: {
    show() {
      this.$refs.dialog.show();
    },
    clickOK() {
      this.$emit("ok", this.selectedType);
    }
  },
  mounted() { },
  created() {
    var vm = this;
    var request = $.getJSON("/api/setting/types");
    request.fail(function(jqXHR, textStatus, errorThrown) {
      var errorMessage = jqXHR.responseJSON ? jqXHR.responseJSON.message : jqXHR.responseText;
      console.error(errorMessage);
    });
    request.done(function(data, textStatus, jqXHR) {
      vm.types = data || [];
    });
  }
}
</script>
