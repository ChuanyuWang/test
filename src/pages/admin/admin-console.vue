<template lang="pug">
div.row(style="margin-top:15px")
  div.panel.col-sm-3(style='padding-right:0;max-height:80vh;overflow:auto',@add='addUnsaveOne')
    template(v-for='(tenant, index) in tenants')
      div.media.tenant-list-item(@click='setSelectedIndex(index)',:class='[index === selectedIndex ? "selected-tenant" : ""]')
        div.media-left
          a(href='#')
            //img.media-object(src='/img/user.png')
            span.glyphicon.glyphicon-home(:class='{"deleted-tenant":tenant.status === "deleted", "text-danger": tenant.status === "inactive"}')
        div.media-body
          h5.media-heading {{tenant._id ? tenant.name : "-Unsaved-"}}
    div(style='display:flex')
      button.btn.btn-default(v-on:click='addUnsaveOne()',style='margin:3px auto;border:none;color:#555',title='create tenant')
        span.glyphicon.glyphicon-plus
  div.col-sm-9(style='padding-left:0')
    div.detail-tenant-border.form-condensed(style='min-height:300px')
      form.form-horizontal(v-show='hasData')
        div.form-group
          label.col-sm-3.control-label {{$t('status')}}:
          div.col-sm-3
            select.form-control(v-model='selectedTenant.status' @change='changeStatus()')
              option.text-success(value='active') active
              option.text-danger(value='inactive') inactive
        div.form-group(:class='{"has-error": errors.name}')
          label.col-sm-3.control-label Name:
          div.col-sm-5(data-toggle="tooltip",data-placement="right",:title="errors.name")
            input.form-control(v-if='!selectedTenant._id',v-model.trim='selectedTenant.name', placeholder='')
            p.form-control-static(v-else) {{selectedTenant.name}}
        div.form-group(:class='{"has-error": errors.displayName}')
          label.col-sm-3.control-label Display name:
          div.col-sm-5(data-toggle="tooltip",data-placement="right",:title="errors.displayName")
            input.form-control(v-if='!selectedTenant._id',v-model.trim='selectedTenant.displayName', placeholder='')
            p.form-control-static(v-else) {{selectedTenant.displayName}}
        div.form-group(:class='{"has-error": errors.logoPath}')
          label.col-sm-3.control-label Logo Path:
          div.col-sm-5(data-toggle="tooltip",data-placement="right",:title="errors.logoPath")
            input.form-control(v-if='!selectedTenant._id',v-model.trim='selectedTenant.logoPath', placeholder='')
            p.form-control-static(v-else) {{selectedTenant.logoPath}}
        div.form-group
          label.col-sm-3.control-label Version:
          div.col-sm-5
            p.form-control-static {{selectedTenant.version}}
        div.form-group
          label.col-sm-3.control-label Feature:
          div.col-sm-5
            select.form-control(v-if='!selectedTenant._id',v-model.trim='selectedTenant.feature')
              option(value='common') 早教
              option(value='book') 绘本
            p.form-control-static(v-else) {{selectedTenant.feature}}
        div.form-group
          label.col-sm-3.control-label WeChat AppID:
          div.col-sm-6
            div.input-group
              input.form-control(type="text" v-model.trim="selectedTenant.wechat.app_id")
              span.input-group-btn
                button.btn.btn-success(type="button" @click="") Save
        div.form-group
          label.col-sm-3.control-label System Message:
          div.col-sm-6
            div.input-group
              input.form-control(type="text" v-model.trim="selectedTenant.systemMessage")
              span.input-group-btn
                button.btn.btn-success(type="button" @click="updateSystemMessage") Save
        div.form-group
          label.col-sm-3.control-label Classroom:
          div.col-sm-5
            p.form-control-static {{selectedTenant.classroom | classroomFilter}}
        div.form-group
          label.col-sm-3.control-label Contact:
          div.col-sm-5
            p.form-control-static {{selectedTenant.contact}}
        div.form-group
          label.col-sm-3.control-label Address:
          div.col-sm-5
            p.form-control-static {{selectedTenant.address}}
        div.form-group
          label.col-sm-3.control-label Map link:
          div.col-sm-5
            p.form-control-static {{selectedTenant.addressLink}}
        div.form-group
          label.col-sm-3.control-label Users:
          div.col-sm-9
            table.table.table-bordered.table-hover.table-condensed.table-striped
              thead
                tr
                  th AccountID
                  th Name
                  th Role
                  th Delete
                  th Password
                  th Active
              tbody
                tr(v-for='user in users')
                  td {{user.username}}
                  td {{user.displayName}}
                  td {{user.role || 'user'}} 
                    span.text-info.glyphicon.glyphicon-edit(@click="setRole(user)" style="cursor:pointer")
                  td
                    span.text-danger.glyphicon.glyphicon-remove(style="cursor:pointer")
                  td
                    span.text-info.glyphicon.glyphicon-edit(@click='setPassword(user.username)' style="cursor:pointer")
                  td
                    input(type='checkbox',v-model='user.active',style="margin:0",@change='updateStatus(user)')
        div.form-group
          div.col-sm-offset-3.col-sm-9
            button.btn.btn-primary.me-3(type='button',v-if='selectedTenant._id',@click='upgradeTenant(selectedTenant.name)') Upgrade
            button.btn.btn-success.me-3(type='button',v-else,@click='createTenant',:disabled='hasError') Create
            button.btn.btn-danger.me-3(type='button',@click='deleteListener') Delete
            button.btn.btn-success(type='button',v-show='selectedTenant._id',@click='$refs.createUserDlg.show(selectedTenant.name)') Add User
  create-user-modal(ref='createUserDlg',@ok='createUser')
</template>

<script>
/**
 * --------------------------------------------------------------------------
 * administrator cockpit page include all the admin features, e.g. create tenant and user
 * --------------------------------------------------------------------------
 */

import createUserDlg from "./create-user-modal.vue";
import serviceUtil from "../../services/util";

export default {
  name: "admin-console",
  props: {},
  data: function() {
    return {
      tenants: [],
      selectedIndex: -1,
      users: [] // the users of selected tenant
    };
  },
  watch: {},
  components: {
    "create-user-modal": createUserDlg
  },
  computed: {
    hasData: function() {
      return !jQuery.isEmptyObject(this.selectedTenant);
    },
    errors: function() {
      var errors = {};
      if (!this.selectedTenant.name) errors.name = "letter only and not null";
      if (!this.selectedTenant.displayName)
        errors.displayName = "can't be empty";
      if (!this.selectedTenant.logoPath) errors.logoPath = "can't be empty";
      return errors;
    },
    hasError: function() {
      var errors = this.errors;
      return Object.keys(errors).some(function(key) {
        return true;
      });
    },
    selectedTenant: function() {
      var res = this.selectedIndex > -1 ? this.tenants[this.selectedIndex] : {};
      res.wechat = res.wechat || {};
      return res;
    }
  },
  filters: {
    classroomFilter: function(value) {
      if (!value) return "";

      var res = [];
      value.forEach(function(val, index, array) {
        res.push(val.name);
      });
      return res.join(";");
    }
  },
  methods: {
    addUnsaveOne: function() {
      this.tenants.push({
        name: "",
        displayName: "",
        status: "active",
        feature: "common",
        logoPath: ""
      });
      this.setSelectedIndex(this.tenants.length - 1);
    },
    changeStatus: function(e) {
      var request = $.ajax("/admin/api/tenant/" + this.selectedTenant.name, {
        type: "PATCH",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify({
          status: this.selectedTenant.status
        }),
        dataType: "json"
      });
      request.fail(function(jqXHR, textStatus, errorThrown) {
        console.error("change tenant fails", jqXHR.responseJSON ? jqXHR.responseJSON.message : jqXHR.responseText);
      });
      request.done((data, textStatus, jqXHR) => {
        Vue.set(this.tenants, this.selectedIndex, data || {});
        alert("Set tenant status successfully");
      });
    },
    setSelectedIndex: function(index) {
      this.selectedIndex = index;
      this.getTenantUsers(this.selectedTenant);
    },
    getTenantUsers: function(tenant) {
      var vm = this;
      var request = $.getJSON("/admin/api/users", { tenant: tenant.name });
      request.fail(function(jqXHR, textStatus, errorThrown) {
        console.error("get tenant user fails", jqXHR);
      });
      request.done(function(data, textStatus, jqXHR) {
        // update the 'active' field of each user
        vm.users = (data || []).map(function(element, index, array) {
          if (typeof (element.active) !== "boolean")
            element.active = true;
          return element;
        });
      });
    },
    createUser: function(user) {
      var vm = this;
      var request = $.ajax("/admin/api/users", {
        type: "POST",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(user),
        dataType: "json"
      });
      request.fail(function(jqXHR, textStatus, errorThrown) {
        console.error("create user fails", jqXHR.responseJSON ? jqXHR.responseJSON.message : jqXHR.responseText);
        alert(jqXHR.responseJSON.message);
      });
      request.done(function(data, textStatus, jqXHR) {
        vm.users.push(data);
      });
    },
    setPassword: function(username) {
      bootbox.prompt({
        size: "small",
        title: "Set new password",
        inputType: "password",
        placeholder: "set passowrd for user: " + username,
        callback: function(result) {
          /* result = String containing user input if OK clicked or null if Cancel clicked */
          if (!result) return;
          var request = $.ajax("/admin/api/user/" + username, {
            type: "PATCH",
            contentType: "application/json; charset=utf-8",
            data: JSON.stringify({
              newPassword: result.trim()
            }),
            dataType: "json"
          });
          request.fail(function(jqXHR, textStatus, errorThrown) {
            console.error("set user password fails", jqXHR);
            alert(jqXHR.responseJSON ? jqXHR.responseJSON.message : jqXHR.responseText);
          });
          request.done(function(data, textStatus, jqXHR) {
            console.log(data);
            alert("Set user password successfully");
          });
        }
      });
    },
    setRole(user) {
      bootbox.prompt({
        size: "small",
        title: "Set new role",
        inputType: "select",
        inputOptions: [{
          text: 'choose a role...',
          value: '',
        }, {
          text: 'admin',
          value: 'admin',
        }, {
          text: 'user',
          value: 'user',
        }],
        callback: function(result) {
          /* result = String containing user input if OK clicked or null if Cancel clicked */
          if (!result) return;
          var request = $.ajax("/admin/api/user/" + user.username, {
            type: "PATCH",
            contentType: "application/json; charset=utf-8",
            data: JSON.stringify({
              role: result.trim()
            }),
            dataType: "json"
          });
          request.fail(function(jqXHR, textStatus, errorThrown) {
            console.error("set user role fails", jqXHR);
            alert(jqXHR.responseJSON ? jqXHR.responseJSON.message : jqXHR.responseText);
          });
          request.done(function(data, textStatus, jqXHR) {
            console.log(data);
            user.role = result.trim();
            alert("Set user role successfully");
          });
        }
      });
    },
    updateStatus: function(user) {
      var request = $.ajax("/admin/api/user/" + user.username, {
        type: "PATCH",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify({
          active: user.active
        }),
        dataType: "json"
      });
      request.fail(function(jqXHR, textStatus, errorThrown) {
        console.error("set user status fails", jqXHR);
        alert(jqXHR.responseJSON ? jqXHR.responseJSON.message : jqXHR.responseText);
      });
      request.done(function(data, textStatus, jqXHR) {
        console.log(data);
        alert("Set user status successfully");
      });
    },
    updateSystemMessage() {
      var request = serviceUtil.patchJSON("/admin/api/tenant/" + this.selectedTenant.name, {
        systemMessage: this.selectedTenant.systemMessage
      });
      request.done((data, textStatus, jqXHR) => {
        Vue.set(this.tenants, this.selectedIndex, data || {});
        alert("Set system message successfully");
      });
    },
    createTenant: function() {
      var vm = this;
      $.ajax("api/tenants", {
        type: "POST",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify({
          name: vm.selectedTenant.name,
          displayName: vm.selectedTenant.displayName,
          status: vm.selectedTenant.status,
          feature: vm.selectedTenant.feature,
          logoPath: vm.selectedTenant.logoPath
        }),
        success: function(data) {
          vm.tenants.splice(vm.selectedIndex, 1, data);
        },
        error: function(jqXHR, status, err) {
          alert(jqXHR.responseJSON.message);
        },
        dataType: "json"
      });
    },
    upgradeTenant: function(name) {
      var request = serviceUtil.postJSON("api/upgrade", {
        tenant: name // tenant.name
      });
      request.done((data, textStatus, jqXHR) => {
        alert(name + " is upgraded successfully");
      });
      request.fail((jqXHR, textStatus, errorThrown) => {
        var errorMessage = jqXHR.responseJSON ? jqXHR.responseJSON.message : jqXHR.responseText;
        alert(errorMessage);
      });
    },
    deleteListener: function() {
      //TODO, remove a tenant
      alert("暂不支持");
    }
  },
  created: function() {
    var vm = this;
    var request = $.ajax("api/tenants", {
      type: "GET",
      //contentType : "application/x-www-form-urlencoded; charset=UTF-8",
      dataType: "json",
      data: {},
      cache: true // browser cache
    });
    request.fail(function(jqXHR, textStatus, errorThrown) {
      console.error(jqXHR);
    });
    request.done(function(data, textStatus, jqXHR) {
      vm.tenants = data;
    });
  },
  mounted: function() {
    //var vm = this;
  }
};
</script>

<style lang='less' scoped>
.selected-tenant {
  border-right: 4px solid #337ab7;
  color: #337ab7;
}

.tenant-list-item:hover {
  background-color: aliceblue;
  cursor: pointer;
}

.tenant-list-item {
  margin-top: 0px;
  padding: 7px 0px;
}

.deleted-tenant {
  color: #777;
}

.detail-tenant-border {
  border-left: 2px solid #eee;
}

.form-condensed .form-group {
  margin-bottom: 3px;
}
</style>
