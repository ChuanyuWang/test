<template lang="pug">
div
  h5.visible-print-block {{$t('classroom') + ": " + classroomName}}
  div.d-flex.hidden-print.align-items-center(style='margin:10px 0')
    div.btn-group.me-3
      button.btn.btn-primary(@click='previousWeek') {{$t('previous_week')}}
      button.btn.btn-primary(@click='thisWeek') {{$t('this_week')}}
      button.btn.btn-primary(@click='nextWeek') {{$t('next_week')}}
    date-picker(v-model='date',style="width:170px")
    div.flex-grow-1
    div.input-group
      span.input-group-addon {{ $t('classroom') }}:
      select.form-control(v-model='classroom',@change="updateSchedule")
        option(v-for='r in classrooms',:value='r.id') {{r.name}}
  table.class-table.table.table-bordered(v-if='hasClassroom')
    thead
      tr
        th(style='width:60px;text-align:center') {{$t('time')}}
        th(v-for='(col, index) in columns') {{col}}
          div {{index | displayWeekDay(monday)}}
    tbody
      tr(v-for='(section, i) in sections')
        td {{section.name}}
        td(v-for='(col, j) in columns',style='padding:0')
          class-list(:data='getClassess(j, section.startTime, section.duration)',v-on:view="viewClass",v-on:delete="deleteClass",v-on:add="addClass(j,section.startTime)")
  div.row(v-else)
    div.col-sm-12(style='height:200px;background-color:#eee')
      a.btn.btn-success(style='margin:83px auto;display:table',href='setting') {{$t('create_classroom')}}
  p.small.pull-right.hidden-print *打印课程表时请选择横向，并根据打印机调整缩放比例，效果更佳
  create-class-modal(ref='createClsDlg',@ok='createClass')
  message-alert(ref="messager")
</template>

<script>
/**
 * --------------------------------------------------------------------------
 * class-calendar.js component display weekly schedule
 * --------------------------------------------------------------------------
 */

import common from "../../common/common";
import class_service from "../../services/classes";
import messageAlert from "../../components/message-alert.vue";
import datePicker from "../../components/date-picker.vue";
import classList from "./class-list.vue";
import createClassDlg from "./create-class-modal.vue"

export default {
  name: "app",
  components: {
    "date-picker": datePicker,
    "class-list": classList,
    "message-alert": messageAlert,
    "create-class-modal": createClassDlg
  },
  props: {},
  data: function() {
    var classrooms = _getTenantConfig().classrooms || [];
    return {
      date: moment().startOf('day'), // moment date object
      // [ "星期一", "星期二", "星期三", "星期四", "星期五", "星期六", "星期日" ]
      columns: moment.weekdays(true),
      sections: [
        { name: "上午", startTime: 0, duration: 12 },
        { name: "下午", startTime: 12, duration: 6 },
        { name: "晚上", startTime: 18, duration: 6 }
      ],
      classes: [],
      tenantConfig: {},
      classrooms,
      // current seelcted classroom id, default is the first available classroom
      classroom: classrooms.length > 0 ? classrooms[0].id : null
    };
  },
  computed: {
    monday: function() {
      // Get the Monday of specific date, each week starts from Monday
      var _date = moment(this.date);
      var dayofweek = _date.day();
      // the Monday of this week
      if (dayofweek == 0) {
        // today is Sunday
        _date.day(-6);
      } else {
        _date.day(1);
      }
      //set the time to the very beginning of day
      return _date.startOf('day');
    },
    // TODO, should not mutate component data
    // https://eslint.vuejs.org/rules/no-side-effects-in-computed-properties.html
    sortedClasses: function() {
      var classes = this.classes || [];
      return classes.sort(function(a, b) {
        if (moment(a.date).isSameOrBefore(b.date)) return -1;
        else return 1;
      });
    },
    hasClassroom: function() {
      if (Array.isArray(this.classrooms) && this.classrooms.length > 0)
        return true;
      else return false;
    },
    classroomName: function() {
      if (!this.classroom) return "";
      var vm = this;
      var selectedRoom = this.classrooms.find(function(value, index, array) {
        return value.id === vm.classroom;
      });
      return selectedRoom.name;
    }
  },
  filters: {
    displayWeekDay: function(dayOffset, monday) {
      return moment(monday)
        .add(dayOffset, "days")
        .format("MMMDo");
    }
  },
  watch: {
    date: function(value, oldValue) {
      // only update the schedule when it's another day
      if (!moment(value).isSame(oldValue, 'day'))
        this.updateSchedule();
    }
  },
  methods: {
    previousWeek: function() {
      // create a new moment object to trigger the data binding
      this.date = moment(this.monday).subtract(7, "days");
    },
    thisWeek: function() {
      this.date = moment().startOf('day');
    },
    nextWeek: function() {
      // create a new moment object to trigger the data binding
      this.date = moment(this.monday).add(7, "days");
    },
    getClassess: function(dayOffset, startTime, duration) {
      var result = [];
      var theDay = moment(this.monday)
        .add(dayOffset, "days")
        .hours(startTime);
      for (var i = 0; i < this.sortedClasses.length; i++) {
        var classItem = this.classes[i];
        if (moment(classItem.date).isSameOrAfter(theDay)) {
          if (moment(classItem.date).diff(theDay, "hours") >= duration) break;
          else result.push(classItem);
        }
      }
      return result;
    },
    viewClass: function(classItem) {
      window.location.href = "./class/" + classItem._id;
    },
    deleteClass: function(classItem) {
      var vm = this;
      if (classItem.courseID) {
        return bootbox.confirm({
          title: "确定删除班级中的课程吗？",
          message:
            "课程<strong>" +
            classItem.name +
            "</strong>是固定班的课程<br/>请先查看班级，并从班级管理界面中删除此课程",
          buttons: {
            confirm: {
              label: "查看班级",
              className: "btn-success"
            }
          },
          callback: function(ok) {
            if (ok) {
              window.location.href = "./course/" + classItem.courseID;
            }
          }
        });
      }
      bootbox.confirm({
        title: "确定删除课程吗？",
        message: "只能删除没有学员预约的课程，如果有预约，请先取消预约",
        buttons: {
          confirm: {
            className: "btn-danger"
          }
        },
        callback: function(ok) {
          if (ok) {
            var request = class_service.removeClass(classItem._id);
            request.done(function(data, textStatus, jqXHR) {
              vm.removeClasses(classItem);
              vm.$refs.messager.showSuccessMessage("删除成功");
            });
          }
        }
      });
    },
    removeClasses: function(oldClass) {
      var found = false;
      for (var i = 0; i < this.classes.length; i++) {
        if (this.classes[i]._id == oldClass._id) {
          // remove the old one
          this.classes.splice(i, 1);
          found = true;
          break;
        }
      }
      if (!found) {
        console.error("can't find the oldClass");
      }
    },
    addClass: function(dayOffset, startTime) {
      // the first class should start from 8:00 in the morning
      this.$refs.createClsDlg.show(
        moment(this.monday)
          .add(dayOffset, "days")
          .hours(startTime == 0 ? 8 : startTime),
        this.classroom
      );
    },
    createClass: function(classItem) {
      var vm = this;
      $.ajax("/api/classes", {
        type: "POST",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(classItem),
        success: function(data) {
          vm.updateClasses(data);
          // jump to new class page
          //window.location.href = './class/' + data._id;
          vm.$refs.messager.showSuccessMessage("添加成功");
        },
        error: function(jqXHR, status, err) {
          console.error(jqXHR.responseJSON ? jqXHR.responseJSON.message : jqXHR.responseText);
          vm.$refs.messager.showErrorMessage("添加课程失败");
        },
        dataType: "json"
      });
    },
    updateClasses: function(newClass) {
      var found = false;
      for (var i = 0; i < this.classes.length; i++) {
        if (this.classes[i]._id == newClass._id) {
          // remove existed and replace by update one
          this.classes.splice(i, 1, newClass);
          var found = true;
          break;
        }
      }
      if (!found) {
        // add as a new class item
        this.classes.push(newClass);
      }
    },
    updateSchedule: function() {
      var vm = this;
      var begin = moment(this.monday);
      var end = moment(begin).add(7, "days");

      var request = class_service.getClasses({
        from: begin.toISOString(),
        to: end.toISOString(),
        classroom: vm.classroom,
        tenant: common.getTenantName()
      }, true);

      request.done(function(data, textStatus, jqXHR) {
        vm.classes = data || [];
      });
      request.fail(function(jqXHR, textStatus, errorThrown) {
        console.error(jqXHR.responseJSON ? jqXHR.responseJSON.message : jqXHR.responseText);
      });
    }
  },
  created: function() {
    this.tenantConfig = _getTenantConfig();
  },
  mounted: function() {
    this.updateSchedule();
  }
};
</script>

<style lang='less'>
.class-table {
  table-layout: fixed;

  tbody td p {
    display: inline-block;
    height: 100%;
    padding-bottom: 16px;
    margin-bottom: -6px;
  }

  tbody tr td {
    overflow: hidden;
  }
}
</style>
