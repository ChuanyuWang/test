<template lang="pug">
v-app
  v-navigation-drawer(app v-model="drawer")
    v-img.mt-1(src="/img/bqsq-logo-2x.png")
    v-divider
    v-list-item
      v-list-item-content
        v-list-item-title.text-h6 门店运营数据中心
        v-list-item-subtitle 光影故事屋数据分析
    v-divider
    v-list(dense nav)
      v-list-item-group(v-model="selectedItem" mandatory @change="open")
        v-list-item(link v-for="item in menuItems" :key="item.name")
          v-list-item-icon
            v-icon(color="primary") {{item.icon}}
          v-list-item-content
            v-list-item-title {{item.name}}
  v-app-bar(app dense color="primary" elevation="1")
    v-app-bar-nav-icon(@click="drawer = !drawer" color="secondary")
    v-app-bar-title {{menuItems[selectedItem].name}}
    v-spacer
    form(action='/logout',method='get')
      v-btn(color="white" text type="submit") 退出登录
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
      selectedItem: 0,
      menuItems: [
        { name: "片源统计", icon: "mdi-video-vintage", value: "/" },
        { name: "门店统计", icon: "mdi-store", value: "/store" },
        { name: "分析功能", icon: "mdi-chart-bar", value: "/statistics" },
        { name: "数据查询", icon: "mdi-database-search", value: "/query" },
        { name: "公告管理", icon: "mdi-bullhorn-variant", value: "/notice" },
        { name: "片源定价", icon: "mdi-tag", value: "/pricing" },
        { name: "门店充值", icon: "mdi-gas-station", value: "/deposit" },
        { name: "门店费用", icon: "mdi-currency-cny", value: "/cost" }
      ],
      drawer: true
    }
  },
  methods: {
    open(value) {
      // load route view
      this.$router.push(this.menuItems[value].value);
    }
  },
  mounted() {
    this.$route.path
    this.menuItems.some((element, index) => {
      if (element.value == this.$route.path) {
        this.selectedItem = index;
        return true;
      }
    });
  }
}
</script>
