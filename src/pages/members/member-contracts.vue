<template lang="pug">
div
  div.page-header
    h3(style="display: inline-block") 学员课程
    button.btn.btn-default(type="button" @click="refresh" style="float: right; margin-top: 16px")
      span.glyphicon.glyphicon-refresh.me-3
      | 刷新
    a.btn.btn-success.me-3(:href="'../contract/create?memberId='+ memberId" style="float: right; margin-top: 16px") 购课
  div.row
    div.col-sm-12
      div#contractToolbar
      bootstrap-table.table-striped(ref="contractsTable" :columns="contractTableColumns" :options="contractTableOptions")
</template>
<script>

var serviceUtil = require("../../services/util");

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
        title: "已消/剩余课时<i class='ms-3 small glyphicon glyphicon-info-sign' style='color:#777'/>",
        formatter: this.creditFormatter,
        titleTooltip: "已消课时=已经完成的课程+已经排课但还没开始的课程\n剩余课时=没有使用的课时"
      }, {
        field: "total",
        title: "已消/剩余金额<i class='ms-3 small glyphicon glyphicon-info-sign' style='color:#777'/>",
        formatter: this.totalFormatter,
        titleTooltip: "已消金额=已经完成的课程金额+已经排课但还没开始的课程金额\n剩余金额=没有使用的金额"
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
        value,
        //'<i class="glyphicon glyphicon-search"></i>',
        '</a>',
        row.status === "open" || row.status === "outstanding" ? '<span class="label label-danger ms-3">欠费</span>' : '',
        row.status === "paid" ? '<span class="label label-success ms-3">缴清</span>' : ''
      ].join('');
    },
    dateFormatter(value, row, index) {
      var start = moment(value).format('YYYY-MM-DD');
      var end = row.expireDate ? moment(row.expireDate).format('YYYY-MM-DD') : "<未指定>";
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
      return this.buildProgressBar(consumedCredit + expendedCredit, value);
    },
    totalFormatter(value, row, index) {
      var consumedCredit = row.consumedCredit || 0;
      var expendedCredit = row.expendedCredit || 0;
      var credit = row.credit || 0;
      var percent = credit == 0 ? 0 : (consumedCredit + expendedCredit) / credit;
      var total = row.total - row.discount;
      return this.buildProgressBar(Math.round(total * percent) / 100, total / 100, "￥");
    },
    buildProgressBar(consume, total, symbol) {
      var remaining = total - consume;
      if (symbol === "￥") remaining = this.$toFixed2(remaining);
      else remaining = this.$toFixed1(remaining);

      var percent = total == 0 ? 0 : consume / total;
      percent = Math.round(percent * 100);
      return [
        `<div><span>消${symbol || ""}${consume}</span><span style="float:right">剩${symbol || ""}${remaining}</span></div>`,
        '<div class="progress" style="margin:0;height:10px">',
        `<div class="progress-bar" role="progressbar" style="width:${percent}%">`,
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
    var request = serviceUtil.getJSON("/api/setting/types");
    request.done((data, textStatus, jqXHR) => {
      this.types = data || [];
    });
  },
  mounted() {
    // delay the refresh after types fetched
    this.refresh();
  }
}
</script>
<style lang="less">

</style>
