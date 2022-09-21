<template lang="pug">
div
  ol.breadcrumb
    li
      a(href="../home") 主页
    li
      a(href="../finance") 合约列表
    li.active 创建合约
  div.page-header
    h3(style='margin-top:0;display:inline-block') 学员信息
    button.btn.btn-success(type='button',style='float:right',disabled,@click='') 确定
  div.container
    div.row
      div.col-sm-6
        form.form-horizontal
          div.form-group
            label.col-sm-2.control-label 类型:
            select.col-sm-5.form-control(v-model='memberData.status',@change='',style='margin-left:15px;width:auto')
              option.text-default(value='new') 新签
              option.text-default(value='renewal') 续费
              option.text-default(value='donate') 赠送
          div.form-group
            label.col-sm-2.control-label 联系方式:
            div.col-sm-10
              p.form-control-static 13512341234
          div.form-group
            label.col-sm-2.control-label openID:
            div.col-sm-9
              p.form-control-static aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
          div.form-group(:class='{"has-error": errors.name}')
            label.col-sm-2.control-label 姓名:
            div.col-sm-5(data-toggle="tooltip",data-placement="right",:title="errors.name")
              input.form-control(v-model.trim='memberData.name', placeholder='学员姓名',type='text')
          div.form-group(:class='{"has-error": errors.birthday}')
            label.control-label.col-sm-2 课时数:
            div.col-sm-4(data-toggle="tooltip",data-placement="right",:title="errors.birthday")
              input.form-control(v-model.trim='memberData.name', placeholder='课时数',type='number')
          div.form-group
            div.col-sm-offset-2.col-sm-10
              button.btn.btn-success(type='button',v-on:click='',:disabled='hasError') 保存
      div.col-sm-6
        form.form-horizontal
          div.form-group
            label.col-sm-2.control-label 类型:
            select.col-sm-5.form-control(v-model='memberData.status',@change='',style='margin-left:15px;width:auto')
              option.text-default(value='new') 新签
              option.text-default(value='renewal') 续费
              option.text-default(value='donate') 赠送
          div.form-group
            label.col-sm-2.control-label 联系方式:
            div.col-sm-10
              p.form-control-static 13512341234
          div.form-group
            label.col-sm-2.control-label openID:
            div.col-sm-9
              p.form-control-static aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
          div.form-group(:class='{"has-error": errors.name}')
            label.col-sm-2.control-label 姓名:
            div.col-sm-10(data-toggle="tooltip",data-placement="right",:title="errors.name")
              input.form-control(v-model.trim='memberData.name', placeholder='学员姓名',type='text')
          div.form-group(:class='{"has-error": errors.birthday}')
            label.control-label.col-sm-2 课时数:
            div.col-sm-4(data-toggle="tooltip",data-placement="right",:title="errors.birthday")
              input.form-control(v-model.trim='memberData.name', placeholder='学员姓名',type='number')
          div.form-group
            div.col-sm-offset-2.col-sm-10
              button.btn.btn-success(type='button',v-on:click='',:disabled='hasError') 保存
  div.page-header
    h3 课程信息
</template>
<script>

module.exports = {
  name: "contract-create",
  props: {},
  components: {},
  data() {
    return {
      tenantConfig: {},
      memberData: {}
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
