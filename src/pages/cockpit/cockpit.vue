<template lang="pug">
v-app
  v-navigation-drawer(app permanent)
    v-img.mt-1(src="/img/bqsq-logo-2x.png")
    v-divider
    v-list-item
      v-list-item-content
        v-list-item-title.text-h6 门店运营数据中心
        v-list-item-subtitle 叮聆课堂光影片源分析
    v-divider
    v-list(dense nav)
      v-list-item(link)
        v-list-item-icon
          v-icon(color="primary") mdi-view-dashboard
        v-list-item-content
          v-list-item-title 片源统计
  v-main
    //v-container(fluid)
    router-view
  v-footer(app)
    v-row.justify-space-between.my-1
      v-btn(color="" text small href='mailto:sales@getbestlesson.com' target='_blank') 联系邮箱
      v-btn(color="" text small href='https://beian.miit.gov.cn/' target='_blank') 沪ICP备16016548号-2
      v-btn(color="" text small href='http://www.beian.gov.cn/portal/registerSystemInfo?recordcode=31011402006462' target='_blank')
        v-img(src="/img/cs_logo.png")
        |沪公网安备 31011402006462号
</template>

<script>
module.exports = {
  name: "cockpit",
  data() {
    return {
      // when open url https://...#/trial
      // update the bottom navigator status
      value: this.$route.path
    }
  },
  methods: {
    test() {
      //console.log("we are in test function....");
      //this.$router.push(this.value);
    }
  }
}
</script>
