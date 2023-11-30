<template lang="pug">
v-dialog(v-model="dialog" max-width="60%")
  v-card
    v-card-title {{ tenantName }}
    v-card-subtitle 门店充值记录
    v-card-text
      v-data-table(:headers="records_headers" dense :items="records" disable-pagination hide-default-footer :loading="isLoadingRecords" no-data-text="无充值记录")
        template(v-slot:item.pay_date="{ item }") {{ item.pay_date | dateFormatter }}
        template(v-slot:item.method="{ item }") {{ item.method | methodFormatter}}
        template(v-slot:item.received="{ item }") {{ item.received/100 }}元
        template(v-slot:item.donate="{ item }") {{ item.donate/100 }}元
        template(v-slot:body.append="{ headers }")
          tr
            td(v-for="(header,i) in headers" :key="i")
              div(v-if="header.value =='received'") <b>{{ receivedTotal }}元</b>
              div(v-if="header.value =='donate'") <b>{{ donateTotal }}元</b>
              div(v-else)
    v-card-actions
      v-spacer
      v-btn(text color="primary" @click="dialog = false") 关闭
</template>

<script>

module.exports = {
  name: "deposit-history-dialog",
  components: {},
  data() {
    return {
      dialog: false,
      tenantName: "",
      isLoadingRecords: true,
      records: [],
      records_headers: [
        { text: '充值日期', value: 'pay_date', sortable: false },
        { text: '付款方式', value: 'method', sortable: false },
        { text: '充值', value: 'received', sortable: false },
        { text: '赠送', value: 'donate', sortable: false },
        { text: '备注', value: 'comment', sortable: false }
      ]
    }
  },
  computed: {
    receivedTotal() {
      return (this.records || []).reduce((accumulator, currentValue) => {
        return accumulator + currentValue.received;
      }, 0) / 100;
    },
    donateTotal() {
      return (this.records || []).reduce((accumulator, currentValue) => {
        return accumulator + currentValue.donate;
      }, 0) / 100;
    }
  },
  filters: {
    methodFormatter(value) {
      switch (value) {
        case "cash":
          return "现金";
        case "bankcard":
          return "银行卡";
        case "mobilepayment":
          return "移动支付"
        default:
          return null;
      }
    },
    dateFormatter(value) {
      return moment(value).format("ll");
    }
  },
  methods: {
    open(tenant) {
      this.tenantName = tenant.tenantName;
      this.isLoadingRecords = true;
      this.dialog = true;
      var request = axios.get("/api/dlktlogs/deposits/" + tenant.tenantId, { params: {} });
      request.then((response) => {
        this.records = response.data || [];
      }).catch((error) => {
        // TODO, display the error message returned from server
        console.error(error);
      }).finally(() => {
        this.isLoadingRecords = false;
      });
    }
  }
}
</script>

<style lang="less"></style>
