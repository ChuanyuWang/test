<template lang="pug">
v-app
  v-app-bar(app,shrink-on-scroll,prominent,fade-img-on-scroll,src="/img/bqsq-logo-2x.png")
    template(v-slot:img='{props}')
      v-img(contain,v-bind='props',position='top',style='margin:0.5rem 1rem 0 1rem')
    v-app-bar-title Title
    v-spacer
    template(v-slot:extension)
      v-tabs(align-with-title)
        v-tab Tab 1 
        v-tab Tab 2
        v-tab Tab 3
  v-main
    v-container#main(style="height: 1000px;") Hello world
  v-bottom-navigation(v-model='value' app)
    v-btn(value='schedule')
      span Schedule
      v-icon mdi-history
    v-btn(value='favorites')
      span Favorites
      v-icon mdi-heart
</template>

<script>
module.exports = {
  name: "mobile-portal",
  data() {
    var items = [{
      _id: "1",
      name: "1",
      date: "2021-06-16T14:00:00.000Z"
    }, {
      _id: "2",
      name: "2",
      date: "2021-06-16T14:00:00.000Z"
    }, {
      _id: "3",
      name: "3",
      date: "2021-06-16T14:00:00.000Z"
    }, {
      _id: "5",
      name: "5",
      date: "2021-06-16T14:00:00.000Z"
    }, {
      _id: "7",
      name: "7",
      date: "2021-06-16T14:00:00.000Z"
    }, {
      _id: "4",
      name: "4",
      date: "2021-06-16T14:00:00.000Z"
    }, {
      _id: "9",
      name: "9",
      date: "2021-06-16T14:00:00.000Z"
    }, {
      _id: "8",
      name: "8",
      date: "2021-06-16T14:00:00.000Z"
    }, {
      _id: "11",
      name: "11",
      date: "2021-06-16T14:00:00.000Z"
    }, {
      _id: "10",
      name: "10",
      date: "2021-06-16T14:00:00.000Z"
    }];
    return {
      value: "schedule",
      items
    }
  }
}
</script>
