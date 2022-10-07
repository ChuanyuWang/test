<template lang="pug">
div
  ul.nav.nav-tabs(role="tablist")
    li(role="presentation")
      a(href="#orders" role="tab" data-toggle="tab") 订单
    li(role="presentation")
      a(href="#contracts" role="tab" data-toggle="tab") 合约
  div.tab-content
    div#contracts.tab-pane(role="tabpanel")
      contracts-page
    div#orders.tab-pane(role="tabpanel")
      orders-page
</template>
<script>
var common = require('../../common/common');
var ordersPage = require('./orders.vue').default;
var contractsPage = require('./contract-overview.vue').default;

module.exports = {
  name: "finance",
  props: {},
  data() {
    return {};
  },
  components: {
    "orders-page": ordersPage,
    "contracts-page": contractsPage
  },
  created() { },
  mounted() {
    // default tab is contract overview
    var showTab = common.getParam("activetab") || "contracts";
    $('a[href="#' + showTab + '"]').tab('show');
  }
}
</script>

<style>
</style>
