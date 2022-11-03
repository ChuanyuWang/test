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
    button.btn.btn-danger(type='button',style='float:right',:disabled='!cls._id',@click='confirmDeleteClass') 删除课程
  div.row
    div.col-sm-6
      form.form-horizontal
        div.form-group
          label.control-label.col-sm-3.col-xs-4 类型:
          div.col-sm-5.col-xs-8
            select.form-control(v-model="cls.type" disabled)
              option.text-default(v-for="item in types" :value="item.id") {{item.name}}
        div.form-group(:class='{"has-error": errors.name}')
          label.control-label.col-sm-3.col-xs-4 课程名称:
          div.col-sm-9.col-md-7.col-xs-8(:title="errors.name")
            input.form-control(type='text',v-model.trim='cls.name',placeholder='课程描述')
        div.form-group
          label.control-label.col-sm-3.col-xs-4 教室:
          div.col-sm-5.col-xs-8
            select.form-control(v-model='cls.classroom')
              option(v-for='r in classrooms',:value='r.id') {{r.name}}
        div.form-group
          label.control-label.col-sm-3.col-xs-4 老师:
          div.col-sm-5.col-xs-8
            select.form-control(v-model='cls.teacher')
              option(v-for='t in teachers',:value='t._id') {{t.name}}
        div.form-group(v-show='cls.courseID')
          label.control-label.col-sm-3.col-xs-4 所属班级:
          div.col-sm-8.col-xs-8
            a.button.btn-primary.btn-sm(:href='"../course/" +cls.courseID',style='line-height:34px') 查看
        div.form-group
          label.control-label.col-sm-3.col-xs-4 所须课时:
          div.col-sm-8.col-xs-8
            p.form-control-static {{cls.cost}}
        div.form-group
          label.control-label.col-sm-3.col-xs-4 价格:
          div.col-sm-5.col-xs-8
            p.form-control-static {{cls.price | formatPrice}}元
    div.col-sm-6
      form.form-horizontal
        div.form-group(:class='{"has-error": errors.date}')
          label.control-label.col-sm-3.col-xs-4 开课日期:
          div.col-sm-8.col-md-6.col-xs-8(:title="errors.date")
            date-picker(v-model='cls.date',:config="{format:'lll',locale:'zh-CN',sideBySide: true}")
        div.form-group(:class='{"has-error": errors.age}')
          label.control-label.col-sm-3.col-xs-4 年龄:
          div.col-sm-8.col-md-6.col-xs-8(:title="errors.age")
            div.input-group
              input.form-control(type='number',min='0',v-model.number='age.min')
              div.input-group-addon 至
              input.form-control(type='number',min='0',v-model.number='age.max')
              div.input-group-addon 岁
        div.form-group(:class='{"has-error": errors.capacity}')
          label.control-label.col-sm-3.col-xs-4 最大人数:
          div.col-sm-4.col-xs-8(:title="errors.capacity")
            input.form-control(type='number',min='0',v-model.number='cls.capacity')
        div.form-group(:class='{"has-error": errors.mediaUrl}')
          label.control-label.col-sm-3.col-xs-4 图片地址:
          div.col-sm-9.col-xs-8(:title="errors.mediaUrl")
            div.input-group
              input.form-control(type='text',v-model.trim='cls.mediaUrl',placeholder='http://或https://开头')
              span.input-group-btn
                button.btn.btn-default(type="button",@click="isPreview=true") 预览
          div.col-sm-offset-3.col-sm-5.col-xs-offset-4.col-xs-8.mt-3(:src="cls.mediaUrl")
            img.img-rounded.img-responsive(v-show="isPreview",:src="cls.mediaUrl")
        div.form-group(:class='{"has-error": errors.description}')
          label.control-label.col-sm-3.col-xs-4 描述:
          div.col-sm-9.col-xs-8(:title="errors.description")
            textarea.form-control.has-3-rows(rows='3',placeholder='(选填) 添加课程描述信息,不超过256字',v-model.trim='cls.description')
  div.row
    div.col-sm-6
      form.form-horizontal
        div.form-group
          div.col-sm-offset-3.col-xs-offset-4.col-sm-8
            button.btn.btn-success(type='button',v-on:click='saveBasicInfo',:disabled='hasError') 保存
  div.page-header
    h3 预约
  form.form-horizontal
    div.form-group
      div.col-xs-2
        button.btn.btn-primary.btn-sm(type="button",:disabled='!cls._id',@click='$refs.memberSelectDlg.show()',style='margin-bottom:7px')
          span.glyphicon.glyphicon-plus 添加
      div.col-xs-10.col-sm-8.col-md-6
        ul.list-group(style='margin-bottom:0px')
          li.list-group-item(v-for="booking in bookings")
            div(style='display:flex')
              span.glyphicon.glyphicon-ok.text-success.me-3(v-if='booking.status=="checkin"',style='font-size:large')
              span.glyphicon.glyphicon-remove.text-danger.me-3(v-else-if='booking.status=="absent"',style='font-size:large')
              span.glyphicon.glyphicon-question-sign.text-default.me-3(v-else,style='font-size:large')
              //div(style='flex-grow:2') {{booking.userName}} <small>({{booking.quantity}}人)</small>
              a.ms-7(:href='"../member/" + booking.member') 
                i.glyphicon.glyphicon-user.me-3
                | {{booking.userName}}
              div.flex-grow-1
              button.btn.btn-danger.btn-xs.me-3(v-show='booking.status!=="absent"',type='button',@click='absent(booking.member)') 缺席
              button.btn.btn-success.btn-xs.me-3(v-show='booking.status!=="checkin"',type='button',@click='checkin(booking.member)') 签到
              //a.btn.btn-xs.btn-primary.me-3(:href='"../member/" + booking.member') 查看
              button.btn.btn-default.btn-xs(type='button',style='',@click='$refs.cancelReservationDlg.show(booking)') 取消
            p.small(style='color:#777;margin:5px 3px 0px;text-align:right') 于{{booking.bookDate | formatDate}}预约 <small>({{booking.quantity}}人)</small>
        small(style='color:#777') 共{{membersCount}}人
  div.page-header(v-if='feature=="book"')
    h3 绘本
  form.form-horizontal(v-if='feature=="book"')
    div.form-group
      div.col-xs-2
        button.btn.btn-primary.btn-sm(type="button",:disabled='!cls._id',@click='$refs.addBookDlg.show()',style='margin-bottom:7px')
          span.glyphicon.glyphicon-plus 添加
      div.col-xs-10.col-sm-8.col-md-6
        template(v-for="item in cls.books")
          div.media
            div.media-left
              span.glyphicon.glyphicon-book.text-primary(style='font-size:large;opacity:0.8')
            div.media-body
              h4.media-heading(style='font-size:small') {{item.title}}
              p.small(style='color:#777') {{item.info}} by {{getTeacherName(cls.teacher) || item.teacher || '未指定'}}
                span.badge(style='background-color:#d9534f;cursor:pointer;float:right;margin-right:16px',@click='$refs.deleteBookDlg.show(item)') 删除
        small(style='color:#777') 共{{booksCount}}本
  add-book-modal(ref='addBookDlg',@ok='addNewBook')
  member-select-modal(ref='memberSelectDlg',@ok='addReservation')
  message-alert(ref="messager")
  modal-dialog(ref='deleteBookDlg' buttonStyle="primary" buttons="confirm" @ok="removeBook") 确定删除绘本吗？
    template(v-slot:body="slotProps")
      p 从当前课程中删除绘本《{{ slotProps.param.title }}》
  modal-dialog(ref='cancelReservationDlg' buttonStyle="danger" buttons="confirm" @ok="cancelReservation") 确定取消学员预约吗？
    template(v-slot:body="slotProps")
      p 取消会员的预约，并且返还扣除的课时，不能在课程开始后取消
  modal-dialog(ref='deleteCourseClassDlg' buttonStyle="danger" buttons="confirm" @ok="cancelReservation") 确定删除班级中的课程吗？
    template(v-slot:body="slotProps")
      p 课程<strong>{{cls.name}}</strong>是固定班的课程<br/>请先查看班级，并从班级管理界面中删除相关课程
    template(v-slot:footer="slotProps")
      button.btn.btn-default(type="button" data-dismiss="modal") 取消
      a.btn.btn-primary(:href='"../course/" + cls.courseID') 查看班级
  modal-dialog(ref='deleteClassDlg' buttonStyle="danger" buttons="confirm" @ok="deleteClass") 确定删除课程吗？
    template(v-slot:body="slotProps")
      p 只能删除没有会员预约的课程，如果有预约，请先取消预约
</template>

<script>
/**
 * --------------------------------------------------------------------------
 * class-view.js display details of single class item
 * --------------------------------------------------------------------------
 */

var date_picker = require("../../components/date-picker.vue").default;
var teacher_service = require("../../services/teachers");
var class_service = require("../../services/classes");
var member_select_modal = require("../../components/member-select-modal.vue").default;
var add_book_modal = require("./add-book-modal.vue").default;
var messageAlert = require("../../components/message-alert.vue").default;
var modalDialog = require("../../components/modal-dialog.vue").default;
var serviceUtil = require("../../services/util");

module.exports = {
  name: "class-detail",
  props: {
    appData: String // the id of class object
  },
  data: function() {
    return {
      tenantConfig: {},
      types: [],
      cls: {
        books: [],
        booking: []
      },
      isPreview: false,
      quantity: 1,
      teachers: [],
      bookedMembers: [],
      feature: null
    };
  },
  components: {
    "date-picker": date_picker,
    "member-select-modal": member_select_modal,
    "add-book-modal": add_book_modal,
    "message-alert": messageAlert,
    "modal-dialog": modalDialog
  },
  computed: {
    classId() {
      return this.appData;
    },
    classrooms() {
      return this.tenantConfig.classrooms || [];
    },
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
      if (this.cls.mediaUrl) {
        try {
          // /^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\*\+,;=.]+$/.test(this.cls.mediaUrl);
          new URL(this.cls.mediaUrl);
        } catch (error) {
          errors.mediaUrl = "图片地址格式不对";
        }
      }
      if (this.cls.description && this.cls.description.length > 256)
        errors.description = "描述超过256个字";

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
    formatPrice: function(value) {
      return (value / 100) || 0;
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

      var urlObject;
      try {
        if (this.cls.mediaUrl) {
          urlObject = new URL(this.cls.mediaUrl);
        }
      } catch (error) {
        // igonre the error in Internet Explorer
      }

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
        },
        mediaUrl: urlObject && urlObject.href || "", // property 'href' is encoded URL
        description: this.cls.description
      });
      request.done((data, textStatus, jqXHR) => {
        this.$refs.messager.showSuccessMessage("课程基本资料更新成功");
        this.cls = Object.assign({}, data, {
          books: data.books || [],
          booking: data.booking || []
        });
      });
    },
    confirmDeleteClass() {
      if (this.cls.courseID) {
        this.$refs.deleteCourseClassDlg.show()
      } else {
        this.$refs.deleteClassDlg.show()
      }
    },
    deleteClass: function() {
      var request = class_service.removeClass(this.classId);
      request.done((data, textStatus, jqXHR) => {
        window.location.href = "../home";
      });
    },
    removeBook: function(item) {
      var request = class_service.deleteBook(this.classId, item);
      request.done((data, textStatus, jqXHR) => {
        this.cls.books = data.books || [];
      });
    },
    addReservation: function(selectedItems) {
      // reset the quantity of reservation
      if (this.quantity === "") this.quantity = 1;

      var vm = this;
      if (selectedItems.length == 0) {
        return this.$refs.messager.showErrorMessage("请选择会员");
      };

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
            classid: vm.classId,
            contact: value.contact,
            name: value.name,
            memberid: value._id,
            quantity: vm.quantity
          };
        });
        // add one member's reservation
        var request = class_service.addReservation(result[0], true);
        request.done(function(data, textStatus, jqXHR) {
          vm.bookedMembers.push({
            member: data["member"]._id,
            userName: data["member"].name
          });
          vm.cls.booking = data["class"].booking || [];
          vm.$refs.messager.showSuccessMessage("预约成功")
        });
      } else {
        this.$refs.messager.showWarningMessage("所选会员已经预约")
      }
    },
    cancelReservation: function(item) {
      var request = class_service.deleteReservation(this.classId, {
        memberid: item.member
      });
      request.done((data, textStatus, jqXHR) => {
        this.cls.booking = data.booking || [];
      });
    },
    addNewBook: function(newBook) {
      var request = class_service.addBooks(this.classId, newBook);
      request.done((data, textStatus, jqXHR) => {
        this.cls.books = data.books;
      });
    },
    checkin: function(memberid) {
      var request = class_service.checkin(this.classId, memberid);
      request.done((data, textStatus, jqXHR) => {
        this.cls.booking = data.booking || [];
      });
    },
    absent: function(memberid) {
      var request = class_service.absent(this.classId, memberid);
      request.done((data, textStatus, jqXHR) => {
        this.cls.booking = data.booking || [];
      });
    }
  },
  created: function() {
    var request = serviceUtil.getJSON("/api/setting/types");
    request.done((data, textStatus, jqXHR) => {
      this.types = data || [];
    });
    // Load all teachers for selection
    var vm = this;
    var request = teacher_service.getAll({ status: "active" });
    request.done(function(data, textStatus, jqXHR) {
      var all = data || [];
      // all the unassigned option with null as id
      all.push({ name: "<未指定>", _id: null });
      vm.teachers = all;
    });
    this.tenantConfig = _getTenantConfig();
    this.feature = this.tenantConfig.feature;

    // load class object
    if (this.classId) {
      var request = class_service.getClass(this.classId);
      request.done((data, textStatus, jqXHR) => {
        // clone the returned data, ensure property "books" and "booking" existed
        if (data) {
          this.cls = Object.assign({}, data, {
            books: data.books || [],
            booking: data.booking || []
          })
        }
      });
    }
  },
  mounted: function() {
    // set message for global usage
    Vue.prototype.$messager = this.$refs.messager;
    // 'this' is refer to vm instance
    var vm = this;
    // load class reservations
    if (this.classId) {
      var request = class_service.getReservations(this.classId);
      request.done(function(data, textStatus, jqXHR) {
        vm.bookedMembers = data || [];
      });
    } else {
      this.$refs.messager.showErrorMessage("查看的课程不存在");
    }
  }
};
</script>

<style lang='less'>
.container .page-header {
  margin: 15px 0;
  padding-bottom: 3px;
}

.col-sm-6 .form-horizontal .control-label {
  padding-top: 7px;
  padding-right: 0;
  margin-bottom: 0;
  text-align: right;
}
</style>
