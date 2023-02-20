<template lang="pug">
v-container
  v-subheader Title
  v-row(dense align="center" justify="end")
    v-col(cols="auto")
      v-menu(ref="menu" :close-on-content-click="false" offset-y v-model="menu")
        template(v-slot:activator="{ on, attrs }")
          v-text-field(solo dense readonly v-model="selectedMonth" hide-details prepend-icon="mdi-calendar" v-bind="attrs" v-on="on")
        v-date-picker(v-model="selectedMonth" type="month" locale="zh" @change="refresh")
    v-spacer
    span 选择时间单位
    v-col(cols="auto")
      v-select(solo dense :items="units" v-model="select" hide-details)
    v-btn(color='primary') 刷新
  v-data-table(:headers="headers" :items="data" :items-per-page="10" :loading="isLoading")
</template>

<script>

var serviceUtil = require("../../services/util");

module.exports = {
  name: "home",
  data() {
    return {
      menu: false,
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
        { text: '播放次数', value: 'total' }
      ],
      rawData: []
    }
  },
  computed: {
    data() {
      return this.rawData.map(value => {
        return { name: value._id.name, total: value.total };
      })
    }
  },
  methods: {
    refresh() {
      // close menu
      this.menu = false;
      // TODO, refresh table data
    }
  },
  mounted() {
    var request = serviceUtil.getJSON("/api/dlktlogs/bytenant");
    request.done((data, textStatus, jqXHR) => {
      this.rawData = data || [];
    });
    request.always(() => {
      this.isLoading = false;
    })
  }
}
</script>

<style lang="less">
.v-select__selections input {
  width: 0 !important;
  min-width: 0 !important;
}
</style>
