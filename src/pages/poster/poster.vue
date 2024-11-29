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
    v-container(fluid)
</template>

<script>
export default {
  name: "mobile-portal",
  data() {
    return {
      value: "/"
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
