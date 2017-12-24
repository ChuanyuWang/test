<style lang='less'>
.detail-teacher-border {
  border-left: 2px solid #eee;
}
</style>

<template lang="jade">
div.detail-teacher-border(style='min-height:300px')
  form.form-horizontal(v-show='hasData')
    div.form-group
      label.col-sm-2.control-label {{$t('status')}}:
      select.col-sm-5.form-control(v-model='item.status',style='margin-left:15px;width:auto',:disabled='isDeleted')
        option.text-success(value='active') {{$t('status_active')}}
        option.text-danger(value='inactive') {{$t('status_inactive')}}
        option(value='deleted') {{$t('status_deleted')}}
    div.form-group(:class='{"has-error": errors.name}')
      label.col-sm-2.control-label {{$t('member_name')}}:
      div.col-sm-5(data-toggle="tooltip",data-placement="right",:title="errors.name")
        input.form-control(v-model.trim='item.name', placeholder='老师姓名')
    div.form-group(:class='{"has-error": errors.contact}')
      label.col-sm-2.control-label {{$t('member_contact')}}:
      div.col-sm-5(data-toggle="tooltip",data-placement="right",:title="errors.contact")
        input.form-control(v-model.trim='item.contact', placeholder='135xxx')
    div.form-group(:class='{"has-error": errors.birthday}')
      label.control-label.col-sm-2 {{$t('birthday')}}:
      div.col-sm-5(data-toggle="tooltip",data-placement="right",:title="errors.birthday")
        date-picker(v-model='item.birthday')
    div.form-group(:class='{"has-error": errors.note}')
      label.control-label.col-sm-2 {{$t('note')}}:
      div.col-sm-10(data-toggle="tooltip",data-placement="right",:title="errors.note")
        textarea.form-control(rows='3',v-model.trim='item.note',style='resize:vertical;min-height:70px')
    div.form-group
      div.col-sm-offset-2.col-sm-10
        button.btn.btn-success(type='button',v-on:click='saveBasicInfo',:disabled='hasError || isDeleted') {{item._id ? $t('save'): $t('create')}}
        button.btn.btn-danger(type='button',v-on:click='deleteListener',v-show='hasData && !isDeleted',style='margin-left:5px') {{$t('delete')}}
</template>

<script>
/**
 * --------------------------------------------------------------------------
 * teach-detail.js display details of selected teacher
 * --------------------------------------------------------------------------
 */

var date_picker = require("./date-picker.vue");

module.exports = {
  props: {
    data: Object // teacher object
  },
  data: function() {
    return {
      item: jQuery.extend(true, {}, this.data || {})
    };
  },
  components: {
    "date-picker": date_picker
  },
  watch: {
    data: function(value) {
      this.item = jQuery.extend(true, {}, value || {});
    }
  },
  computed: {
    hasData: function() {
      return !jQuery.isEmptyObject(this.item);
    },
    errors: function() {
      var errors = {};
      if (!this.item.name) errors.name = this.$t("msg_name_cannot_empty");
      if (this.item.note && this.item.note.length > 256)
        errors.note = this.$t("msg_note_too_long");
      return errors;
    },
    hasError: function() {
      var errors = this.errors;
      return Object.keys(errors).some(function(key) {
        return true;
      });
    },
    isDeleted: function() {
      if (this.item && this.item.status) {
        return this.item.status === 'deleted';
      }
      return false;
    }
  },
  filters: {},
  methods: {
    saveBasicInfo: function() {
      var res = {
        name: this.item.name,
        //gender: this.item.gender,
        status: this.item.status,
        contact: this.item.contact || "",
        birthday:
          this.item.birthday && moment(this.item.birthday).toISOString(),
        note: this.item.note || ""
      };
      if (this.item._id) {
        res._id = this.item._id;
        this.$emit("update", res);
      } else {
        this.$emit("create", res);
      }
    },
    deleteListener: function(params) {
      var vm = this;
      if (!vm.item._id) {
        return vm.$emit("delete");
      }
      bootbox.confirm({
        title: "确定删除吗？",
        message: '被删除的老师，会被标记成"已删除"状态，并且不能修改',
        buttons: {
          confirm: {
            className: "btn-danger"
          }
        },
        callback: function(ok) {
          if (ok) vm.$emit("delete", vm.item._id);
        }
      });
    }
  }
};
</script>