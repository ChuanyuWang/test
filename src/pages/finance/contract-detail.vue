<template lang="pug">
div
  ol.breadcrumb
    li
      a(href="../home") 主页
    li
      a(href="../finance") 合约列表
    li.active 查看合约
  div.page-header(style="margin-top: 15px")
    h3(style="margin-top: 0; display: inline-block") 合约状态
      span.label.label-success.ms-3(style="font-size: 65%") 已缴清
    button.btn.btn-default.bg-primary(type="button" style="float: right", :disabled="hasError" @click="") 退费
    button.btn.btn-default.me-3(type="button" style="float: right", :disabled="hasError" @click="") 转课时
    button.btn.btn-primary.me-3(type="button" style="float: right", :disabled="hasError" @click="") 缴费
  div.container
    div.row
      div.col-sm-4
        form.form-horizontal.form-condensed
          div.form-group
            label.col-sm-4.control-label 类型:
            div.col-sm-8
              p.form-control-static {{ contract.type | typeFilter }}
                span.label.label-primary.ms-3 课时卡
          div.form-group
            label.col-sm-4.control-label 签约日期:
            div.col-sm-8
              p.form-control-static {{ contract.signDate | dateFilter }}
          div.form-group
            label.col-sm-4.control-label 生效日期:
            div.col-sm-8
              p.form-control-static {{ contract.effectiveDate | dateFilter }}
                a(role="button" @click="notImplement")
                  i.glyphicon.glyphicon-pencil.ms-3
          div.form-group
            label.col-sm-4.control-label 截止日期:
            div.col-sm-8
              p.form-control-static {{ contract.expireDate | dateFilter }}
                a(role="button" @click="notImplement")
                  i.glyphicon.glyphicon-pencil.ms-3
      div.col-sm-4
        form.form-horizontal.form-condensed
          div.form-group
            label.col-sm-4.control-label 剩余课时:
            div.col-sm-8
              p.form-control-static TBD课时
          div.form-group
            label.col-sm-4.control-label 剩余金额:
            div.col-sm-8
              p.form-control-static TBD元
          div.form-group
            label.col-sm-4.control-label 已消课时:
            div.col-sm-8
              p.form-control-static TBD课时
                a.small.ms-3 消课记录
                  i.glyphicon.glyphicon-search
          div.form-group
            label.col-sm-4.control-label 已消金额:
            div.col-sm-8
              p.form-control-static TBD元
      div.col-sm-4
        form.form-horizontal.form-condensed
          div.form-group
            label.col-sm-4.control-label 应收金额:
            div.col-sm-8
              p.form-control-static {{ receivable }}元
          div.form-group
            label.col-sm-4.control-label 实收金额:
            div.col-sm-8
              p.form-control-static {{ contract.received }}元
                a.small.ms-3 缴费记录
                  i.glyphicon.glyphicon-search
          div.form-group
            label.col-sm-4.control-label 欠费金额:
            div.col-sm-8(:class="{ 'text-danger': outstandingFee }")
              p.form-control-static {{ outstandingFee }}元
  div.page-header
    h3 合约课程
  div.container
    div.row.form-condensed
      div.col-sm-4
        form.form-horizontal.form-condensed
          div.form-group
            label.col-sm-4.control-label 学员:
            div.col-sm-8
              div.input-group
                p.form-control-static {{ memberData.name }}
                  a(:href="'../member/' + contract.memberId" target="_blank")
                    i.glyphicon.glyphicon-search.ms-3
          div.form-group
            label.col-sm-4.control-label 联系方式:
            div.col-sm-8
              p.form-control-static {{ memberData.contact }}
      div.col-sm-4
        form.form-horizontal
          div.form-group
            label.col-sm-4.control-label 课程:
            div.col-sm-8
              p.form-control-static {{ productName }}
          div.form-group
            label.col-sm-4.control-label 合约课时:
            div.col-sm-8
              p.form-control-static {{ contract.credit }}课时
                a(role="button" @click="notImplement")
                  i.glyphicon.glyphicon-pencil.ms-3
          div.form-group
            label.col-sm-4.control-label 课程单价:
            div.col-sm-8
              p.form-control-static {{ averageFee }}课时
          div.form-group
            label.col-sm-4.control-label 课程金额:
            div.col-sm-8
              p.form-control-static {{ totalFee }}元
                a(role="button" @click="notImplement")
                  i.glyphicon.glyphicon-pencil.ms-3
      div.col-sm-4
        form.form-horizontal
          div.form-group
            label.col-sm-4.control-label 系统外耗课:
            div.col-sm-8
              p.form-control-static {{ contract.expendedCredit }}课时
                a.small.ms-3(style="color: #777" data-toggle="tooltip" title="系统外消耗课时是指使用系统前(合同签约前)上了的课时，例如：合约中有100课时，系统外耗课20课时，则实际可以使用的课时为80课时")
                  i.glyphicon.glyphicon-info-sign
          div.form-group
            label.col-sm-4.control-label 折扣直减:
            div.col-sm-8
              p.form-control-static {{ discountFee }}元
                a(role="button" @click="notImplement")
                  i.glyphicon.glyphicon-pencil.ms-3
  div.page-header
    h3 合约备注
  div.container
    div.row
      div.col-sm-6
        form.form-horizontal
          div.form-group
            label.control-label.col-sm-2 新备注:
            div.col-sm-10
              textarea.form-control(rows="3" placeholder="添加合约备注信息, 保存后无法修改" name="note" v-model.trim="memberData.note" style="resize: vertical; min-height: 70px")
          div.form-group
            div.col-sm-offset-2.col-sm-10
              button.btn.btn-primary(type="button" @click="test", :disabled="true") 保存
  div.page-header
    h3 缴费记录
  div.container
    div.row
      div.col-sm-6
        form.form-horizontal
          div.form-group
            label.control-label.col-sm-3 应收金额:
            div.col-sm-4
              div.input-group
                input.form-control(type="number" readonly v-model="receivable")
                span.input-group-addon 元
          div.form-group
            label.col-sm-3.control-label 支付方式:
            div.col-sm-9
              p.form-control-static 线下支付
          div.form-group
            label.col-sm-3.control-label 实收金额:
            div.col-sm-4
              div.input-group
                input.form-control(type="number" min="1" step="1")
                span.input-group-addon 元
          div.form-group
            label.col-sm-3.control-label 缴费日期:
            div.col-sm-9
              p.form-control-static 13512341234
  div.page-header
    h3 消课记录
  div.page-header
    h3 修改记录
</template>
<script>

var member_select_modal = require("../../components/member-select-modal.vue").default;
var type_select_modal = require("../../components/type-select-modal.vue").default;
var serviceUtil = require("../../services/util");

module.exports = {
  name: "contract-detail",
  props: {
    contractId: String
  },
  components: {
    "member-select-modal": member_select_modal,
    "type-select-modal": type_select_modal,
    "date-picker": require('../../components/date-picker.vue').default
  },
  data() {
    return {
      tenantConfig: {},
      types: [],
      productName: "",
      memberData: {},
      contract: {}
    }
  },
  computed: {
    receivable() {
      var value = this.contract.total - this.contract.discount;
      return value > 0 ? Math.round(value) / 100 : 0;
    },
    averageFee: {
      get() {
        var value = this.contract.credit > 0 ? this.contract.total / this.contract.credit : 0
        return Math.round(value) / 100;
      },
      set(newValue) {
        var total = this.contract.credit > 0 ? newValue * this.contract.credit : 0;
        this.contract.total = Math.round(total * 100);
      }
    },
    totalFee: {
      get() {
        return Math.round(this.contract.total) / 100;
      },
      set(newValue) {
        this.contract.total = Math.round(newValue * 100);
      }
    },
    discountFee: {
      get() {
        return Math.round(this.contract.discount) / 100;
      },
      set(newValue) {
        this.contract.discount = Math.round(newValue * 100);
      }
    },
    outstandingFee() {
      return (this.contract.total - this.contract.discount - this.contract.received) / 100;
    },
    errors() {
      var errors = {};
      if (!moment(this.contract.effectiveDate).isValid())
        errors.effectiveDate = "生效日期未设置或格式不正常";
      if (moment(this.contract.expireDate).isValid() && moment(this.contract.expireDate).isBefore(this.contract.effectiveDate))
        errors.expireDate = "截止日期不能早于生效日期";
      if (this.contract.credit <= 0)
        errors.credit = "课时数不能小于零";
      if (this.averageFee < 0)
        errors.averageFee = "课程单价不能小于零";
      if (this.contract.total < 0)
        errors.total = "课程金额不能小于零";
      if (this.contract.discount < 0)
        errors.discount = "折扣金额不能小于零";
      if (this.contract.discount > 0 && this.contract.total < this.contract.discount)
        errors.discount = "折扣金额不能大于课程金额";
      if (this.contract.expendedCredit < 0)
        errors.expendedCredit = "已耗课时不能小于零";
      if (this.contract.expendedCredit > 0 && this.contract.credit < this.contract.expendedCredit)
        errors.expendedCredit = "已耗课时不能大于课时数";
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
    "contract.goods"(value, oldValue) {
      var vm = this;
      if (value) {
        var request = serviceUtil.getJSON("/api/setting/types");
        request.done(function(data, textStatus, jqXHR) {
          vm.types = data || [];
          for (let i = 0; i < vm.types.length; i++) {
            var element = vm.types[i];
            if (element.id === value) {
              vm.productName = element.name;
              break;
            }
          }
        });
      }
    },
    "contract.memberId"(value, oldValue) {
      var vm = this;
      if (value) {
        var request = serviceUtil.getJSON("/api/members/" + value);
        request.done(function(data, textStatus, jqXHR) {
          vm.memberData = data || {};
        });
      }
    }
  },
  filters: {
    typeFilter(value) {
      switch (value) {
        case "new":
          return "新签";
        case "renewal":
          return "续费";
        case "donate":
          return "赠送";
        default:
          return null;
      }
    },
    dateFilter(value) {
      if (!value) return null;
      return moment(value).format('YYYY-MM-DD');
    },
  },
  methods: {
    test() {
      console.log(this.contract.expireDate);
      console.log(this.contract.signDate);
      console.log(moment(this.contract.expireDate).isValid() ? this.contract.expireDate.toISOString() : null);
      console.log(moment(this.contract.signDate).isValid() ? this.contract.signDate.toISOString() : null);
    },
    notImplement() {
      alert("该功能不支持");
    },
    modifyContract() {
      var vm = this;
      var updatedContract = {

      };
      var request = serviceUtil.patchJSON("/api/contracts/" + this.contractId, updatedContract);
      request.done(function(data, textStatus, jqXHR) {
        vm.contract = this.data || {};
      });
    }
  },
  created() {
    var vm = this;
    vm.tenantConfig = _getTenantConfig();
    if (this.contractId) {
      var request = serviceUtil.getJSON("/api/contracts/" + this.contractId);
      request.done(function(data, textStatus, jqXHR) {
        vm.contract = data || {};
      });
    }
  },
  mounted() {
    $('[data-toggle="tooltip"]').tooltip();
  }
}
</script>
<style lang="less">
.container .page-header {
  padding-bottom: 3px;
}
</style>
