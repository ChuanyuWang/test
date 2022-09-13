<template lang="pug">
div
  div#member_toolbar
    form.form-inline
      date-picker(v-model='targetYear', :config='datePickerConfig', @input="refresh",:label="$t('time')")
  bootstrap-table.table-striped(ref='memberTable',:columns='columns',:options='options')
</template>

<script>
/**
 * --------------------------------------------------------------------------
 * member-tab display a panel for member status statistics
 * --------------------------------------------------------------------------
 */

var common = require("../../common/common");
var date_picker = require('../../components/date-picker.vue').default;

module.exports = {
  name: "member-tab",
  props: {},
  data: function() {
    // load the setting of tenant from html root-level elements
    var setting = common.getTenantSetting();
    return {
      targetYear: moment().startOf('year'),
      datePickerConfig: { "format": "YYYY", "locale": "zh-CN", "viewMode": "years" },
      feature: setting.feature,
      columns: [
        {
          field: "name",
          title: "学员",
          sortable: false,
          formatter: this.nameFormatter
        }, {
          title: "一月"
        }, {
          title: "二月"
        }, {
          title: "三月"
        }, {
          title: "四月"
        }, {
          title: "五月"
        }, {
          title: "六月"
        }, {
          title: "七月"
        }, {
          title: "八月"
        }, {
          title: "九月"
        }, {
          title: "十月"
        }, {
          title: "十一月"
        }, {
          title: "十二月"
        },
      ],
      options: {
        locale: "zh-CN",
        //sortName: 'total',
        //sortOrder: "desc",
        toolbar: '#member_toolbar',
        queryParams: this.statusQuery,
        //url: "/api/classes/checkin",
        sidePagination: "server",
        showRefresh: true,
        pagination: true,
        pageSize: 15,
        pageList: [10, 15, 20, 50, 100],
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
        url: "/api/analytics/teacherAnalysis",
      });
    },
    counterFormatter: function(value, row, index) {
      return (value || []).length;
    },
    nameFormatter: function(value, row, index) {
      return value ? this.teachers[value].name : "<未指定>";
    },
    timeFormatter: function(value, row, index) {
      return this.targetMonth.format("YYYY-MM");
    },
    statusFormatter: function(value, row, index) {
      var status = row._id && this.teachers[row._id].status;
      switch (status) {
        case "active":
          return this.$t("status_active");
        case "inactive":
          return this.$t("status_inactive");
        case "deleted":
          return this.$t("status_deleted");
        default:
          return null;
      }
    },
    numberFormatter: function(value, row, index) {
      return value;
    },
    actualFormatter: function(value, row, index) {
      var res = row.total - row.absent || 0;
      return Math.round(res * 10) / 10;
    },
    statusQuery: function(params) {
      // params : {search: "", sort: undefined, order: "asc", offset: 0, limit: 15}
      params.targetYear = this.targetYear.toISOString();
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
