<template lang="pug">
v-container.pb-16
  v-list(three-line)
    v-subheader Today
    template(v-for="(item, index) in classes")
      v-divider(:key="index" insert)
      v-list-item
        v-list-item-avatar
          v-img(v-if="item.mediaUrl" :src="item.mediaUrl")
          v-img(v-else src="/img/class-ghost.png")
        v-list-item-content
          v-list-item-title.font-weight-bold {{item.name + " "}}
            v-chip.font-weight-regular.px-1(x-small label) 光影课
          v-list-item-subtitle.text-caption(v-show="item.description") {{item.description}}
            //v-chip.px-1(x-small label) 光影课
          div
            //v-chip.px-1.font-italic.me-1(color="secondary" text-color="primary" x-small) 1课时
            v-chip.px-1.font-italic.me-1(color="amber darken-1" text-color="white" x-small) 1课时
            v-chip.px-1.font-italic(color="amber darken-1" text-color="white" x-small) 98元
        v-list-item-action
          v-list-item-action-text {{item.date | timeFilter}}
          v-btn(color="primary" x-small rounded) 预约

  //v-card.mb-1(v-for="item in classes",:key="item._id")
    v-img(v-if="item.mediaUrl",max-height="180",:src="item.mediaUrl")
    v-img(v-else, max-height="180",src="/img/bqsq-logo-2x.png")
    v-card-title.py-1 {{item.name}}
    v-card-text.pb-1 {{item.description}}
    v-card-actions
      v-spacer
      v-btn(color="primary") 预约
      //v-icon mdi-bookmark
</template>

<script>
var commonUtil = require("../../common/common");

module.exports = {
  name: "schedule",
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
      items,
      classes: []
    }
  },
  methods: {
    test() {
    }
  },
  filters: {
    timeFilter(date) {
      return moment(date).format("LT");
    }
  },
  mounted() {
    var today = moment();
    //set the time to the very beginning of day
    var begin = today.startOf('day');
    var end = moment(begin).add(1, 'days');
    var request = axios.get('/api/classes', {
      params: {
        from: begin.toISOString(),
        to: end.toISOString(),
        // 'undefined' field will not append to the URL
        classroom: commonUtil.getPublicClassroom() || undefined,
        tenant: commonUtil.getTenantName()
      }
    });
    request.then((response) => {
      this.classes = response.data || [];
    });
  }
}
</script>
