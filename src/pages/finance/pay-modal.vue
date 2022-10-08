<template lang="pug">
modal-dialog(ref="dialog" buttons="confirm" @ok="clickOK", :hasError="hasError") 合约缴费
  template(v-slot:body)
    form.form-horizontal
      div.form-group
        label.control-label.col-sm-3 应收金额:
        div.col-sm-8
          p.form-control-static {{ outstandingFee }}
      div.form-group
        label.col-sm-3.control-label 支付方式:
        div.col-sm-8(style="height: 34px")
          label.radio-inline
            input(type="radio" name="paymentType" value="wechat" disabled v-model="payment.type")
            | 微信支付
          label.radio-inline
            input(type="radio" name="paymentType" value="offline" v-model="payment.type")
            | 线下支付
      div.form-group
        label.col-sm-3.control-label 支付渠道:
        div.col-sm-5
          select.form-control(v-model="payment.method")
            option(value="cash") 现金
            option(value="bankcard") 银行卡
            option(value="mobilepayment") 移动支付
      div.form-group(:class="{ 'has-error': errors.amount }")
        label.col-sm-3.control-label 实收金额:
        div.col-sm-5
          div.input-group
            input.form-control(type="number" min="1" step="1" v-model="payment.amount")
            span.input-group-addon 元
          span.help-block.ms-3(v-if="outstandingFee > payment.amount") 未缴费: {{ outstandingFee - payment.amount }}元
          span.help-block.ms-3(v-else) 已缴清
      div.form-group(:class="{ 'has-error': errors.payDate }")
        label.col-sm-3.control-label 缴费日期:
        div.col-sm-5
          date-picker(v-model="payment.payDate")
</template>

<script>
module.exports = {
  name: "pay-dialog",
  props: {
    outstandingFee: Number
  },
  components: {
    "date-picker": require('../../components/date-picker.vue').default,
    "modal-dialog": require("../../components/modal-dialog.vue").default
  },
  data() {
    return {
      payment: {
        payDate: new Date(),
        amount: 0,
        method: "cash",
        type: "offline"
      }
    };
  },
  computed: {
    errors() {
      var errors = {};
      if (!moment(this.payment.payDate).isValid())
        errors.payDate = "缴费日期格式不正确";
      if (this.payment.amount <= 0)
        errors.amount = "缴费金额不能小于或等于零";
      return errors;
    },
    hasError() {
      var errors = this.errors
      return Object.keys(errors).some(function(key) {
        return true;
      })
    }
  },
  methods: {
    show() {
      this.$refs.dialog.show();
    },
    clickOK() {
      // copy the payment to get a plain object (without vue get/set functions)
      this.$emit("ok", Object.assign({}, this.payment));
    }
  },
  mounted() { },
  created() { }
}
</script>
