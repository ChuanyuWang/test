<template lang="pug">
modal-dialog(ref="dialog",size="small") 确认订单信息
  template(v-slot:body)
    div.alert.alert-warning(v-if="warningMessage",role="alert",style='padding:7px;margin-bottom:15px') {{warningMessage}}
    div.panel.panel-default(style='margin:-7px -7px 15px -7px')
      div.panel-body(style='padding:7px')
        form.form-horizontal.form-condensed
          h3(style='margin-top:0px;text-align:center') {{bookItem.content}}
          div.form-group.form-group-sm
            label.control-label-sm.col-xs-2 时间:
            div.col-xs-10
              p.form-control-static {{bookItem.date | dateTimeFormatter}}
          div.form-group.form-group-sm(v-show='address')
            label.control-label-sm.col-xs-2 地点:
            div.col-xs-10
              p.form-control-static {{address}}
    div.panel.panel-default(style='margin:-7px -7px 15px -7px')
      div.panel-body(style='padding:7px')
        form.form-horizontal.form-condensed
          div.form-group.form-group-sm
            label.control-label-sm.col-xs-2 姓名:
            div.col-xs-10
              p.form-control-static {{bookItem.name}}
          div.form-group.form-group-sm
            label.control-label-sm.col-xs-2 电话:
            div.col-xs-10
              p.form-control-static {{bookItem.contact}}
          div.form-group.form-group-sm
            label.control-label-sm.col-xs-2 人数:
            div.col-xs-10
              p.form-control-static {{bookItem.quantity}}人
          div.form-group.form-group-sm
            label.control-label-sm.col-xs-2 价格:
            div.col-xs-10
              p.form-control-static
                strong {{bookItem.price/100}}元
    div.panel.panel-default(style='margin:-7px -7px 0px -7px')
      div.panel-body(style='padding:7px 7px 7px 20px')
        label 退课须知:
        p 距离开课时间大于24小时取消预约, 支持全额退款;<br>
          |距离开课时间不满24小时取消预约, 不支持退款。
  template(v-slot:footer)
    div.alert.alert-danger.text-center(v-if="errorMessage",role="alert",style='padding:3px;margin:-7px 0px 3px 0px') {{errorMessage}}
    div.btn-group.btn-group-lg.btn-group-justified(role="group",style="background-color:#eee")
      template(v-if='status!="success"')
        div.btn 待支付  
          strong {{total}}元
        div.btn(style="text-align:right",data-dismiss="modal")
          small {{ $t('dialog_cancel') }}
        div.btn-group.btn-group-lg(role="group")
          button.btn.btn-success(type="button",@click="pay",:disabled="disablePayButton") 微信支付
      template(v-else)
        div.btn.btn-success 支付成功
        div.btn(style="text-align:right",data-dismiss="modal")
          small 返回
        div.btn-group.btn-group-lg(role="group")
          button.btn.btn-primary(type="button",@click="openMyBooking") 我的预约
</template>
<script>
var modalDialog = require("../../components/modal-dialog.vue").default;
var common = require("../../common/common");
var orders_service = require("../../services/orders");

module.exports = {
  name: "pay-modal",
  props: {
    bookItem: Object,
    openid: String
  },
  data: function() {
    var config = common.getTenantConfig();
    return {
      address: config.address || "",
      warningMessage: "",
      errorMessage: "",
      status: "open", // open|paying|success|error
      payParams: {},
      WeixinJSBridgeReady: false,
      order: {}
    };
  },
  components: {
    "modal-dialog": modalDialog
  },
  computed: {
    total() {
      return this.bookItem.price / 100 * this.bookItem.quantity;
    },
    disablePayButton() {
      return !this.WeixinJSBridgeReady || this.status == "paying" || !this.openid;
    }
  },
  filters: {
    dateTimeFormatter(value) {
      return moment(value).format('MMMDoah:mm'); //TODO, weekday, e.g. Thursday
    },
  },
  methods: {
    onBridgeReady() {
      this.WeixinJSBridgeReady = true;
      this.errorMessage = "";
    },
    show(warning) {
      this.warningMessage = warning;
      var ua = navigator.userAgent.toLowerCase();
      if (ua.indexOf('micromessenger') < 0) {
        this.errorMessage = "请在微信中打开";
      } else if (typeof WeixinJSBridge == "undefined") {
        // we are within wechat, but WeixinJSBridge object is not fully loaded
        this.WeixinJSBridgeReady = false;
        this.errorMessage = "微信支付加载中...";
        if (document.addEventListener) {
          document.addEventListener('WeixinJSBridgeReady', this.onBridgeReady, false);
        } else if (document.attachEvent) {
          document.attachEvent('WeixinJSBridgeReady', this.onBridgeReady);
          document.attachEvent('onWeixinJSBridgeReady', this.onBridgeReady);
        }
      } else {
        // we are within wechat, everything is ok
        this.WeixinJSBridgeReady = true;
      }

      this.$refs.dialog.show();
    },
    pay() {
      var vm = this;
      this.status = "paying";
      var request = orders_service.add({
        "tenant": common.getTenantName(),
        "timeStart": moment().toISOString(),
        "timeExpire": moment().add(15, 'minutes').toISOString(), // expire in 15 mins
        "tradeType": "JSAPI",
        "classid": this.bookItem.classid,
        "name": this.bookItem.name,
        "contact": this.bookItem.contact,
        "quantity": this.bookItem.quantity,
        "openid": this.openid,
        "totalfee": parseInt(this.total * 100)
      });
      request.done(function(data, textStatus, jqXHR) {
        vm.payParams = data;
        vm.invokeWxPay(data)
      });
      request.fail(function(jqXHR, textStatus, errorThrown) {
        vm.errorMessage = jqXHR.responseJSON ? jqXHR.responseJSON.message : jqXHR.responseText;
        vm.status = "error";
      });
    },
    invokeWxPay(params) {
      var vm = this;
      if (typeof WeixinJSBridge == "undefined") {
        vm.errorMessage = "微信支付加载中...";
        vm.status = "error";
        return;
      }
      WeixinJSBridge.invoke('getBrandWCPayRequest', params, function(res) {
        if (res.err_msg == "get_brand_wcpay_request:ok") {
          vm.confirmPay(params);
        } else {
          // "get_brand_wcpay_request:fail" or "get_brand_wcpay_request:cancel"
          vm.errorMessage = "支付失败，请重试";
          vm.status = "error";
        }
      });
    },
    confirmPay(params) {
      var vm = this;
      var request = orders_service.confirmPay({
        "tenant": common.getTenantName(),
        // package is like "prepay_id=wx23114615719969d4a38d1115ef7a390000"
        prepayid: params.package.split("=")[1]
      });

      request.done(function(data, textStatus, jqXHR) {
        vm.order = data;
        if (vm.order.status === "success") {
          vm.errorMessage = "";
          vm.status = "success";
        } else {
          vm.errorMessage = vm.order.errormessage;
          vm.status = "error";
        }
      });
      request.fail(function(jqXHR, textStatus, errorThrown) {
        //TODO, handle error case, retry??
        vm.errorMessage = jqXHR.responseJSON ? jqXHR.responseJSON.message : jqXHR.responseText;
        vm.status = "error";
      });
      request.always(function(data, textStatus, jqXHR) {
        vm.warningMessage = "";
      });
    },
    openMyBooking() {
      location.href = './mybooking'; //TODO add "openid" as additional param
    }
  }
}
</script>
<style lang="less">
.form-condensed .form-group {
  margin-bottom: 0px;
}
</style>
