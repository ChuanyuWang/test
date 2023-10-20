<template lang="pug">
v-container
  v-subheader
    p 光影故事屋播放统计和分析功能，选择日期并查看统计数据（含全国门店）。
      |所有数据来源于叮聆课堂浏览日志，从2023年3月份开始统计，以下统计的数据截止到 <b>{{ yesterday.format("ll") }}</b>
  v-row(dense align="center" justify="end")
    v-spacer
    v-col(cols="auto")
      v-autocomplete(:items="[2023, 2024, 2025, 2026, 2027]" dense
        v-model="selectedYear" @change="refresh" label="选择年份" hide-details)
    v-col(cols="auto")
      v-btn(color='primary' :disabled="isLoading" @click="refresh") 刷新
  v-row
    v-col(md="6")
      v-card(outlined)
        div(ref="chart1" style="height:400px")
  v-snackbar.mb-12(v-model="snackbar") {{ message }}
    template(v-slot:action="{ attrs }")
      v-btn(color="primary" text v-bind="attrs" @click="snackbar = false") 关闭
</template>

<script>

var waldenTheme = require("./walden.json");
var common = require("../../common/common.js");

module.exports = {
  name: "statistics",
  data() {
    return {
      chart1: null,
      controller1: null,
      snackbar: false,
      message: "重新提取当天日志，请等待5分钟，不要重复刷新",
      yesterday: moment().subtract(1, 'day'),
      menu: false,
      selectedYear: new Date().getFullYear(),
      isLoading: true,
      rawData: []
    }
  },
  computed: {},
  methods: {
    init() {
      echarts.registerTheme("walden", waldenTheme);
      this.chart1 = echarts.init(
        this.$refs.chart1,
        "walden"
      );
      window.onresize = () => {
        this.chart1.resize();
      };
      this.refresh();
    },
    refresh() {
      // close menu
      this.menu = false;
      this.isLoading = true;

      // resize the chart according to its parent dom size
      this.chart1.resize();
      this.chart1.showLoading();

      if (this.controller1) this.controller1.abort("abort by user");
      else this.controller1 = new AbortController();
      // refresh table data
      var request = axios.get("/api/dlktlogs//bydate", { params: { year: this.selectedYear }, signal: this.controller1.signal });
      request.then((response) => {
        this.rawData = response.data || [];
        this.drawChart1(this.rawData, this.selectedYear, "月");
      });
      request.finally(() => {
        delete this.controller1;
        this.isLoading = false;
        this.chart1.hideLoading();
      });
    },
    drawChart1: function(rawData, year, unitName) {
      // prepare the data
      var data = this.assembleOneSeriesData(rawData, unitName);
      // define the options of charts
      var option = {
        title: {
          text: (this.unit === 'year' ? "每" : year) + "年播放次数统计",
          subtext: "仅统计播放时间大于10分钟的次数",
          top: "top",
          left: "center"
        },
        tooltip: {
          trigger: "axis"
        },
        toolbox: {
          feature: {
            dataView: { readOnly: true }
          }
        },
        grid: {
          //left: '5%',
          //right: '15%',
          //bottom: '10%'
        },
        legend: {
          data: ["播放次数"],
          //top: "10%",
          //right: 10,
          bottom: 0,
          //orient: "horizontal"
        },
        xAxis: {
          type: 'category',
          name: unitName,
          data: data.xAxis
        },
        yAxis: {
          name: "次"
        },
        series: [
          {
            name: "播放次数",
            type: "bar",
            stack: "one",
            barGap: 0,
            data: data.series0
          }
        ]
      };

      // Apply the chart options to create/update chart instance
      this.chart1.setOption(option);
    },
    assembleOneSeriesData: function(rawData, unitName) {
      var chartData = {
        xAxis: [],
        series0: []
      };

      if (!rawData || rawData.length === 0) {
        return chartData;
      }

      var data = {};
      // parse the comsumption data
      rawData.forEach(function(value, index, array) {
        if (!value) return;
        var i = value._id;
        if (typeof i !== "number") return;

        data[i] = data[i] || {};
        data[i].amount = value.total;
      });
      for (var key in data) {
        chartData.xAxis.push(key + unitName);
        chartData.series0.push(
          Math.round((data[key].amount || 0))
        );
      }
      return chartData;
    }
  },

  mounted() {
    if (typeof echarts === "object") return this.init();
    var result = common.loadScript("https://lf26-cdn-tos.bytecdntp.com/cdn/expire-1-y/echarts/5.3.0/echarts.min.js");
    result.then((event) => {
      this.init();
    });
    result.catch((error) => {
      console.error("fail to load echarts")
    });
  }
}
</script>

<style lang="less">
</style>
