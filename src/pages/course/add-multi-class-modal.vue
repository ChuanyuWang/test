<template lang="pug">
div.modal.fade(tabindex='-1',data-backdrop='static')
  div.modal-dialog
    div.modal-content
      div.modal-header
        button.close(type="button",data-dismiss="modal",aria-label="Close")
          span(aria-hidden="true") &times
        h4.modal-title 添加课程到当前班级
      div.modal-body
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
            div.col-sm-6(:title="errors.date")
              div.input-group.date
                date-picker(v-model='date',:config='dateFormat')
          div.form-group(:class='{"has-error": errors.cost}')
            label.control-label.col-sm-2 所须课时:
            div.col-sm-3(:title="errors.cost")
              input.form-control(type='number',name='cost',min='0',step='0.1',value=0,v-model.number='cost')
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
      div.modal-footer
        button.btn.btn-default(type="button",data-dismiss="modal") 取消
        button.btn.btn-success(type="button",@click='handleOK',:disabled="hasError") 确定
</template>

<script>
/**
 * --------------------------------------------------------------------------
 * add-multi-class-modal.vue component for add multi classes modal dailog
 * --------------------------------------------------------------------------
 */

var date_picker = require('../../components/date-picker.vue').default;
var teacher_service = require('../../services/teachers');
var serviceUtil = require("../../services/util");

module.exports = {
  components: {
    'date-picker': date_picker
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
      name: this.defaultName || "",
      type: "",
      date: moment(),
      begin: moment(),
      end: moment().add(1, 'week'),
      room: '',
      cost: 0,
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
    show: function(value) {
      $(this.$el).modal('show')
    },
    handleOK: function() {
      if (!this.hasError) {
        this.$emit("ok", this.$data);
        $(this.$el).modal('hide');
      }
    }
  },
  mounted: function() { },
  created: function() {
    // Load all teachers for selection
    var vm = this;
    var request = teacher_service.getAll({ status: 'active' });
    request.done(function(data, textStatus, jqXHR) {
      var all = data || [];
      // all the unassigned option with null as id
      all.push({ name: '<未指定>', _id: null });
      vm.teachers = all;
    });
    var request = serviceUtil.getJSON("/api/setting/types");
    request.done((data, textStatus, jqXHR) => {
      this.types = data || [];
    });
  }
};
</script>

<style lang='less'>

</style>
