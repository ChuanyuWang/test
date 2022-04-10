<template lang="pug">
div.container
  ol.breadcrumb
    li
      a(href="../home") 主页
    li
      a(href="../course") 班级列表
    li.active 查看班级
  div.page-header
    h3(style='margin-top:0;display:inline-block') 基本信息
    button.btn.btn-danger(type='button',style='float:right',:disabled='!course._id',@click='$refs.confirmDlg.show()') 删除班级
  form.form-horizontal
    div.form-group
      label.col-sm-2.control-label {{$t('status')}}:
      select.col-sm-5.form-control(v-model='course.status',@change='closeAlert',style='margin-left:15px;width:auto')
        option.text-success(value='active') 进行中
        option.text-danger(value='closed') 结束
    div.form-group(:class='{"has-error": errors.name}')
      label.col-sm-2.control-label 名称:
      div.col-sm-5(data-toggle="tooltip",data-placement="right",:title="errors.name")
        input.form-control(v-model.trim='course.name', placeholder='班级名称')
      div.col-sm-5
        p.form-control-static(style='color:#808080')
          small {{course.createDate | formatDate}}创建
    div.form-group
      label.control-label.col-sm-2 教室:
      select#roomList.form-control.col-sm-4(style='margin-left:15px;width:auto',v-model='course.classroom')
        option(v-for='r in classrooms',:value='r.id') {{r.name}}
    div.form-group
      label.control-label.col-sm-2 简介:
      div.col-sm-8
        textarea.form-control(rows='3', v-model.trim='course.remark',style='resize:vertical;min-height:70px')
    div.form-group
      div.col-sm-offset-2.col-sm-10
        button.btn.btn-success(type='button',:disabled='!course._id || hasError',v-on:click='saveBasicInfo') {{$t('save')}}
  div.page-header
    h3 成员
  form.form-horizontal
    div.form-group
      div.col-sm-2
        button.btn.btn-primary.btn-sm(type="button",:disabled='!course._id',@click='showAddMemberDlg')
          span.glyphicon.glyphicon-plus 添加
      div.col-sm-7.col-md-5
        ul.list-group(style='margin-bottom:0px')
          transition-group(name="list")
            li.list-group-item(v-for="member in memberList",:key='member.id')
              span.glyphicon.glyphicon-user.text-primary(style='margin-right:3px')
              span.badge(style='background-color:#d9534f;cursor:pointer',@click='removeMember(member)') 移除
              a.badge(:href='"../member/" + member.id',style='margin-right:3px;background-color:#337ab7',target='_blank') 查看
              //span.badge(style='margin-right:3px;background-color:#337ab7;cursor:pointer',@click='showMemberCourse(member)') 分配
              | {{member.name}}
              div.small(style='color:#777') 学习进度
              div.participation-status.progress(style='margin-bottom:0px;display:flex',v-show='progressStatus[member.id].total')
                template(v-for='item in member.participationStatus')
                  div(v-if='item.status=="nonparticipant"',style='flex-grow:1',:title='item.date',data-toggle='tooltip',@touchend='showTooltip')
                  div.progress-bar-danger(v-if='item.status=="absent"',style='flex-grow:1',:title='item.date',data-toggle='tooltip',@touchend='showTooltip')
                  div.progress-bar-warning(v-if='item.status=="unchecked"',style='flex-grow:1',:title='item.date',data-toggle='tooltip',@touchend='showTooltip')
                  div.progress-bar-success(v-if='item.status=="checkin"',style='flex-grow:1',:title='item.date',data-toggle='tooltip',@touchend='showTooltip')
                  div.progress-bar.progress-bar-info.progress-bar-striped.active(v-if='item.status=="tobechecked"',style='flex-grow:1',:title='item.date',data-toggle='tooltip',@touchend='showTooltip')
        small(style='color:#777') 共{{membersCount}}人
      div.col-sm-3.col-md-5.participation-status-legend        
        div.progress
          div.progress-bar(style='background-color:darkgrey') 未预约
        div.progress
          div.progress-bar.progress-bar-danger 缺席
        div.progress
          div.progress-bar.progress-bar-warning 未签到
        div.progress
          div.progress-bar.progress-bar-success 签到
        div.progress
          div.progress-bar.progress-bar-info.progress-bar-striped.active 剩余课程
  div.page-header
    h3 课程
  form.form-horizontal
    div.form-group
      div.col-sm-2
        button.btn.btn-primary.btn-sm(type="button",:disabled='!course._id',@click='showAddClassDlg')
          span.glyphicon.glyphicon-plus 添加
      div.col-sm-7.col-md-5
        ul.list-group(style='margin-bottom:0px')
          transition-group(name="list")
            li.list-group-item(v-for="item in sortedClasses",:key='item._id')
              h4(style='margin: 3px 0') {{item.name}}
              small(style='position:absolute;right:15px;top:11px') {{item.cost}}课时
              p(style='margin: 3px 0', v-if='feature=="book"') 绘本: {{item.books | formatBooks}}
              a(:href='"../class/" + item._id',style='margin-right:3px',target='_blank')
                i.glyphicon.glyphicon-calendar
              span.small {{item.date | formatDateTime}} - {{getClassroomName(item.classroom)}}
              span.badge(style='background-color:#d9534f;cursor:pointer',@click='removeClass(item)') 删除
              a.badge(:href='"../class/" + item._id',style='margin-right:3px;background-color:#337ab7',target='_blank') 查看
      div.col-sm-3.col-md-5
        div
          small(style='color:#777') 共{{classesCount}}节
        div
          small(style='color:#777') 已上{{completedClassesCount}}节/未上{{classesCount - completedClassesCount}}节
  div(style='height:20px')
  add-multi-class-modal(ref='modal',:classrooms='classrooms',:defaultName='this.courseData.name',@ok='addClass')
  view-member-course-modal(ref='assignClassDlg',courseID='#{courseID}')
  show-booking-result-modal(ref='summaryDlg')
  confirm-delete-modal(ref='confirmDlg', @ok='deleteCourse')
  member-select-modal(ref='memberSelectDlg',@ok='addMembers',:multi-selection='true')
    template(v-slot:toolbar)
      div.checkbox(style='position:absolute;top:25px;left:20px')
        label
          input(type='checkbox',checked,disabled)
          |仅参加尚未开始的课程
</template>

<script>
/**
 * --------------------------------------------------------------------------
 * course-view.js display details of single course item
 * --------------------------------------------------------------------------
 */

var util = require('../../common/common.js');
var course_service = require("../../services/courses");
var add_multi_class_modal = require("./add-multi-class-modal.vue").default;
var view_member_course_modal = require("./view-member-course-modal.vue").default;
var show_booking_result_modal = require("./show-booking-result-modal.vue").default;
var member_select_modal = require("../../components/member-select-modal.vue").default;
var confirm_delete_modal = require("./confirm-delete-course.vue").default;

module.exports = {
  name: "course-view",
  inheritAttrs: false,
  props: {
    courseData: Object, // course object
    classrooms: Array // Array of available classrooms
  },
  data: function() {
    return {
      course: this.courseData || {},
      members: [],
      classes: [],
      feature: null
    };
  },
  components: {
    "add-multi-class-modal": add_multi_class_modal,
    "view-member-course-modal": view_member_course_modal,
    "show-booking-result-modal": show_booking_result_modal,
    "member-select-modal": member_select_modal,
    "confirm-delete-modal": confirm_delete_modal
  },
  computed: {
    membersCount: function() {
      return this.members ? this.members.length : 0;
    },
    classesCount: function() {
      return this.classes ? this.classes.length : 0;
    },
    completedClassesCount: function() {
      var now = moment(),
        count = 0;
      this.sortedClasses.some(function(value, index, array) {
        if (moment(value.date).isBefore(now)) count++;
        else return true;
      });
      return count;
    },
    sortedClasses: function() {
      var classes = this.classes || [];
      return classes.sort(function(a, b) {
        if (moment(a.date).isSameOrBefore(b.date)) return -1;
        else return 1;
      });
    },
    memberList: function() {
      var vm = this;
      var members = this.members || [];
      var now = moment();

      var result = members.map(function(member, index, array) {
        // five status: 'nonparticipant' || 'absent' || 'checkin' || 'unchecked' || 'tobechecked'
        var allClassesStatus = [];
        vm.sortedClasses.forEach(function(cls, index, array) {
          var status = vm.getParticipationStatus(cls, member);
          if (moment(cls.date).isSameOrAfter(now)) {
            // consider all unchecked classes as tobechecked in the future
            status = status === 'unchecked' ? 'tobechecked' : status;
          }
          allClassesStatus.push({
            date: moment(cls.date).format("ll"),
            status: status
          });
        });
        return {
          id: member.id,
          name: member.name,
          participationStatus: allClassesStatus
        };
      });
      return result;
    },
    progressStatus: function() {
      var progress = {},
        vm = this;
      var members = this.members || [];
      if (members.length == 0) return progress;
      var now = moment();

      members.forEach(function(member, index, array) {
        var status = {
          done: 0,
          absent: 0,
          left: 0,
          uninvolved: 0,
          total: vm.sortedClasses.length
        };
        vm.sortedClasses.forEach(function(cls, index, array) {
          if (vm.isAbsent(cls, member)) {
            if (moment(cls.date).isSameOrBefore(now)) status.absent++;
            else status.uninvolved++;
          } else {
            if (moment(cls.date).isSameOrBefore(now)) status.done++;
            else status.left++;
          }
        });
        //status.total = status.done + status.absent + status.left + status.uninvolved;
        progress[member.id] = status;
      });
      return progress;
    },
    errors: function() {
      var errors = {};
      if (this.course.name.length == 0) errors.name = "名称不能为空";
      return errors;
    },
    hasError: function() {
      var errors = this.errors;
      return Object.keys(errors).some(function(key) {
        return true;
      });
    }
  },
  filters: {
    formatDate: function(value) {
      if (!value) return "?";
      return moment(value).format("ll");
    },
    formatDateTime: function(value) {
      if (!value) return "?";
      return moment(value).format("lll");
    },
    formatBooks: function(value) {
      var result = "";
      if (jQuery.isArray(value)) {
        value.forEach(function(book) {
          if (book.title) {
            if (book.title.substr(0, 1) !== "《")
              result += "《" + book.title + "》";
            else
              result += book.title;
          }
        });
      }
      return result || "未添加";
    }
  },
  watch: {},
  methods: {
    showTooltip: function(e) {
      // must listen to 'touchstart' event
      $(document).one("touchstart", function() {
        // hide tooltip when user touch screen again
        $(e.target).tooltip('destroy');
      });
      // show tooltip
      $(e.target).tooltip({
        container: "body"
      }).tooltip('show');
    },
    getClassroomName: function(value) {
      for (var i = 0; i < this.classrooms.length; i++) {
        if (this.classrooms[i].id == value)
          return this.classrooms[i].name;
      }
      return null;
    },
    isAbsent: function(cls, member) {
      var booking = cls.booking || [];
      var hasReservation = function(value, index, array) {
        return value.member === member.id;
      };
      return !booking.some(hasReservation);
    },
    getParticipationStatus: function(cls, member) {
      var booking = cls.booking || [];
      var checkinStatus = null;
      var hasReservation = function(value, index, array) {
        if (value.member === member.id) {
          checkinStatus = value.status || 'unchecked';
          return true;
        }
        return false;
      };
      if (booking.some(hasReservation)) {
        return checkinStatus;
      } else {
        return 'nonparticipant'
      }
    },
    saveBasicInfo: function() {
      if (this.hasError) return false;
      var request = course_service.updateCourse(this.course._id, {
        status: this.course.status,
        name: this.course.name,
        classroom: this.course.classroom,
        remark: this.course.remark
      });
      request.done(function(data, textStatus, jqXHR) {
        bootbox.alert("班级基本资料更新成功");
      });
    },
    deleteCourse: function() {
      var request = course_service.removeCourse(this.course._id);
      request.done(function(data, textStatus, jqXHR) {
        window.location.href = "../course";
      });
    },
    showAddClassDlg: function() {
      this.$refs.modal.room = this.course.classroom;
      this.$refs.modal.show();
    },
    showAddMemberDlg: function(params) {
      var checkedItems = (this.members || []).map(function(
        value,
        index,
        array
      ) {
        return value.id;
      });
      this.$refs.memberSelectDlg.show(checkedItems);
    },
    genClassNames: function(baseName, count) {
      var count = count || 0;
      var result = [];
      var existed = this.classes || [];
      var suffix = existed.length + 1;
      for (var i = 0; i < count; i++) {
        var name = baseName + "-" + suffix;
        while (
          existed.some(function(val, index, array) {
            return val.name == name;
          })
        ) {
          suffix++;
          name = baseName + "-" + suffix;
        }
        result.push(name);
        suffix++;
      }
      return result;
    },
    genRepeatClass: function(datetime, startdate, enddate, days, name) {
      var dates = [];
      var current = moment(startdate);
      while (current.isSameOrBefore(enddate)) {
        if (
          days.some(function(value, index, array) {
            return value == current.day();
          })
        ) {
          var date = moment(current).set({
            hours: datetime.hours(),
            minutes: datetime.minutes(),
            seconds: datetime.seconds(),
            milliseconds: datetime.milliseconds()
          });
          dates.push(date);
        }
        current.add(1, "day");
      }
      var names = this.genClassNames(name, dates.length);
      return names.map(function(value, index, array) {
        return {
          //name: value, // class name with suffix
          name: name, // class name without suffix
          date: dates[index].toISOString()
        };
      });
    },
    addClass: function(options) {
      var vm = this;
      var datetime = options.date;
      var result = [];
      if (options.isRepeated) {
        var startdate = options.begin;
        var enddate = options.end;
        var days = options.weekdays || [];
        if (enddate.diff(startdate, "days") > 180)
          return bootbox.alert("开始和结束日期不能超过180天");
        result = this.genRepeatClass(datetime, startdate, enddate, days, options.name);
      } else {
        result.push({
          name: options.name,
          date: datetime.toISOString()
        });
      }
      if (result.length === 0) return bootbox.alert("没有符合所选条件的课程");
      // assign classroom
      result.forEach(function(value, index, array) {
        value.classroom = options.room;
        value.teacher = options.teacher;
        value.cost = options.cost;
      });
      // create classes
      var request = course_service.addCourseClasses(vm.course._id, result);
      request.done(function(data, textStatus, jqXHR) {
        var addedClasses = data.addedClasses || [];
        addedClasses.forEach(function(value, index, array) {
          vm.classes.push(value);
        });
        vm.$refs.summaryDlg.show(data.result || {});
        //bootbox.alert('班级课程添加成功');
      });
    },
    removeClass: function(item) {
      var vm = this;
      bootbox.confirm({
        title: "删除课程",
        message:
          "删除" +
          moment(item.date).format("ll dddd") +
          " 课程吗?<br><small>同时返还相关课时到预约会员的会员卡中</small>",
        buttons: {
          confirm: {
            className: "btn-danger"
          }
        },
        callback: function(ok) {
          if (!ok) return;
          var request = course_service.removeCourseClasses(vm.course._id, {
            id: item._id
          });
          request.done(function(data, textStatus, jqXHR) {
            var classes = vm.classes;
            for (var i = 0; i < classes.length; i++) {
              if (classes[i]._id == item._id) {
                classes.splice(i, 1);
                break;
              }
            }
            //bootbox.alert('删除班级课程成功');
          });
        }
      });
    },
    addMembers: function(selectedMembers) {
      var vm = this;
      var members = this.members || [];
      var addedOnes = selectedMembers.filter(function(element, index, array) {
        // filter the new added member
        return !members.some(function(value, index, array) {
          // find one matched member and return true
          return value.id == element._id;
        });
      });

      if (addedOnes.length > 0) {
        var result = addedOnes.map(function(value, index, array) {
          return {
            id: value._id,
            name: value.name
          };
        });

        var request = course_service.addCourseMembers(
          vm.course._id,
          result
        );
        request.done(function(data, textStatus, jqXHR) {
          result.forEach(function(value, index, array) {
            vm.members.push(value);
          });
          vm.classes = data.updateClasses || [];
          vm.$refs.summaryDlg.show(data.result || {});
          //bootbox.alert('添加班级成员成功');
        });
      }
    },
    removeMember: function(item) {
      var vm = this;
      bootbox.confirm({
        title: "移除班级成员",
        message:
          "从班级中移除" +
          item.name +
          "，并取消此成员所有未开始的课程吗?<br><small>同时返还相关课时到会员卡中</small>",
        buttons: {
          confirm: {
            className: "btn-danger"
          }
        },
        callback: function(ok) {
          if (!ok) return;
          var request = course_service.removeCourseMember(vm.course._id, {
            id: item.id
          });
          request.done(function(data, textStatus, jqXHR) {
            var members = vm.members || [];
            for (var i = 0; i < members.length; i++) {
              if (members[i].id == item.id) {
                members.splice(i, 1);
                break;
              }
            }
            //bootbox.alert('删除班级成员成功');
          });
        }
      });
    },
    closeAlert: function(e) {
      if (this.course.status == "closed") {
        bootbox.alert({
          message:
            "请在结束此班级前请确认所有课程全部结束<br><small>确认后，请点击保存进行修改</small>",
          buttons: {
            ok: {
              label: "确定",
              className: "btn-danger"
            }
          }
        });
      }
    },
    showMemberCourse: function(member) {
      //TODO
      //alert(member)
      this.$refs.assignClassDlg.name = member.name;
      this.$refs.assignClassDlg.show();
    }
  },
  mounted: function() {
    // 'this' is refer to vm instance
    var vm = this;
    var request = course_service.getCourseClasses(vm.course._id);
    request.done(function(data, textStatus, jqXHR) {
      // set classes property
      vm.classes = data || [];
    });

    if (vm.course.members && vm.course.members.length > 0) {
      var request2 = course_service.getCourseMembers(vm.course._id);
      request2.done(function(data, textStatus, jqXHR) {
        // set members property
        vm.members = data && data.members || [];
      });
    }

    // load the setting of tenant
    var setting = util.getTenantSetting();
    vm.feature = setting.feature;
  }
};
</script>

<style lang='less'>
.container .page-header {
  margin: 15px 0;
  padding-bottom: 3px;
}
.participation-status div:hover {
  border-color: black;
  border-width: 1px;
  border-style: solid;
}
.participation-status-legend .progress {
  margin-bottom: 5px;
  width: 70px;
  .progress-bar {
    width: 100%;
  }
}
.list-item {
  display: inline-block;
  margin-right: 10px;
}
.list-enter-active,
.list-leave-active {
  transition: all 1s;
}
.list-enter, .list-leave-to /* .list-leave-active below version 2.1.8 */ {
  opacity: 0;
  transform: translateX(30px);
}
</style>
