<style>
</style>

<template lang="pug">
div
  div#opps_toolbar(style='line-height:1.5;display:inline-block')
  table#opps_table(data-show-refresh='true',data-checkbox-header='false',data-sort-name='since',data-sort-order='desc',data-pagination='true',data-page-size='15',data-page-list='[10,15,20,50,100]',data-search='true',data-striped='true',data-show-columns='true',data-unique-id="_id")
    thead
      tr
        th(data-field='status',data-align='center')
        th(data-field='name',data-sortable='true') 宝宝姓名
        th(data-field='contact') 联系方式
        th(data-field='birthday',data-sortable='true') 宝宝生日
        th(data-field='since',data-sortable='true') 登记时间
        th(data-field='remark') 备注
        th(data-field='source') 来源
</template>

<script>
/**
 * --------------------------------------------------------------------------
 * opportunity-tab display a panel for opportunity statistics
 * --------------------------------------------------------------------------
 */

var common = require("../common");

module.exports = {
  name: "opportunity-tab",
  props: {},
  data: function() {
    return {};
  },
  watch: {},
  components: {},
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
          $(vm.$el)
            .find("#opps_table")
            .bootstrapTable("updateRow", { index: index, row: row });
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
          '<a class="phone text-success" href="javascript:void(0)" title="未联系">',
          '<i class="glyphicon glyphicon-earphone"></i>',
          "</a>"
        ].join("");
      } else {
        return [
          '<a class="phone text-danger" href="javascript:void(0)" title="已联系">',
          '<i class="glyphicon glyphicon-earphone"></i>',
          "</a>"
        ].join("");
      }
    },
    statusQuery: function(params) {
      // params : {search: "", sort: undefined, order: "asc", offset: 0, limit: 15}
      return params;
    }
  },
  created: function() { },
  mounted: function() {
    $(this.$el)
      .find("#opps_table")
      .bootstrapTable({
        locale: "zh-CN",
        //sortOrder: "asc",
        maintainSelected: true,
        toolbar: '#opps_toolbar',
        //rowStyle: highlightExpire,
        queryParams: this.statusQuery,
        url: "/api/opportunities",
        //sidePagination: "server",
        columns: [
          {
            formatter: this.statusFormatter,
            events: { "click .phone": this.changePhone }
          },
          {},
          {},
          {
            formatter: common.dateFormatter
          },
          {
            formatter: common.dateFormatter
          },
          {},
          {}
        ]
      });
  }
};
</script>
