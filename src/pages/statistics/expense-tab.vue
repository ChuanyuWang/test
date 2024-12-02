<template lang="pug">
div
  div.row(style="margin-top:15px")
    div.col-md-12
      div.d-flex.justify-content-end
        date-picker.me-7(v-model='year', :disabled='unit=="year"', :config='yearPickerConfig', @input="refreshChart" label="年份:" style="max-width:160px")
        div.input-group.me-7
          span.input-group-addon 单位:
          select.form-control(v-model='unit',@change='refreshChart')
            option(value='year') 年
            option(value='month') 月
            option(value='week') 周
        button.btn.btn-primary(type="button",@click='refreshChart') 刷新
  div.row(style="margin-top:15px")
    div.col-sm-12.col-md-6
      div#chart1(style="height:400px")
    div.col-sm-12.col-md-6
      div#chart2(style="height:400px")
  div.row(style="margin-top:15px")
    div.col-sm-12.col-md-6
      div.d-flex.justify-content-end(style="margin-bottom:15px")
        date-picker.me-7(v-model='selectedMonth', label="月份:" :config='monthPickerConfig', @input="refreshChart3", style="max-width:200px")
        button.btn.btn-primary(type="button",@click='refreshChart3') 刷新
      div#chart3(style="height:400px")
    div.col-sm-12.col-md-6
      div.d-flex.justify-content-end(style="margin-bottom:15px")
        date-picker.me-7(v-model='selectedDay', label="日期:" :config='dayPickerConfig', @input="refreshChart4", style="max-width:200px")
        button.btn.btn-primary(type="button",@click='refreshChart4') 刷新
      div#chart4(style="height:400px")
</template>

<script>
/**
 * --------------------------------------------------------------------------
 * expense-tab display a panel for consume statistics
 * --------------------------------------------------------------------------
 */

import util from '../../services/util';
import date_picker from '../../components/date-picker.vue';
import waldenTheme from "./walden.json";
import westerosTheme from "./westeros.json";
var request1 = null;
var request2 = null;
var request3 = null;
var request4 = null;

export default {
  name: "expense-tab",
  props: {},
  data: function() {
    return {
      chart1: null,
      chart2: null,
      chart3: null,
      chart4: null,
      yearPickerConfig: { "format": "YYYY", "locale": "zh-CN", "viewMode": "years" },
      monthPickerConfig: { "format": "YYYY年MMM", "locale": "zh-CN", "viewMode": "months" },
      dayPickerConfig: { "format": "L", "locale": "zh-CN", "viewMode": "days" },
      year: moment().startOf("year"),
      selectedMonth: moment().startOf("month"),
      selectedDay: moment().startOf("day"),
      unit: "month"
    };
  },
  watch: {},
  components: {
    'date-picker': date_picker
  },
  computed: {
    unitName: function() {
      switch (this.unit) {
        case "year":
          return "年";
        case "month":
          return "月";
        case "week":
          return "周";
        case "day":
          return "日";
        default:
          return "";
      }
    }
  },
  filters: {},
  methods: {
    firstLoad() {
      this.chart1 = echarts.init(
        $(this.$el).find("#chart1")[0],
        "westeros"
      );

      this.chart2 = echarts.init(
        $(this.$el).find("#chart2")[0],
        "walden"
      );

      this.chart3 = echarts.init(
        $(this.$el).find("#chart3")[0],
        "westeros"
      );

      this.chart4 = echarts.init(
        $(this.$el).find("#chart4")[0],
        "walden"
      );

      window.onresize = () => {
        this.chart1.resize();
        this.chart2.resize();
        this.chart3.resize();
        this.chart4.resize();
      };

      this.refreshChart();
      this.refreshChart3();
      this.refreshChart4();
    },
    refreshChart: function() {
      var filter = {
        unit: this.unit,
        year: this.year.year()
      };
      //load data for chart1
      if (request1) request1.abort("abort by user");
      // resize the chart according to its parent dom size
      this.chart1.resize();
      this.chart1.showLoading();
      request1 = util.getJSON("/api/analytics/classexpense", filter);
      request1.fail(jqXHR => {
        util.showAlert("刷新图表失败", jqXHR);
      });
      request1.done((data, textStatus, jqXHR) => {
        this.drawChart1(data || [], filter.year, this.unitName);
      });
      request1.always(() => {
        request1 = null;
        this.chart1.hideLoading();
      });

      // load data for chart2
      if (request2) request2.abort("abort by user");
      // resize the chart according to its parent dom size
      this.chart2.resize();
      this.chart2.showLoading();
      request2 = util.getJSON("/api/analytics/incomingpayment", filter);
      request2.fail(jqXHR => {
        util.showAlert("刷新图表失败", jqXHR);
      });
      request2.done((data, textStatus, jqXHR) => {
        this.drawChart2(data || [], filter.year, this.unitName);
      });
      request2.always(() => {
        request2 = null;
        this.chart2.hideLoading();
      });
    },
    refreshChart3() {
      // load data for chart3
      if (request3) request3.abort("abort by user");
      // resize the chart according to its parent dom size
      this.chart3.resize();
      this.chart3.showLoading();
      request3 = util.getJSON("/api/analytics/classexpense", { unit: "day", year: this.selectedMonth.year(), month: this.selectedMonth.month() });
      request3.fail(jqXHR => {
        util.showAlert("刷新图表失败", jqXHR);
      });
      request3.done((data, textStatus, jqXHR) => {
        this.drawChart3(data || [], this.selectedMonth.clone(), "日");
      });
      request3.always(() => {
        request3 = null;
        this.chart3.hideLoading();
      });
    },
    refreshChart4() {
      // load data for chart4
      if (request4) request4.abort("abort by user");
      // resize the chart according to its parent dom size
      this.chart4.resize();
      this.chart4.showLoading();
      request4 = util.getJSON("/api/analytics/classexpense2", { date: this.selectedDay.toISOString() });
      request4.fail(jqXHR => {
        util.showAlert("刷新图表失败", jqXHR);
      });
      request4.done((data, textStatus, jqXHR) => {
        this.drawChart4(data || [], this.selectedDay.clone());
      });
      request4.always(() => {
        request4 = null;
        this.chart4.hideLoading();
      });
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
      /*
      data.forEach((value, index, array) => {
        if (!value) return;
        chartData.xAxis.push(index + unitName);
        chartData.series0.push(
          Math.round((value.amount || 0) / 100 * 10) / 10
        );
      });
      */
      for (var key in data) {
        chartData.xAxis.push(key + unitName);
        chartData.series0.push(
          Math.round((data[key].amount || 0) / 100 * 10) / 10
        );
      }
      return chartData;
    },
    drawChart1: function(rawData, year, unitName) {
      // prepare the data
      var data = this.assembleOneSeriesData(rawData, unitName);
      // define the options of charts
      var option = {
        title: {
          text: (this.unit === 'year' ? "每" : year) + "年课消金额统计",
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
          data: ["课消金额"],
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
          name: "元"
        },
        series: [
          {
            name: "课消金额",
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
    drawChart2: function(rawData, year, unitName) {
      // prepare the data
      var data = this.assembleOneSeriesData(rawData, unitName);
      // define the options of charts
      var option = {
        title: {
          text: (this.unit === 'year' ? "每" : year) + "年缴费金额统计",
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
          data: ["缴费金额"],
          //top: "10%",
          bottom: 10,
          //orient: "vertical"
        },
        xAxis: {
          type: 'category',
          name: unitName,
          data: data.xAxis
        },
        yAxis: {
          name: "元"
        },
        series: [
          {
            name: "缴费金额",
            type: "bar",
            stack: "one",
            barGap: 0,
            data: data.series0
          }
        ]
      };

      // Apply the chart options to create/update chart instance
      this.chart2.setOption(option);
    },
    drawChart3: function(rawData, selectedMonth, unitName) {
      var dataObj = {};
      // parse the comsumption data
      rawData.forEach(function(value, index, array) {
        var key = value._id;
        if (typeof key !== "number") return;
        dataObj[key] = value.total;
      });

      var fullMonth = [];
      for (let index = 1; index <= selectedMonth.endOf("month").date(); index++) {
        fullMonth[index] = dataObj[index] || 0;
      }

      // array.map will only loop array indexes which have assigned values
      var fullMonthData = fullMonth.map((value, index) => {
        return {
          _id: index,
          total: value
        }
      });

      // prepare the data
      var data = this.assembleOneSeriesData(fullMonthData, unitName);
      // define the options of charts
      var option = {
        title: {
          text: selectedMonth.format("YYYY[年]MMM") + "课消金额统计",
          top: "top",
          left: "center"
        },
        tooltip: {
          //format: "{b0}",
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
          data: ["课消金额"],
          //top: "10%",
          bottom: 10,
          //orient: "vertical"
        },
        xAxis: {
          type: 'category',
          name: unitName,
          data: data.xAxis
        },
        yAxis: {
          name: "元"
        },
        series: [
          {
            name: "课消金额",
            type: "bar",
            //stack: "one",
            //barGap: 0,
            data: data.series0
          }
        ]
      };

      // Apply the chart options to create/update chart instance
      this.chart3.setOption(option);
    },
    drawChart4: function(rawData, selectedDay, unitName) {
      var chartData = rawData.map(item => {
        return {
          name: item._id && item._id.name || "",
          //name: item._id && item._id._id || "",
          value: Math.round(item.total) / 100
        }
      });

      // define the options of charts
      var option = {
        title: {
          text: selectedDay.format("ll") + "课消金额统计",
          top: "top",
          left: "center"
        },
        tooltip: {
          //formatter: "{a}<br>{b} <b>{c}</b>元",
          trigger: "item"
        },
        toolbox: {
          feature: {
            dataView: { readOnly: true },
            myTool: {
              show: true,
              //title: "abc",
              icon: "path://M200.753 408.251c-57.062 0-103.749 46.687-103.749 103.749s46.687 103.749 103.749 103.749S304.502 569.062 304.502 512s-46.687-103.749-103.749-103.749z m622.494 0c-57.062 0-103.749 46.687-103.749 103.749s46.687 103.749 103.749 103.749S926.996 569.062 926.996 512s-46.687-103.749-103.749-103.749z m-311.247 0c-57.062 0-103.749 46.687-103.749 103.749S454.938 615.749 512 615.749 615.749 569.062 615.749 512 569.062 408.251 512 408.251z",
              onclick: o => {
                //console.log(o);
              }
            }
          }
        },
        legend: {
          //top: "10%",
          //orient: "vertical"
          bottom: 10
        },
        series: [{
          name: "课消金额",
          type: "pie",
          radius: "50%",
          data: chartData,
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }]
      };

      // Apply the chart options to create/update chart instance
      this.chart4.setOption(option);
    }
  },
  created: function() { },
  mounted: function() {
    echarts.registerTheme("walden", waldenTheme);
    echarts.registerTheme("westeros", westerosTheme);
  }
};
</script>

<style lang='less'></style>
