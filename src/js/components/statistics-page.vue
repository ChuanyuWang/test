<style>

</style>

<template lang="pug">
div
  ul.nav.nav-tabs(role='tablist')
    li.active(role='presentation')
      a(href="#checkin",role='tab',data-toggle='tab') {{$t('checkin_title')}}
    li(role='presentation')
      a(href="#opportunity",role='tab',data-toggle='tab') {{$t('opportunity')}}
    li(role='presentation')
      a(href="#analytics",role='tab',data-toggle='tab') {{$t('consume')}}
  div.tab-content
    div.tab-pane.active(role="tabpanel",id="checkin")
      checkin-tab
    div.tab-pane(role="tabpanel",id="opportunity")
      opportunity-tab
    div.tab-pane(role="tabpanel",id="analytics")
      consume-tab(ref='consumeChart')
</template>

<script>
/**
 * --------------------------------------------------------------------------
 * statistics page include all the statistical feature, e.g. checkin, opportunity
 * --------------------------------------------------------------------------
 */

var common = require("../common");
var checkinTab = require("./checkin-tab.vue");
var opportunityTab = require("./opportunity-tab.vue");
var consumeTab = require("./consume-tab.vue");
var class_service = require("../services/classes");

module.exports = {
  name: "statistics-page",
  props: {},
  data: function() {
    return {};
  },
  watch: {},
  components: {
    "checkin-tab": checkinTab,
    "opportunity-tab": opportunityTab,
    "consume-tab": consumeTab
  },
  computed: {},
  filters: {},
  methods: {},
  created: function() {},
  mounted: function() {
    var vm = this;

    $(this.$el).find('a[href="#analytics"]').one('shown.bs.tab', function(e) {
      // refresh the chart when user switch to consume tab first time, otherwise width is 0
      vm.$refs.consumeChart.refreshChart();
    });
  }
};
</script>