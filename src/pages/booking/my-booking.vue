<template lang="pug">
div
  div.container(style='padding-left:7px;padding-right:7px')
    div.row(style='margin-left:-7px;margin-right:-7px')
      img.center-block.img-responsive(:src='tenantConfig.logoPath',style="padding:0px;width:200px")
    form.form-horizontal(style='margin-top:15px;display:none;padding-left:8px;padding-right:8px',role='form',v-show='!user._id')
      div.form-group.form-group-sm
        div.col-xs-12(style='color:#808080;text-align:center') 请输入学员姓名和联系方式查看已预约课程
      div.form-group.form-group-sm(:class='{"has-error": errors.name}')
        label.control-label-sm.col-xs-3(for='cls_name') 学员姓名:
        div.col-xs-9
          input.form-control(type='text',placeholder='注册时的学员姓名',v-model.trim='name')
      div.form-group.form-group-sm(:class='{"has-error": errors.contact}')
        label.control-label-sm.col-xs-3(for='cls_name') 联系方式:
        div.col-xs-9
          input.form-control(type='tel',placeholder='135xxx',v-model.trim='contact')
      div.form-group
        div.col-xs-offset-3.col-xs-9
          button.btn.btn-primary(type='button',@click='login',:disabled='hasError') 查看预约
    div(v-show='user._id')
      div.row(style='margin:7px -7px 3px -7px')
        p.pull-left.col-xs-10 你好, 
          b {{user.name}}
          |小朋友<br>
          small(style='color:#808080') 已预约课程共{{notStartedCredit}}课时
          small(style='color:#808080' v-if="user.contracts.length > 0") , 未使用课时包括: {{remainingCredit}}
        div.col-xs-2(style='padding-right:9px')
          button.btn.btn-danger.btn-xs.pull-right(@click='logoff') 注销
      ul.nav.nav-tabs(role='tablist')
        li(role='presentation',:class='{active:!showHistory}')
          a.btn-xs(href="#future",role='tab',data-toggle='tab',style='padding:3px 7px',@click='updateSchedule(false)') 预约课程
        li(role='presentation',:class='{active:showHistory}')
          a.btn-xs(href="#history",role='tab',data-toggle='tab',style='padding:3px 7px',@click='updateSchedule(true)') 历史课程
      div.tab-content
        div.tab-pane.active(role="tabpanel",id="all")
          template(v-if='classesByDay.length === 0')
            div.class-separator
            div.alert.alert-warning(role='alert',style='margin-top:7px')
              strong 提示：
              | 没有预约课程
          template(v-for="day in classesByDay")
            div.class-separator(:class='{notStartedDay: day.notStarted}')
            div.row.class-row
              div.col-xs-2.date-col {{day.date | dateFormatter}}
                br
                small {{day.date | weekFormatter}}
              div.col-xs-10.content-col
                div(v-for="item in day.classes")
                  div.cls-col
                    p {{item.name}}
                    p.cls-tip
                      span.glyphicon.glyphicon-time
                      | {{item.date | timeFormatter}} 
                      template(v-if='item.cost > 0')
                        span.glyphicon.glyphicon-bell
                        | {{item.cost}}课时
                      span.cls-free(v-else) 免费课程
                      |  {{getClassroomName(item.classroom)}}
                  div.book-col
                    template(v-if='isCompletedClass(item)')
                      p.cls-status.text-danger(v-if='isAbsent(item)') (缺席)
                      p.cls-status.text-info(v-else) (已上)
                    template(v-else)
                      button.btn.btn-danger.cancel-btn(@click='showCancelDialog(item)') 取消
                      p.cls-status.text-danger (未上)
  modal-dialog(ref='errorDlg',size="small",buttonStyle="danger") {{errorTitle}}
    template(v-slot:body)
      p {{errorMessage}}
      p(style='color:#808080')
        small {{$t('support_contact')}}:
          a(:href='tenantConfig.contact | tel') {{tenantConfig.contact}}
        br
        small {{$t('org_address')}}:
          a(:href='tenantConfig.addressLink') {{tenantConfig.address}}
  modal-dialog(ref='cancelDlg',size="small",buttonStyle="danger",buttons='confirm',@ok='cancelBooking') 取消预约
    template(v-slot:body)
      p 确定取消选中的课程吗？
</template>

<script>
/**
 * --------------------------------------------------------------------------
 * booking page
 * --------------------------------------------------------------------------
 */

import common from "../../common/common";
import class_service from "../../services/classes";
import serviceUtil from "../../services/util";
import modalDialog from "../../components/modal-dialog.vue";

export default {
  name: "booking-app",
  props: {},
  data: function() {
    return {
      name: "",
      contact: "",
      notStartedCredit: 0,
      user: {
        _id: 0,
        name: "",
        contact: "",
        membership: [],
        contracts: []
      },
      tenantName: common.getTenantName(),
      tenantConfig: {},
      types: [],
      loading: false,
      errorTitle: "",
      errorMessage: "",
      showHistory: false,
      items: []
    };
  },
  components: {
    "modal-dialog": modalDialog
  },
  computed: {
    remainingCredit() {
      return this.user.contracts.map(value => {
        var remaining = value.credit - value.expendedCredit - value.consumedCredit;
        // A better way of 'toFixed(1)'
        remaining = Math.round(remaining * 10) / 10;
        var typeName = this.getTypeName(value.goods);
        return `${typeName}${remaining}课时`;
      }).join(", ");
    },
    classesByDay() {
      var today = moment(0, "HH"); // today, 00:00:00.000
      var results = [];
      this.items.forEach(function(value, index, array) {
        //var date = moment(value.date).format('M/D');
        if (results.length > 0) {
          var last = results[results.length - 1];
          if (moment(last.date).isSame(value.date, "day")) {
            last.classes.push(value);
            return;
          }
        }
        var dayClasses = {
          date: value.date,
          classes: [value]
        };
        if (today.isBefore(moment(value.date))) {
          dayClasses.notStarted = true;
        }
        results.push(dayClasses);
      });
      return results;
    },
    errors: function() {
      var errors = {};
      var phone = /^1(3[0-9]|4[01456879]|5[0-35-9]|6[2567]|7[0-8]|8[0-9]|9[0-35-9])\d{8}$/;
      if (!this.name || this.name.length === 0)
        errors.name = '姓名不能为空';
      if (!this.contact || this.contact.length === 0) {
        errors.contact = '联系方式不能为空';
      } else if (!phone.test(this.contact)) {
        // TBD phone error
        //errors.phone = '手机号格式错误';
      }
      return errors;
    },
    hasError: function() {
      var errors = this.errors;
      return Object.keys(errors).some(function(key) {
        return true;
      })
    }
  },
  filters: {
    tel(contact) {
      // Remove the non-digit character from tel string, e.g. 136-6166-6616 -> 13664666616
      // And append prefix "tel:"
      return "tel:" + (contact && contact.replace(/\D/g, ''));
    },
    dateFormatter(value) {
      return moment(value).format('M/D');
    },
    weekFormatter(value) {
      return moment(value).format('ddd');
    },
    timeFormatter(value) {
      return moment(value).format('HH:mm');
    }
  },
  methods: {
    login() {
      if (this.hasError) return;

      var vm = this;
      // validate the input
      var userInfo = {
        tenant: common.getTenantName(),
        name: this.name,
        contact: this.contact
      };

      //TODO, move below call to members service
      var request = serviceUtil.postJSON("/api/members/validate", userInfo);
      request.done(function(data, textStatus, jqXHR) {
        if (!data) {
          // handle login fail
          vm.errorTitle = '登录失败';
          vm.errorMessage = '没有找到学员信息，请核对您的姓名和联系方式，如有问题请联系客服';
          vm.$refs.errorDlg.show();
          return;
        }

        vm.user = data;
        vm.updateSchedule(false);
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
      });
    },
    logoff() {
      this.user._id = null;
      this.user.name = "";
      this.user.contact = "";
      this.items = [];
    },
    queryContracts() {

    },
    updateSchedule(showHistory) {
      var vm = this;
      this.loading = true;
      this.showHistory = showHistory;
      this.item = [];

      var query = {
        memberid: this.user._id,
        tenant: common.getTenantName()
      }

      if (showHistory) {
        query.from = moment(0).toISOString();
        query.to = moment().toISOString();
        query.order = 'desc';
      } else { // show the booking in one year
        query.from = moment().toISOString();
        query.to = moment().add(1, 'years').toISOString();
      }

      var request = class_service.getClasses(query);
      request.done(function(data, textStatus, jqXHR) {
        vm.items = data || [];
        // TODO, get the summary info via additional query
        if (!showHistory) {
          vm.sumNotStartedCredit();
        }
      });
      request.fail(function(jqXHR, textStatus, errorThrown) {
        console.error(jqXHR.responseJSON ? jqXHR.responseJSON.message : jqXHR.responseText);
      });
      request.always(function(data, textStatus, jqXHR) {
        vm.loading = false;
      });
    },
    showCancelDialog(item) {
      // don't allow member to cancel the booking if it's less than 24 hours before begin
      if (moment() > moment(item.date).subtract(24, 'hours')) {
        this.errorTitle = '取消失败';
        this.errorMessage = '不能在课程开始前24小时取消预约，如有问题请联系客服';
        this.$refs.errorDlg.show();
        return;
      }
      this.$refs.cancelDlg.show(item);
    },
    cancelBooking(item) {
      var vm = this;
      var request = $.ajax("/api/booking/" + item._id, {
        type: "DELETE",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify({ memberid: vm.user._id, tenant: common.getTenantName() }),
        dataType: "json"
      });
      request.done(function(data, textStatus, jqXHR) {
        if (!data) return;
        for (var i = 0; i < vm.items.length; i++) {
          if (vm.items[i]._id === data._id) {
            vm.items.splice(i, 1);
            break;
          }
        }
        // TODO, update the remaining credit
      });
      request.fail(function(jqXHR, textStatus, errorThrown) {
        console.error(jqXHR.responseJSON ? jqXHR.responseJSON.message : jqXHR.responseText);
        vm.errorTitle = '取消失败';
        vm.errorMessage = jqXHR.responseJSON ? jqXHR.responseJSON.message : jqXHR.responseText;
        vm.$refs.errorDlg.show();
      });
      request.always(function(data, textStatus, jqXHR) {
        //vm.loading = false;
      });
    },
    sumNotStartedCredit() {
      var now = moment();
      var total = 0;
      this.items.forEach(function(value) {
        if (moment(value.date).isAfter(now)) {
          total += value.cost || 0;
        }
      })
      // A better way of 'toFixed(1)'
      this.notStartedCredit = Math.round(total * 10) / 10;
    },
    isAbsent(item) {
      var bookings = item && item.booking || [];
      for (var i = 0; i < bookings.length; i++) {
        if (bookings[i].member === this.user._id) {
          return bookings[i].status === 'absent';
        }
      }
      return false;
    },
    isCompletedClass(cls) {
      return moment().isAfter(moment(cls.date).subtract(1, 'hours'));
    },
    getClassroomName(value) {
      var roomList = this.tenantConfig && this.tenantConfig.classrooms || [];
      for (var i = 0; i < roomList.length; i++) {
        if (value == roomList[i].id) {
          return roomList[i].name;
        }
      }
      return value;
    },
    getTypeName(typeId) {
      var item = this.types.find(value => {
        return value.id === typeId;
      });
      return item && item.name || "未指定类型";
    }
  },
  created: function() {
    this.tenantConfig = _getTenantConfig();
    this.types = this.tenantConfig && this.tenantConfig.types || [];
    this.name = localStorage._name;
    this.contact = localStorage._contact;
  },
  mounted: function() { }
};
</script>

<style lang="less" scoped>
.class-row {
  margin-left: -7px;
  margin-right: -7px;
}

.date-col {
  padding-left: 9px;
  padding-right: 0px;
  padding-top: 2px;
  color: #2b2b2b;
  font-size: 18px;
  min-width: 50px;
  text-align: center;
  line-height: 1;

  small {
    font-size: 12px;
    color: #808080;
  }
}

.content-col {
  padding-left: 7px;
  padding-right: 9px;
}

.cls-col {
  float: left;
  width: 80%;
  min-height: 60px;
}

.book-col {
  float: right;
  width: 20%;
  max-width: 60px;

  .finish-btn {
    float: right;
    margin-top: 3px;
  }

  .cancel-btn {
    .finish-btn;
    opacity: 0.5;
  }

  .cls-status {
    text-align: center;
    font-weight: bold;
    margin-bottom: auto;
  }
}

.cls-tip {
  color: #808080;
  font-size: 12px;
}
</style>
