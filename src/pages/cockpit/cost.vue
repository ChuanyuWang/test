<template lang="pug">
v-container
  v-subheader(style="height:auto")
    p 光影故事屋门店费用统计，门店费用基于叮聆课堂播放日志和片源价格进行统计，未设置价格的片源不参与统计，播放时间小于10分钟亦不参与统计。
      | 所有门店信息来源于叮聆课堂播放日志，每日00:00同步前一天的播放日志，统计数据有24小时的延迟。
      | 新增门店可能不显示，已经关闭的门店也会出现在列表中
  v-row(dense align="center" justify="end")
    v-spacer
    v-col(cols="auto")
      v-text-field(v-model="search" prepend-icon="mdi-magnify" label="搜索门店"  hide-details dense clearable)
    //v-col(cols="auto")
      tenant-picker(label="选择门店" v-model="selectedTenant" @change="refresh")
    v-col(cols="auto")
      v-menu(:close-on-content-click="false" offset-y v-model="menu")
        template(v-slot:activator="{ on, attrs }")
          v-text-field(dense readonly v-model="begin_date" hide-details 
            prepend-icon="mdi-calendar" v-bind="attrs" v-on="on" label="费用开始日期")
        v-date-picker(v-model="begin_date" type="date" locale="zh" @change="refresh" min="2023-03-01")
    v-col(cols="auto")
      v-btn(color='primary' @click="refresh" :disabled="isLoading") 刷新
  v-data-table(:headers="headers" :items="rawData" :items-per-page="10" :loading="isLoading" no-data-text="无数据" :search="search")
    template(v-slot:item.total="{ item }") {{ item.total/100 }}元
    template(v-slot:item.deposit="{ item }") {{ item.deposit/100 }}元
    template(v-slot:item.remaining="{ item }") {{ item.remaining/100 }}元
    template(v-slot:item.actions="{ item }")
      v-btn(small color="primary" @click="notImplemented") 提醒
      v-btn.ml-1(small @click="showDetails(item)") 详细
  v-snackbar.mb-12(v-model="snackbar") {{ message }}
    template(v-slot:action="{ attrs }")
      v-btn(color="primary" text v-bind="attrs" @click="snackbar = false") 关闭
  v-dialog(v-model="dialog1" max-width="60%")
    v-card
      v-card-title {{ clickedTenant.tenantName }}
      v-card-subtitle 门店播放记录
      v-card-text
        v-data-table(:headers="details_headers" dense :items="play_logs" :loading="isLoadingDetails" 
          no-data-text="无播放充值记录" :footer-props="{'items-per-page-options': [10,20,50,100]}"
          :options.sync="options" :server-items-length="play_logs_total" :items-per-page="10" :page.sync="page")
          template(v-slot:item._timestamp="{ item }") {{ item._timestamp | dateFormatter }}
          template(v-slot:item.duration="{ item }") {{ item.duration | humanize }}
      v-card-actions
        v-spacer
        v-btn(text color="primary" @click="dialog1 = false") 关闭
</template>

<script>

module.exports = {
  name: "cost",
  components: {},
  data() {
    return {
      snackbar: false,
      message: "",
      selectedTenant: "",
      isLoading: true,
      search: "",
      headers: [
        { text: '门店ID', value: '_id', sortable: false },
        { text: '门店名称', value: 'tenantName', sortable: false },
        { text: '门店费用', value: 'total', sortable: true },
        { text: '播放次数', value: 'play', sortable: true },
        { text: '播放人次', value: 'attendance', sortable: true },
        { text: '累计充值金额（含赠送）', value: 'deposit', sortable: true },
        { text: '剩余金额', value: 'remaining', sortable: true },
        { text: '操作', value: 'actions', sortable: false, align: 'center' }
      ],
      rawData: [],
      menu: false,
      begin_date: "2023-11-01",
      clickedTenant: {},
      dialog1: false,
      isLoadingDetails: false,
      page: 1,
      details_headers: [
        { text: '播放日期', value: '_timestamp', sortable: false },
        { text: '片源ID', value: 'fromContentId', sortable: false },
        { text: '片源名称', value: 'itemName', sortable: false },
        { text: '播放时长', value: 'duration', sortable: false },
        { text: '人数', value: 'attendance', sortable: false }
      ],
      options: {},
      play_logs: [],
      play_logs_total: 0
    }
  },
  computed: {},
  watch: {
    options: {
      handler() {
        this.fetchDetails();
      },
      deep: true
    }
  },
  filters: {
    dateFormatter(value) {
      return moment(value).format("lll");
    },
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
    refresh() {
      // close menu
      this.menu = false;
      this.isLoading = true;
      // refresh table data
      var request = axios.get("/api/dlktlogs/costs", {
        params: {
          tenantId: this.selectedTenant || undefined,
          //from: this.begin_date ? new Date(this.begin_date).toISOString() : undefined 
          // new Date("2023-11-10") will ignore system time zone
          from: this.begin_date ? moment(this.begin_date).toISOString() : undefined
        }
      });
      request.then((response) => {
        this.rawData = (response.data || []).map((value, index, array) => {
          value.remaining = value.deposit - value.total;
          return value;
        });
      }).catch((error) => {
        // TODO, append the error message returned from server
        this.message = "刷新门店失败";
        this.snackbar = true;
      }).finally(() => {
        this.isLoading = false;
      });
    },
    showDetails(item) {
      this.clickedTenant = item;
      this.dialog1 = true;
      // handle the case when page is not the first page
      if (this.page !== 1) {
        this.page = 1;
      } else {
        this.fetchDetails();
      }
    },
    fetchDetails() {
      if (!this.clickedTenant._id) return;

      this.isLoadingDetails = true;
      var fromDate = moment(this.begin_date);

      // support pagination and sorting
      const { sortBy, sortDesc, page, itemsPerPage } = this.options;
      // the options is not initialized (sync) yet
      if (itemsPerPage === undefined) return;

      var params = {
        offset: (page - 1) * itemsPerPage,
        limit: itemsPerPage,
        duration: 600,
        from: fromDate.toISOString(),
        tenantId: this.clickedTenant._id || undefined
      };

      if (sortBy.length === 1 && sortDesc.length === 1) {
        params.sort = sortBy[0];
        params.order = sortDesc[0] === false ? "asc" : "desc";
      }

      var request = axios.get("/api/dlktlogs/query", { params });
      request.then((response) => {
        this.play_logs = response.data && response.data.rows || [];
        this.play_logs_total = response.data && response.data.total || 0;
      }).catch((error) => {
        // TODO, append the error message returned from server
        this.message = "查看播放记录失败";
        this.snackbar = true;
      }).finally(() => {
        this.isLoadingDetails = false;
      });
    },
    notImplemented() {
      this.message = "此功能尚不支持";
      this.snackbar = true;
    }
  },
  mounted() {
    this.refresh();
  }
}
</script>

<style lang="less">
</style>
