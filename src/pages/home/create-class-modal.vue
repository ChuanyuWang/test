<template lang="pug">
div.modal.fade(tabindex='-1',role='dialog',data-backdrop='static')
  div.modal-dialog(role="document")
    div.modal-content
      div.modal-header
        button.close(type="button",data-dismiss="modal",aria-label="Close")
          span(aria-hidden="true") &times
        h4.modal-title 添加常规课程
      div.modal-body
        form.form-horizontal
          div.form-group(:class='{"has-error": errors.name}',:title='errors.name')
            label.control-label.col-sm-2(for='cls_name') 课程名称:
            div.col-sm-10
              input#cls_name.form-control(type='text',placeholder='课程描述',autofocus,v-model='name')
          div.form-group(:class='{"has-error": errors.cost}',:title='errors.cost')
            label.control-label.col-sm-2(for='cost') 所需课时:
            div.col-sm-2
              input.form-control(type='number',name='cost',min='0',step='0.1',v-model.number='cost')
          div.form-group
            label.control-label.col-sm-2 时间:
            div.col-sm-10
              p.form-control-static(style="width:110px;float:left") {{classDate}}
              date-picker(style="width:150px;float:left",v-model='startTime',:config='{locale: "zh-CN", format: "LT"}')
          div.form-group(:class='{"has-error": errors.age}',:title='errors.age')
            label.control-label.col-sm-2 年龄:
            div.col-sm-10(style="display:inline-flex")
              input.form-control(type='number',min='0',style={'width':'60px'},v-model.number='age.min')
              p.form-control-static(style={'display':'inline-block','margin-left':'3px','float':'left'}) 至
              input.form-control(type='number',min='0',style={'width':'60px','margin-left':'3px'},v-model.number='age.max')
              p.form-control-static(style={'display':'inline-block','margin-left':'3px'}) 岁
          div.form-group(:class='{"has-error": errors.capacity}',:title='errors.capacity')
            label.control-label.col-sm-2(for='cls_capacity') 最大人数:
            div.col-sm-2
              input#cls_capacity.form-control(type='number',min='0',v-model.number='capacity')
      div.modal-footer
        p.small(style='color:#777;float:left;margin-top:7px') *如果需要添加课程到指定班级，请到班级设置中添加
        button.btn.btn-default(type="button",data-dismiss="modal") {{$t('dialog_cancel')}}
        button#create_cls.btn.btn-success(type="button",v-on:click='handleOK',:disabled='hasError') 添加
</template>

<script>
/**
 * --------------------------------------------------------------------------
 * create-class-modal.vue component display a dailog to create class
 * --------------------------------------------------------------------------
 */

var date_picker = require('../../components/date-picker.vue').default;

module.exports = {
  components: {
    'date-picker': date_picker
  },
  props: {},
  data: function() {
    return {
      startDate: moment(),
      startTime: moment(),
      name: '',
      cost: 1,
      capacity: 8,
      age: { // by year
        min: null,
        max: null
      },
      classroom: null
    };
  },
  watch: {
    capacity: function(value) {
      this.capacity = parseInt(value);
    }
  },
  computed: {
    classDate: function() {
      return this.startDate.format('ll');
    },
    errors: function() {
      var errors = {};
      if (!this.name || this.name.length == 0)
        errors.name = '课程名称不能为空';
      if (this.cost === '' || this.cost < 0)
        errors.cost = '所需课时不能为负';
      if (isNaN(this.capacity) || this.capacity < 0)
        errors.capacity = '最大人数不能为负';
      if (this.age.min < 0)
        errors.age = '最小年龄不能为负';
      if (this.age.max < 0)
        errors.age = '最大年龄不能为负';
      if (typeof this.age.max === "number" &&
        typeof this.age.min === "number" &&
        this.age.max < this.age.min)
        errors.age = '最大年龄不能小于最小年龄';
      return errors;
    },
    hasError: function() {
      var errors = this.errors
      return Object.keys(errors).some(function(key) {
        return true;
      })
    }
  },
  filters: {},
  methods: {
    show: function(classTime, classroom) {
      this.name = '';
      this.startDate = moment(classTime);
      this.startTime = moment(classTime);
      this.classroom = classroom;
      $(this.$el).modal('show');
    },
    handleOK: function() {
      if (this.hasError) return;

      var createdClass = {
        name: this.name,
        // get the date from text control and appending the time
        date: moment(this.startDate).hours(this.startTime.hours()).minutes(this.startTime.minutes()),
        cost: this.cost,
        capacity: this.capacity,
        classroom: this.classroom,
        age: { // age is stored as months
          min: this.age.min ? parseInt(this.age.min * 12) : null,
          max: this.age.max ? parseInt(this.age.max * 12) : null
        }
      };
      this.$emit("ok", createdClass);
      $(this.$el).modal('hide');
    }
  },
  mounted: function() {
    //var vm = this;
  }
};
</script>

<style lang='less'>
</style>
