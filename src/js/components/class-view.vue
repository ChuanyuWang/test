<template lang="pug">
div.container
  ol.breadcrumb
    li
      a(href="../home") 主页
    li
      a(href="../home") 课程表
    li.active 查看课程
  div.page-header
    h3(style='margin-top:0;display:inline-block') 基本信息
    button.btn.btn-danger(type='button',style='float:right',:disabled='!cls._id',@click='deleteClass') 删除课程
  form.form-horizontal
    div.form-group(:class='{"has-error": errors.name}')
      label.control-label.col-sm-2 课程名称:
      div.col-sm-5(data-toggle="tooltip",data-placement="right",:title="errors.name")
        input.form-control(type='text',v-model.trim='cls.name',placeholder='课程描述')
    div.form-group
      label.control-label.col-sm-2 教室:
      select.form-control.col-sm-10(style='margin-left:15px;width:auto',v-model='cls.classroom')
        option(v-for='r in classrooms',:value='r.id') {{r.name}}
    div.form-group
      label.control-label.col-sm-2 老师:
      select.form-control.col-sm-10(style='margin-left:15px;width:auto',v-model='cls.teacher')
        option(v-for='t in teachers',:value='t._id') {{t.name}}
    div.form-group(v-show='cls.courseID',style='display:none')
      label.control-label.col-sm-2 所属班级:
      div.col-sm-10
        a.button.btn-primary.btn-sm(:href='"../course/" +cls.courseID',style='line-height:34px') 查看
    div.form-group
      label.control-label.col-sm-2 所须课时:
      div.col-sm-10
        p.form-control-static {{cls.cost}}
    div.form-group(:class='{"has-error": errors.date}')
      label.control-label.col-sm-2 日期/时间:
      div.col-sm-4(data-toggle="tooltip",data-placement="right",:title="errors.date")
        date-picker(v-model='cls.date',:config="{format:'lll',locale:'zh-CN',sideBySide: true}")
    div.form-group(:class='{"has-error": errors.age}')
      label.control-label.col-sm-2 年龄:
      div.col-sm-10(style="display:inline-flex",data-toggle="tooltip",data-placement="right",:title="errors.age")
        input.form-control(type='number',v-model.number='age.min',min='0',style={'width':'70px'})
        p.form-control-static(style={'display':'inline-block','margin-left':'3px','float':'left'}) 至
        input.form-control(type='number',v-model.number='age.max',min='0',style={'width':'70px','margin-left':'3px'})
        p.form-control-static(style={'display':'inline-block','margin-left':'3px'}) 岁
    div.form-group(:class='{"has-error": errors.capacity}')
      label.control-label.col-sm-2 最大人数:
      div.col-sm-2(data-toggle="tooltip" data-placement="right",:title="errors.capacity")
        input.form-control(type='number',min='0',v-model.number='cls.capacity')
    div.form-group
      div.col-sm-offset-2.col-sm-10
        button.btn.btn-success(type='button',v-on:click='saveBasicInfo',:disabled='hasError') 保存
  div.page-header
    h3 预约
  form.form-horizontal
    div.form-group
      div.col-sm-2
        button.btn.btn-primary.btn-sm(type="button",:disabled='!cls._id',@click='$refs.memberSelectDlg.show()',style='margin-bottom:7px')
          span.glyphicon.glyphicon-plus 添加
      div.col-sm-6
        ul.list-group(style='margin-bottom:0px')
          li.list-group-item(v-for="booking in bookings")
            div(style='display:flex')
              span.glyphicon.glyphicon-ok.text-success(v-if='booking.status=="checkin"',style='margin-right:3px;font-size:large')
              span.glyphicon.glyphicon-remove.text-danger(v-else-if='booking.status=="absent"',style='margin-right:3px;font-size:large')
              span.glyphicon.glyphicon-question-sign.text-default(v-else,style='margin-right:3px;font-size:large')
              div(style='flex-grow:2') {{booking.userName}} <small>({{booking.quantity}}人)</small>
              button.btn.btn-danger.btn-xs(v-show='booking.status!=="absent"',type='button',style='margin-right:3px',@click='absent(booking.member)') 缺席
              button.btn.btn-success.btn-xs(v-show='booking.status!=="checkin"',type='button',style='margin-right:3px',@click='checkin(booking.member)') 签到
              a.btn.btn-xs.btn-primary(:href='"../member/" + booking.member',style='margin-right:3px',target='_blank') 查看
              button.btn.btn-default.btn-xs(type='button',style='',@click='cancelReservation(booking)') 取消
            p.small(style='color:#777;margin:5px 3px 0px;text-align:right') 于{{booking.bookDate | formatDate}}预约
        small(style='color:#777') 共{{membersCount}}人
  div.page-header(v-if='feature=="book"')
    h3 绘本
  form.form-horizontal(v-if='feature=="book"')
    div.form-group
      div.col-sm-2
        button.btn.btn-primary.btn-sm(type="button",:disabled='!cls._id',@click='$refs.addBookDlg.show()',style='margin-bottom:7px')
          span.glyphicon.glyphicon-plus 添加
      div.col-sm-6
        template(v-for="item in cls.books")
          div.media
            div.media-left
              span.glyphicon.glyphicon-book.text-primary(style='font-size:large;opacity:0.8')
            div.media-body
              h4.media-heading(style='font-size:small') {{item.title}}
              p.small(style='color:#777') {{item.info}} by {{getTeacherName(cls.teacher) || item.teacher || '未指定'}}
                span.badge(style='background-color:#d9534f;cursor:pointer;float:right;margin-right:16px',@click='removeBook(item)') 删除
        small(style='color:#777') 共{{booksCount}}本
  add-book-modal(ref='addBookDlg',@ok='addNewBook')
  member-select-modal(ref='memberSelectDlg',@ok='addReservation')
    div.btn-group(slot='toolbar',style='display:inline-flex;position:absolute;top:25px;left:20px')
      label(style='margin-right:4px;line-height:34px') 人数:
      input.form-control(type='number',min='1',step='1',style='width:90px',v-model.number='quantity')
</template>

<script>
/**
 * --------------------------------------------------------------------------
 * class-view.js display details of single class item
 * --------------------------------------------------------------------------
 */

var util = require("../common.js");
var date_picker = require("./date-picker.vue").default;
var teacher_service = require("../services/teachers");
var class_service = require("../services/classes");
var member_select_modal = require("./member-select-modal.vue").default;
var add_book_modal = require("./add-book-modal.vue").default;

module.exports = {
  name: "class-view",
  props: {
    data: Object, // class object
    classrooms: Array // Array of available classroom
  },
  data: function() {
    // clone the pass in data, because class-view component will
    // modify the booking and books property of cls
    var tmp = this.data || {};
    return {
      cls: Object.assign({}, tmp, {
        books: tmp.books || [],
        booking: tmp.booking || []
      }),
      quantity: 1,
      teachers: [],
      bookedMembers: [],
      feature: null
    };
  },
  components: {
    "date-picker": date_picker,
    "member-select-modal": member_select_modal,
    "add-book-modal": add_book_modal
  },
  computed: {
    bookings: function() {
      var vm = this;
      var result = vm.cls.booking || [];
      result.forEach(function(value, index, array) {
        var name = "已删除";
        vm.bookedMembers.some(function(member) {
          if (member.member == value.member) {
            name = member.userName;
            return true;
          }
          return false;
        });
        value.userName = name;
      });
      return result;
    },
    membersCount: function() {
      var count = 0;
      var all = this.bookings || [];
      all.forEach(function(value, index, array) {
        count += value.quantity || 0;
      });
      return count;
    },
    booksCount: function() {
      return this.cls.books ? this.cls.books.length : 0;
    },
    // age is displayed as year
    age: function() {
      var age = this.cls.age || {}; // age field could be null
      return {
        min: age.min ? Math.round((age.min / 12) * 10) / 10 : null,
        max: age.max ? Math.round((age.max / 12) * 10) / 10 : null
      };
    },
    errors: function() {
      var errors = {};
      if (!this.cls.name || this.cls.name.length == 0)
        errors.name = "名称不能为空";
      if (!this.cls.date) errors.date = "日期/时间未指定";
      if (this.cls.date && !moment(this.cls.date).isValid())
        errors.date = "日期/时间格式不正确";
      if (this.cls.capacity < 0) errors.capacity = "最大人数不能小于零";
      if (this.age.min < 0) errors.age = "最小年龄不能小于零";
      if (this.age.max < 0) errors.age = "最大年龄不能小于零";
      if (
        typeof this.age.max === "number" &&
        typeof this.age.min === "number" &&
        this.age.max < this.age.min
      )
        errors.age = "最大年龄不能小于最小年龄";
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
    }
  },
  watch: {},
  methods: {
    getTeacherName: function(teacherID) {
      if (!teacherID) return "";
      for (var index = 0; index < this.teachers.length; index++) {
        var element = this.teachers[index];
        if (element._id === teacherID) {
          return element.name;
        }
      }
      return "";
    },
    saveBasicInfo: function() {
      if (this.hasError) return false;

      var vm = this;
      var request = class_service.updateClass(this.cls._id, {
        name: this.cls.name,
        date: this.cls.date && moment(this.cls.date).toISOString(),
        classroom: this.cls.classroom,
        teacher: this.cls.teacher,
        capacity: this.cls.capacity || 0, // default value take effect if capacity is ""
        age: {
          // age is stored as months
          min: this.age.min ? parseInt(this.age.min * 12) : null,
          max: this.age.max ? parseInt(this.age.max * 12) : null
        }
      });
      request.done(function(data, textStatus, jqXHR) {
        bootbox.alert("课程基本资料更新成功");
        vm.cls = data;
        vm.cls.books = data.books || [];
      });
    },
    deleteClass: function() {
      var vm = this;
      if (vm.cls.courseID) {
        return bootbox.confirm({
          title: "确定删除班级中的课程吗？",
          message:
            "课程<strong>" +
            vm.cls.name +
            "</strong>是固定班的课程<br/>请先查看班级，并从班级管理界面中删除相关课程",
          buttons: {
            confirm: {
              label: "查看班级",
              className: "btn-success"
            }
          },
          callback: function(ok) {
            if (ok) {
              window.location.href = "../course/" + vm.cls.courseID;
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
          if (!ok) return;
          var request = class_service.removeClass(vm.cls._id);
          request.done(function(data, textStatus, jqXHR) {
            window.location.href = "../home";
          });
        }
      });
    },
    removeBook: function(item) {
      var vm = this;
      bootbox.confirm({
        title: "确定删除绘本吗？",
        message: "从当前课程中删除绘本《" + item.title + "》",
        buttons: {
          confirm: {
            className: "btn-danger"
          }
        },
        callback: function(ok) {
          if (!ok) return;
          var request = class_service.deleteBook(vm.cls._id, item);
          request.done(function(data, textStatus, jqXHR) {
            vm.cls.books = data.books;
          });
        }
      });
    },
    addReservation: function(selectedItems) {
      // reset the quantity of reservation
      if (this.quantity === "") this.quantity = 1;

      var vm = this;
      if (selectedItems.length == 0)
        return bootbox.alert({
          message: "请选择会员",
          size: "small",
          buttons: {
            ok: {
              className: "btn-danger"
            }
          }
        });

      var members = vm.bookings || [];
      var addedOnes = selectedItems.filter(function(element, index, array) {
        // filter the new added member
        return !members.some(function(value, index, array) {
          // find one matched member and return true
          return value.member == element._id;
        });
      });

      if (addedOnes.length > 0) {
        var result = addedOnes.map(function(value, index, array) {
          return {
            classid: vm.cls._id,
            contact: value.contact,
            name: value.name,
            quantity: vm.quantity
          };
        });
        // add one member's reservation
        var request = class_service.addReservation(result[0]);
        request.done(function(data, textStatus, jqXHR) {
          vm.bookedMembers.push({
            member: data["member"]._id,
            userName: data["member"].name
          });
          vm.cls.booking = data["class"].booking || [];
          bootbox.alert("预约成功");
        });
      } else {
        bootbox.alert("所选会员已经预约");
      }
    },
    cancelReservation: function(item) {
      var vm = this;
      bootbox.confirm({
        title: "确定取消会员预约吗？",
        message: "取消会员的预约，并且返还扣除的课时，无法在课程开始后取消",
        buttons: {
          confirm: {
            className: "btn-danger"
          }
        },
        callback: function(ok) {
          if (!ok) return;
          var request = class_service.deleteReservation(vm.cls._id, {
            memberid: item.member
          });
          request.done(function(data, textStatus, jqXHR) {
            vm.cls.booking = data.booking || [];
          });
        }
      });
    },
    addNewBook: function(newBook) {
      var vm = this;
      var request = class_service.addBooks(vm.cls._id, newBook);
      request.done(function(data, textStatus, jqXHR) {
        vm.cls.books = data.books;
      });
    },
    checkin: function(memberid) {
      var vm = this;
      var request = class_service.checkin(vm.cls._id, memberid);
      request.done(function(data, textStatus, jqXHR) {
        vm.cls.booking = data.booking || [];
      });
    },
    absent: function(memberid) {
      var vm = this;
      var request = class_service.absent(vm.cls._id, memberid);
      request.done(function(data, textStatus, jqXHR) {
        vm.cls.booking = data.booking || [];
      });
    }
  },
  created: function() {
    // Load all teachers for selection
    var vm = this;
    var request = teacher_service.getAll({ status: "active" });
    request.done(function(data, textStatus, jqXHR) {
      var all = data || [];
      // all the unassigned option with null as id
      all.push({ name: "<未指定>", _id: null });
      vm.teachers = all;
    });
  },
  mounted: function() {
    // 'this' is refer to vm instance
    var vm = this;
    // load class reservations
    if (this.cls._id) {
      var request = class_service.getReservations(this.cls._id);
      request.done(function(data, textStatus, jqXHR) {
        vm.bookedMembers = data || [];
      });
    } else {
      bootbox.alert({
        message: "查看的课程不存在",
        buttons: {
          ok: {
            className: "btn-danger"
          }
        }
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
</style>