<style>

</style>

<template lang="pug">
div
  ul.nav.nav-tabs(role='tablist')
    li.active(role='presentation')
      a(href="#checkin",role='tab',data-toggle='tab') {{$t('checkin_title')}}
  div.tab-content
    div.tab-pane.active(role="tabpanel",id="checkin")
      checkin-tab
</template>

<script>
/**
 * --------------------------------------------------------------------------
 * teach-setting display a panel for teacher settings
 * --------------------------------------------------------------------------
 */

var common = require("../common");
var checkinTab = require("./checkin-tab.vue");
var class_service = require("../services/classes");

module.exports = {
  name: "statistics-page",
  props: {},
  data: function() {
    return {};
  },
  watch: {},
  components: {
    "checkin-tab": checkinTab
  },
  computed: {},
  filters: {},
  methods: {},
  created: function() {},
  mounted: function() {}
};
</script>