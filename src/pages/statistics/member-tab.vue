<template lang="pug">
div
  div#member_toolbar
    div.d-flex.align-items-center
      date-picker(v-model="targetYear" :config="datePickerConfig" @input="refresh" label="年份:" style="width:170px")
      //TODO, add filter of class type
      div.text-muted.small(style="display: inline-block; margin-left: 1rem") 统计学员每个月完成的课时数（单位：课时）
  bootstrap-table.table-striped(ref="memberTable", :columns="columns", :options="options")
</template>

<script>
/**
 * --------------------------------------------------------------------------
 * member-tab display a panel for member status statistics
 * --------------------------------------------------------------------------
 */

var date_picker = require('../../components/date-picker.vue').default;

module.exports = {
  name: "member-tab",
  props: {},
  data: function() {
    return {
      targetYear: moment().startOf('year'),
      datePickerConfig: { "format": "YYYY", "locale": "zh-CN", "viewMode": "years" },
      columns: [
        {
          field: "_id",
          title: "学员",
          sortable: false,
          formatter: this.nameFormatter
        }, {
          field: "1",
          title: "一月",
          formatter: this.numberFormatter
        }, {
          field: "2",
          title: "二月",
          formatter: this.numberFormatter
        }, {
          field: "3",
          title: "三月",
          formatter: this.numberFormatter
        }, {
          field: "4",
          title: "四月",
          formatter: this.numberFormatter
        }, {
          field: "5",
          title: "五月",
          formatter: this.numberFormatter
        }, {
          field: "6",
          title: "六月",
          formatter: this.numberFormatter
        }, {
          field: "7",
          title: "七月",
          formatter: this.numberFormatter
        }, {
          field: "8",
          title: "八月",
          formatter: this.numberFormatter
        }, {
          field: "9",
          title: "九月",
          formatter: this.numberFormatter
        }, {
          field: "10",
          title: "十月",
          formatter: this.numberFormatter
        }, {
          field: "11",
          title: "十一月",
          formatter: this.numberFormatter
        }, {
          field: "12",
          title: "十二月",
          formatter: this.numberFormatter
        },
      ],
      options: {
        locale: "zh-CN",
        //sortName: 'total',
        //sortOrder: "desc",
        toolbar: '#member_toolbar',
        queryParams: this.customQuery,
        url: "/api/analytics/memberdata",
        //sidePagination: "server",
        search: true,
        showRefresh: true,
        pagination: true,
        pageSize: 15,
        pageList: [15, 20, 50, 100],
        showColumns: false,
        uniqueId: "_id"
      }
    };
  },
  watch: {},
  components: {
    "BootstrapTable": BootstrapTable,
    'date-picker': date_picker
  },
  computed: {},
  filters: {},
  methods: {
    refresh: function() {
      // refresh the table when user changes the status filter
      this.$refs.memberTable.refresh({
        url: "/api/analytics/memberdata",
      });
    },
    nameFormatter: function(value, row, index) {
      var data = value && value[0];
      return [
        `<a href="./member/${data._id}">`,
        '<i class="glyphicon glyphicon-user me-3"></i>' + data.name,
        "</a>"
      ].join("");
    },
    numberFormatter: function(value, row, index, field) {
      var data = row.value || [];
      for (var i = 0; i < data.length; i++) {
        if (parseInt(field) === data[i].m) {
          return Math.round(data[i].t * 10) / 10
        }
      }
      return null;
    },
    customQuery: function(params) {
      // params : {search: "", sort: undefined, order: "asc", offset: 0, limit: 15}
      params.year = this.targetYear.year();
      return params;
    }
  },
  created: function() {
    //var vm = this;
  },
  mounted: function() { }
};
</script>

<style lang='less'>
</style>
