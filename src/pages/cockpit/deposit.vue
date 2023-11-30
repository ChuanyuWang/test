<template lang="pug">
v-container
  v-subheader
    p 光影故事屋门店充值管理，
      |所有门店信息来源于叮聆课堂浏览日志，新增门店可能不显示，已经关闭的门店也会出现在列表中
  v-row(dense align="center" justify="end")
    v-spacer
    v-col(cols="auto")
      v-text-field(v-model="search" prepend-icon="mdi-magnify" label="搜索门店"  hide-details dense clearable)
    //v-col(cols="auto")
      tenant-picker(label="选择门店" v-model="selectedTenant" @change="refresh")
    v-col(cols="auto")
      v-btn(color='primary' @click.stop="refresh" :disabled="isLoading") 刷新
  v-data-table(:headers="headers" :items="rawData" :items-per-page="10" :loading="isLoading" no-data-text="无数据" :search="search")
    template(v-slot:item.total="{ item }") {{ item.total/100 }}元
    template(v-slot:item.actions="{ item }")
      v-btn(small color="primary" @click.stop="openDeposit(item)") 充值
      v-btn.ml-1(small @click.stop="$refs.historyDlg.open(item)") 记录
  v-snackbar.mb-12(v-model="snackbar") {{ message }}
    template(v-slot:action="{ attrs }")
      v-btn(color="primary" text v-bind="attrs" @click="snackbar = false") 关闭
  v-dialog(v-model="dialog1" max-width="500")
    v-card
      v-card-title {{ depositItem.name }}
      v-card-subtitle 门店充值
      v-card-text
        v-form(v-model="valid" ref="depositForm")
          v-row
            v-col(sm="4")
              v-select(v-model="depositItem.method" label="支付方式" :items="methods")
            v-col(sm="4")
              v-menu(v-model="menu2" :close-on-content-click="false" :nudge-bottom="-20" offset-y min-width="auto")
                template(v-slot:activator="{ on, attrs }")
                  v-text-field(v-model="depositItem.pay_date" label="充值日期" readonly v-bind="attrs" v-on="on")
                v-date-picker(v-model="depositItem.pay_date" @input="menu2 = false")
          v-row
            v-col(sm="4")
              v-text-field(type="number" v-model.number="depositItem.received" label="充值金额" suffix="元"
                :rules="[rules.required]" hint="实际收款金额" persistent-hint)
            v-col(sm="4")
              v-text-field(type="number" v-model.number="depositItem.donate" label="赠送金额" suffix="元"
                :rules="[rules.required, rules.positive]")
            v-col(sm="4")
              v-text-field(readonly v-model.number="depositTotal" label="总计" suffix="元" hint="=充值+赠送" persistent-hint)
          v-row
            v-col(sm="12")
              v-textarea(v-model.trim="depositItem.comment" label="备注" rows="3" counter="500" no-resize
                hint="备注内容会显示在客户端，提交后无法修改" :rules="[rules.textRequired]" persistent-hint)
      v-card-actions
        v-spacer
        v-btn(text color="primary" @click="dialog1 = false") 关闭
        v-btn(text color="primary" @click="addDeposit" :disabled="!valid" :loading="dialog1_loading") 充值
  deposit-history-dialog(ref="historyDlg")
</template>

<script>
var depositHistoryDialog = require("./deposit-history-dialog.vue").default;

module.exports = {
  name: "deposit",
  components: { depositHistoryDialog },
  data() {
    return {
      snackbar: false,
      message: "",
      selectedTenant: "",
      isLoading: true,
      search: "",
      headers: [
        { text: '门店ID', value: 'tenantId', sortable: false },
        { text: '门店名称', value: 'tenantName', sortable: false },
        { text: '累计充值金额（含赠送）', value: 'total', sortable: true },
        { text: '操作', value: 'actions', sortable: false, align: 'center' }
      ],
      rawData: [],
      depositItem: { received: 0, donate: 0, comment: "" },
      selectedIndex: -1,
      dialog1: false,
      dialog1_loading: false,
      valid: true,
      rules: {
        required: value => value !== "" || '金额不能为空',
        positive: value => value >= 0 || '金额不能为负',
        textRequired: value => value && value.trim() !== "" || '必填'
      },
      methods: [
        { text: "银行卡", value: "bankcard" },
        { text: "现金", value: "cash" },
        { text: "移动支付", value: "mobilepayment" }
      ],
      menu2: false
    }
  },
  computed: {
    depositTotal() {
      return ((this.depositItem.received || 0) + (this.depositItem.donate || 0));
    }
  },
  filters: {},
  methods: {
    refresh() {
      this.isLoading = true;
      // refresh table data
      var request = axios.get("/api/dlktlogs/deposits", { params: { tenantId: this.selectedTenant || undefined } });
      request.then((response) => {
        this.rawData = (response.data || []).map((value, index, array) => {
          return {
            tenantId: value._id,
            tenantName: value.tenantName,
            total: value.deposits.length > 0 ? value.deposits[0].total : 0
          }
        });
      }).catch((error) => {
        // TODO, append the error message returned from server
        this.message = "刷新门店失败";
        this.snackbar = true;
      }).finally(() => {
        this.isLoading = false;
      });
    },
    openDeposit(item) {
      this.selectedIndex = this.rawData.indexOf(item);
      this.depositItem.tenantId = item.tenantId;
      this.depositItem.name = item.tenantName;
      this.depositItem.pay_date = moment().format("YYYY-MM-DD");
      this.depositItem.method = "bankcard";
      this.depositItem.received = "";
      this.depositItem.donate = 0;
      this.depositItem.comment = "";
      this.dialog1 = true;
      this.$nextTick(() => {
        this.$refs.depositForm.validate(); // force validate for the first time
      });
    },
    addDeposit() {
      this.dialog1_loading = true;
      var request = axios.post("/api/dlktlogs/deposits", {
        tenantId: this.depositItem.tenantId,
        method: this.depositItem.method,
        received: Math.round(this.depositItem.received * 100),
        donate: Math.round(this.depositItem.donate * 100),
        pay_date: moment(this.depositItem.pay_date).toDate().toISOString(),
        comment: this.depositItem.comment
      });
      request.then((response) => {
        if (this.selectedIndex > -1) {
          this.rawData[this.selectedIndex].total += Math.round(this.depositItem.received * 100 + this.depositItem.donate * 100);
        }
        this.message = "门店充值成功";
        this.snackbar = true;
      }).catch((error) => {
        // TODO, append the error message returned from server
        this.message = "门店充值失败";
        this.snackbar = true;
      }).finally(() => {
        this.dialog1 = false;
        this.dialog1_loading = false;
      });
    }
  },
  mounted() {
    this.refresh();
  }
}
</script>

<style lang="less"></style>
