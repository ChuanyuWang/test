<template lang="pug">
div
  ul.nav.nav-tabs(role='tablist')
    li(role='presentation')
      a(href="#general",role='tab',data-toggle='tab') 基础
    li(role='presentation')
      a(href="#entry",role='tab',data-toggle='tab') 入口
    li(role='presentation')
      a(href="#classroom",role='tab',data-toggle='tab') 教室
    li(role='presentation')
      a(href="#users",role='tab',data-toggle='tab') 权限
    li(role='presentation')
      a(href="#teacher",role='tab',data-toggle='tab') {{$t("teacher")}}
    li(role='presentation')
      a(href="#types",role='tab',data-toggle='tab') 课程类型
  div.tab-content
    div.tab-pane(role="tabpanel",id="users")
      user-setting
    div.tab-pane(role="tabpanel",id="general")
      general-setting
    div.tab-pane(role="tabpanel",id="teacher")
      teacher-setting
    div.tab-pane(role="tabpanel",id="types")
      type-setting
    div.tab-pane(role="tabpanel",id="classroom")
      classroom-setting
    div.tab-pane(role="tabpanel",id="entry")
      div.page-header(style='margin-top:0')
        h3 家长端功能入口
      form.form-horizontal
        span.help-block 根据业务需要选择不同的家长端功能入口, 并设置在微信公共号的自定义菜单中, 请将 <b>{{hostname}}</b> 添加到公共号的三个业务域名的任一个, 参见
          a(href='http://kf.qq.com/faq/120911VrYVrA150323ZJfURJ.html',target='_blank') 腾讯帮助文档
          |中《域名设置》部分
        div.form-group
          label.col-sm-2.control-label 预约课程
          div.col-sm-10
            p.form-control-static {{tenantUrl + '/booking'}}
            span.help-block 预约入口, 访问用户可以查看本周放开预约的课程（课程类型为开放预约，并且课程所在教室为非内部教室）, 并根据注册信息进行课程预约; 未开始课程, 可以提前24小时取消。
        div.form-group
          label.col-sm-2.control-label 我的课程
          div.col-sm-10
            p.form-control-static {{tenantUrl + '/mybooking'}}
            span.help-block 我的课程入口，访问用户可以根据注册信息查看学员历史课程，包括已经结束的和预约中的。
        div.form-group
          label.col-sm-2.control-label 试听
          div.col-sm-10
            p.form-control-static {{tenantUrl + '/trial'}}
            span.help-block 试听入口，访问用户可以提交试听申请，包括姓名、联系方式和感兴趣内容，管理员可以在后台查看所有申请并处理。<br>在入口Url后添加 <b>?source=xxx</b> 可以区别统计不同渠道的访问量，比如 #{tenantUrl}/trial?source=wechat
        div.form-group
          label.col-sm-2.control-label 我的阅读
          div.col-sm-10
            p.form-control-static {{tenantUrl + '/myReadBooks'}}
            span.help-block 我的阅读入口，访问用户可以根据注册信息查看所有历史课程中使用的绘本，包括书名和授课老师。
  message-alert(ref="messager")
</template>
<script>
import teacher_setting from './teach-setting.vue';
import users_setting from './users-setting.vue';
import general_setting from './general-setting.vue';
import classroom_setting from './classrooms.vue';
import type_setting from './type-setting.vue';
import common from '../../common/common';
import messageAlert from "../../components/message-alert.vue";

export default {
  name: "settings",
  props: {
  },
  data() {
    return {
      hostname: "localhost",
      tenantUrl: "http://localhost:3000/t/test"
    };
  },
  components: {
    "general-setting": general_setting,
    "user-setting": users_setting,
    "classroom-setting": classroom_setting,
    "message-alert": messageAlert,
    "teacher-setting": teacher_setting,
    "type-setting": type_setting
  },
  created() {
    var el = $('tenant-url');
    if (el.length > 0) {
      this.tenantUrl = el.attr('tenantUrl') || '';
      this.hostname = el.attr('hostname') || '';
    }
  },
  mounted() {
    // set message for global usage
    Vue.prototype.$messager = this.$refs.messager;
    // default tab is classroom
    var showTab = common.getParam("activetab") || "classroom";
    $('a[href="#' + showTab + '"]').tab('show');
  }
}
</script>

<style></style>
