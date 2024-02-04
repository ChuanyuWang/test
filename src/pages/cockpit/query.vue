<template lang="pug">
v-container
  v-subheader
    p 光影故事屋浏览日志查询，选择日期并查看当天的播放记录（含全国门店）。
      |所有数据来源于叮聆课堂浏览日志，从2023年3月份开始统计，数据同步需要<b>24</b>小时，以下统计的数据截止到 <b>{{ yesterday.format("ll") }}</b>
  v-row(dense align="center" justify="end")
    //v-col(cols="auto")
      v-btn.ml-3(@click="reload") 重新提取当天日志
    v-spacer
    v-col(cols="2")
      tenant-picker(label="选择门店" v-model="selectedTenant" @change="refresh(true)")
    v-col(cols="2")
      v-text-field(type="number" v-model.number="duration" label="播放时长大于" 
        suffix="分钟" hide-details dense prepend-icon="mdi-clock-time-eight")
    v-col(cols="2")
      v-menu(:close-on-content-click="false" offset-y v-model="menu1")
        template(v-slot:activator="{ on, attrs }")
          v-text-field(dense readonly v-model="fromDate" hide-details 
            prepend-icon="mdi-calendar" v-bind="attrs" v-on="on" label="选择日期")
        v-date-picker(v-model="fromDate" type="date" locale="zh" @change="refresh(true)" :max="yesterday.format('YYYY-MM-DD')" min="2023-03-01")
    v-col(cols="auto")
      v-btn(color='primary' @click="refresh" :disabled="isLoading") 刷新
  v-data-table(:headers="headers" :items="rawData" :items-per-page="10" :loading="isLoading" 
    no-data-text="当日无数据" :server-items-length="total" :options.sync="options" :page.sync="page"
    :footer-props="{'items-per-page-options': [10,20,50,100]}")
    template(v-slot:item._timestamp="{ item }") {{ new Date(item._timestamp).toLocaleString() }}
    template(v-slot:item.duration="{ item }") {{ item.duration | humanize }}
    template(v-slot:item.attendance="{ item }") {{ item.attendance || "没有数据" }}
  v-snackbar.mb-12(v-model="snackbar") {{ message }}
    template(v-slot:action="{ attrs }")
      v-btn(color="primary" text v-bind="attrs" @click="snackbar = false") 关闭
</template>

<script>

var tenantPicker = require("./tenant-picker.vue").default;

module.exports = {
  name: "query",
  components: {
    tenantPicker
  },
  data() {
    return {
      snackbar: false,
      message: "重新提取当天日志，请等待5分钟，不要重复刷新",
      yesterday: moment().subtract(1, 'day'),
      menu1: false,
      duration: 0,
      fromDate: moment().subtract(1, 'day').format("YYYY-MM-DD"),
      isLoading: true,
      headers: [
        { text: '时间', value: '_timestamp' },
        { text: '门店名称', value: 'tenantName', },
        { text: '用户昵称', value: 'nickname' },
        { text: '片源', value: 'itemName' },
        { text: '片源ID', value: 'fromContentId' },
        { text: '播放时长(秒)', value: 'duration' },
        { text: '使用人数', value: 'attendance' }
      ],
      options: {},
      page: 1,
      rawData: [],
      total: 0,
      selectedTenant: ""
    }
  },
  computed: {},
  watch: {
    options: {
      handler() {
        this.refresh();
      },
      deep: true
    }
  },
  filters: {
    humanize(value) {
      if (value === 0) return moment.localeData().relativeTime(0, true, 'ss', true);

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
        // comment out the below code line for more accurate humanize, 
        // e.g. 2101 seconds will be display as 35mins 1second, instead of 35mins a few seconds
        //.map(({ value, key }) => ({ value: value, key: value === 1 ? key[0] : key }))
        .map(({ value, key }) => moment.localeData().relativeTime(value, true, key, true))
        .join(' ');
    }
  },
  methods: {
    refresh(resetPageNo) {
      // close menu
      this.menu1 = false;
      this.isLoading = true;

      // handle the case when page is not the first page
      if (resetPageNo && this.page !== 1) {
        this.page = 1;
        return;
      }

      var fromDate = moment(this.fromDate);
      var endDate = moment(fromDate).add(24, 'hours');

      // support pagination and sorting
      const { sortBy, sortDesc, page, itemsPerPage } = this.options;
      var params = {
        offset: (page - 1) * itemsPerPage,
        limit: itemsPerPage,
        from: fromDate.toISOString(),
        to: endDate.toISOString(),
        tenantId: this.selectedTenant || undefined
      };
      if (sortBy.length === 1 && sortDesc.length === 1) {
        params.sort = sortBy[0];
        params.order = sortDesc[0] === false ? "asc" : "desc";
      }
      params.duration = parseInt(this.duration * 60);
      // refresh table data
      var request = axios.get("/api/dlktlogs/query", { params });
      request.then((response) => {
        this.rawData = response.data && response.data.rows || [];
        this.total = response.data && response.data.total || 0;
      });
      // TODO, catch the exception
      request.finally(() => {
        this.isLoading = false;
      });
    },
    reload() {
      // refresh table data
      var request = axios.patch("/api/dlktlogs/tasks", { date: this.fromDate });
      request.then((response) => {
        this.snackbar = true;
      });
      // TODO, catch the exception
    }
  },
  mounted() { }
}
</script>

<style lang="less">
</style>
