<template lang="pug">
div
  div.row(style="margin-top:7px")
    div.col-md-12
      form.form-inline.pull-right
        div.form-group.me-7
          label.text-nowrap 年份:
          date-picker.ms-3(v-model='year', :disabled='unit=="year"', :config='yearPickerConfig', @input="refreshChart")
        div.form-group.me-7
          label 单位:
          select.form-control.ms-3(v-model='unit',@change='refreshChart')
            //option(value='year') 年
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
      date-picker.mb-7(v-model='selectedMonth', label="月份:" :config='monthPickerConfig', @input="refreshChart3", style="width:40%;margin-left:auto")
      div#chart3(style="height:400px")
    div.col-sm-12.col-md-6
      div#chart4(style="height:400px")
</template>

<script>
/**
 * --------------------------------------------------------------------------
 * consume-tab display a panel for consume statistics
 * --------------------------------------------------------------------------
 */

var util = require('../../services/util');
var date_picker = require('../../components/date-picker.vue').default;
var waldenTheme = require("./walden.json");
var westerosTheme = require("./westeros.json");
var request1 = null;
var request2 = null;
var request3 = null;

module.exports = {
  name: "expense-tab",
  props: {},
  data: function() {
    var current = new Date();
    return {
      chart1: null,
      chart2: null,
      chart3: null,
      yearPickerConfig: { "format": "YYYY", "locale": "zh-CN", "viewMode": "years" },
      monthPickerConfig: { "format": "YYYY-MM", "locale": "zh-CN", "viewMode": "years" },
      year: moment(current.getFullYear(), "YYYY"),
      selectedMonth: moment(`${current.getFullYear()}-${current.getMonth()}`, "YYYY-MM"),
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
    refreshChart: function() {
      var filter = {
        unit: this.unit,
        year: this.year.year()
      };
      //load data for chart1
      if (request1) request1.abort("abort by user");
      request1 = util.getJSON("/api/analytics/classexpense", filter);
      request1.fail(jqXHR => {
        util.showAlert("刷新图表失败", jqXHR);
      });
      request1.done((data, textStatus, jqXHR) => {
        this.drawChart1(data || [], filter.year, this.unitName);
      });
      request1.always(() => {
        request1 = null;
      });

      // load data for chart2
      if (request2) request2.abort("abort by user");
      request2 = util.getJSON("/api/analytics/incomingpayment", filter);
      request2.fail(jqXHR => {
        util.showAlert("刷新图表失败", jqXHR);
      });
      request2.done((data, textStatus, jqXHR) => {
        this.drawChart2(data || [], filter.year, this.unitName);
      });
      request2.always(() => {
        request2 = null;
      });
    },
    refreshChart3() {
      // load data for chart3
      if (request3) request3.abort("abort by user");
      request3 = util.getJSON("/api/analytics/classexpense", { unit: "day", year: this.selectedMonth.year(), month: this.selectedMonth.month() });
      request3.fail(jqXHR => {
        util.showAlert("刷新图表失败", jqXHR);
      });
      request3.done((data, textStatus, jqXHR) => {
        this.drawChart3(data || [], this.selectedMonth.format("YYYY[年]MMM"), "日");
      });
      request3.always(() => {
        request3 = null;
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

      var data = [];
      // parse the comsumption data
      rawData.forEach(function(value, index, array) {
        if (!value) return;
        var i = value._id;
        if (typeof i !== "number") return;

        data[i] = data[i] || {};
        data[i].amount = value.total;
      });
      data.forEach((value, index, array) => {
        if (!value) return;
        chartData.xAxis.push(index + unitName);
        chartData.series0.push(
          Math.round((value.amount || 0) / 100 * 10) / 10
        );
      });
      return chartData;
    },
    drawChart1: function(rawData, year, unitName) {
      // prepare the data
      var data = this.assembleOneSeriesData(rawData, unitName);
      // resize the chart according to its parent dom size
      this.chart1.resize();
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
      // resize the chart according to its parent dom size
      this.chart2.resize();
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
    drawChart3: function(rawData, yearAndMonth, unitName) {
      // prepare the data
      var data = this.assembleOneSeriesData(rawData, unitName);
      // resize the chart according to its parent dom size
      this.chart3.resize();
      // define the options of charts
      var option = {
        title: {
          text: yearAndMonth + "课消金额统计",
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
            stack: "one",
            barGap: 0,
            data: data.series0
          }
        ]
      };

      // Apply the chart options to create/update chart instance
      this.chart3.setOption(option);
    }
  },
  created: function() { },
  mounted: function() {
    echarts.registerTheme("walden", waldenTheme);
    echarts.registerTheme("westeros", westerosTheme);

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

    window.onresize = () => {
      this.chart1.resize();
      this.chart2.resize();
      this.chart3.resize();
    };
  }
};
</script>

<style lang='less'>

</style>
