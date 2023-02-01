<template lang="pug">
div
  div.row(style="margin-top:15px")
    div.col-md-12
      div.d-flex.justify-content-end
        date-picker.me-7(label='年份:', v-model='year', :disabled='unit=="year"', :config='yearPickerConfig', @input="refreshChart" style="max-width:160px")
        div.input-group.me-7
          span.input-group-addon 单位:
          select.form-control(v-model='unit',@change='refreshChart')
            option(value='year') 年
            option(value='month') 月
            option(value='week') 周
        button.btn.btn-primary(type="button",@click='refreshChart') 刷新
  div.row(style="margin-top:15px")
    div.col-xs-12
      div#consume_chart(style="height:400px")
  div.row(style="margin-top:15px")
    div.col-xs-12
      div#orders_chart(style="height:400px")
</template>

<script>
/**
 * --------------------------------------------------------------------------
 * consume-tab display a panel for consume statistics
 * --------------------------------------------------------------------------
 */

var util = require('../../services/util');
var date_picker = require('../../components/date-picker.vue').default;
var vintageTheme = require("./vintage.json");

module.exports = {
  name: "consume-tab",
  props: {},
  data: function() {
    return {
      consumeChart: null,
      orderChart: null,
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
        case "month":
          return "月";
        case "week":
          return "周";
        default:
          return "";
      }
    }
  },
  filters: {},
  methods: {
    firstLoad() {
      this.consumeChart = echarts.init(
        $(this.$el).find("#consume_chart")[0],
        "vintage"
      );

      this.orderChart = echarts.init(
        $(this.$el).find("#orders_chart")[0],
        "vintage"
      );

      window.onresize = () => {
        this.consumeChart.resize();
        this.orderChart.resize();
      };

      this.refreshChart();
    },
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

      // Draw orders chart
      var request = $.get("/api/analytics/orders", filter, "json");
      request.done(function(data, textStatus, jqXHR) {
        vm.drawOrdersChart(vm.parseOrdersData(data));
      });
      request.fail(errorFunc);

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
          text: (this.unit === 'year' ? "每" : year) + "年会员卡课时消费明细",
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
          left: '5%',
          right: '15%',
          bottom: '10%'
        },
        legend: {
          data: ["消费课时", "充值课时"],
          top: "10%",
          right: 10,
          orient: "vertical"
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
    },
    parseOrdersData: function(rawData) {
      var vm = this;
      var chartData = {
        xAxis: [],
        series0: [] // totalfee
      };

      if (!rawData) {
        return chartData;
      }

      var data = [];
      // parse the totalfee data
      rawData.forEach(function(value, index, array) {
        if (!value) return;
        var i = value._id;
        if (typeof i !== "number") return;

        data[i] = data[i] || {};
        data[i].total = value.total;
      });

      data.forEach(function(value, index, array) {
        if (!value) return;
        chartData.xAxis.push(index + vm.unitName);
        chartData.series0.push((value.total || 0) / 100);
      });
      return chartData;
    },
    drawOrdersChart: function(data) {
      // resize the chart according to its parent dom size
      this.orderChart.resize();
      // define the options of charts
      var option = {
        title: {
          text: (this.unit === 'year' ? "每" : this.year.year()) + "年销售订单明细",
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
          left: '5%',
          right: '15%',
          bottom: '10%'
        },
        legend: {
          data: ["订单金额"],
          top: "10%",
          right: 10,
          orient: "vertical"
        },
        xAxis: {
          name: this.unitName,
          data: data.xAxis
        },
        yAxis: {
          name: "金额(元)"
        },
        series: [
          {
            name: "订单金额",
            type: "bar",
            //stack: "one",
            //barGap: 0,
            data: data.series0
          }
        ]
      };

      // Apply the chart options to create/update chart instance
      this.orderChart.setOption(option);
    }
  },
  created: function() { },
  mounted: function() {
    // register vintage Theme for echarts
    echarts.registerTheme("vintage", vintageTheme);
  }
};
</script>

<style lang='less'>

</style>
