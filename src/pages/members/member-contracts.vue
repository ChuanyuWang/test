<template lang="pug">
div
  div.page-header
    h3(style="display: inline-block") 学员课程
    button.btn.btn-default(type="button" @click="refresh" style="float: right; margin-top: 16px")
      span.glyphicon.glyphicon-refresh.me-3
      | 刷新
    a.btn.btn-success.me-3(:href="'../contract/create?memberId='+ memberId" style="float: right; margin-top: 16px") 购课/续课
  div.row
    div.col-sm-12
      span.help-block.small.text-right(style="margin:3px") *当学员拥有一个课程的多个合约时, 会根据合约的生效日期，从最早生效的合约扣除课时
      div#contractToolbar
      bootstrap-table.table-striped(ref="contractsTable" :columns="contractTableColumns" :options="contractTableOptions")
</template>
<script>

module.exports = {
  name: "member-contracts",
  props: {
    memberId: {
      type: String,
      require: true
    }
  },
  components: {
    "BootstrapTable": BootstrapTable,
  },
  data() {
    return {
      types: [],
      contractTableColumns: [{
        field: "serialNo",
        title: "合约编号",
        formatter: this.contractLinkFormatter
      }, {
        field: "type",
        title: "合约类型",
        formatter: this.typeFormatter
      }, {
        field: "goods",
        title: "课程",
        formatter: this.goodsFormatter
      }, {
        field: "effectiveDate",
        title: "有效期",
        sortable: true,
        formatter: this.dateFormatter
      }, {
        field: "credit",
        title: "消/排/余课时<i class='ms-3 small glyphicon glyphicon-info-sign' style='color:#777'/>",
        formatter: this.creditFormatter,
        titleTooltip: "合约课时=消(已经排课并且结束的课程)+排(已经排课尚未开始的课时)+余(没有排课的课时)"
      }, {
        field: "total",
        title: "消/排/余金额<i class='ms-3 small glyphicon glyphicon-info-sign' style='color:#777'/>",
        formatter: this.totalFormatter,
        titleTooltip: "根据应收金额计算出消/排/余各部分对应的金额"
      }],
      contractTableOptions: {
        //toolbar: "#contractToolbar",
        locale: "zh-CN",
        //showRefresh: true,
        queryParams: this.customQuery,
        //url: "/api/contracts",
        uniqueId: "_id",
        sortName: "effectiveDate",
        sortOrder: "asc",
        pageSize: 15,
        pageList: [15, 25, 50, 100],
        pagination: true,
        sidePagination: "client"
      }
    }
  },
  computed: {},
  watch: {},
  filters: {},
  methods: {
    refresh() {
      this.$refs.contractsTable.refresh({ url: "/api/contracts" });
    },
    contractLinkFormatter(value, row, index) {
      return [
        `<a href="../contract/${row._id}">`,
        '<i class="glyphicon glyphicon-list-alt me-3"></i>',
        value,
        '</a>',
        row.status === "open" || row.status === "outstanding" ? '<span class="label label-danger ms-3">欠费</span>' : '',
        row.status === "paid" ? '<span class="label label-success ms-3">缴清</span>' : ''
      ].join('');
    },
    dateFormatter(value, row, index) {
      var start = moment(value).format('YYYY-MM-DD');
      var end = "<未指定>";
      if (row.expireDate) {
        end = moment(row.expireDate).format('YYYY-MM-DD');
        if (moment(row.expireDate).isBefore(moment())) {
          return [start, '~', end, '<span class="label label-danger ms-3">过期</span>'].join('');
        }
      }
      return [start, '~', end].join('');
    },
    goodsFormatter(value, row, index) {
      for (let i = 0; i < this.types.length; i++) {
        var element = this.types[i];
        if (element.id === value) {
          return element.name;
        }
      }
    },
    creditFormatter(value, row, index) {
      var consumedCredit = row.consumedCredit || 0;
      var expendedCredit = row.expendedCredit || 0;
      var actualConsumed = row.credit - row.actualRemaining;
      return this.buildProgressBar(this.$toFixed1(actualConsumed), consumedCredit + expendedCredit, value);
    },
    totalFormatter(value, row, index) {
      var consumedCredit = row.consumedCredit || 0;
      var expendedCredit = row.expendedCredit || 0;
      var actualConsumed = row.credit - row.actualRemaining;
      var credit = row.credit || 0;
      var percent = credit ? (consumedCredit + expendedCredit) / credit : 0;
      var total = row.total - row.discount;

      var actualFee = (credit ? actualConsumed / credit : 0) * total;
      return this.buildProgressBar(Math.round(actualFee) / 100, Math.round(total * percent) / 100, total / 100, "￥");
    },
    buildProgressBar(actual, consume, total, symbol) {
      var remaining = total - consume;
      remaining = symbol === "￥" ? this.$toFixed2(remaining) : this.$toFixed1(remaining);

      var actualPercent = total ? actual / total : 0;
      actualPercent = Math.round(actualPercent * 100);

      var planned = consume - actual;
      planned = symbol === "￥" ? this.$toFixed2(planned) : this.$toFixed1(planned);

      var plannedPercent = total ? planned / total : 0;
      plannedPercent = Math.round(plannedPercent * 100);
      return [
        `<div class="small" style="display:flex;justify-content:space-between">`,
        `<span class="text-primary">消${symbol || ""}${actual}</span>`,
        `<span class="text-success">排${symbol || ""}${planned}</span>`,
        `<span class="text-muted">余${symbol || ""}${remaining}</span></div>`,
        '<div class="progress" style="margin:0;height:10px">',
        `<div class="progress-bar" role="progressbar" style="width:${actualPercent}%"/>`,
        `<div class="progress-bar progress-bar-success" role="progressbar" style="width:${plannedPercent}%"/>`,
        '</div>',
        '</div>'
      ].join('');
    },
    typeFormatter(value, row, index) {
      switch (value) {
        case "new":
          return "新签<span class='label label-primary ms-3'>课时卡</span>";
        case "renewal":
          return "续费<span class='label label-primary ms-3'>课时卡</span>";
        case "donate":
          return "赠送<span class='label label-primary ms-3'>课时卡</span>";
        default:
          return null;
      }
    },
    customQuery(params) {
      // params : {search: "", sort: undefined, order: "asc", offset: 0, limit: 15}
      params.memberId = this.memberId; // add the status filter
      return params;
    }
  },
  created() {
    var tenantConfig = _getTenantConfig();
    this.types = tenantConfig && tenantConfig.types || [];
  },
  mounted() {
    // delay the refresh after types fetched
    this.refresh();
  }
}
</script>
<style lang="less">
</style>
