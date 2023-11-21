<template lang="pug">
v-container
  v-subheader(style="height:auto")
    p 光影故事屋门店费用统计，门店费用基本叮聆课堂播放日志和片源价格进行统计，未设置价格的片源不参与统计，播放时间小于10分钟亦不参与统计。
      | 所有门店信息来源于叮聆课堂播放日志，每日00:00同步前一天的播放日志，统计数据有24小时的延迟。
      | 新增门店可能不显示，已经关闭的门店也会出现在列表中
  v-row(dense align="center" justify="end")
    v-spacer
    v-col(cols="auto")
      tenant-picker(label="选择门店" v-model="selectedTenant" @change="refresh")
    v-col(cols="auto")
      v-btn(color='primary' @click="refresh" :disabled="isLoading") 刷新
  v-data-table(:headers="headers" :items="rawData" :items-per-page="10" :loading="isLoading" no-data-text="无数据")
    template(v-slot:item.total="{ item }") {{ item.total/100 }}元
    template(v-slot:item.deposit="{ item }") {{ item.deposit/100 }}元
    template(v-slot:item.remaining="{ item }") {{ (item.deposit - item.total)/100 }}元
    template(v-slot:item.actions="{ item }")
      v-btn(small color="primary" @click="notImplemented") 提醒
      v-btn.ml-1(small @click="notImplemented") 详细
  v-snackbar.mb-12(v-model="snackbar") {{ message }}
    template(v-slot:action="{ attrs }")
      v-btn(color="primary" text v-bind="attrs" @click="snackbar = false") 关闭
</template>

<script>
var tenantPicker = require("./tenant-picker.vue").default;

module.exports = {
  name: "cost",
  components: {
    tenantPicker
  },
  data() {
    return {
      snackbar: false,
      message: "",
      selectedTenant: "",
      isLoading: true,
      headers: [
        { text: '门店ID', value: '_id', sortable: false },
        { text: '门店名称', value: 'tenantName', sortable: false },
        { text: '门店费用', value: 'total', sortable: true },
        { text: '播放次数', value: 'play', sortable: true },
        { text: '累计充值金额（含赠送）', value: 'deposit', sortable: true },
        { text: '剩余金额', value: 'remaining', sortable: true },
        { text: '操作', value: 'actions', sortable: false, align: 'center' }
      ],
      rawData: []
    }
  },
  computed: {},
  filters: {},
  methods: {
    refresh() {
      this.isLoading = true;
      // refresh table data
      var request = axios.get("/api/dlktlogs/costs", { params: { tenantId: this.selectedTenant || "" } });
      request.then((response) => {
        this.rawData = response.data || [];
      }).catch((error) => {
        // TODO, append the error message returned from server
        this.message = "刷新门店失败";
        this.snackbar = true;
      }).finally(() => {
        this.isLoading = false;
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

<style lang="less"></style>
