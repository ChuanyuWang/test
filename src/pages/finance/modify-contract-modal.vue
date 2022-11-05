<template lang="pug">
modal-dialog(ref="dialog" buttons="confirm" size="medium" @ok="clickOK", :hasError="hasError") 修改合约
  template(v-slot:body)
    form.form-horizontal
      div.form-group
        label.col-sm-3.control-label 类型:
        div.col-sm-5
          select.col-sm-5.form-control(v-model="item.type")
            option.text-default(value="new") 新签
            option.text-default(value="renewal") 续费
            option.text-default(value="donate") 赠送
      div.form-group(:class="{ 'has-error': errors.effectiveDate }")
        label.col-sm-3.control-label 生效日期:
        div.col-sm-5
          date-picker(v-model="item.effectiveDate")
      div.form-group(:class="{ 'has-error': errors.expireDate }")
        label.col-sm-3.control-label 截止日期:
        div.col-sm-5
          date-picker(v-model="item.expireDate")
      div.form-group(:class="{ 'has-error': errors.credit }")
        label.col-sm-3.control-label 课时数:
        div.col-sm-5
          div.input-group
            input.form-control(type="number" v-model.number="item.credit" min="1" step="1")
            span.input-group-addon 课时
      div.form-group
        label.col-sm-3.control-label 课程单价:
        div.col-sm-5
          p.form-control-static {{averageFee}}元
      div.form-group(:class="{ 'has-error': errors.total }")
        label.col-sm-3.control-label 课程金额:
        div.col-sm-5
          div.input-group
            input.form-control(type="number" v-model.number="totalFee" min="0" step="1")
            span.input-group-addon 元
      div.form-group(:class="{ 'has-error': errors.discount }")
        label.col-sm-3.control-label 折扣直减:
        div.col-sm-5
          div.input-group
            input.form-control(type="number" v-model.number="discount" min="0" step="1")
            span.input-group-addon 元
      div.form-group(:class="{ 'has-error': errors.comment }")
        label.col-sm-3.control-label 合约备注:
        div.col-sm-9
          textarea.form-control.has-3-rows(rows="3" placeholder="添加合约备注" v-model.trim="item.comment")
          span.help-block.ms-3.small 最多256个字，提交后无法修改
</template>

<script>
module.exports = {
  name: "modify-contract-dialog",
  props: {
    contract: {
      type: Object,
      require: true
    }
  },
  components: {
    "date-picker": require('../../components/date-picker.vue').default,
    "modal-dialog": require("../../components/modal-dialog.vue").default
  },
  data() {
    return {
      item: {
        type: "new",
        effectiveDate: null,
        expireDate: null,
        credit: 0,
        total: 0,
        discount: 0,
        comment: ""
      }
    };
  },
  computed: {
    averageFee() {
      var value = this.item.credit > 0 ? this.item.total / this.item.credit : 0
      return Math.round(value) / 100;
    },
    totalFee: {
      get() {
        return Math.round(this.item.total) / 100;
      },
      set(newValue) {
        this.item.total = Math.round(newValue * 100);
      }
    },
    discount: {
      get() {
        return Math.round(this.item.discount) / 100;
      },
      set(newValue) {
        this.item.discount = Math.round(newValue * 100);
      }
    },
    errors() {
      var errors = {};
      if (this.item.comment.length == 0)
        errors.comment = "备注不能为空";
      if (this.item.comment.length > 256)
        errors.comment = "备注不超过256个字";
      if (!moment(this.item.effectiveDate).isValid())
        errors.effectiveDate = "生效日期未设置或格式不正常";
      if (moment(this.item.expireDate).isValid() && moment(this.item.expireDate).isBefore(this.item.effectiveDate))
        errors.expireDate = "截止日期不能早于生效日期";
      if (this.item.credit < this.contract.consumedCredit + this.contract.expendedCredit)
        errors.credit = "课时数不能小于已消耗课时";
      if (this.item.credit <= 0)
        errors.credit = "课时数不能小于或等于零";
      if (this.item.total < this.item.discount)
        errors.total = "课程金额不能小于折扣";
      return errors;
    },
    hasError() {
      var errors = this.errors
      return Object.keys(errors).some(function(key) {
        return true;
      })
    }
  },
  watch: {},
  methods: {
    show() {
      this.item.type = this.contract.type;
      this.item.effectiveDate = this.contract.effectiveDate;
      this.item.expireDate = this.contract.expireDate;
      this.item.credit = this.contract.credit;
      this.item.total = this.contract.total;
      this.item.discount = this.contract.discount;
      this.item.comment = "";
      this.$refs.dialog.show();
    },
    clickOK() {
      // copy the contract to get a plain object (without vue get/set functions)
      var contract = Object.assign({}, this.item);
      this.$emit("ok", contract);
    }
  },
  mounted() { },
  created() { }
}
</script>
