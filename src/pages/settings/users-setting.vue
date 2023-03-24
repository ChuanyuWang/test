<template lang="pug">
div(style='padding:7px')
  table.table.table-striped.table-bordered.table-hover
    thead
      tr
        th 操作权限
        th 学员
        th 店长
        th 管理员
    tbody
      tr(v-for='item in permissions')
        td {{item.name}}
        td
          span.glyphicon.glyphicon-ok.text-success(v-if='item.role == "guest"')
          span.glyphicon.glyphicon-remove.text-danger(v-else)
        td
          span.glyphicon.glyphicon-remove.text-danger(v-if='item.role == "admin"')
          span.glyphicon.glyphicon-ok.text-success(v-else)
        td
          span.glyphicon.glyphicon-ok.text-success
  p.small 
    |*删除课程 - 店长可以删除未开始的课程;管理员不受限制<br/>
    |*预约课程 - 如果课程已经开始或者距离开始时间不足1分钟, 学员将不能预约;管理员和店长不受限制<br/>
    |*取消预约 - 学员可以在课程开始前24小时取消预约;店长可以在课程开始1小时内取消预约;管理员不受限制<br/>
    |*签到 - 店长可以在课程开始72小时内签到;管理员不受限制
</template>

<script>
/**
 * --------------------------------------------------------------------------
 * users-setting display a panel for users settings
 * --------------------------------------------------------------------------
 */

module.exports = {
  name: "users-setting",
  props: {},
  data: function() {
    return {
      permissions: [
        { name: "查看教室", role: "guest" },
        { name: "添加教室", role: "admin" },
        { name: "删除教室", role: "admin" },
        { name: "修改教室", role: "admin" },

        { name: "查看老师", role: "user" },
        { name: "添加老师", role: "admin" },
        { name: "删除老师", role: "admin" },
        { name: "修改老师", role: "admin" },

        { name: "基础设置", role: "admin" },

        { name: "查看课程", role: "guest" },
        { name: "添加课程类型", role: "admin" },
        { name: "修改课程类型", role: "admin" },
        { name: "删除课程类型", role: "admin" },

        { name: "查看课程", role: "guest" },
        { name: "添加课程", role: "user" },
        { name: "删除课程*", role: "user" },
        { name: "修改课程", role: "user" },
        { name: "添加绘本", role: "user" },
        { name: "删除绘本", role: "user" },
        { name: "预约课程*", role: "guest" },
        { name: "取消预约*", role: "guest" },

        { name: "查看学员", role: "user" },
        { name: "添加学员", role: "admin" },
        { name: "删除学员", role: "admin" },
        { name: "修改学员", role: "admin" },
        { name: "添加备注", role: "user" },

        { name: "查看合约", role: "user" },
        { name: "添加合约", role: "user" },
        { name: "删除合约", role: "admin" },
        { name: "修改合约", role: "admin" },
        { name: "备注合约", role: "user" },

        { name: "合约缴费", role: "user" },
        { name: "撤销缴费", role: "admin" },

        { name: "查看班级", role: "user" },
        { name: "添加班级", role: "user" },
        { name: "删除班级", role: "admin" },
        { name: "修改班级", role: "admin" },
        { name: "自动预约", role: "user" },
        { name: "添加班级成员", role: "user" },
        { name: "删除班级成员", role: "user" },
        { name: "添加班级课程", role: "user" },
        { name: "删除班级课程", role: "admin" },

        { name: "查看订单", role: "user" },
        { name: "删除订单", role: "admin" },
        { name: "关闭订单", role: "admin" },
        { name: "退款", role: "admin" },

        { name: "签到*", role: "user" },
        { name: "旗标", role: "user" },
        { name: "备注", role: "user" },
        { name: "试听统计", role: "user" }
      ]
    };
  },
  components: {},
  computed: {},
  filters: {},
  methods: {},
  created: function() { }
};
</script>

<style lang='less'>
</style>
