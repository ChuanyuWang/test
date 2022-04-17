<template lang="pug">
v-container.pb-16
  v-card.mb-1(v-for="item in classes",:key="item._id")
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
var classesService = require("../../services/classes");
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
  mounted() {
    var vm = this;
    var today = moment();
    //set the time to the very beginning of day
    var begin = today.hours(0).minutes(0).seconds(0).milliseconds(0);
    var end = moment(begin).add(1, 'days');
    var request = classesService.getClasses({
      from: begin.toISOString(),
      to: end.toISOString(),
      // 'undefined' field will not append to the URL
      classroom: commonUtil.getPublicClassroom() || undefined,
      tenant: commonUtil.getTenantName()
    });
    request.fail(function(jqXHR, textStatus, errorThrown) {
      console.error("get classes fails", jqXHR.responseJSON ? jqXHR.responseJSON.message : jqXHR.responseText);
    });
    request.done(function(data, textStatus, jqXHR) {
      vm.classes = data || [];
    });
  }
}
</script>
