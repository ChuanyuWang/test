<template lang="pug">
div.container
  form.col-sm-12.col-md-6.col-md-offset-3
    div.form-group(style='margin-bottom:auto')
      p.form-control-static(style='color:#808080;text-align:center')
        small(v-if="tenantName!=='bqsqdrc'") 请填写小朋友的姓名和联系方式，客服会在收到申请后第一时间联系您
        small(v-else) 请填写小朋友的姓名和联系方式，客服会在收到申请后第一时间联系您，为您开通账号，咨询电话:
          a(href='tel:15000359159') 15000359159
    div.form-group(:class='{"has-error": errors.name}')
      label.control-label 小朋友姓名:
      input.form-control(type='text',v-model.trim='name',placeholder='小朋友姓名',autofocus)
    div.form-group(:class='{"has-error": errors.contact}')
      label.control-label 手机号:
      input.form-control(type='tel',v-model.trim='contact',placeholder='135xxx')
    div.form-group(:class='{"has-error": errors.verifyCode}')
      label.control-label 验证码:
      div.input-group
        input.form-control(type='number',v-model.trim='verifyCode')
        span.input-group-btn
          button.btn.btn-success(type="button", @click='showNoCaptcha', :disabled="errors.contact") 发送验证码
    div.form-group(:class='{"has-error": errors.birthday}')
      label.control-label 小朋友生日:
      input.form-control(type='date',v-model='birthday')
    div.form-group
      label.control-label 感兴趣的内容:
      textarea.form-control(rows='2',style='resize:vertical;min-height:70px',v-model.trim='remark',placeholder='选填')
  div.row.col-12
  button.btn.btn-primary(:disabled='hasError' style="display:block;margin:0 auto" @click="handleSubmit") 提交

  modal-dialog(ref='errMsg',size="small") 出错啦
    template(v-slot:body)
      p {{errorMessage}}

  modal-dialog(ref='ncDialog',size="small",buttons="cancel") 发送验证码
    template(v-slot:body)
      div#__nc(style='margin-left:auto;margin-right:auto;width:100%;height:100%')
        div#nc
  modal-dialog(ref='errorDlg',size="small",buttonStyle="danger") 提交失败
    template(v-slot:body)
      p {{errorMessage}}
      p(style='color:#808080')
        small 客服电话: 
          a(:href='tenantConfig.contact | tel') {{tenantConfig.contact}}
        br
        small 门店地址: 
          a(:href='tenantConfig.addressLink') {{tenantConfig.address}}
  modal-dialog(ref='successDlg',size="small",buttonStyle="success") 提交成功
    template(v-slot:body)
      p 您的信息已经成功提交，我们的客服人员会在第一时间联系您
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
 * trial page for collecting opportunity
 * --------------------------------------------------------------------------
 */

var common = require("../../common/common");
var modalDialog = require("../../components/modal-dialog.vue").default;

module.exports = {
  name: "users-setting",
  props: {},
  data: function() {
    return {
      tenantName: common.getTenantName(),
      tenantConfig: {},
      name: "",
      contact: "",
      verifyCode: "",
      birthday: null,
      remark: "",
      nc: null,
      //nc_appKey: "FFFF0N000000000084E3", // comment out for purpose
      nc_token: [
        "FFFF0N000000000084E3",
        new Date().getTime(),
        Math.random()
      ].join(":"),
      nc_scene: "nc_register_h5",
      errorMessage: ""
    };
  },
  components: {
    "modal-dialog": modalDialog
  },
  computed: {
    errors: function() {
      var errors = {};
      if (!this.name || this.name.length == 0) errors.name = "姓名不能为空";
      if (!/^1[345789]\d{9}$/.test(this.contact)) {
        errors.contact = "请输入正确的手机号码(11位)";
      }
      if (!this.verifyCode) errors.verifyCode = "请输入验证码";
      if (!this.birthday || !moment(this.birthday).isValid())
        errors.birthday = "日期/时间格式不正确";
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
    tel: function(contact) {
      // Remove the non-digit character from tel string, e.g. 136-6166-6616 -> 13664666616
      // And append prefix "tel:"
      return "tel:" + (contact && contact.replace(/\D/g, ''));
    }
  },
  methods: {
    handleSubmit: function(event) {
      var vue = this;
      var opportunity = {
        status: "open",
        tenant: common.getTenantName(),
        name: this.name,
        contact: this.contact,
        code: this.verifyCode,
        birthday: new Date(this.birthday),
        remark: this.remark,
        source: common.getParam("source")
      };

      $.ajax("/api/opportunities", {
        type: "POST",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(opportunity),
        success: function(data) {
          //show successful message
          vue.$refs.successDlg.show();
        },
        error: function(jqXHR, status, err) {
          //console.error(jqXHR);
          vue.errorMessage = jqXHR.responseJSON
            ? jqXHR.responseJSON.message
            : jqXHR.responseText;
          vue.$refs.errorDlg.show();
        },
        dataType: "json"
      });
    },
    showNoCaptcha: function(event) {
      // Check phone number is valid
      if (this.errors.contact) {
        this.errorMessage = "请输入手机号码";
        return this.$refs.errMsg.show();
      }
      // 阿里云盾人机验证收取最低10元/天的费用，所以取消调用，直接发送手机验证码
      //this.nc.reset(); //请务必确保这里调用一次reset()方法
      //this.$refs.ncDialog.show();
      this.sendVerifyCode({ sig: "", csessionid: "" });
    },
    sendVerifyCode: function(data) {
      var vue = this;
      //window.console && console.log(this.nc_token);
      //window.console && console.log(data.csessionid);
      //window.console && console.log(data.sig);

      var query = {
        tenant: common.getTenantName(),
        token: this.nc_token,
        sig: data.sig,
        sessionId: data.csessionid,
        scene: this.nc_scene,
        appKey: this.nc_appKey,
        contact: this.contact
      };

      var request = $.ajax("/api/function/sendSMS", {
        type: "POST",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(query),
        dataType: "json"
      });
      request.done(function(data, textStatus, jqXHR) {
        vue.$refs.ncDialog.hide();
      });
      request.fail(function(jqXHR, textStatus, errorThrown) {
        vue.$refs.ncDialog.hide();
        vue.errorMessage = jqXHR.responseJSON
          ? jqXHR.responseJSON.message
          : jqXHR.responseText;
        vue.$refs.errMsg.show();
      });
    }
  },
  created: function() {
    this.tenantConfig = _getTenantConfig();
  },
  mounted: function() {
    this.nc = NoCaptcha.init({
      renderTo: "#nc",
      appkey: this.nc_appKey,
      scene: this.nc_scene,
      token: this.nc_token,
      trans: { key1: "code200" },
      elementID: ["usernameID"],
      is_Opt: 0,
      language: "cn",
      timeout: 10000,
      retryTimes: 5,
      errorTimes: 5,
      inline: false,
      apimap: {
        // 'analyze': '//a.com/nocaptcha/analyze.jsonp',
        // 'uab_Url': '//aeu.alicdn.com/js/uac/909.js',
      },
      bannerHidden: false,
      initHidden: false,
      callback: this.sendVerifyCode,
      error: function(s) {
        window.console && console.error(s);
      }
    });
    NoCaptcha.setEnabled(true);
    //nc.reset(); //请务必确保这里调用一次reset()方法

    NoCaptcha.upLang("cn", {
      LOADING: "加载中...", //加载
      SLIDER_LABEL: "请向右滑动验证", //等待滑动
      CHECK_Y: "正在发送验证码...", //通过
      ERROR_TITLE: "非常抱歉，这出错了...", //拦截
      CHECK_N: "验证未通过", //准备唤醒二次验证
      OVERLAY_INFORM: "经检测你当前操作环境存在风险，请输入验证码", //二次验证
      TIPS_TITLE: "验证码错误，请重新输入" //验证码输错时的提示
    });
  }
};
</script>

<style lang='less'>
</style>
