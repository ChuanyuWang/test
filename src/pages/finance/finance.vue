<template lang="pug">
div
  ul.nav.nav-tabs(role="tablist")
    li(role="presentation")
      a(href="#orders" role="tab" data-toggle="tab") 订单
    li(role="presentation")
      a(href="#contracts" role="tab" data-toggle="tab") {{$t("contracts")}}
  div.tab-content
    div#contracts.tab-pane(role="tabpanel")
      contracts-page(ref="contractsTab")
    div#orders.tab-pane(role="tabpanel")
      orders-page(ref="ordersTab")
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
    // refresh when user open the tab first time
    $(this.$el).find('a[href="#contracts"]').one('shown.bs.tab', e => {
      this.$refs.contractsTab.refresh();
    });

    $(this.$el).find('a[href="#orders"]').one('shown.bs.tab', e => {
      this.$refs.ordersTab.refresh();
    });

    // default tab is contract overview
    var showTab = common.getParam("activetab") || "contracts";
    $('a[href="#' + showTab + '"]').tab('show');
  }
}
</script>

<style>

</style>
