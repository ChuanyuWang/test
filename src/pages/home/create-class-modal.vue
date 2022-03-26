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
            label.control-label.col-sm-2(for='cost') 课时:
            div.col-sm-2
              input.form-control(type='number',name='cost',min='0',step='0.1',v-model.number='cost')
          div.form-group(:class='{"has-error": errors.price}',:title='errors.price')
            label.control-label.col-sm-2(for='price') 价格:
            div.col-sm-3
              div.input-group
                input.form-control(type='number',name='price',min='0',step='1',v-model.number='price')
                label.input-group-addon 元
          div.form-group
            label.control-label.col-sm-2 时间:
            div.col-sm-10
              p.form-control-static(style="width:110px;float:left") {{classDate}}
              date-picker(style="width:150px;float:left",v-model='startTime',:config='{locale: "zh-CN", format: "LT"}')
          div.form-group(:class='{"has-error": errors.age}',:title='errors.age')
            label.control-label.col-sm-2 年龄:
            div.col-sm-5
              div.input-group
                input.form-control(type='number',min='0',v-model.number='age.min')
                div.input-group-addon 至
                input.form-control(type='number',min='0',v-model.number='age.max')
                div.input-group-addon 岁
          div.form-group(:class='{"has-error": errors.capacity}',:title='errors.capacity')
            label.control-label.col-sm-2 最大人数:
            div.col-sm-3
              div.input-group
                input.form-control(type='number',min='0',v-model.number='capacity')
                div.input-group-addon 人
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
      price: 0,
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
    finalPrice: function() {
      // change unit to fen
      return parseInt(this.price * 100) || 0;
    },
    errors: function() {
      var errors = {};
      if (!this.name || this.name.length == 0)
        errors.name = '课程名称不能为空';
      if (this.cost === '' || this.cost < 0)
        errors.cost = '所需课时不能为负';
      if (this.finalPrice === 0 && this.price > 0)
        errors.price = '课程价格不能小于1分钱';
      if (this.finalPrice < 0)
        errors.price = '课程价格不能为负';
      if (this.finalPrice > 0 && this.cost <= 0)
        errors.price = '付费课程的课时不能为0';
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
        price: this.finalPrice,
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
