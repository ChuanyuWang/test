<template lang="pug">
v-container
  v-subheader
    p 光影故事屋浏览日志查询，选择日期并查看当天的播放记录（含全国门店）。
      |所有数据来源于叮聆课堂浏览日志，数据同步需要<b>24</b>小时，以下统计的数据截止到 <b>{{ yesterday.toLocaleDateString() }}</b>
  v-row.mt-1(dense align="center" justify="end")
    v-btn.ml-2(@click="reload") 重新提取当天日志
    v-spacer
    span 选择日期:
    v-col(cols="auto")
      v-menu(ref="menu" :close-on-content-click="false" offset-y v-model="menu")
        template(v-slot:activator="{ on, attrs }")
          v-text-field(solo dense readonly v-model="selectedDate" hide-details prepend-icon="mdi-calendar" v-bind="attrs" v-on="on")
        v-date-picker(v-model="selectedDate" type="date" locale="zh" @change="refresh")
    v-btn(color='primary' @click="refresh") 刷新
  v-data-table(:headers="headers" :items="rawData" :items-per-page="10" :loading="isLoading" no-data-text="当日无数据")
    template(v-slot:item._timestamp="{ item }") {{ new Date(item._timestamp).toLocaleString() }}
    template(v-slot:item.duration="{ item }") {{ humanize(item.duration) }}
</template>

<script>

var serviceUtil = require("../../services/util");

module.exports = {
  name: "query",
  data() {
    return {
      yesterday: moment().subtract(1, 'day').toDate(),
      menu: false,
      selectedDate: moment().subtract(1, 'day').format("YYYY-MM-DD"),
      isLoading: true,
      headers: [
        { text: '时间', value: '_timestamp' },
        { text: '门店名称', value: 'tenantName', },
        { text: '用户昵称', value: 'nickname' },
        { text: '片源', value: 'itemName' },
        { text: '片源ID', value: 'fromContentId' },
        { text: '播放时长(秒)', value: 'duration' },
      ],
      rawData: []
    }
  },
  computed: {},
  methods: {
    refresh() {
      // close menu
      this.menu = false;
      this.isLoading = true;
      // refresh table data
      var request = serviceUtil.getJSON("/api/dlktlogs/query", { date: this.selectedDate });
      request.done((data, textStatus, jqXHR) => {
        this.rawData = data || [];
      });
      request.always(() => {
        this.isLoading = false;
      });
    },
    reload() {
      // refresh table data
      var request = serviceUtil.patchJSON("/api/dlktlogs/tasks", { date: this.selectedDate });
      request.done((data, textStatus, jqXHR) => {
        // TODO, inform user to wait 5 mins
        console.log(data);
      });
    },
    humanize(value) {
      var units = [
        { unit: 'y', key: 'yy' },
        { unit: 'M', key: 'MM' },
        { unit: 'd', key: 'dd' },
        { unit: 'h', key: 'hh' },
        { unit: 'm', key: 'mm' },
        { unit: 's', key: 'ss' },
      ];
      let beginFilter = false;
      let componentCount = 0;

      return units
        .map(({ unit, key }) => ({ value: moment.duration(value, 'seconds').get(unit), key }))
        .filter(({ value, key }) => {
          if (beginFilter === false) {
            if (value === 0) {
              return false;
            }
            beginFilter = true;
          }
          componentCount++;
          return value !== 0 && componentCount <= 2; //	29 分钟 2 秒 or	1 小时 4 分钟
        })
        .map(({ value, key }) => ({ value: value, key: value === 1 ? key[0] : key }))
        .map(({ value, key }) => moment.localeData().relativeTime(value, true, key, true))
        .join(' ');
    }
  },
  mounted() {
    this.refresh();
  }
}
</script>

<style lang="less">

</style>
