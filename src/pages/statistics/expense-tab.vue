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
    div#chart1(style="height:400px")
  div.row(style="margin-top:15px")
    div#chart2(style="height:400px")
</template>

<script>
/**
 * --------------------------------------------------------------------------
 * consume-tab display a panel for consume statistics
 * --------------------------------------------------------------------------
 */

var util = require('../../services/util');
var date_picker = require('../../components/date-picker.vue').default;

module.exports = {
  name: "expense-tab",
  props: {},
  data: function() {
    return {
      chart1: null,
      chart2: null,
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
    refreshChart: function() {
      var filter = {
        unit: this.unit,
        year: this.year.year()
      };

      var request = util.getJSON("/api/analytics/classexpense", filter);
      request.fail(jqXHR => {
        util.showAlert("刷新图表失败", jqXHR);
      });
      request.done((data, textStatus, jqXHR) => {
        this.drawChart1(data || [], filter.year, this.unitName);
      });
    },
    preChart1Data: function(rawData) {
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
        data[i].storyConsumption = value.total;
      });
      data.forEach((value, index, array) => {
        if (!value) return;
        chartData.xAxis.push(index + this.unitName);
        chartData.series0.push(
          Math.round((value.storyConsumption || 0) / 100 * 10) / 10
        );
      });
      return chartData;
    },
    drawChart1: function(rawData, year, unitName) {
      // prepare the data
      var data = this.preChart1Data(rawData);
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
          left: '5%',
          right: '15%',
          bottom: '10%'
        },
        legend: {
          data: ["课消金额"],
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
      backgroundColor: "#ffffff",
      graph: {
        color: colorPalette
      }
    });

    this.chart1 = echarts.init(
      $(this.$el).find("#chart1")[0],
      "vintage"
    );

    this.chart2 = echarts.init(
      $(this.$el).find("#chart2")[0],
      "vintage"
    );
  }
};
</script>

<style lang='less'>

</style>
