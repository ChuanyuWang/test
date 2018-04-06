<style>

</style>

<template lang="pug">
div
  div.row(style='margin-top:15px;margin-bottom:15px')
    div.col-sm-4.btn-group
      button.btn.btn-primary.btn-sm(@click='previousWeek') 上一周
      button.btn.btn-primary.btn-sm(@click='thisWeek') 本周
      button.btn.btn-primary.btn-sm(@click='nextWeek') 下一周
      date-picker(v-model='date',inputClass='input-group-sm')
    div.col-sm-2.pull-right
      select.form-control.input-sm(style='float:right',v-model='classroom')
        option(v-for='r in classrooms',:value='r.id') {{r.name}}
      //span(style='float:right;line-height:30px') 教室: 
  table.class-table.table.table-bordered(v-if='hasClassroom')
    thead
      tr
        th(style='width:60px;text-align:center') 时间
        th(v-for='(col, index) in columns') {{col}}
          div {{index | displayWeekDay(monday)}}
    tbody
      tr(v-for='(section, i) in sections')
        td {{section.name}}
        td(v-for='(col, j) in columns',style='padding:0')
          class-list(:data='getClassess(j, section.startTime, section.duration)',v-on:view="viewClass",v-on:delete="deleteClass",v-on:add="addClass(j,section.startTime)")
  div.row(v-else)
    div.col-sm-12(style='height:200px;background-color:#eee')
      a.btn.btn-success(style='margin:83px auto;display:table',href='setting') 创建教室
  create-class-modal(ref='createClsDlg',@ok='createClass')
  notification(ref='alertbar')
</template>

<script>
/**
 * --------------------------------------------------------------------------
 * class-calendar.js component display weekly schedule
 * --------------------------------------------------------------------------
 */

var common = require("../common");
var class_service = require("../services/classes");

// Get the Monday of specific date, each week starts from Monday
function getMonday(date) {
  var _date = moment(date);
  var dayofweek = _date.day();
  // the Monday of this week
  if (dayofweek == 0) {
    // today is Sunday
    _date.day(-6);
  } else {
    _date.day(1);
  }
  //set the time to the very beginning of day
  _date
    .hours(0)
    .minutes(0)
    .seconds(0)
    .milliseconds(0);
  return _date;
}

module.exports = {
  name: "app",
  components: {
    'notification': require("./notification.vue"),
    "date-picker": require("./date-picker.vue"),
    "class-list": require("./class-list.vue"),
    "create-class-modal": require("./create-class-modal.vue")
  },
  props: {
    classrooms: Array // Array of available classroom
  },
  data: function() {
    return {
      date: moment(), // moment date object
      //monday: getMonday(moment()), // moment date object
      columns: ["星期一", "星期二", "星期三", "星期四", "星期五", "星期六", "星期日"],
      sections: [
        { name: "上午", startTime: 0, duration: 12 },
        { name: "下午", startTime: 12, duration: 6 },
        { name: "晚上", startTime: 18, duration: 6 }
      ],
      classes: [],
      // current seelcted classroom id, default is the first available classroom
      classroom: this.classrooms.length > 0 ? this.classrooms[0].id : null
    };
  },
  computed: {
    monday: function name() {
      return getMonday(this.date);
    },
    sortedClasses: function() {
      return this.classes.sort(function(a, b) {
        if (moment(a.date).isSameOrBefore(b.date)) return -1;
        else return 1;
      });
    },
    hasClassroom: function() {
      if (Array.isArray(this.classrooms) && this.classrooms.length > 0)
        return true;
      else return false;
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
    },
    classroom: function(value) {
      this.updateSchedule();
    }
  },
  methods: {
    previousWeek: function() {
      // create a new moment object to trigger the data binding
      this.date = moment(this.monday).subtract(7, "days");
    },
    thisWeek: function() {
      this.date = moment();
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
        message: "只能删除没有会员预约的课程，如果有预约，请先取消预约",
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
              vm.$refs.alertbar.showSuccessMsg("删除成功");
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
          vm.$refs.alertbar.showSuccessMsg('添加成功');
        },
        error: function(jqXHR, status, err) {
          vm.$refs.alertbar.showErrorMsg(
            jqXHR.responseJSON ? jqXHR.responseJSON.message : jqXHR.responseText
          );
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

      $.ajax("/api/classes", {
        type: "GET",
        //contentType : "application/x-www-form-urlencoded; charset=UTF-8",
        data: {
          from: begin.toISOString(),
          to: end.toISOString(),
          classroom: vm.classroom,
          tenant: common.getTenantName()
        },
        success: function(data) {
          vm.classes = data || [];
        },
        error: function(jqXHR, status, err) {
          console.error(
            jqXHR.responseJSON ? jqXHR.responseJSON.message : jqXHR.responseText
          );
        },
        complete: function(jqXHR, status) {
          // TODO, finish loading
        },
        dataType: "json"
      });
    }
  }
};
</script>