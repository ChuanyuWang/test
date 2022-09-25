<template lang="pug">
div
  ol.breadcrumb
    li
      a(href="../home") 主页
    li
      a(href="../finance") 合约列表
    li.active 创建合约
  div.page-header
    h3(style='margin-top:0;display:inline-block') 合约信息
    button.btn.btn-success(type='button',style='float:right',disabled,@click='') 确定
  div.container
    div.row
      div.col-sm-6
        form.form-horizontal
          div.form-group
            label.col-sm-2.control-label 学员:
            div.col-sm-5
              div.input-group
                input.form-control(type='text',readonly)
                span.input-group-btn
                  button.btn.btn-primary(type='button') 选择学员
          div.form-group
            label.col-sm-2.control-label 联系方式:
            div.col-sm-10
              p.form-control-static 13512341234
      div.col-sm-6
        form.form-horizontal
          div.form-group
            label.col-sm-2.control-label 类型:
            select.col-sm-5.form-control(v-model='memberData.status',@change='',style='margin-left:15px;width:auto')
              option.text-default(value='new') 新签
              option.text-default(value='renewal') 续费
              option.text-default(value='donate') 赠送
            div.col-sm-5
              p.form-control-static(style='color:#808080')
                small {{memberData.since | formatDate}}课时卡
          div.form-group
            label.col-sm-2.control-label 生效日期:
            div.col-sm-10
              p.form-control-static 13512341234
          div.form-group
            label.col-sm-2.control-label 截止日期:
            div.col-sm-9
              p.form-control-static TBD
          div.form-group
            label.col-sm-2.control-label 签约日期:
            div.col-sm-10
              p.form-control-static 13512341234
  div.page-header
    h3 选择课程
  div.container
    div.row
      div.col-sm-6
        form.form-horizontal
          div.form-group
            label.col-sm-2.control-label 课程:
            div.col-sm-5
              div.input-group
                input.form-control(type='text',readonly)
                span.input-group-btn
                  button.btn.btn-primary(type='button') 选择课程
          div.form-group
            label.col-sm-2.control-label 课时数:
            div.col-sm-4
              div.input-group
                input.form-control(type='number',min='1',step='1')
                span.input-group-addon 课时
          div.form-group
            label.col-sm-2.control-label 课程单价:
            div.col-sm-4
              div.input-group
                input.form-control(type='number',min='1',step='1')
                span.input-group-addon 元
          div.form-group
            label.col-sm-2.control-label 课程金额:
            div.col-sm-4
              div.input-group
                input.form-control(type='number',min='1',step='1')
                span.input-group-addon 元
      div.col-sm-6
        form.form-horizontal
          div.form-group
            label.col-sm-2.control-label 已耗课时:
            div.col-sm-4
              div.input-group
                input.form-control(type='number',min='1',step='1')
                span.input-group-addon 课时
          div.form-group
            label.col-sm-2.control-label 折扣直减:
            div.col-sm-4
              div.input-group
                input.form-control(type='number',min='1',step='1')
                span.input-group-addon 元
  div.page-header
    h3 合约备注
  div.container
    div.row
      div.col-sm-6
        form.form-horizontal
          div.form-group
            label.control-label.col-sm-2 新备注:
            div.col-sm-10
              textarea.form-control(rows='3', placeholder='添加合约备注信息, 保存后无法修改', name='note',v-model.trim='memberData.note',style='resize:vertical;min-height:70px')
          div.form-group
            div.col-sm-offset-2.col-sm-10
              button.btn.btn-success(type='button',v-on:click='',:disabled='hasError') 保存
  div.page-header
    h3 合约缴费
  div.container
    div.row
      div.col-sm-6
        form.form-horizontal
          div.form-group
            label.control-label.col-sm-2 应收金额:
            div.col-sm-4
              div.input-group
                input.form-control(type='number',readonly)
                span.input-group-addon 元
          div.form-group
            label.col-sm-2.control-label 支付方式:
            div.col-sm-10
              p.form-control-static 线下支付
          div.form-group
            label.col-sm-2.control-label 实收金额:
            div.col-sm-4
              div.input-group
                input.form-control(type='number',min='1',step='1')
                span.input-group-addon 元
          div.form-group
            label.col-sm-2.control-label 缴费日期:
            div.col-sm-10
              p.form-control-static 13512341234
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
