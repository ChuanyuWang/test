<style>

</style>

<template lang="jade">
form.form-horizontal
  div.form-group
    label.control-label.col-sm-2 课时:
    div.col-sm-10
      p.form-control-static {{item.credit | formatCredit}}次(剩余)
  div.form-group(:class='{"has-error": errors.delta}')
    label.control-label.col-sm-2 增加/减少:
    div.col-sm-10(style="display:inline-flex",data-toggle="tooltip",data-placement="right",:title="errors.delta")
      button.btn.btn-sm.btn-danger(type="button",style="margin:2px;padding:3px",@click="alterCharge(-10)")
        span.glyphicon.glyphicon-minus
        | 10
      button.btn.btn-sm.btn-danger(type="button",style="margin:2px;padding:3px",@click="alterCharge(-1)")
        span.glyphicon.glyphicon-minus
        | 1
      input.form-control(type='number',v-model.number='delta',min='-100',max='100',step='0.1',style="width:85px;margin:0 2px")
      button.btn.btn-sm.btn-success(type="button",style="margin:2px;padding:3px",@click="alterCharge(1)")
        span.glyphicon.glyphicon-plus
        | 1
      button.btn.btn-sm.btn-success(type="button",style="margin:2px;padding:3px",@click="alterCharge(10)")
        span.glyphicon.glyphicon-plus
        | 10
  div.form-group(:class='{"has-error": errors.expire}')
    label.control-label.col-sm-2 有效期至:
    div.col-sm-4(data-toggle="tooltip",data-placement="right",:title="errors.expire")
      date-picker(v-model='expire')
  div.form-group(:class='{"has-error": errors.type}')
    label.control-label.col-sm-2 类型:
    div.col-sm-5(data-toggle="tooltip",data-placement="right",:title="errors.type")
      select.form-control(name="card_type",v-model='type')
        option(value='ALL') 通用卡
        option(value='LIMITED') 限定卡
  div.form-group(v-show='isLimitedCard')
    label.control-label.col-sm-2 可用教室:
    div#roomlist.col-sm-10
      div.checkbox(v-for='r in classrooms')
        label
          input(type="checkbox", :value='r.id',v-model='room')
          {{r.name}}
  div.form-group
    div.col-sm-offset-2.col-sm-10
      button.btn.btn-success(type='button',v-on:click='onSave',:disabled='hasError') 保存
</template>

<script>
/**
 * --------------------------------------------------------------------------
 * card.vue component for membership card
 * --------------------------------------------------------------------------
 */

var date_picker = require('./date-picker.vue');

module.exports = {
    components: {
        'date-picker': date_picker
    },
    props: {
        index: Number, // index of membership card
        item: Object, // object of membership card object
        classrooms: Array // Array of available classroom
    },
    data: function() {
        return {
            delta: 0,
            type: this.item.type,
            // Fix a bug, there is some invalid date which has boolean value
            room: typeof (this.item.room) === 'boolean' ? [] : this.item.room,
            expire: this.item.expire ? moment(this.item.expire) : null
        };
    },
    watch: {
        'item': function() {
            this.delta = 0;
        }
    },
    computed: {
        isLimitedCard: function() {
            return this.type === 'LIMITED';
        },
        errors: function() {
            var errors = {};
            if (typeof (this.delta) !== 'number')
                errors.delta = '增加/减少的课时数不正确';
            if (!this.expire || !this.expire.isValid())
                errors.expire = '请指定会员有效期';
            if (!this.type)
                errors.type = '请选择会员卡类型';
            return errors;
        },
        hasError: function() {
            var errors = this.errors
            return Object.keys(errors).some(function(key) {
                return true;
            })
        }
    },
    filters: {
        formatCredit: function(value) {
            var n = Math.round(value * 10) / 10;
            return n === 0 ? 0 : n; // handle the "-0" case
        }
    },
    methods: {
        alterCharge: function(value) {
            if (typeof (this.delta) !== 'number') {
                this.delta = parseFloat(this.delta) || 0;
            }
            this.delta += value;
        },
        onSave: function() {
            if (this.hasError) return;
            var toBeSaved = {
                "type": this.type,
                "room": this.room,
                "expire": this.expire && this.expire.toISOString(),
                "credit": this.item.credit + this.delta
            };
            this.$emit("save", toBeSaved, this.index);
        }
    },
    mounted: function() {
        //var vm = this;
    }
};
</script>