<style>

</style>

<template lang="pug">
div(style='padding:7px')
  table.table.table-striped.table-bordered.table-hover
    thead
      tr
        th 操作权限
        th 会员
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
    |*修改课程 - 店长可以在课程开始前修改;管理员不受限制<br/>
    |*取消预约 - 会员可以在课程开始前24小时取消预约;店长可以在课程开始1小时内取消预约;管理员不受限制<br/>
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
        {name:'查看教室', role: 'guest'},
        {name:'添加教室', role: 'admin'},
        {name:'删除教室', role: 'admin'},
        {name:'修改教室', role: 'admin'},

        {name:'查看老师', role: 'user'},
        {name:'添加老师', role: 'admin'},
        {name:'删除老师', role: 'admin'},
        {name:'修改老师', role: 'admin'},

        {name:'综合设置', role: 'admin'},

        {name:'查看课程', role: 'guest'},
        {name:'添加课程', role: 'user'},
        {name:'删除课程', role: 'admin'},
        {name:'修改课程*', role: 'user'},
        {name:'添加绘本', role: 'user'},
        {name:'删除绘本', role: 'user'},
        {name:'预约课程', role: 'guest'},
        {name:'取消预约*', role: 'guest'},

        {name:'查看会员', role: 'user'},
        {name:'添加会员', role: 'admin'},
        {name:'删除会员', role: 'admin'},
        {name:'修改会员', role: 'admin'},
        {name:'添加备注', role: 'user'},
        {name:'添加会员卡', role: 'admin'},
        {name:'修改会员卡', role: 'admin'},
        
        {name:'查看班级', role: 'user'},
        {name:'添加班级', role: 'admin'},
        {name:'删除班级', role: 'admin'},
        {name:'修改班级', role: 'admin'},
        {name:'添加班级成员', role: 'user'},
        {name:'删除班级成员', role: 'user'},
        {name:'添加班级课程', role: 'user'},
        {name:'删除班级课程', role: 'admin'},

        {name:'签到*', role: 'user'},
        {name:'旗标', role: 'user'},
        {name:'备注', role: 'user'},
        {name:'试听统计', role: 'user'}
      ]
    };
  },
  components: {},
  computed: {},
  filters: {},
  methods: {},
  created: function() {}
};
</script>