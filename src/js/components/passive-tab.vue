<style>

</style>

<template lang="pug">
div
  div.row(style="margin-top:7px")
    div#chart1.col-md-6(style="height:450px")
    div#chart2.col-md-6(style="height:450px")
  div.row(style="margin-top:15px")
    div#chart3.col-md-12(style="height:400px")
</template>

<script>
/**
 * --------------------------------------------------------------------------
 * passive-tab display a panel for passive statistics
 * --------------------------------------------------------------------------
 */

var common = require("../common");
var util = require("../services/util");

module.exports = {
  name: "passive-tab",
  props: {},
  data: function() {
    return {
      passiveChart: null,
      passiveChart2: null,
      passiveChart3: null,
      year: 2018,
      unit: "month"
    };
  },
  watch: {},
  components: {},
  computed: {
    unitName: function() {
      switch (this.unit) {
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
    round: function(value) {
      return Math.round(value * 10) / 10;
    },
    refreshPassiveChart: function() {
      var vm = this;
      // all effective members, {'<id>':{_id:String, membership:Object,since:string,name:String,contact:String}}
      var effectiveMembers = {}; // default value
      var request = $.get("/api/analytics/passive", null, "json");
      request.done(function(data, textStatus, jqXHR) {
        var rawUserData = data.effectiveMembers || [];
        rawUserData.forEach(function(value, index, array) {
          effectiveMembers[value._id] = value;
        });
      });
      request.done(function(data, textStatus, jqXHR) {
        var userList = [],
          chartData = [];
        var lastBook = data.lastBook || [];
        // the lastBook is sorted from newest to oldest at server side
        for (var i = 0; i < lastBook.length; i++) {
          var value = lastBook[i];
          effectiveMembers[value._id].hasBooking = true;
          var last = moment(value.last);
          var toNow = moment().diff(last, "days");
          if (toNow <= 0) continue; // ignore negative
          userList.push(effectiveMembers[value._id].name);
          chartData.push(toNow);
        }
        vm.renderPassiveChart1(userList, chartData);
        vm.renderPassiveChart2(effectiveMembers);
        vm.renderPassiveChart3(effectiveMembers);
      });
      request.fail(function(jqXHR, textStatus, errorThrown) {
        util.showAlert("刷新图表失败", jqXHR);
      });
    },
    renderPassiveChart1: function(userList, chartData) {
      // only display the top 20
      var topN = 20;
      if (userList.length > topN) {
        userList.splice(0, userList.length - topN);
        chartData.splice(0, chartData.length - topN);
      }
      // resize the chart according to its parent dom size
      this.passiveChart.resize();
      // define the options of charts
      var option = {
        title: {
          text: "长期未上课会员排名-前20",
          subtext: "(不包含过期或未激活会员)",
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
          data: ["未上课天数"],
          top: "bottom"
        },
        xAxis: {
          name: "天",
          type: "value"
        },
        yAxis: {
          name: "宝宝姓名",
          type: "category",
          data: userList
        },
        series: [
          {
            name: "未上课天数",
            type: "bar",
            barGap: 0,
            data: chartData
          }
        ]
      };

      // Apply the chart options to create/update chart instance
      this.passiveChart.setOption(option);
    },
    renderPassiveChart2: function(all) {
      var noBookingUsers = [];
      var users = Object.keys(all);
      for (var i = 0; i < users.length; i++) {
        if (!all[users[i]].hasBooking) {
          noBookingUsers.push(all[users[i]]);
        }
      }
      var sortBySince = function(a, b) {
        if (moment(a.since).isBefore(b.since)) return 1;
        else return -1;
      };
      noBookingUsers.sort(sortBySince);
      var userList = [],
        chartData = [];
      // skip less two weeks
      noBookingUsers.forEach(function(value, index, array) {
        var off = moment().diff(value.since, "days");
        if (off > 14) {
          userList.push(value.name);
          chartData.push(off);
        }
      });
      // resize the chart according to its parent dom size
      this.passiveChart2.resize();
      // define the options of charts
      var option = {
        title: {
          text: "新会员未上课排名-2周以上",
          subtext: "(不包含过期或未激活会员)",
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
          data: ["未上课天数"],
          top: "bottom"
        },
        xAxis: {
          name: "天",
          type: "value"
        },
        yAxis: {
          name: "宝宝姓名",
          type: "category",
          data: userList
        },
        series: [
          {
            name: "未上课天数",
            type: "bar",
            barGap: 0,
            data: chartData
          }
        ]
      };

      // Apply the chart options to create/update chart instance
      this.passiveChart2.setOption(option);
    },
    renderPassiveChart3: function(all) {
      // refer to http://echarts.baidu.com/demo.html#scatter-aqi-color
      var chartData = [];
      var now = moment();
      var users = Object.keys(all);
      for (var i = 0; i < users.length; i++) {
        var user = all[users[i]];
        var card = user.membership[0];
        var days2expire = moment(card.expire).diff(now, "days");
        if (days2expire > 100) continue;
        days2expire = days2expire == 0 ? 1 : days2expire;
        chartData.push([
          days2expire,
          this.round(card.credit),
          this.round(card.credit / days2expire),
          user.name
        ]);
      }
      // resize the chart according to its parent dom size
      this.passiveChart3.resize();
      // define the options of charts
      var option = {
        title: {
          text: "课时在有效期内分布-100天内",
          subtext: "(不包含过期或未激活会员)",
          top: "top",
          left: "center"
        },
        tooltip: {
          borderWidth: 1,
          formatter: function(obj) {
            var value = obj.value;
            return (
              '<div style="border-bottom: 1px solid rgba(255,255,255,.3); font-size: 18px;padding-bottom: 7px;margin-bottom: 7px">' +
              "会员：" +
              value[3] +
              "</div>" +
              "过期天数：" +
              value[0] +
              "<br>" +
              "剩余课时：" +
              value[1] +
              "<br>" +
              "CPD：" +
              value[2] +
              "<br>"
            );
          }
        },
        grid: {
          x2: 120
        },
        visualMap: [
          {
            left: "right",
            top: "20%",
            dimension: 2,
            min: 0.1,
            max: 1,
            itemWidth: 30,
            itemHeight: 120,
            calculable: true,
            precision: 0.01,
            text: ["CPD-消费压力\n(课时/剩余天数)"],
            textGap: 30,
            inRange: {
              symbolSize: [10, 70]
            },
            outOfRange: {
              symbolSize: [10, 70],
              color: ["rgba(4,4,4,.5)"]
            },
            controller: {
              inRange: {
                color: ["#c23531"]
              },
              outOfRange: {
                color: ["#444"]
              }
            },
            formatter: function(value) {
              return Math.round(value * 10) / 10; // 范围标签显示内容
            }
          }
        ],
        toolbox: {
          feature: {
            dataView: { readOnly: true }
          }
        },
        legend: {
          data: ["会员分布"],
          top: "bottom"
        },
        xAxis: {
          name: "过期天数",
          type: "value",
          nameLocation: "middle"
        },
        yAxis: {
          name: "剩余课时",
          type: "value"
        },
        series: [
          {
            name: "会员分布",
            type: "scatter",
            data: chartData
          }
        ]
      };

      // Apply the chart options to create/update chart instance
      this.passiveChart3.setOption(option);
    }
  },
  created: function() {},
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

    // initialize chart instance
    this.passiveChart = echarts.init($(this.$el).find("#chart1")[0], "vintage");
    this.passiveChart2 = echarts.init(
      $(this.$el).find("#chart2")[0],
      "vintage"
    );
    this.passiveChart3 = echarts.init(
      $(this.$el).find("#chart3")[0],
      "vintage"
    );
  }
};
</script>