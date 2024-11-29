<template lang="pug">
div
  ul.nav.nav-tabs(role="tablist")
    li(role="presentation")
      a(href="#orders" role="tab" data-toggle="tab") 订单
    li(role="presentation")
      a(href="#contracts" role="tab" data-toggle="tab") {{$t("contracts")}}
    li(role="presentation")
      a(href="#payments" role="tab" data-toggle="tab") 缴费
  div.tab-content
    div#contracts.tab-pane(role="tabpanel")
      contracts-page(ref="contractsTab")
    div#orders.tab-pane(role="tabpanel")
      orders-page(ref="ordersTab")
    div#payments.tab-pane(role="tabpanel")
      payments-page(ref="paymentsTab")
</template>
<script>
import common from'../../common/common';
import ordersPage from'./orders-overview.vue';
import contractsPage from'./contract-overview.vue';
import paymentsPage from'./payments-overview.vue';

export default {
  name: "finance-page",
  props: {},
  data() {
    return {};
  },
  components: {
    "orders-page": ordersPage,
    "payments-page": paymentsPage,
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

    $(this.$el).find('a[href="#payments"]').one('shown.bs.tab', e => {
      this.$refs.paymentsTab.refresh();
    });

    // default tab is contract overview
    var showTab = common.getParam("activetab") || "contracts";
    $('a[href="#' + showTab + '"]').tab('show');
  }
}
</script>

<style>

</style>
