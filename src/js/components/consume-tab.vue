<template lang="pug">
div
  div.row(style="margin-top:7px")
    div.col-md-1.pull-right(style="display:inline-flex")
      button.btn.btn-primary(type="button",@click='refreshChart') 刷新
    div.col-md-3.pull-right(style="display:inline-flex")
      p.form-control-static.text-nowrap(style="display:inline-table") 单位：
      select.form-control(v-model='unit',@change='refreshChart')
        option(value='year') 年
        option(value='month') 月
        option(value='week') 周
    div.col-md-3.pull-right(style="display:inline-flex")
      p.form-control-static.text-nowrap(style="display:inline-table") 年份：
      div
        date-picker(v-model='year', :disabled='unit=="year"', :config='yearPickerConfig', @input="refreshChart")
  div.row(style="margin-top:15px")
    div#consume_chart(style="height:400px")
</template>

<script>
/**
 * --------------------------------------------------------------------------
 * consume-tab display a panel for consume statistics
 * --------------------------------------------------------------------------
 */

var util = require('../services/util');
var date_picker = require('./date-picker.vue').default;

module.exports = {
  name: "consume-tab",
  props: {},
  data: function() {
    return {
      consumeChart: null,
      yearPickerConfig: { "format": "YYYY", "locale": "zh-CN", "viewMode": "years" },
      year: moment(new Date().getFullYear(), "YYYY"),
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
          break;
        case "month":
          return "月";
          break;
        case "week":
          return "周";
          break;
        default:
          return "";
      }
    }
  },
  filters: {},
  methods: {
    refreshChart: function() {
      var vm = this;

      var drawChartFunc = function(consumptionQueryResult, depositQueryResult) {
        vm.drawChart(
          vm.preChartData(
            consumptionQueryResult[0],
            depositQueryResult[0],
            vm.unitName
          ),
          vm.year.year(),
          vm.unitName
        );
      };

      var errorFunc = function(jqXHR, textStatus, errorThrown) {
        util.showAlert("刷新图表失败", jqXHR);
      };

      var filter = {
        unit: vm.unit,
        year: vm.year.year()
      };

      //Execute the function drawChartFunc when both ajax requests are successful, or errorFunc if either one has an error.
      // errorFunc is called only once even if both ajax requests have error
      var consumptionQuery = $.get(
        "/api/analytics/consumption",
        filter,
        "json"
      );
      var depositQuery = $.get("/api/analytics/deposit", filter, "json");
      $.when(consumptionQuery, depositQuery).then(drawChartFunc, errorFunc);
    },
    preChartData: function(consumptionData, depositData, unitName) {
      var chartData = {
        xAxis: [],
        series0: [], // consumption
        series1: [] // deposit value list
      };

      if (!consumptionData && !depositData) {
        return chartData;
      }

      var data = [];
      // parse the comsumption data
      consumptionData.forEach(function(value, index, array) {
        if (!value) return;
        var i = value._id;
        if (typeof i !== "number") return;

        data[i] = data[i] || {};
        data[i].storyConsumption = value.total;
      });
      // parse the deposit data
      depositData.forEach(function(value, index, array) {
        if (!value) return;
        var i = value._id;
        if (typeof i !== "number") return;

        data[i] = data[i] || {};
        data[i].deposit = value.total;
      });

      data.forEach(function(value, index, array) {
        if (!value) return;
        chartData.xAxis.push(index + unitName);
        chartData.series0.push(
          Math.round((value.storyConsumption || 0) * 10) / 10
        );
        chartData.series1.push(Math.round((value.deposit || 0) * 10) / 10);
      });
      return chartData;
    },
    drawChart: function(data, year, unitName) {
      // resize the chart according to its parent dom size
      this.consumeChart.resize();
      // define the options of charts
      var option = {
        title: {
          text: (this.unit === 'year' ? "每" : year) + "年课时消费明细",
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
        legend: {
          data: ["消费课时", "充值课时"],
          top: "bottom"
        },
        xAxis: {
          name: unitName,
          data: data.xAxis
        },
        yAxis: {
          name: "课时"
        },
        series: [
          {
            name: "消费课时",
            type: "bar",
            stack: "one",
            barGap: 0,
            data: data.series0
          },
          {
            name: "充值课时",
            type: "bar",
            stack: "two",
            data: data.series1
          }
        ]
      };

      // Apply the chart options to create/update chart instance
      this.consumeChart.setOption(option);
    }
  },
  created: function() { },
  mounted: function() {
    // register vintage Theme for echarts
    var colorPalette = [
      "#d87c7c",
      "#919e8b",
      "#d7ab82",
      "#6e7074",
      "#61a0a8",
      "#efa18d",
      "#787464",
      "#cc7e63",
      "#724e58",
      "#4b565b"
    ];
    echarts.registerTheme("vintage", {
      color: colorPalette,
      backgroundColor: "#00000",
      graph: {
        color: colorPalette
      }
    });

    this.consumeChart = echarts.init(
      $(this.$el).find("#consume_chart")[0],
      "vintage"
    );
  }
};
</script>

<style lang='less'>
</style>