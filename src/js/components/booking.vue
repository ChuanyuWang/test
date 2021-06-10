<template lang="pug">
div
  div#topbar.container(style='padding-left:7px;padding-right:7px')
    div.row(style='margin-left:-7px;margin-right:-7px')
      img.center-block(:src='tenantConfig.logoPath',style="padding:0px;width:200px")
    div.row(style='margin:7px -7px 3px -7px')
      div.btn-group(style='float:left;padding-left:9px')
        button.btn.btn-default.btn-xs(:disabled='loading',@click='updateSchedule(-7)') 上一周
        button.btn.btn-default.btn-xs(:disabled='loading',@click='updateSchedule("today")') 本周
        button.btn.btn-default.btn-xs(:disabled='loading',@click='updateSchedule(7)') 下一周
      div(style='float:right;padding-right:9px')
        a.btn.btn-success.btn-xs(href='mybooking') 我的课程
  div#main.container(style='padding-left:7px;padding-right:7px;overflow-y:auto;height:100%')
    template(v-if='classesByDay.length === 0')
      div.class-separator
      div.alert.alert-warning(role='alert',style='margin-top:7px')
        strong 提示：
        | 本周没有课程，请查看下一周
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
                span.cls-free(v-else) 公益活动
                |  {{item.age | ageFormatter}}
            div.book-col
              button.btn.btn-danger.book-btn(v-if='remainingClass(item) === 0') 已满
              button.btn.btn-primary.book-btn(v-else,@click='showBookDlg(item, $event)') 预约
              button.btn.btn-primary.remain-btn(disabled) 剩余
                span.badge.remain-span {{remainingClass(item)}}
  modal-dialog(ref='bookDlg',size="small",buttonStyle="success",buttons="confirm",:hasError="hasError",@ok="addNewBook(bookItem)") 预约课程
    template(v-slot:body)
      form.form-horizontal
        div.form-group.form-group-sm(style='margin-bottom:9px')
          label.control-label-sm.col-xs-3 时间:
          div.col-xs-9
            p.form-control-static {{bookItem.date | dateTimeFormatter}}
        div.form-group.form-group-sm
          label.control-label-sm.col-xs-3 内容:
          div.col-xs-9
            p.form-control-static(style='height:auto') {{bookItem.content}}
        div.form-group.form-group-sm(:class='{"has-error": errors.name}')
          label.control-label-sm.col-xs-3 宝宝姓名:
          div.col-xs-9
            input.form-control(type='text',placeholder='宝宝注册时用的名称',v-model='bookItem.name')
        div.form-group.form-group-sm(:class='{"has-error": errors.contact}')
          label.control-label-sm.col-xs-3 联系方式:
          div.col-xs-9
            input.form-control(type='tel',placeholder='135xxx',v-model='bookItem.contact')
        div.form-group.form-group-sm(:class='{"has-error": errors.quantity}')
          label.control-label-sm.col-xs-3 人数:
          div.col-xs-4
            input.form-control(type='number',min='1',step='1',v-model='bookItem.quantity')
    template(v-slot:action) 预约
  modal-dialog(ref='errorDlg',size="small",buttonStyle="danger") 预约失败
    template(v-slot:body)
      p {{errorMessage}}
      p(style='color:#808080')
        small 客服电话: 
          a(:href='tenantConfig.contact | tel') {{tenantConfig.contact}}
        br
        small 门店地址: 
          a(:href='tenantConfig.addressLink') {{tenantConfig.address}}
  modal-dialog(ref='successDlg',size="small",buttonStyle="success") 预约成功
    template(v-slot:body)
      p(v-html='successMessage')
      p(style='color:#808080')
        small 客服电话: 
          a(:href='tenantConfig.contact | tel') {{tenantConfig.contact}}
        br
        small 门店地址: 
          a(:href='tenantConfig.addressLink') {{tenantConfig.address}}
</template>

<script>
/**
 * --------------------------------------------------------------------------
 * booking page
 * --------------------------------------------------------------------------
 */

var common = require("../common");
var class_service = require("../services/classes");
var modalDialog = require("./modal-dialog.vue").default;

module.exports = {
  name: "booking-app",
  props: {},
  data: function() {
    return {
      tenantName: common.getTenantName(),
      tenantConfig: {},
      loading: false,
      errorMessage: "",
      successMessage: "",
      items: [],
      // the Monday of query week
      currentMonday: this.getMonday(moment()),
      classroomID: null,
      minimumAge: null,
      bookItem: {
        quantity: 1,
        date: null,
        content: "",
        name: "",
        contact: "",
        classid: null
      }
    };
  },
  components: {
    "modal-dialog": modalDialog
  },
  computed: {
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
      if (!this.bookItem.name || this.bookItem.name.length === 0)
        errors.name = '姓名不能为空';
      if (!this.bookItem.contact || this.bookItem.contact.length === 0)
        errors.contact = '联系方式不能为空';
      var quantity = parseInt(this.bookItem.quantity);
      if (isNaN(quantity) || quantity <= 0)
        errors.quantity = '人数不能小于1';
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
    },
    dateTimeFormatter(value) {
      return moment(value).format('MMMDoah:mm');
    },
    ageFormatter(value) {
      var age = value || {};
      var min = age.min ? Math.round(age.min / 12 * 10) / 10 : null;
      var max = age.max ? Math.round(age.max / 12 * 10) / 10 : null;
      if (min && max) {
        return "年龄" + min + "至" + max + "岁";
      } else if (min) {
        return "年龄大于" + min + "岁";
      } else if (max) {
        return "年龄小于" + max + "岁";
      }
      return "";
    }
  },
  methods: {
    updateSchedule(delta) {
      var vue = this;
      this.loading = true;
      this.item = [];
      if (delta === 'today') {
        this.currentMonday = this.getMonday(moment());
      } else {
        this.currentMonday.add(delta || 0, 'day');
      }
      var begin = moment(this.currentMonday);
      var end = moment(this.currentMonday).add(7, 'days');

      var request = class_service.getClasses({
        from: begin.toISOString(),
        to: end.toISOString(),
        classroom: this.publicClassrooms() || undefined, // 'undefined' field will not append to the URL
        tenant: common.getTenantName(),
        minAge: this.minimumAge || undefined // 'undefined' field will not append to the URL
      });
      request.done(function(data, textStatus, jqXHR) {
        vue.items = data || [];
        //scrollToToday();
        vue.$nextTick(function() {
          var divs = $("#main div.notStartedDay");
          if (divs.length > 0) {
            divs[0].scrollIntoView({ behavior: "smooth" });
          }
        });
      });
      request.fail(function(jqXHR, textStatus, errorThrown) {
        console.error(jqXHR.responseText);
      });
      request.always(function(data, textStatus, jqXHR) {
        vue.loading = false;
      });
    },
    addNewBook(bookInfo) {
      var vue = this;
      try {
        localStorage._name = bookInfo.name;
        localStorage._contact = bookInfo.contact;
      } catch (oException) {
        if (oException.name == 'QuotaExceededError') {
          console.error('超出本地存储限额！');
          //clear the local storage
          localStorage.clear();
        }
      }
      var request = class_service.addReservation({
        classid: bookInfo.classid,
        name: bookInfo.name,
        contact: bookInfo.contact,
        quantity: parseInt(bookInfo.quantity)
      });

      request.done(function(data, textStatus, jqXHR) {
        var classInfo = data['class'];
        // update booking data
        vue.items.some(function(value, index, array) {
          if (value._id === classInfo._id) {
            value.booking = classInfo.booking;
            return true;
          }
        });
        vue.updateSuccessMessage(data['member'], classInfo);
        vue.$refs.successDlg.show();
        // send a message to user through weixin
        if (window._openid) {
          var tenant = common.getTenantName();
          var msg = {
            openid: _openid,
            message: "您已预约" + moment(classInfo.date).format('MMMDoah:mm')
              + "的课程，请准时参加。\n您还剩余" + credit + "课时",
            tenant: tenant
          };
          $.ajax("/api/sendNotification", {
            type: "POST",
            contentType: "application/json; charset=utf-8",
            data: JSON.stringify(msg),
            success: function(data) {
              //TODO
            },
            error: function(jqXHR, status, err) {
              console.error(jqXHR.responseJSON ? jqXHR.responseJSON.message : jqXHR.responseText);
            },
            dataType: "json"
          });
        }
      });
      request.fail(function(jqXHR, textStatus, errorThrown) {
        //console.error(jqXHR.responseJSON ? jqXHR.responseJSON.message : jqXHR.responseText);
        vue.errorMessage = jqXHR.responseJSON ? jqXHR.responseJSON.message : jqXHR.responseText;
        vue.$refs.errorDlg.show();
      });
    },
    updateSuccessMessage(member, classInfo) {
      var message = "您已预约" + moment(classInfo.date).format('MMMDoah:mm') + "活动，请准时参加";
      //TODO, support multi membership card
      var credit = 0;
      if (member.membership && member.membership.length > 0) {
        credit = Math.round(member.membership[0].credit * 10) / 10;
        message += '<br>您还剩余' + credit + '课时';
      }
      if (member.membership && member.membership.length > 0) {
        message += '，有效期至' + moment(member.membership[0].expire).format('ll');
      }
      this.successMessage = message;
    },
    showBookDlg(item, event) {
      if (!item) {
        alert("网络异常，请刷新重试");
        event.preventDefault();
        console.error("Can't get the class or event item with id %s", item_id);
        return;
      }
      this.bookItem.classid = item._id;
      this.bookItem.date = item.date;
      this.bookItem.content = item.name;
      this.bookItem.name = localStorage._name;
      this.bookItem.contact = localStorage._contact;
      this.$refs.bookDlg.show();
    },
    getMonday(date) {
      var _date = moment(date);
      var dayofweek = _date.day();
      // the Monday of this week
      if (dayofweek == 0) { // today is Sunday
        _date.day(-6);
      } else {
        _date.day(1);
      }
      //set the time to the very beginning of day
      _date.hours(0).minutes(0).seconds(0).milliseconds(0);
      return _date;
    },
    remainingClass(cls) {
      return common.classRemaining(cls);
    },
    publicClassrooms() {
      if (this.tenantConfig && this.tenantConfig.classrooms) {
        var publicRooms = [];
        this.tenantConfig.classrooms.forEach(function(value) {
          if (value.visibility !== "internal") {
            publicRooms.push(value.id);
          }
        })
        return publicRooms.join(",");
      }
    }
  },
  created: function() {
    this.tenantConfig = _getTenantConfig();
  },
  mounted: function() {
    this.updateSchedule("today");
  },
  updated: function() {
    // set the height of #main div to enable div scroll bar instead of body scroll bar
    $('#main').height(window.innerHeight - $('#topbar').height() - 2);
  }
};
</script>

<style lang="less">
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
  .book-btn {
    .finish-btn;
    padding-bottom: 3px;
    border-bottom-left-radius: 0px;
    border-bottom-right-radius: 0px;
  }
  .remain-btn {
    font-size: 12px;
    float: right;
    padding: 0px;
    width: 54px;
    background-color: #f0ad4e !important;
    border-top-left-radius: 0px;
    border-top-right-radius: 0px;
    opacity: 1 !important; // remain button is disabled by default, keep the opacity as 1 for better visual
    .remain-span {
      padding: 2px;
      margin-left: 1px;
      color: #f0ad4e !important;
    }
  }
}

.cls-tip {
  color: #808080;
  font-size: 12px;
}
</style>