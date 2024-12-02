<template lang="pug">
div
  div#payments_toolbar
    div.d-flex.align-items-center.flex-wrap
      date-picker.input-group-sm(v-model="from" placeholder="缴费日期" style="width: 160px")
      i.glyphicon.glyphicon-minus
      date-picker.input-group-sm.me-3(v-model="to" placeholder="结束" style="width: 160px", :class="{ 'has-error': errors.to }")
      button.btn.btn-primary.btn-sm.me-3(type="button" @click="refresh") 查询
      button.btn.btn-default.btn-sm(type="button" @click="clear") 清空
  bootstrap-table.table-striped(ref="paymentTable", :columns="columns", :options="options")
  modal-dialog(ref="confirmDeletePaymentDialog" buttons="confirm" @ok="deletePayment") 删除缴费记录
    template(v-slot:body)
      p 确认删除并撤销缴费吗?
      p.small (撤销后合约的实收金额和欠费金额会发生变动)
  message-alert(ref="messager")
</template>
<script>

import serviceUtil from "../../services/util";
import messageAlert from "../../components/message-alert.vue";
import datePicker from "../../components/date-picker.vue";
import modalDialog from "../../components/modal-dialog.vue";

export default {
  name: "payments-overview",
  props: {},
  components: {
    "BootstrapTable": BootstrapTable,
    "message-alert": messageAlert,
    "date-picker": datePicker,
    "modal-dialog": modalDialog
  },
  data() {
    return {
      tenantConfig: {},
      types: [],
      from: null,
      to: null,
      columns: [{
        field: "payDate",
        title: "缴费日期",
        sortable: true,
        formatter: this.dateFormatter
      }, {
        field: "memberId",
        title: "学员",
        formatter: this.memberFormatter
      }, {
        field: "contractNo",
        title: "合约编号",
        formatter: this.contractFormatter
      }, {
        field: "amount",
        title: "缴费金额 (元)",
        formatter: (value) => { return "￥" + Math.round(value) / 100; }
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
      options: {
        toolbar: "#payments_toolbar",
        iconSize: "sm",
        locale: 'zh-CN',
        pagination: true,
        pageSize: 15,
        pageList: [15, 25, 50, 110],
        //url: "/api/payments",
        uniqueId: "_id",
        sidePagination: "server",
        silentSort: false,
        search: true,
        showRefresh: true,
        sortName: "payDate",
        sortOrder: "desc",
        queryParams: this.customQuery
      }
    }
  },
  computed: {
    errors: function() {
      var errors = {};
      if (this.from && this.to && this.to.isBefore(this.from))
        errors.to = '结束日期不能小于开始日期';
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
  methods: {
    dateFormatter(value, row, index) {
      if (!value) return null;
      return moment(value).format('YYYY-MM-DD');
    },
    typeFormatter(value, row, index2) {
      switch (value) {
        case "wechat":
          return "微信支付"; // + '<i class="text-success glyphicon glyphicon-ok"></i>';
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
    memberFormatter(value, row, index) {
      var members = row.member || [];
      return [
        `<a href="./member/${value}">`,
        `<i class="glyphicon glyphicon-user me-3"/>`,
        members.length > 0 ? members[0].name : value,
        //'<i class="glyphicon glyphicon-search"></i>',
        '</a>'
      ].join('');
    },
    contractFormatter(value, row, index) {
      return [
        `<a href="./contract/${row.contractId}">`,
        `<i class="glyphicon glyphicon-list-alt me-3"/>`,
        value,
        //'<i class="glyphicon glyphicon-search"></i>',
        '</a>'
      ].join('');
    },
    actionFormatter(value, row, index) {
      return ['<a role="button" class="text-danger delete-payment" title="撤消缴费">',
        '<i class="glyphicon glyphicon-trash"></i>',
        '</a>'].join("");
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
    customQuery(params) {
      // params : {search: "", sort: undefined, order: "asc", offset: 0, limit: 15}
      params.from = this.from && this.from.startOf('day').toISOString();
      params.to = this.to && this.to.endOf('day').toISOString();
      return params;
    },
    clear() {
      this.from = null;
      this.to = null;
    },
    refresh() {
      this.$refs.paymentTable.refresh({ url: "/api/payments" });
    }
  },
  created() {
    this.tenantConfig = _getTenantConfig();
    this.types = this.tenantConfig && this.tenantConfig.types || [];
  },
  mounted() {
    // set message for global usage
    Vue.prototype.$messager = this.$refs.messager;
    this.$refs.paymentTable.updateFormatText("formatSearch", "查询合约编号");
  }
}
</script>
<style lang="less"></style>
