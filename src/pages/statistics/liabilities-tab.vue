<template lang="pug">
div
  div.row(style="margin-top:15px")
    div.col-sm-12.col-md-6
      div.d-flex.justify-content-end.align-items-center(style="margin-bottom:15px")
        div.me-7 有效学员总计: <strong>{{effectiveMembersCount}}</strong>人
        div.me-7 合约总计剩余: <strong>{{notStartedContracts | toFixed1}}</strong>课时
        button.btn.btn-primary(type="button",@click='refreshChart3') 刷新
      div#chart3(style="height:400px")
    div.col-sm-12.col-md-6
      div.d-flex.justify-content-end.align-items-center(style="margin-bottom:15px")
        div.me-7 课程总计剩余: <strong>{{notStartedTotal | toFixed1}}</strong>课时
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
var request3 = null;
var request4 = null;

export default {
  name: "liabilities-tab",
  props: {},
  data: function() {
    return {
      types: [],
      chart3: null,
      chart4: null,
      notStartedTotal: 0,
      notStartedContracts: 0,
      effectiveMembersCount: 0
    };
  },
  watch: {},
  components: {
    'date-picker': date_picker
  },
  computed: {},
  filters: {},
  methods: {
    getTypeName(typeId) {
      var item = this.types.find(value => {
        return value.id === typeId;
      });
      return item && item.name || "未指定类型";
    },
    firstLoad() {
      this.chart3 = echarts.init(
        $(this.$el).find("#chart3")[0],
        "westeros"
      );

      this.chart4 = echarts.init(
        $(this.$el).find("#chart4")[0],
        "walden"
      );

      window.onresize = () => {
        this.chart3.resize();
        this.chart4.resize();
      };

      this.refreshChart3();
      this.refreshChart4();
    },
    refreshEffectiveMembers() {
      // load data for effective members
      if (request1) request1.abort("abort by user");

      request1 = util.getJSON("/api/analytics/effectivemembers");
      request1.fail(jqXHR => {
        util.showAlert("刷新有效学员失败", jqXHR);
      });
      request1.done((data, textStatus, jqXHR) => {
        var result = (data || []).length === 1 ? data[0] : null;
        this.effectiveMembersCount = result ? result.count : "error";
      });
      request1.always(() => {
        request1 = null;
      });
    },
    refreshChart3() {
      this.refreshEffectiveMembers();
      // load data for chart3
      if (request3) request3.abort("abort by user");
      // resize the chart according to its parent dom size
      this.chart3.resize();
      this.chart3.showLoading();
      request3 = util.getJSON("/api/analytics/remainingcontracts");
      request3.fail(jqXHR => {
        util.showAlert("刷新图表失败", jqXHR);
      });
      request3.done((data, textStatus, jqXHR) => {
        this.drawChart3(data || []);
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
      request4 = util.getJSON("/api/analytics/remainingclasses");
      request4.fail(jqXHR => {
        util.showAlert("刷新图表失败", jqXHR);
      });
      request4.done((data, textStatus, jqXHR) => {
        this.drawChart4(data || []);
      });
      request4.always(() => {
        request4 = null;
        this.chart4.hideLoading();
      });
    },
    drawChart3: function(rawData, selectedMonth, unitName) {
      this.notStartedContracts = 0;
      var chartData = rawData.map(item => {
        this.notStartedContracts += item.total;
        return {
          name: this.getTypeName(item._id),
          //name: item._id && item._id._id || "",
          value: Math.round(item.total * 10) / 10
        }
      });

      // define the options of charts
      var option = {
        title: {
          text: "有效合约剩余课时分类统计",
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
          name: "剩余课时",
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
      this.chart3.setOption(option);
    },
    drawChart4: function(rawData) {
      this.notStartedTotal = 0;
      var chartData = rawData.map(item => {
        this.notStartedTotal += item.total;
        return {
          name: this.getTypeName(item._id),
          //name: item._id && item._id._id || "",
          value: Math.round(item.total * 10) / 10
        }
      });

      // define the options of charts
      var option = {
        title: {
          text: "已排课程剩余课时分类统计",
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
          name: "剩余课时",
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
  created: function() {
    this.tenantConfig = _getTenantConfig();
    this.types = this.tenantConfig && this.tenantConfig.types || [];
  },
  mounted: function() {
    echarts.registerTheme("walden", waldenTheme);
    echarts.registerTheme("westeros", westerosTheme);
  }
};
</script>

<style lang='less'>

</style>
