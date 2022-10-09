<template lang="pug">
modal-dialog(ref="dialog" buttons="confirm" @ok="clickOK", :hasError="hasError") 合约缴费
  template(v-slot:body)
    form.form-horizontal
      div.form-group
        label.control-label.col-sm-3 应收金额:
        div.col-sm-8
          p.form-control-static {{ outstandingFee }}
      div.form-group
        label.col-sm-3.control-label 支付渠道:
        div.col-sm-8(style="height: 34px")
          label.radio-inline
            input(type="radio" name="paymentType" value="wechat" disabled v-model="payment.type")
            | 微信支付
          label.radio-inline
            input(type="radio" name="paymentType" value="offline" v-model="payment.type")
            | 线下支付
      div.form-group
        label.col-sm-3.control-label 支付方式:
        div.col-sm-5
          select.form-control(v-model="payment.method")
            option(value="cash") 现金
            option(value="bankcard") 银行卡
            option(value="mobilepayment") 移动支付
      div.form-group(:class="{ 'has-error': errors.amount }")
        label.col-sm-3.control-label 实收金额:
        div.col-sm-5
          div.input-group
            input.form-control(type="number" min="1" step="1" v-model.number="payment.amount")
            span.input-group-addon 元
          span.help-block.ms-3.small(v-if="outstandingFee > payment.amount") 未缴费: {{ outstandingFee - payment.amount }}元
          span.help-block.ms-3.small(v-else) 已缴清
      div.form-group(:class="{ 'has-error': errors.payDate }")
        label.col-sm-3.control-label 缴费日期:
        div.col-sm-5
          date-picker(v-model="payment.payDate")
      div.form-group(:class="{ 'has-error': errors.comment }")
        label.col-sm-3.control-label 缴费备注:
        div.col-sm-9
          textarea.form-control.has-3-rows(rows="3" placeholder="添加缴费备注" name="note" v-model.trim="payment.comment")
          span.help-block.ms-3.small 最多256个字，缴费备注提交后无法修改
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
        type: "offline",
        comment: ""
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
      if (this.payment.comment.length > 256)
        errors.comment = "缴费备注超出256个字";
      return errors;
    },
    hasError() {
      var errors = this.errors
      return Object.keys(errors).some(function(key) {
        return true;
      })
    }
  },
  watch: {
    "payment.amount"(value) {
      console.log(value);
      this.payment.amount = Math.round(value * 100) / 100;
    }
  },
  methods: {
    show() {
      // Reset to default value
      this.payment.amount = 0;
      this.payment.method = "cash";
      this.payment.type = "offline";
      this.payment.comment = "";
      this.payment.payDate = new Date();
      this.$refs.dialog.show();
    },
    clickOK() {
      // copy the payment to get a plain object (without vue get/set functions)
      var payment = Object.assign({}, this.payment);
      payment.amount = payment.amount * 100;
      this.$emit("ok", payment);
    }
  },
  mounted() { },
  created() { }
}
</script>
