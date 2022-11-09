<template lang="pug">
div
  div#contracts_toolbar
    div.d-flex.align-items-center.flex-wrap
      a.btn.btn-success.btn-sm.me-3(type="button" href="contract/create") 创建
      div.input-group.input-group-sm
        span.input-group-addon {{ $t('status') }}
        select.form-control(v-model="filter" @change="refresh")
          //"open|outstanding|paid|closed",
          option(value="") {{ $t('all') }}
          option(value="open") 新建
          option(value="outstanding") 部分支付
          option(value="paid") 已支付
          option(value="closed") 完成
          option(value="" disabled) ------
          option(value="deleted") 作废
      date-picker.input-group-sm(v-model="from" placeholder="签约日期" style="width: 160px; margin-left: 4px")
      i.glyphicon.glyphicon-minus
      date-picker.input-group-sm(v-model="to" placeholder="结束" style="width: 160px", :class="{ 'has-error': errors.to }")
      button.btn.btn-primary.btn-sm(type="button" style="margin-left: 4px" @click="refresh") 查询
      button.btn.btn-default.btn-sm(type="button" style="margin-left: 4px" @click="clear") 清空
  bootstrap-table.table-striped(ref="contractTable", :columns="columns", :options="options")
  modal-dialog(ref="errorDialog" buttonStyle="danger") 出错了
    template(v-slot:body)
      p {{ errorMessage }}
</template>
<script>

module.exports = {
  name: "contract-overview",
  props: {},
  components: {
    "BootstrapTable": BootstrapTable,
    "date-picker": require("../../components/date-picker.vue").default,
    "modal-dialog": require("../../components/modal-dialog.vue").default
  },
  data() {
    return {
      tenantConfig: {},
      types: [],
      actionOrder: "",
      errorMessage: "",
      filter: "",
      from: null,
      to: null,
      columns: [{
        align: "center",
        formatter: this.actionFormatter
      }, {
        field: "signDate",
        title: "签约日期",
        sortable: true,
        formatter: this.dateFormatter
      }, {
        field: "memberId",
        title: "学员",
        formatter: this.memberFormatter
      }, {
        field: "type",
        title: "合约类型",
        formatter: this.typeFormatter
      }, {
        field: "goods",
        title: "课程",
        formatter: this.goodsFormatter
      }, {
        field: "credit",
        title: "合约课时",
        formatter: value => { return Math.round(value * 10) / 10; }
      }, {
        field: "remaining",
        title: "可用课时<i class='ms-3 small glyphicon glyphicon-info-sign' style='color:#777'/>",
        titleTooltip: "可用课时是指还有多少课时可以使用 (合约中没有排课的课时)",
        sortable: true,
        formatter: (value) => { return Math.round(value * 10) / 10; }
      }, {
        field: "actualRemaining",
        title: "剩余课时<i class='ms-3 small glyphicon glyphicon-info-sign' style='color:#777'/>",
        titleTooltip: "剩余课时是指还有多少课时没有上课 (包括可用课时和已经排课但尚未开始的课时)",
        sortable: true,
        formatter: (value) => { return Math.round(value * 10) / 10; }
      }, {
        field: "effectiveDate",
        title: "生效日期",
        sortable: true,
        formatter: this.dateFormatter
      }, {
        title: "合约金额",
        formatter: this.totalFormatter
      }, {
        field: "received",
        title: "欠费金额",
        formatter: this.outstandingFormatter,
        cellStyle: this.outstandingStyle
      }],
      options: {
        toolbar: "#contracts_toolbar",
        iconSize: "sm",
        locale: 'zh-CN',
        pagination: true,
        pageSize: 15,
        pageList: [15, 25, 50, 110],
        //url: "/api/contracts",
        uniqueId: "_id",
        sidePagination: "server",
        silentSort: false,
        search: false,
        showRefresh: true,
        sortName: "signDate",
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
    dateTimeFormatter(value, row, index) {
      if (!value) return null;
      return moment(value).format('YYYY-MM-DD HH:mm');
    },
    dateFormatter(value, row, index) {
      if (!value) return null;
      return moment(value).format('YYYY-MM-DD');
    },
    typeFormatter(value, row, index2) {
      switch (value) {
        // "new|renewal|donate|import|export"
        case "new":
          return "新签"; // + '<i class="text-success glyphicon glyphicon-ok"></i>';
        case "renewal":
          return "续费";
        case "donate":
          return "赠送";
        case "import":
          return "转入";
        case "export":
          return "转出";
        case "refund":
          return "退费";
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
    goodsFormatter(value, row, index) {
      var goods_type = row && row.goods_type || "type";
      if (goods_type === "type") {
        for (var i = 0; i < this.types.length; i++) {
          if (this.types[i].id === value) {
            return this.types[i].name;
          }
        }
      }
    },
    totalFormatter(value, row, index) {
      return Math.round(row.total - row.discount) / 100 + "元";
    },
    outstandingFormatter(value, row, index) {
      var result = Math.round(row.total - row.discount - value) / 100;
      return result === 0 ? 0 : result + "元";
    },
    outstandingStyle(value, row, index, field) {
      var outstanding = row.total - row.discount - value;
      return outstanding > 0 ? { classes: "text-danger" } : {};
    },
    actionFormatter(value, row, index) {
      var href = './contract/' + row._id;
      return ['<a href="' + href + '" title="查看合约">',
        '<i class="glyphicon glyphicon-edit"></i>',
        '</a>'
      ].join("");
    },
    customQuery(params) {
      // params : {search: "", sort: undefined, order: "asc", offset: 0, limit: 15}
      params.status = this.filter; // add the status filter
      params.from = this.from && this.from.startOf('day').toISOString();
      params.to = this.to && this.to.endOf('day').toISOString();
      return params;
    },
    clear() {
      this.from = null;
      this.to = null;
    },
    refresh() {
      this.$refs.contractTable.refresh({ url: "/api/contracts" });
    }
  },
  created() {
    this.tenantConfig = _getTenantConfig();
    this.types = this.tenantConfig && this.tenantConfig.types || [];
  },
  mounted() {
    this.refresh();
  }
}
</script>
<style lang="less">

</style>
