<template lang="pug">
div.container(style='padding-left:7px;padding-right:7px')
  form.form-horizontal(style='margin-top:15px;padding-left:8px;padding-right:8px',v-show='!user._id')
    div.form-group.form-group-sm
      div.col-xs-12(style='color:#808080;text-align:center') 请输入小朋友姓名和联系方式查看阅读过的绘本
    div.form-group.form-group-sm(:class='{"has-error": errors.name}')
      label.control-label-sm.col-xs-3(for='cls_name') 小朋友姓名:
      div.col-xs-9
        input.form-control(type='text',placeholder='小朋友注册时用的姓名',name='name',v-model='name')
    div.form-group.form-group-sm(:class='{"has-error": errors.contact}')
      label.control-label-sm.col-xs-3(for='cls_name') 联系方式:
      div.col-xs-9
        input.form-control(type='tel',placeholder='135xxx',name='contact',v-model='contact')
    div.form-group
      div.col-xs-offset-3.col-xs-9
        button.btn.btn-primary(type='button',@click='handleLoginOK',:disabled='hasError') 登录
  div#user_info.row(style='margin:7px -7px 3px -7px',v-show='user.name')
    p.pull-left.col-xs-10 <b>{{user.name}}</b>小朋友

  div#content(v-show='user._id')
    table.table.table-condensed.table-striped(style='margin-bottom:7px')
      thead
        tr
          th(style='min-width:85px') 日期
          th 上课绘本
          th(style='min-width:40px') 老师
      tbody
        tr(v-for="(item, i) in books" :key="i")
          td {{item.date | dateFilter}}
          td {{item.title}}
          td {{item.teacher}}
    p.small 阅读绘本共: <strong>{{books.length}}</strong>册
  div.alert.alert-warning(role='alert',style='margin-top:7px',v-show='user._id && books.length === 0') <strong>提示: </strong>没有找到绘本
  modal-dialog(ref='errorDlg',size="small",buttonStyle="danger") 登录失败
    template(v-slot:body)
      p {{errorMessage}}
      p(style='color:#808080')
        small {{$t('support_contact')}}:
          a(:href='tenantConfig.contact | tel') {{tenantConfig.contact}}
        br
        small {{$t('org_address')}}:
          a(:href='tenantConfig.addressLink') {{tenantConfig.address}}
</template>

<script>
/**
 * --------------------------------------------------------------------------
 * administrator cockpit page include all the admin features, e.g. create tenant and user
 * --------------------------------------------------------------------------
 */

var common = require("../../common/common");
var teachersService = require("../../services/teachers");
var modalDialog = require("../../components/modal-dialog.vue").default;

module.exports = {
  name: "my-read-books",
  props: {},
  data: function() {
    return {
      tenantConfig: {},
      name: "",
      contact: "",
      user: {
        _id: null,
        name: ""
      },
      errorMessage: "",
      classes: [],
      teachers: {} // Map {"id": "name"}
    };
  },
  watch: {},
  components: {
    "modal-dialog": modalDialog
  },
  computed: {
    hasData: function() {
      return !jQuery.isEmptyObject(this.selectedTenant);
    },
    errors: function() {
      var errors = {};
      if (!this.name) errors.name = "名字不能为空";
      if (!this.contact) errors.contact = "联系方式不能为空";
      return errors;
    },
    hasError: function() {
      var errors = this.errors;
      return Object.keys(errors).some(function(key) {
        return true;
      });
    },
    books: function() {
      var allBooks = [];
      for (var i = 0; i < (this.classes && this.classes.length); i++) {
        var books = this.classes[i].books || [];
        for (var j = 0; j < books.length; j++) {
          // append the date field to each book
          books[j].date = this.classes[i].date;
          // display the teacher of class, fallback 'book.teacher' if not defined
          books[j].teacher = this.getTeacherName(this.classes[i].teacher) || books[j].teacher;
          allBooks.push(books[j]);
        }
      }

      return allBooks;
    }
  },
  filters: {
    tel(contact) {
      // Remove the non-digit character from tel string, e.g. 136-6166-6616 -> 13664666616
      // And append prefix "tel:"
      return "tel:" + (contact && contact.replace(/\D/g, ''));
    },
    dateFilter: function(value) {
      if (!value) return "";
      return moment(value).format('l');
    }
  },
  methods: {
    getTeacherName: function(teacherID) {
      if (!teacherID) return "";
      else return this.teachers[teacherID] || "未找到";
    },
    showMyBooks: function() {
      var vm = this;
      var query = {
        memberid: memberid,
        from: moment(0).toISOString(),
        to: moment().add(1, 'years').toISOString(),
        order: 'desc',
        tenant: common.getTenantName(),
        hasBooks: true
      };
      var request = $.ajax("/api/classes", {
        type: "GET",
        //contentType : "application/x-www-form-urlencoded; charset=UTF-8",
        data: query,
        dataType: "json"
      });

      request.fail(function(jqXHR, textStatus, errorThrown) {
        // handle login error
        console.error(jqXHR.responseJSON ? jqXHR.responseJSON.message : jqXHR.responseText);
      });
      request.done(function(data, textStatus, jqXHR) {
        vm.classes = data || [];
      });
    },
    handleLoginOK: function(event) {
      // validate the input
      var userInfo = {
        tenant: common.getTenantName(),
        name: this.name,
        contact: this.contact
      };

      var vm = this;
      var request = $.ajax("/api/members/validate", {
        type: "POST",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(userInfo),
        dataType: "json"
      });
      request.fail(function(jqXHR, textStatus, errorThrown) {
        // handle login error
        console.error(jqXHR.responseJSON ? jqXHR.responseJSON.message : jqXHR.responseText);
      });
      request.done(function(data, textStatus, jqXHR) {
        if (data) {
          try {
            // cache the member id in global variable before access localStorage
            localStorage._memberid = memberid = data._id;
            localStorage._name = data.name;
            localStorage._contact = data.contact;
          } catch (oException) {
            if (oException.name == 'QuotaExceededError') {
              console.error('超出本地存储限额！');
              //clear the local storage
              localStorage.clear();
            }
          }
          vm.user._id = data._id;
          vm.user.name = data.name;

          vm.showMyBooks();
        } else {
          // handle login fail, show error dialog
          vm.errorMessage = '没有找到会员信息，请核对您的姓名和联系方式，如有问题请联系客服';
          vm.$refs.errorDlg.show();
        }
      });
    }
  },
  created: function() {
    var vm = this;

    this.tenantConfig = _getTenantConfig();

    var request = teachersService.getAll({
      tenant: common.getTenantName()
    });
    request.done(function(data, textStatus, jqXHR) {
      if (data && data.length > 0) {
        data.forEach(function(value, index, array) {
          vm.teachers[value._id] = value.name;
        });
      }
    });

    // initialize the default value from local storage
    this.name = localStorage._name;
    this.contact = localStorage._contact;
  },
  mounted: function() {
    //var vm = this;
  }
};
</script>

<style lang='less'>
</style>
