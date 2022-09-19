<template lang="pug">
div
  ul.nav.nav-tabs(role='tablist')
    li(role='presentation')
      a(href="#orders",role='tab',data-toggle='tab') 订单
    li.active(role='presentation')
      a(href="#contracts",role='tab',data-toggle='tab') 合约
  div.tab-content
    div.tab-pane.active(role="tabpanel",id="contracts")
      contracts-page
    div.tab-pane(role="tabpanel",id="orders")
      orders-page
</template>
<script>
var ordersPage = require('./orders.vue').default;
var contractsPage = require('./contracts.vue').default;

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
  created() { }
}
</script>

<style>
</style>
