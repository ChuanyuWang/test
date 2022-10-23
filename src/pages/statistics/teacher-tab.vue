<template lang="pug">
div
  div#teacher_toolbar
    form.form-inline
      date-picker(v-model='targetMonth', :config='datePickerConfig', @input="refresh",:label="$t('time')")
      div.input-group.ms-3
        span.input-group-addon 课程
        select.form-control(v-model="typeFilter" @change="refresh")
          option(value="") {{ $t('all') }}
          option(v-for="item in types" :value="item.id") {{item.name}}
  bootstrap-table.table-striped(ref='checkinTable',:columns='columns',:options='options')
</template>

<script>
/**
 * --------------------------------------------------------------------------
 * teacher-tab display a panel for teacher status statistics
 * --------------------------------------------------------------------------
 */

var common = require("../../common/common");
var date_picker = require('../../components/date-picker.vue').default;
var teacher_service = require("../../services/teachers");

module.exports = {
  name: "teacher-tab",
  props: {},
  data: function() {
    // load the setting of tenant from html root-level elements
    var setting = common.getTenantSetting();
    return {
      tenantSettings: {},
      typeFilter: "",
      targetMonth: moment().startOf('month'),
      datePickerConfig: { "format": "YYYY-MM", "locale": "zh-CN", "viewMode": "months" },
      feature: setting.feature,
      teacherData: [],
      columns: [
        {
          field: "_id",
          title: this.$t("teacher"),
          sortable: false,
          formatter: this.nameFormatter
        }, {
          title: this.$t("time"),
          sortable: false,
          formatter: this.timeFormatter
        }, {
          title: this.$t("status"),
          sortable: false,
          formatter: this.statusFormatter
        }, {
          field: "counter",
          title: "完成课次<i class='small glyphicon glyphicon-info-sign' style='color:#777'/>",
          sortable: false,
          formatter: value => { return (value || []).length; },
          titleTooltip: "每上一次课计一次, 与课时无关"
        }, {
          field: "counter",
          title: "完成课节<i class='small glyphicon glyphicon-info-sign' style='color:#777'/>",
          sortable: false,
          formatter: this.counterFormatter,
          titleTooltip: "完成课节=完成课次*每节课时, 例如: 完成两次课, 课时分别为1课时和2课时, 则完成课节为3 (1+2)"
        }, {
          title: "实际完成课时",
          sortable: false,
          formatter: this.actualFormatter
        }, {
          field: "absent",
          title: "缺席课时",
          sortable: true,
          formatter: this.numberFormatter
        }, {
          field: "total",
          title: "完成课时",
          sortable: true,
          formatter: this.numberFormatter
        }
      ],
      options: {
        locale: "zh-CN",
        sortName: 'total',
        sortOrder: "desc",
        toolbar: '#teacher_toolbar',
        queryParams: this.statusQuery,
        //url: "/api/classes/checkin",
        //sidePagination: "server",
        showRefresh: true,
        pagination: true,
        pageSize: 15,
        pageList: [10, 15, 20, 50, 100],
        showColumns: true,
        uniqueId: "_id"
      }
    };
  },
  watch: {},
  components: {
    "BootstrapTable": BootstrapTable,
    'date-picker': date_picker
  },
  computed: {
    types() {
      return this.tenantSettings.types || [];
    },
    teachers: function() {
      var res = {};
      this.teacherData.forEach(function(val, index, array) {
        res[val._id] = val;
      });
      return res;
    }
  },
  filters: {},
  methods: {
    refresh: function() {
      // refresh the table when user changes the status filter
      this.$refs.checkinTable.refresh({
        url: "/api/analytics/teacherAnalysis",
      });
    },
    counterFormatter: function(value, row, index) {
      var sum = 0;
      (value || []).forEach(value => {
        sum += value.cost;
      });
      return sum;
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
      params.targetMonth = this.targetMonth.toISOString();
      params.type = this.typeFilter || undefined;
      return params;
    }
  },
  created: function() {
    var vm = this;
    var request = teacher_service.getAll();
    request.done(function(data, textStatus, jqXHR) {
      vm.teacherData = data || [];
    });
    this.tenantSettings = _getTenantConfig();
  },
  mounted: function() { }
};
</script>

<style lang='less'>

</style>
