<template lang="pug">
modal-dialog(ref='dialog' buttons="confirm" @ok="handleOK" :hasError="hasError" @show="lazyLoad") 添加课程到当前班级
  template(v-slot:body)
    form.form-horizontal
      div.form-group(:class='{"has-error": errors.type}',:title='errors.type')
        label.control-label.col-sm-2 类型:
        div.col-sm-3
          select.form-control(v-model="type")
            option.text-default(v-for="item in types" :value="item.id") {{item.name}}
      div.form-group(:class='{"has-error": errors.name}')
        label.control-label.col-sm-2 名称:
        div.col-sm-5(:title="errors.name")
          input.form-control(type='text',v-model.trim='name')
      div.form-group(:class='{"has-error": errors.date}')
        label.control-label.col-sm-2 时间/日期:
        div.col-sm-5(:title="errors.date")
          date-picker(v-model='date',:config='dateFormat')
      div.form-group(:class='{"has-error": errors.cost}')
        label.control-label.col-sm-2 所须课时:
        div.col-sm-3(:title="errors.cost")
          input.form-control(type='number',name='cost',min='0',step='0.1',v-model.number='cost')
      div.form-group
        label.control-label.col-sm-2 教室:
        div.col-sm-3
          select.form-control(v-model='room')
            option(v-for='r in classrooms',:value='r.id') {{r.name}}
      div.form-group
        label.control-label.col-sm-2 老师:
        div.col-sm-3
          select.form-control(v-model='teacher')
            option(v-for='t in teachers',:value='t._id') {{t.name}}
        div.col-sm-offset-2.col-sm-10
          div.checkbox
            label
              input(type='checkbox',name='recurrence',v-model='isRepeated')
              |每周重复
      div.recurrence-panel(style='display:none',v-show='isRepeated')
        div.form-group(:class='{"has-error": errors.weekdays}')
          label.control-label.col-sm-2 每周:
          div.weekdays.col-sm-10(style='display:flex;flex-wrap:wrap',:title="errors.weekdays")
            each day,index in ['星期日','星期一','星期二','星期三','星期四','星期五','星期六']
              div.checkbox(style='margin:0 30px 0 0')
                label
                  input(type="checkbox", name="weekday", value=index,v-model='weekdays')
                  | #{day}
        div.form-group(:class='{"has-error": errors.begin}')
          label.control-label.col-sm-2 开始日期:
          div.col-sm-5(:title="errors.begin")
            date-picker(v-model='begin')
        div.form-group(:class='{"has-error": errors.end}')
          label.control-label.col-sm-2 结束:
          div.col-sm-5(:title="errors.end")
            date-picker(v-model='end')
</template>

<script>
/**
 * --------------------------------------------------------------------------
 * add-multi-class-modal.vue component for add multi classes modal dailog
 * --------------------------------------------------------------------------
 */

import date_picker from '../../components/date-picker.vue';
import modalDialog from "../../components/modal-dialog.vue";

import teacher_service from '../../services/teachers';
import serviceUtil from "../../services/util";

export default {
  components: {
    'date-picker': date_picker,
    "modal-dialog": modalDialog
  },
  props: {
    // default name of class session
    defaultName: {
      type: String,
      required: false
    },
    classrooms: Array // list of available classrooms
  },
  data: function() {
    return {
      name: "",
      type: "",
      date: moment(),
      begin: moment(),
      end: moment().add(1, 'week'),
      room: '',
      cost: 1,
      weekdays: [],
      isRepeated: false,
      teacher: null, // selected teacher
      teachers: [], // all active teachers
      types: [] // all class types
    };
  },
  watch: {},
  computed: {
    errors: function() {
      var errors = {};
      if (!this.type || this.type.length == 0)
        errors.type = '课程类型不能为空';
      if (!this.name || this.name.length == 0)
        errors.name = "名称不能为空";
      if (typeof (this.cost) !== 'number' || this.cost < 0)
        errors.cost = "课时不能为负";
      if (!this.date || !this.date.isValid())
        errors.date = "日期格式不正确";
      if (this.isRepeated) {
        if (this.weekdays.length <= 0)
          errors.weekdays = "选择至少一天";
        if (!this.begin || !this.begin.isValid())
          errors.begin = "起始日期格式不正确";
        if (!this.end || !this.end.isValid())
          errors.end = "结束日期格式不正确";
        if (this.begin && this.end && this.begin.isValid() && this.end.isValid() && this.end.diff(this.begin, "days") > 180)
          errors.end = "开始和结束日期不能超过180天";
        if (this.begin && this.end && this.begin.isValid() && this.end.isValid() && this.end.isBefore(this.begin))
          errors.end = "结束日期不能小于开始日期";
      }
      return errors;
    },
    hasError: function() {
      var errors = this.errors;
      return Object.keys(errors).some(function(key) {
        return true;
      });
    },
    dateFormat: function() {
      return this.isRepeated ? { 'format': 'LT', "locale": "zh-CN" } : { 'format': 'lll', "locale": "zh-CN" };
    }
  },
  filters: {},
  methods: {
    lazyLoad() {
      if (this.types.length === 0) {
        var request = serviceUtil.getJSON("/api/setting/types");
        request.done((data, textStatus, jqXHR) => {
          this.types = data || [];
        });
      }
      if (this.teachers.length === 0) {
        // Load all active teachers for selection
        var request = teacher_service.getAll({ status: 'active' });
        request.done((data, textStatus, jqXHR) => {
          var all = data || [];
          // all the unassigned option with null as id
          all.push({ name: '<未指定>', _id: null });
          this.teachers = all;
        });
      }
    },
    show() {
      this.name = this.defaultName;
      this.$refs.dialog.show();
    },
    handleOK() {
      this.$emit("ok", this.$data);
    }
  },
  mounted: function() { },
  created: function() { }
};
</script>

<style lang='less'></style>
