<template lang="pug">
div(style='padding:7px')
  form.form-horizontal
    span.help-block 请设置客服电话和门店地址，方便会员在约课遇到问题时联系
    div.form-group
      label.col-sm-2.control-label 门店标识:
      div.col-sm-10
        p.form-control-static {{name}}
    div.form-group(:class='{"has-error": errors.displayName}')
      label.col-sm-2.control-label 门店名称:
      div.col-sm-10
        input.form-control(type='text',name='displayName',v-model='displayName')
        span.help-block 显示在约课界面标题上的名称，一个门店只有一个名字，设置后可以再次更改
    div.form-group(:class='{"has-error": errors.type}')
      label.col-sm-2.control-label 主题:
      div.col-sm-5
        select.form-control(v-model='feature')
          option(value='common') 早教
          option(value='book') 绘本
        span.help-block 设置课程主题，并在建立课程添加与主题相关的信息
    div.form-group(:class='{"has-error": errors.contact}')
      label.col-sm-2.control-label 客服电话:
      div.col-sm-10
        input.form-control(type='text',name='contact',v-model='contact')
        span.help-block 客服电话，学员遇到问题时拨打咨询，设置后可以再次更改
    div.form-group(:class='{"has-error": errors.address}')
      label.col-sm-2.control-label 门店地址:
      div.col-sm-10
        input.form-control(type='text',name='address',v-model='address')
        span.help-block 门店地址，学员遇到问题时可以前往咨询，设置后可以再次更改
    div.form-group(:class='{"has-error": errors.mapLink}')
      label.col-sm-2.control-label 门店地图:
      div.col-sm-10
        input.form-control(type='text',name='mapLink',v-model='mapLink')
        span.help-block 门店地图名片，学员遇到问题时可以前往咨询，设置后可以再次更改
    div.form-group
      div.col-sm-offset-2.col-sm-10
        button.btn.btn-success(type='button',@click='save',:disabled='hasError') 保存
</template>

<script>
/**
 * --------------------------------------------------------------------------
 * general-setting display a panel for general settings
 * --------------------------------------------------------------------------
 */

import util from "../../services/util";

export default {
  name: "general-setting",
  props: {},
  data: function() {
    return {
      name: "",
      displayName: "",
      feature: "",
      contact: "",
      address: "",
      mapLink: ""
    };
  },
  components: {},
  computed: {
    errors: function() {
      var urlExpression = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g;
      var regex = new RegExp(urlExpression);

      var errors = {};
      if (!this.displayName) errors.displayName = "displayName is empty";
      if (!this.contact) errors.contact = "contact is empty";
      if (!this.address) errors.address = "address is empty";
      if (this.mapLink && !this.mapLink.match(regex)) errors.mapLink = "map url is invalid";
      return errors;
    },
    hasError: function() {
      var errors = this.errors;
      return Object.keys(errors).some(function(key) {
        return true;
      });
    }
  },
  filters: {},
  methods: {
    save: function(event) {
      var request = $.ajax("/api/setting/basic", {
        type: "PATCH",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify({
          displayName: this.displayName,
          feature: this.feature,
          contact: this.contact,
          address: this.address,
          addressLink: this.mapLink
        }),
        dataType: "json"
      });
      request.fail(function(jqXHR, textStatus, errorThrown) {
        util.showAlert("更新基础设置失败", jqXHR);
      });
      request.done((data, textStatus, jqXHR) => {
        this.update(data || {});
        this.$messager.showSuccessMessage("保存成功");
      });
    },
    update: function(setting) {
      this.name = setting.name;
      this.displayName = setting.displayName;
      this.feature = setting.feature;
      this.contact = setting.contact;
      this.address = setting.address;
      this.mapLink = setting.addressLink;
    }
  },
  created: function() {
    var vm = this;
    var request = $.getJSON("/api/setting");
    request.fail(function(jqXHR, textStatus, errorThrown) {
      util.showAlert("获取综合设置失败", jqXHR);
    });
    request.done(function(data, textStatus, jqXHR) {
      vm.update(data || {});
    });
  }
};
</script>

<style lang='less'></style>
