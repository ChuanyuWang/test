<template lang="pug">
modal-dialog(ref='dialog',buttons="confirm",@ok="clickOK",:hasError="hasError") 选择一个课程
  template(v-slot:body)
    a.btn.btn-sm.btn-success.mb-7(href='../setting?activetab=types',target='_blank') 添加课程类型
    template(v-for='item in types')
      div.radio
        label
          input(type="radio",name="typeOptions",:value="item.id",v-model="selectedTypeId")
          |{{item.name}} 
          span.label.label-primary(v-show="item.visible!==false" style="opacity:0.8") 开放预约
  template(v-slot:helpText)
    p.small(style='color:#777;float:left;margin-top:7px') 若需要同时选择两个或多个课程，请创建多份合约，一份合约对应一种课程
</template>

<script>
var serviceUtil = require("../services/util");

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
    var request = serviceUtil.getJSON("/api/setting/types");
    request.done((data, textStatus, jqXHR) => {
      this.types = data || [];
    });
  }
}
</script>
