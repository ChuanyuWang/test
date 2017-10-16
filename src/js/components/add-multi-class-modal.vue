/**
 * --------------------------------------------------------------------------
 * add-multi-class-modal.vue component for add multi classes modal dailog
 * --------------------------------------------------------------------------
 */

<style>

</style>

<template lang="jade">
div#add-multi-class-modal.modal.fade(tabindex='-1',data-backdrop='static')
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
              div#class_date.input-group.date
                input.form-control(type='text')
                span.input-group-addon
                  span.glyphicon.glyphicon-calendar
          div.form-group(:class='{"has-error": !validation.cost}')
            label.control-label.col-sm-2 所须课时:
            div.col-sm-2
              input.form-control(type='number',name='cost',min='0',step='0.1',value=0,v-model.number='cost')
          div.form-group(:class='{"has-error": !validation.room}')
            label.control-label.col-sm-2 教室:
            select#class_room.form-control.col-sm-4(style='margin-left:15px;width:auto',v-model='room')
              option(v-for='(name, id) in classrooms',:value='id') {{name}}
            div.col-sm-offset-2.col-sm-10
              div.checkbox
                label
                  input(type='checkbox',name='recurrence',v-model='isRepeated')
                  |每周重复
          div.recurrence-panel(style='display:none',v-show='isRepeated')
            div.form-group(:class='{"has-error": !validation.weekdays}')
              label.control-label.col-sm-2 每周:
              div.weekdays.col-sm-10(style='display:flex;flex-wrap:wrap')
                - each day,index in ['星期日','星期一','星期二','星期三','星期四','星期五','星期六']
                  div.checkbox(style='margin:0 30px 0 0')
                    label
                      input(type="checkbox", name="weekday", value="#{index}",v-model='weekdays')
                      | #{day}
            div.form-group(:class='{"has-error": !validation.begin}')
              label.control-label.col-sm-2 开始日期:
              div.col-sm-5
                div#class_begin.input-group.date
                  input.form-control(type='text',name='begin')
                  span.input-group-addon
                    span.glyphicon.glyphicon-calendar
            div.form-group(:class='{"has-error": !validation.end}')
              label.control-label.col-sm-2 结束:
              div.col-sm-5
                div#class_end.input-group.date
                  input.form-control(type='text',name='end')
                  span.input-group-addon
                    span.glyphicon.glyphicon-calendar
      div.modal-footer
        button.btn.btn-default(type="button",data-dismiss="modal") 取消
        button.btn.btn-success(type="button",@click='handleOK') 确定
</template>

<script>
module.exports = {
  props: {
    classrooms: Object // list of available classrooms
  },
  data: function() {
    return {
      date: moment(),
      begin: moment(),
      end: moment(),
      room: '',
      cost: 0,
      weekdays: [],
      isRepeated: false
    };
  },
  watch: {
    isRepeated: function(newValue) {
      var vm = this;
      if (newValue) {
        $(vm.$el).find('#class_date').data("DateTimePicker").format('LT');
      } else {
        $(vm.$el).find('#class_date').data("DateTimePicker").format('lll');
      }
    }
  },
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
    }
  },
  filters: {},
  methods: {
    show: function(value) {
      // TODO, clear error
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
    var vm = this;
    $(vm.$el).find('#class_date').datetimepicker({
      defaultDate: moment(),
      locale: 'zh-CN',
      format: 'lll'
    });
    $(vm.$el).find('#class_begin').datetimepicker({
      defaultDate: moment(),
      locale: 'zh-CN',
      format: 'll'
    });
    $(vm.$el).find('#class_end').datetimepicker({
      defaultDate: moment().add(1, 'week'),
      locale: 'zh-CN',
      format: 'll'
    });

    $(vm.$el).find('#class_date').on('dp.change', function(e) {
      // when user clears the input box, the 'e.date' is false value
      vm.date = e.date === false ? null : e.date;
    });
    $(vm.$el).find('#class_begin').on('dp.change', function(e) {
      // when user clears the input box, the 'e.date' is false value
      vm.begin = e.date === false ? null : e.date;
    });
    $(vm.$el).find('#class_end').on('dp.change', function(e) {
      // when user clears the input box, the 'e.date' is false value
      vm.end = e.date === false ? null : e.date;
    });
  }
};
</script>