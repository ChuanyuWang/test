<template lang="pug">
div.container
  ol.breadcrumb
    li
      a(href="../home") 主页
    li
      a(href="../finance") 合约列表
    li.active 查看合约
  div.page-header(style="margin-top: 15px")
    h3(style="margin-top: 0; display: inline-block") 合约状态
      span.label.label-default.ms-3(style="font-size: 65%" v-if="contract.status == 'deleted'") 已作废
      span.label.label-primary.ms-3(style="font-size: 65%" v-else-if="contract.status == 'closed'") 已完成
      span.label.label-danger.ms-3(style="font-size: 65%" v-else-if="isExpired") 已过期
      span.label.label-success.ms-3(style="font-size: 65%" v-else-if="contract.status == 'paid'") 已缴清
      span.label.label-danger.ms-3(style="font-size: 65%" v-else) 未缴清
    button.btn.btn-danger.pull-right(type="button" v-show="contract.status !== 'deleted'" @click="$refs.confirmDeleteDialog.show()") 删除
    button.btn.btn-primary.pull-right.me-3(type="button" @click="openModifyDialog") 修改
    //button.btn.btn-default.pull-right.me-3(type="button" @click="notImplemented") 转课时
    //button.btn.btn-default.pull-right.me-3(type="button" @click="notImplemented") 退费
    button.btn.btn-default.pull-right.me-3(type="button" @click="notImplemented") 结束合约
    button.btn.btn-primary.pull-right.me-3(type="button" v-show="contract.status == 'open' || contract.status == 'outstanding'" @click="openPayDialog") 缴费
  div.row
    div.col-xs-12.col-sm-6.col-sm-offset-3.col-md-4.col-md-offset-4.mb-7
      div.progress(style="margin:0;height:10px")
        div.progress-bar.progress-bar-primary(:style="consumedWidth")
        div.progress-bar.progress-bar-success(:style="plannedWidth")
      div.d-flex(style="justify-content:space-between")
        span.text-primary 消{{consumedTotalCredit - contract.unStartedClassCredit | toFixed1}}
        span.text-success 排{{contract.unStartedClassCredit | toFixed1}}
        span.text-muted 余{{remainingCredit | toFixed1}}
  div.row.form-condensed
    div.col-sm-4.col-xs-6
      form.form-horizontal
        div.form-group
          label.col-xs-6.col-sm-5.col-md-4.control-label 类型:
          div.col-xs-6.col-sm-7.col-md-8
            p.form-control-static {{ contract.type | typeFilter }}
              span.label.label-primary.ms-3 课时卡
              a(role="button" @click="openModifyDialog")
                i.glyphicon.glyphicon-pencil.ms-3
        div.form-group
          label.col-xs-6.col-sm-5.col-md-4.control-label 签约日期:
          div.col-xs-6.col-sm-7.col-md-8
            p.form-control-static {{ contract.signDate | dateFilter }}
        div.form-group
          label.col-xs-6.col-sm-5.col-md-4.control-label 生效日期:
          div.col-xs-6.col-sm-7.col-md-8
            p.form-control-static {{ contract.effectiveDate | dateFilter }}
              a(role="button" @click="openModifyDialog")
                i.glyphicon.glyphicon-pencil.ms-3
        div.form-group
          label.col-xs-6.col-sm-5.col-md-4.control-label 截止日期:
          div.col-xs-6.col-sm-7.col-md-8
            p.form-control-static {{ contract.expireDate | dateFilter }}
              a(role="button" @click="openModifyDialog")
                i.glyphicon.glyphicon-pencil.ms-3
    div.col-sm-4.col-xs-6
      form.form-horizontal
        div.form-group
          label.col-xs-6.col-sm-5.col-md-4.control-label 已用课时:
          div.col-xs-6.col-sm-7.col-md-8
            p.form-control-static {{consumedTotalCredit | toFixed1}}课时
              a.small.ms-3(style="color: #777" data-toggle="tooltip" title="已用课时=消+排; 是指所有已经排课课程的课时合计 (包括已经结束和尚未开始的课程)")
                i.glyphicon.glyphicon-info-sign
              a.small.ms-3(role="button" href="#classes-section") 消课记录
                i.glyphicon.glyphicon-search.ms-3
        div.form-group
          label.col-xs-6.col-sm-5.col-md-4.control-label 可用课时:
          div.col-xs-6.col-sm-7.col-md-8
            p.form-control-static {{remainingCredit | toFixed1}}课时
              a.small.ms-3(style="color: #777" data-toggle="tooltip" title="可用课时(余) = 合约课时 - 已用课时")
                i.glyphicon.glyphicon-info-sign
        div.form-group
          label.col-xs-6.col-sm-5.col-md-4.control-label 剩余课时:
          div.col-xs-6.col-sm-7.col-md-8
            p.form-control-static {{actualRemaining | toFixed1}}课时
              a.small.ms-3(style="color: #777" data-toggle="tooltip" title="剩余课时=排+余; 是指可用课时和已经排课但尚未开始的课时")
                i.glyphicon.glyphicon-info-sign
        div.form-group
          label.col-xs-6.col-sm-5.col-md-4.control-label 已消金额:
          div.col-xs-6.col-sm-7.col-md-8
            p.form-control-static {{consumedFee}}元
              a.small.ms-3(style="color: #777" data-toggle="tooltip" title="已消金额 = 已用课时 * 折后课单价")
                i.glyphicon.glyphicon-info-sign
        div.form-group
          label.col-xs-6.col-sm-5.col-md-4.control-label 剩余金额:
          div.col-xs-6.col-sm-7.col-md-8
            p.form-control-static {{remainingFee}}元
              a.small.ms-3(style="color: #777" data-toggle="tooltip" title="剩余金额 = 应收金额 - 已消金额")
                i.glyphicon.glyphicon-info-sign
    div.col-sm-4.col-xs-6
      form.form-horizontal
        div.form-group
          label.col-xs-6.col-sm-5.col-md-4.control-label 应收金额:
          div.col-xs-6.col-sm-7.col-md-8
            p.form-control-static {{ receivable }}元
              a.small.ms-3(style="color: #777" data-toggle="tooltip" title="应收金额 = 课程金额 - 折扣直减")
                i.glyphicon.glyphicon-info-sign
        div.form-group
          label.col-xs-6.col-sm-5.col-md-4.control-label 实收金额:
          div.col-xs-6.col-sm-7.col-md-8
            p.form-control-static {{ contract.received / 100 | toFixed2 }}元
              a.small.ms-3(role="button" href="#payments-section") 缴费记录
                i.glyphicon.glyphicon-search.ms-3
        div.form-group
          label.col-xs-6.col-sm-5.col-md-4.control-label 欠费金额:
          div.col-xs-6.col-sm-7.col-md-8(:class="{ 'text-danger': outstandingFee }")
            p.form-control-static {{ outstandingFee }}元
              a.small.ms-3(style="color: #777" data-toggle="tooltip" title="欠费金额 = 应收金额 - 实收金额 (负数表示多缴)")
                i.glyphicon.glyphicon-info-sign
  div.page-header
    h3 合约课程
  div.row.form-condensed
    div.col-sm-4.col-xs-6
      form.form-horizontal
        div.form-group
          label.col-xs-6.col-sm-5.col-md-4.control-label 合约编号:
          div.col-xs-6.col-sm-7.col-md-8
            p.form-control-static {{ contract.serialNo }}
        div.form-group
          label.col-xs-6.col-sm-5.col-md-4.control-label 学员:
          div.col-xs-6.col-sm-7.col-md-8
            div.input-group
              p.form-control-static
                a(:href="'../member/' + contract.memberId")
                  i.glyphicon.glyphicon-user.me-3
                  | {{ memberData.name }}
        div.form-group
          label.col-xs-6.col-sm-5.col-md-4.control-label 联系方式:
          div.col-xs-6.col-sm-7.col-md-8
            p.form-control-static {{ memberData.contact }}
    div.col-sm-4.col-xs-6
      form.form-horizontal
        div.form-group
          label.col-xs-6.col-sm-5.col-md-4.control-label 课程:
          div.col-xs-6.col-sm-7.col-md-8
            p.form-control-static {{ productName }}
        div.form-group
          label.col-xs-6.col-sm-5.col-md-4.control-label 合约课时:
          div.col-xs-6.col-sm-7.col-md-8
            p.form-control-static {{ contract.credit | toFixed1 }}课时
              a(role="button" @click="openModifyDialog")
                i.glyphicon.glyphicon-pencil.ms-3
        div.form-group
          label.col-xs-6.col-sm-5.col-md-4.control-label 课程单价:
          div.col-xs-6.col-sm-7.col-md-8
            p.form-control-static {{ averageFee }}元
              a.small.ms-3(style="color: #777" data-toggle="tooltip" title="课程单价 = 课程金额 / 合约课时")
                i.glyphicon.glyphicon-info-sign
        div.form-group
          label.col-xs-6.col-sm-5.col-md-4.control-label 课程金额:
          div.col-xs-6.col-sm-7.col-md-8
            p.form-control-static {{ totalFee }}元
              a(role="button" @click="openModifyDialog")
                i.glyphicon.glyphicon-pencil.ms-3
    div.col-sm-4.col-xs-6
      form.form-horizontal
        div.form-group
          label.col-xs-6.col-sm-5.col-md-4.control-label 系统外耗课:
          div.col-xs-6.col-sm-7.col-md-8
            p.form-control-static {{ contract.expendedCredit }}课时
              a.small.ms-3(style="color: #777" data-toggle="tooltip" title="系统外消耗课时是指使用系统前(合同签约前)上了的课时，例如：合约中有100课时，系统外耗课20课时，则实际可以使用的课时为80课时")
                i.glyphicon.glyphicon-info-sign
        div.form-group
          label.col-xs-6.col-sm-5.col-md-4.control-label 折扣直减:
          div.col-xs-6.col-sm-7.col-md-8
            p.form-control-static {{ discountFee }}元
              a(role="button" @click="openModifyDialog")
                i.glyphicon.glyphicon-pencil.ms-3
        div.form-group
          label.col-xs-6.col-sm-5.col-md-4.control-label 折后课单价:
          div.col-xs-6.col-sm-7.col-md-8
            p.form-control-static {{ receivable / contract.credit | toFixed2}}元
              a.small.ms-3(style="color: #777" data-toggle="tooltip" title="折后课单价 = 应收金额 / 合约课时")
                i.glyphicon.glyphicon-info-sign
  contract-comments(:contractId="contractId")
  div.page-header
    h3(style="display: inline-block") 缴费记录
      a(name="payments-section")
    button.btn.btn-default(type="button" @click="$refs.paymentTable.refresh()" style="float: right; margin-top: 16px")
      span.glyphicon.glyphicon-refresh.me-3
      | 刷新
  div.row
    div.col-sm-12
      div#paymentToolbar
      bootstrap-table.table-striped(ref="paymentTable", :columns="paymentTableColumns", :options="paymentTableOptions")
  contract-history(ref="historySection" :contractId="contractId")
  div.page-header
    h3(style="display: inline-block") 消课记录
      a(name="classes-section")
    button.btn.btn-default(type="button" @click="showAndRefreshClassesSection" style="float: right; margin-top: 16px")
      span.glyphicon.glyphicon-refresh.me-3
      | 刷新
  div#classesSection.row(style="display:none")
    div.col-sm-12
      div#classesToolbar
      bootstrap-table.table-striped(ref="classesTable", :columns="classesTableColumns", :options="classesTableOptions")
  div.row(style='height:20px')
  pay-dialog(ref="payDialog" buttons="confirm" @ok="pay", :outstandingFee="outstandingFee")
  modify-contract-dialog(ref="modifyDialog" @ok="modifyContract" :contract="contract")
  modal-dialog(ref="confirmDeletePaymentDialog" buttons="confirm" @ok="deletePayment") 删除缴费记录
    template(v-slot:body)
      p 确认删除并撤销缴费吗?
      p.small (撤销后合约的实收金额和欠费金额会发生变动)
  modal-dialog(ref="confirmDeleteDialog" buttons="confirm" @ok="deleteContract") 删除合约
    template(v-slot:body)
      p 确认删除并作废合约吗?
      p.small <b>注意: 删除操作无法恢复</b>, 删除后合约的状态变为作废
      p.small (不能删除已缴费或已约课的合约)
  message-alert(ref="messager")
</template>
<script>

import messageAlert from "../../components/message-alert.vue";
import serviceUtil from "../../services/util";
import commonUtil from "../../common/common";
import contractComments from "./contract-comments.vue";
import contractHistory from "./contract-history.vue";
import modifyContractDialog from "./modify-contract-modal.vue";
import datePicker from "../../components/date-picker.vue";
import modalDialog from "../../components/modal-dialog.vue";
import payDialog from "./pay-modal.vue";

export default {
  name: "contract-detail",
  props: {
    appData: {
      type: String, // should be contract id
      require: true
    }
  },
  components: {
    "BootstrapTable": BootstrapTable,
    "contract-comments": contractComments,
    "contract-history": contractHistory,
    "modify-contract-dialog": modifyContractDialog,
    "message-alert": messageAlert,
    "date-picker": datePicker,
    "modal-dialog": modalDialog,
    "pay-dialog": payDialog
  },
  data() {
    return {
      tenantConfig: {},
      types: [],
      productName: "",
      memberData: {},
      contract: {},
      paymentTableColumns: [{
        field: "payDate",
        title: "缴费日期",
        sortable: true,
        formatter: commonUtil.dateFormatter2
      }, {
        field: "amount",
        title: "缴费金额",
        formatter: commonUtil.CNYFormatter
      }, {
        field: "type",
        title: "支付渠道",
        formatter: this.typeFormatter
      }, {
        field: "method",
        title: "支付方式",
        formatter: this.methodFormatter
      }, {
        field: "comment",
        title: "备注"
      }, {
        title: "操作",
        formatter: this.actionFormatter,
        events: {
          'click .delete-payment': this.confirmDeletePayment
        }
      }],
      paymentTableOptions: {
        //toolbar: "#paymentToolbar",
        locale: "zh-CN",
        //showRefresh: true,
        //search: true,
        queryParams: this.customQuery,
        url: "/api/payments",
        uniqueId: "_id",
        sortName: "payDate",
        sortOrder: "desc",
        pageSize: 15,
        pageList: [15, 25, 50, 100],
        pagination: true,
        sidePagination: "server"
      },
      classesTableColumns: [{
        field: "date",
        title: "日期",
        sortable: true,
        formatter: commonUtil.dateFormatter2
      }, {
        field: "name",
        title: "课程名称",
        formatter: (value, row) => {
          return `<a href="../class/${row._id}"><i class="glyphicon glyphicon-blackboard me-3"/>${value}</a>`;
        }
      }, {
        field: "cost",
        title: "消耗课时"
      }, {
        field: "cost",
        title: "消耗金额",
        formatter: value => {
          return value * this.averageFee + "元";
        }
      }, {
        field: "type",
        title: "课程类型",
        formatter: this.getTypeName
      }],
      classesTableOptions: {
        //toolbar: "#paymentToolbar",
        locale: "zh-CN",
        //showRefresh: true,
        //search: true,
        queryParams: this.customQuery,
        //url: "/api/classes",
        uniqueId: "_id",
        sortName: "date",
        sortOrder: "desc",
        pageSize: 15,
        pageList: [15, 25, 50, 100],
        pagination: true
        //sidePagination: "server"
      }
    }
  },
  computed: {
    contractId() {
      return this.appData;
    },
    receivable() {
      var value = this.contract.total - this.contract.discount;
      return value > 0 ? Math.round(value) / 100 : 0;
    },
    averageFee() {
      var value = this.contract.credit > 0 ? this.contract.total / this.contract.credit : 0
      return Math.round(value) / 100;
    },
    totalFee() {
      return Math.round(this.contract.total) / 100;
    },
    discountFee() {
      return Math.round(this.contract.discount) / 100;
    },
    outstandingFee() {
      var value = Math.round(this.contract.total - this.contract.discount - this.contract.received) / 100;
      return value === 0 ? 0 : value;
    },
    remainingCredit() {
      return this.contract.credit - this.consumedTotalCredit;
    },
    remainingFee() {
      return Math.round((this.contract.total - this.contract.discount) * this.remainingCredit / this.contract.credit) / 100;
    },
    consumedTotalCredit() {
      return this.contract.consumedCredit + (this.contract.expendedCredit || 0);
    },
    consumedFee() {
      return Math.round((this.contract.total - this.contract.discount) * this.consumedTotalCredit / this.contract.credit) / 100;
    },
    actualRemaining() {
      return this.remainingCredit + (this.contract.unStartedClassCredit || 0);
    },
    consumedWidth() {
      return {
        width: (this.consumedTotalCredit - (this.contract.unStartedClassCredit || 0)) * 100 / this.contract.credit + "%",
        "min-width": "1rem"
      }
    },
    plannedWidth() {
      return {
        width: (this.contract.unStartedClassCredit || 0) * 100 / this.contract.credit + "%"
      }
    },
    isExpired() {
      if (moment(this.contract.expireDate).isValid() && moment(this.contract.expireDate).isBefore())
        return true;
      else
        return false;
    },
    errors() {
      var errors = {};
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
      this.productName = this.getTypeName(value);
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
    }
  },
  methods: {
    notImplemented() {
      this.$refs.messager.showErrorMessage("此功能尚不支持, 请等系统更新后再试");
    },
    openModifyDialog() {
      this.$refs.modifyDialog.show();
    },
    customQuery(params) {
      // params : {search: "", sort: undefined, order: "asc", offset: 0, limit: 15}
      params.contractId = this.contractId; // add the status filter
      return params;
    },
    typeFormatter(value, row, index) {
      switch (value) {
        case "wechat":
          return "微信支付";
        case "offline":
          return "线下支付";
        default:
          return null;
      }
    },
    methodFormatter(value, row, index) {
      switch (value) {
        case "cash":
          return "现金";
        case "bankcard":
          return "银行卡";
        case "mobilepayment":
          return "移动支付"
        default:
          return null;
      }
    },
    actionFormatter(value, row, index) {
      return [
        '<div class="btn-group btn-group-xs" role="group">',
        ['<a role="button" class="text-danger delete-payment" title="撤消缴费">',
          '<i class="glyphicon glyphicon-trash"></i>',
          '</a>'].join(""),
        '</div>'
      ].join('');
    },
    confirmDeletePayment(e, value, row, index) {
      this.$refs.confirmDeletePaymentDialog.show(row._id);
    },
    deletePayment(paymentId) {
      var request = serviceUtil.deleteJSON("/api/payments/" + paymentId);
      request.done((data, textStatus, jqXHR) => {
        this.refresh();
        this.$refs.paymentTable.refresh();
        this.$refs.messager.showSuccessMessage("缴费记录已经删除");
      });
    },
    openPayDialog() {
      this.$refs.payDialog.show();
    },
    pay(payment) {
      payment.contractId = this.contractId;
      payment.contractNo = this.contract.serialNo;
      payment.memberId = this.memberData._id;
      var request = serviceUtil.postJSON("/api/payments", payment);
      request.done((data, textStatus, jqXHR) => {
        this.refresh();
        this.$refs.paymentTable.refresh();
        this.$refs.messager.showSuccessMessage("成功缴费");
      });
    },
    modifyContract(updatedContract) {
      var request = serviceUtil.patchJSON("/api/contracts/" + this.contractId, updatedContract);
      request.done((data, textStatus, jqXHR) => {
        // keep addtional fields during update, e.g. unStartedClassCredit
        Object.assign(this.contract, data || {});
        this.$refs.historySection.refresh();
        this.$refs.messager.showSuccessMessage("修改完成");
      });
      request.fail((jqXHR, textStatus, errorThrown) => {
        this.$refs.messager.showErrorMessage(jqXHR.responseJSON ? jqXHR.responseJSON.message : jqXHR.responseText);
      });
    },
    refresh() {
      if (this.contractId) {
        var request = serviceUtil.getJSON("/api/contracts/" + this.contractId);
        request.done((data, textStatus, jqXHR) => {
          this.contract = data || {};
        });
      }
    },
    showAndRefreshClassesSection(e) {
      $('#classesSection').show(600);
      this.$refs.classesTable.refresh({ url: '/api/classes' });
    },
    deleteContract() {
      var request = serviceUtil.deleteJSON("/api/contracts/" + this.contractId);
      request.done((data, textStatus, jqXHR) => {
        this.contract = data || {};
        this.$refs.messager.showSuccessMessage("合约已经作废");
      });
      request.fail((jqXHR, textStatus, errorThrown) => {
        var errorMsg = jqXHR.responseJSON ? jqXHR.responseJSON.message : jqXHR.responseText;
        this.$refs.messager.showErrorMessage(errorMsg);
      });
    },
    getTypeName(typeId) {
      var item = this.types.find(value => {
        return value.id === typeId;
      });
      return item && item.name || "<未设置>";
    }
  },
  created() {
    this.tenantConfig = _getTenantConfig();
    this.types = this.tenantConfig && this.tenantConfig.types || [];
    this.refresh();
  },
  mounted() {
    // set message for global usage
    Vue.prototype.$messager = this.$refs.messager;
    $('[data-toggle="tooltip"]').tooltip();
  }
}
</script>
<style lang="less" scoped>
.container .page-header {
  padding-bottom: 3px;
}

.form-condensed .form-horizontal .control-label {
  padding-top: 7px;
  padding-right: 0;
  margin-bottom: 0;
  text-align: right;
}

.form-condensed .form-horizontal .form-group>div {
  padding-right: 0;
}
</style>
