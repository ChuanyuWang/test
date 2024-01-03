<template lang="pug">
v-container
  v-subheader
    p 光影故事屋门店统计分析，选择月份并查看每个门店的当月累计播放次数和当年累计播放次数。
      |所有数据来源于叮聆课堂浏览日志，从2023年3月份开始统计，每日数据同步需要<b>24</b>小时，以下统计的数据截止到 <b>{{ yesterday.format("ll") }}</b>
  v-row(dense align="center" justify="end")
    v-spacer
    v-col(cols="auto")
      v-text-field(v-model="search" prepend-icon="mdi-magnify" label="搜索门店"  hide-details dense clearable)
    v-col(cols="auto")
      v-autocomplete(:items="contentList" item-text="itemName" item-value="contentId" clearable
        @focus.once="fetchContentList" v-model="selectedContent" @change="refresh" 
        dense hide-details label="选择片源" prepend-icon="mdi-video-vintage")
    v-col(cols="2")
      v-text-field(type="number" v-model.number="duration" label="播放时长大于"
        suffix="分钟" hide-details dense prepend-icon="mdi-clock-time-eight")
    v-col(cols="2")
      v-menu(ref="menu" :close-on-content-click="false" offset-y v-model="menu" min-width="auto")
        template(v-slot:activator="{ on, attrs }")
          v-text-field(dense readonly v-model="selectedMonth" hide-details 
            prepend-icon="mdi-calendar" v-bind="attrs" v-on="on" label="选择月份")
        v-date-picker(v-model="selectedMonth" type="month" @change="refresh" min="2023-03")
    v-col(cols="auto")
      v-btn(color='primary' @click="refresh" :disabled="isLoading") 刷新
  v-data-table(:headers="headers" :items="rawData" :items-per-page="10" :loading="isLoading" :search="search")
</template>

<script>

module.exports = {
  name: "store",
  data() {
    return {
      yesterday: moment().subtract(1, 'day'),
      menu: false,
      duration: 10,
      selectedMonth: moment().format("YYYY-MM"),
      isLoading: true,
      select: "year",
      units: [
        { text: "年", value: "year" },
        { text: "月", value: "month" }
      ],
      search: "",
      headers: [
        { text: '门店ID', value: 'id', sortable: false },
        { text: '门店名称', value: 'name', sortable: false },
        { text: '当月累计播放次数 (可选择月份)', value: 'month_total' },
        { text: '当年累计播放次数', value: 'year_total' }
      ],
      rawData: [],
      contentList: [],
      selectedContent: ""
    }
  },
  computed: {},
  methods: {
    refresh() {
      // close menu
      this.menu = false;
      this.isLoading = true;
      // refresh table data
      var request = axios.get("/api/dlktlogs/bytenant", {
        params: { month: this.selectedMonth, duration: this.duration, contentId: this.selectedContent || undefined }
      });
      request.then((response) => {
        this.rawData = response.data || [];
      }).catch((error) => {
        console.error(error);
      }).finally(() => {
        this.isLoading = false;
      });
    },
    fetchContentList() {
      var request = axios.get("/api/dlktlogs/content/list");
      request.then((response) => {
        this.contentList = (response.data || []).map((value, index, array) => {
          return {
            itemName: value.itemName,
            contentId: value._id
          }
        });
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
