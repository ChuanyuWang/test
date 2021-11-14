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
          div.form-group(:class='{"has-error": !validation.date}')
            label.control-label.col-sm-2 时间/日期:
            div.col-sm-6
              div.input-group.date
                date-picker(v-model='date',:config='dateFormat')
          div.form-group(:class='{"has-error": !validation.cost}')
            label.control-label.col-sm-2 所须课时:
            div.col-sm-2
              input.form-control(type='number',name='cost',min='0',step='0.1',value=0,v-model.number='cost')
          div.form-group(:class='{"has-error": !validation.room}')
            label.control-label.col-sm-2 教室:
            select#class_room.form-control.col-sm-4(style='margin-left:15px;width:auto',v-model='room')
              option(v-for='r in classrooms',:value='r.id') {{r.name}}
          div.form-group
            label.control-label.col-sm-2 老师:
            select.form-control.col-sm-10(style='margin-left:15px;width:auto',v-model='teacher')
              option(v-for='t in teachers',:value='t._id') {{t.name}}
            div.col-sm-offset-2.col-sm-10
              div.checkbox
                label
                  input(type='checkbox',name='recurrence',v-model='isRepeated')
                  |每周重复
          div.recurrence-panel(style='display:none',v-show='isRepeated')
            div.form-group(:class='{"has-error": !validation.weekdays}')
              label.control-label.col-sm-2 每周:
              div.weekdays.col-sm-10(style='display:flex;flex-wrap:wrap')
                each day,index in ['星期日','星期一','星期二','星期三','星期四','星期五','星期六']
                  div.checkbox(style='margin:0 30px 0 0')
                    label
                      input(type="checkbox", name="weekday", value=index,v-model='weekdays')
                      | #{day}
            div.form-group(:class='{"has-error": !validation.begin}')
              label.control-label.col-sm-2 开始日期:
              div.col-sm-5
                date-picker(v-model='begin')
            div.form-group(:class='{"has-error": !validation.end}')
              label.control-label.col-sm-2 结束:
              div.col-sm-5
                date-picker(v-model='end')
      div.modal-footer
        button.btn.btn-default(type="button",data-dismiss="modal") 取消
        button.btn.btn-success(type="button",@click='handleOK') 确定
</template>

<script>
/**
 * --------------------------------------------------------------------------
 * add-multi-class-modal.vue component for add multi classes modal dailog
 * --------------------------------------------------------------------------
 */

var date_picker = require('../../components/date-picker.vue').default;
var teacher_service = require('../../services/teachers');

module.exports = {
  components: {
    'date-picker': date_picker
  },
  props: {
    classrooms: Array // list of available classrooms
  },
  data: function() {
    return {
      date: moment(),
      begin: moment(),
      end: moment().add(1, 'week'),
      room: '',
      cost: 0,
      weekdays: [],
      isRepeated: false,
      teacher: null, // selected teacher
      teachers: [] // all active teachers
    };
  },
  watch: {},
  computed: {
    validation: function() {
      return {
        cost: typeof (this.cost) === 'number' && this.cost >= 0,
        date: this.date && this.date.isValid(),
        room: typeof (this.room) === 'string' && this.room.length > 0,
        weekdays: !this.isRepeated || this.weekdays.length > 0,
        begin: !this.isRepeated || (this.begin && this.begin.isValid()),
        end: !this.isRepeated || (this.end && this.end.isValid())
      }
    },
    isValid: function() {
      var validation = this.validation
      return Object.keys(validation).every(function(key) {
        return validation[key]
      })
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
      if (this.isValid) {
        this.$emit("ok", this.$data);
        $(this.$el).modal('hide');
      }
    }
  },
  mounted: function() {
    // 'this' is refer to vm instance
    // var vm = this;
  },
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
  }
};
</script>

<style lang='less'>
</style>
