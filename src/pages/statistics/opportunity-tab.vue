<template lang="pug">
div
  div#opps_toolbar(style='line-height:1.5;display:inline-block')
  bootstrap-table.table-striped(ref='oppTable',:columns='columns',:options='options')
</template>

<script>
/**
 * --------------------------------------------------------------------------
 * opportunity-tab display a panel for opportunity statistics
 * --------------------------------------------------------------------------
 */

var common = require("../../common/common");

module.exports = {
  name: "opportunity-tab",
  props: {},
  data: function() {
    return {
      columns: [
        {
          field: "status",
          formatter: this.statusFormatter,
          align: "center",
          events: { "click .phone": this.changePhone }
        }, {
          field: "name",
          title: "学员姓名",
          sortable: false
        }, {
          field: "contact",
          title: "联系方式"
        }, {
          field: "birthday",
          title: "生日",
          sortable: false,
          formatter: common.dateFormatter
        }, {
          field: "since",
          title: "登记时间",
          sortable: true,
          formatter: common.dateFormatter
        }, {
          field: "remark",
          title: "备注"
        }, {
          field: "source",
          title: "来源"
        }
      ],
      options: {
        locale: "zh-CN",
        toolbar: '#opps_toolbar',
        queryParams: this.statusQuery,
        url: "/api/opportunities",
        sidePagination: "server",
        showRefresh: true,
        sortName: "since",
        sortOrder: "desc",
        pagination: true,
        pageSize: 15,
        pageList: [10, 15, 20, 50, 100],
        search: true,
        showColumns: true,
        uniqueId: "_id"
      }
    };
  },
  watch: {},
  components: {
    "BootstrapTable": BootstrapTable
  },
  computed: {},
  filters: {},
  methods: {
    changePhone: function(e, value, row, index) {
      var vm = this;
      var opportunity = row; // the object of clicked row
      var newStatus = opportunity.status == "open" ? "closed" : "open";

      $.ajax("/api/opportunities/" + opportunity._id, {
        type: "PATCH",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify({ status: newStatus }),
        success: function(data) {
          row.status = newStatus;
          vm.$refs.oppTable.updateRow(index, row);
        },
        error: function(jqXHR, status, err) {
          console.error(
            jqXHR.responseJSON ? jqXHR.responseJSON.message : jqXHR.responseText
          );
        },
        complete: function(jqXHR, status) {
          //TODO
        },
        dataType: "json"
      });
    },
    statusFormatter: function(value, row, index) {
      if (value == "open") {
        return [
          '<button type="button" class="phone btn btn-success btn-xs" title="未联系">',
          '<i class="glyphicon glyphicon-earphone"></i>',
          "</button>"
        ].join("");
      } else {
        return [
          '<button type="button" class="phone btn btn-danger btn-xs" title="已联系">',
          '<i class="glyphicon glyphicon-earphone"></i>',
          "</button>"
        ].join("");
      }
    },
    statusQuery: function(params) {
      // params : {search: "", sort: undefined, order: "asc", offset: 0, limit: 15}
      return params;
    }
  },
  created: function() { },
  mounted: function() { }
};
</script>

<style lang='less'>
</style>
