<template lang="pug">
v-app
  v-app-bar(light,app,absolute,elevate-on-scroll,scroll-target="#scrolling-techniques-2")
    //template(v-slot:img='{props}')
      v-img(v-bind="props")
    //v-app-bar-nav-icon
    v-app-bar-title 大Q小q光影故事屋
    //v-spacer
    //v-btn(icon,@click="test")
      v-icon mdi-magnify
    //template(v-slot:extension)
      v-tabs(align-with-title)
        v-tab Tab 1 
        v-tab Tab 2
        v-tab Tab 3
  v-main#scrolling-techniques-2.overflow-y-auto(style="height: 100vh;")
    //v-container(fluid)
    router-view
  v-bottom-navigation(app,v-model='value',color='primary',@change="$router.push(value)")
    v-btn(value='/')
      span 预约
      v-icon mdi-calendar-month
    v-btn(value='/trial')
      span 试听
      v-icon mdi-seal
    v-btn(value='/appointment')
      span 我的
      v-icon mdi-heart
</template>

<script>
module.exports = {
  name: "mobile-portal",
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
