<template lang="pug">
div
  div.page-header
    h3(style="display: inline-block") 修改记录
    button.btn.btn-default(type="button" @click="refresh" style="float: right; margin-top: 16px")
      span.glyphicon.glyphicon-refresh.me-3
      | 刷新
  div.row
    div.col-sm-12
      div#historyToolbar
      bootstrap-table(ref="historyTable", :columns="historyTableColumns", :options="historyTableOptions")
</template>
<script>

var commonUtil = require("../../common/common");

module.exports = {
  name: "contract-history",
  props: {
    contractId: {
      type: String,
      require: true
    }
  },
  components: {
    "BootstrapTable": BootstrapTable,
  },
  data() {
    return {
      fieldNames: {
        total: (o, n) => {
          return "课程金额由 <del>" + o / 100 + "</del> 更新为 <strong>" + n / 100 + "</strong>元";
        },
        credit: (o, n) => {
          return "合约课时由 <del>" + o + "</del> 更新为 <strong>" + n + "</strong>课时";
        },
        effectiveDate: (o, n) => {
          return "生效日期由 <del>" + this.dateFormatter(o) + "</del> 更新为 <strong>" + this.dateFormatter(n) + "</strong>";
        },
        expireDate: (o, n) => {
          return "截止日期由 <del>" + this.dateFormatter(o) + "</del> 更新为 <strong>" + this.dateFormatter(n) + "</strong>";
        }
      },
      historyTableColumns: [{
        field: "date",
        title: "修改日期",
        sortable: true,
        formatter: commonUtil.datetimeFormatter
      }, {
        field: "old",
        title: "变更内容",
        formatter: this.changeFormatter
      }, {
        field: "user",
        title: "用户"
      }, {
        field: "remark",
        title: "备注"
      }],
      historyTableOptions: {
        //toolbar: "#historyToolbar",
        locale: "zh-CN",
        //showRefresh: true,
        url: "/api/contracts/" + this.contractId + "/history",
        //uniqueId: "_id",
        sortName: "date",
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
      this.$refs.historyTable.refresh();
    },
    dateFormatter: function(value, row, index) {
      if (value) {
        return moment(value).format('ll');
      } else {
        return "<未指定>";
      }
    },
    changeFormatter(value, row, index) {
      var change = "<small>";
      for (var key in value) {
        change += this.fieldNames[key](value[key], row.new[key]) + "<br>";
      }
      return change + "</small>";
    }
  },
  created() { },
  mounted() { }
}
</script>
<style lang="less">

</style>
