<template lang="pug">
div
  ul.nav.nav-tabs(role='tablist')
    li.active(role='presentation')
      a(href="#checkin",role='tab',data-toggle='tab') {{$t('checkin_title')}}
    li(role='presentation')
      a(href="#opportunity",role='tab',data-toggle='tab') {{$t('opportunity')}}
    li(role='presentation')
      a(href="#teacher",role='tab',data-toggle='tab') {{$t('teacher')}}
    li(role='presentation')
      a(href="#contracts",role='tab',data-toggle='tab') {{$t('contracts')}}
    li(role='presentation')
      a(href="#member",role='tab',data-toggle='tab') 学员消课
    li(role='presentation')
      a(href="#liabilities",role='tab',data-toggle='tab') 剩余课时
    li(role='presentation')
      a(href="#analytics",role='tab',data-toggle='tab') 会员卡(旧)
  div.tab-content
    div.tab-pane.active(role="tabpanel",id="checkin")
      checkin-tab
    div.tab-pane(role="tabpanel",id="opportunity")
      opportunity-tab
    div.tab-pane(role="tabpanel",id="teacher")
      teacher-tab(ref='teacherTab')
    div.tab-pane(role="tabpanel",id="contracts")
      expense-tab(ref='expenseChart')
    div.tab-pane(role="tabpanel",id="analytics")
      consume-tab(ref='consumeChart')
    div.tab-pane(role="tabpanel",id="member")
      member-tab
    div.tab-pane(role="tabpanel",id="liabilities")
      TBD
</template>

<script>
/**
 * --------------------------------------------------------------------------
 * statistics page include all the statistical feature, e.g. checkin, opportunity
 * --------------------------------------------------------------------------
 */

var checkinTab = require("./checkin-tab.vue").default;
var teacherTab = require("./teacher-tab.vue").default;
var opportunityTab = require("./opportunity-tab.vue").default;
var consumeTab = require("./consume-tab.vue").default;
var expenseTab = require("./expense-tab.vue").default;
var memberTab = require("./member-tab.vue").default;

module.exports = {
  name: "statistics-page",
  props: {},
  data: function() {
    return {};
  },
  watch: {},
  components: {
    "checkin-tab": checkinTab,
    "teacher-tab": teacherTab,
    "opportunity-tab": opportunityTab,
    "consume-tab": consumeTab,
    "expense-tab": expenseTab,
    "member-tab": memberTab
  },
  computed: {},
  filters: {},
  methods: {},
  created: function() { },
  mounted: function() {
    var vm = this;

    // refresh the chart when user switch to consume tab first time, otherwise width is 0
    $(this.$el).find('a[href="#analytics"]').one('shown.bs.tab', function(e) {
      vm.$refs.consumeChart.refreshChart();
    });

    // refresh the chart when user switch to consume tab first time, otherwise width is 0
    $(this.$el).find('a[href="#contracts"]').one('shown.bs.tab', function(e) {
      vm.$refs.expenseChart.refresh();
    });

    // refresh the chart when user switch to hint tab first time
    $(this.$el).find('a[href="#hint"]').one('shown.bs.tab', function(e) {
      vm.$refs.passiveChart.refreshPassiveChart();
    });

    // refresh the chart when user switch to teacher tab first time
    $(this.$el).find('a[href="#teacher"]').one('shown.bs.tab', function(e) {
      vm.$refs.teacherTab.refresh();
    });
  }
};
</script>

<style lang='less'>

</style>
