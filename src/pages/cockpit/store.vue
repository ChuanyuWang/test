<template lang="pug">
v-container
  v-subheader
    p 光影故事屋片源统计分析，选择月份并查看每个门店的当月累计播放次数和当年累计播放次数。
      |所有数据来源于叮聆课堂浏览日志，数据同步需要<b>24</b>小时，以下统计的数据截止到 <b>{{ yesterday.toLocaleDateString() }}</b>
  v-row.mt-1(dense align="center" justify="end")
    v-spacer
    v-slider.align-center.me-3(v-model="duration" step="1" min="0" max="180" thumb-label="always" thumb-size="24" 
      dense label="播放时长" hide-details)
      template(v-slot:append)
        v-text-field(v-model="duration" type="number" style="width: 60px" suffix="分")
    span 选择月份:
    v-col(cols="auto")
      v-menu(ref="menu" :close-on-content-click="false" offset-y v-model="menu")
        template(v-slot:activator="{ on, attrs }")
          v-text-field(solo dense readonly v-model="selectedMonth" hide-details prepend-icon="mdi-calendar" v-bind="attrs" v-on="on")
        v-date-picker(v-model="selectedMonth" type="month" locale="zh" @change="refresh")
    v-btn(color='primary' @click="refresh") 刷新
  v-data-table(:headers="headers" :items="rawData" :items-per-page="10" :loading="isLoading")
</template>

<script>

module.exports = {
  name: "store",
  data() {
    return {
      yesterday: moment().subtract(1, 'day').toDate(),
      menu: false,
      duration: 0,
      selectedMonth: moment().format("YYYY-MM"),
      isLoading: true,
      select: "year",
      units: [
        { text: "年", value: "year" },
        { text: "月", value: "month" }
      ],
      headers: [
        {
          text: '门店名称',
          align: 'start',
          sortable: false,
          value: 'name',
        },
        { text: '当月累计播放次数 (可选择月份)', value: 'month_total' },
        { text: '当年累计播放次数', value: 'year_total' }
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
      var request = axios.get("/api/dlktlogs/bytenant", { params: { month: this.selectedMonth, duration: this.duration } });
      request.then((response) => {
        this.rawData = response.data || [];
      });
      request.finally(() => {
        this.isLoading = false;
      });
    }
  },
  mounted() {
    this.refresh();
  }
}
</script>

<style lang="less">
</style>
