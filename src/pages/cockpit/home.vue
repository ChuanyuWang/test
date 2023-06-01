<template lang="pug">
v-container
  v-subheader
    p 光影故事屋片源统计分析，选择月份并查看每个片源的当月累计播放次数和当年累计播放次数。
      |所有数据来源于叮聆课堂浏览日志，数据同步需要<b>24</b>小时，以下统计的数据截止到 <b>{{ yesterday.toLocaleDateString() }}</b>
  v-row.mt-1(dense align="center" justify="end")
    v-spacer
    span 选择门店:
    v-col(cols="auto")
      v-select.fit(:items="tenantList" item-text="tenantName" item-value="tenantId"
        @click.once="fetchTenantList" v-model="selectedTenant" @change="refresh")
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
  name: "home",
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
          text: '片源名称',
          align: 'start',
          sortable: false,
          value: 'name',
        },
        { text: '当月累计播放次数 (可选择月份)', value: 'month_total' },
        { text: '当年累计播放次数', value: 'year_total' }
      ],
      rawData: [],
      tenantList: [],
      selectedTenant: null
    }
  },
  computed: {},
  methods: {
    refresh() {
      // close menu
      this.menu = false;
      this.isLoading = true;
      // refresh table data
      var request = axios.get("/api/dlktlogs/bycontent", {
        params: { month: this.selectedMonth, duration: this.duration, tenantId: this.selectedTenant }
      });
      request.then((response) => {
        this.rawData = response.data || [];
      }).catch((error) => {
        console.error(error);
      }).finally(() => {
        this.isLoading = false;
      });
    },
    fetchTenantList() {
      var request = axios.get("/api/dlktlogs/tenant/list");
      request.then((response) => {
        this.tenantList = (response.data || []).map((value, index, array) => {
          return {
            tenantName: value._id.tenantName,
            tenantId: value._id.tenantId
          }
        });
        this.tenantList.push({ tenantName: "全部", tenantId: "" })
      });
    }
  },
  mounted() {
    this.refresh();
  }
}
</script>

<style lang="less">
.v-select.fit {
  width: min-content;
  min-width: 50px;
}

.v-select.fit .v-select__selection--comma {
  text-overflow: unset;
  margin-right: 12px;
}
</style>
