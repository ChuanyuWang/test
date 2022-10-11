<template lang="pug">
div
  div.page-header
    h3(style="display: inline-block") 学员课程
    button.btn.btn-default(type="button" @click="refresh" style="float: right; margin-top: 16px")
      span.glyphicon.glyphicon-refresh.me-3
      | 刷新
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
        title: "已消/剩余课时",
        formatter: this.creditFormatter
      }, {
        field: "total",
        title: "已消/剩余金额",
        formatter: this.totalFormatter
      }],
      contractTableOptions: {
        //toolbar: "#contractToolbar",
        locale: "zh-CN",
        //showRefresh: true,
        queryParams: this.customQuery,
        url: "/api/contracts",
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
      this.$refs.contractsTable.refresh();
    },
    contractLinkFormatter(value, row, index) {
      return [
        ' <a href="../contract/' + row._id + '" target="_blank">',
        value,
        //'<i class="glyphicon glyphicon-search"></i>',
        '</a>'
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
      return [
        '<div><span>ABC</span><span style="float:right">DEF</span></div>',
        '<div class="progress" style="margin:0">',
        '<div class="progress-bar" role="progressbar" style="width: 6%;">',
        '6%',
        '</div>',
        '</div>'
      ].join('');
    },
    totalFormatter(value, row, index) {
      return [
        '<div><span>ABC</span><span style="float:right">DEF</span></div>',
        '<div class="progress" style="margin:0">',
        '<div class="progress-bar" role="progressbar" style="width: 60%;">',
        '</div>',
        '</div>'
      ].join('');
    },
    typeFormatter(value, row, index) {
      switch (value) {
        case "new":
          return "新签<span class='label label-success ms-3'>课时卡</span>";
        case "renewal":
          return "续费<span class='label label-success ms-3'>课时卡</span>";
        case "donate":
          return "赠送<span class='label label-success ms-3'>课时卡</span>";
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
  mounted() { }
}
</script>
<style lang="less">

</style>
