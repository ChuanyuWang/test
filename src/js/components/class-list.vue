<style>

</style>

<template lang="pug">
div
  template(v-for='classItem in data')
    div.class-item-div(v-bind:class="[reservation(classItem) > 0 ? 'bg-success' : 'bg-info']")
      div.small(style='color:#777;display:flex;justify-content:space-between')
        div
          span.glyphicon.glyphicon-time(style='color:#999;margin-right:1px')
          |{{classItem.date | displayTime}}
        div
          span.glyphicon.glyphicon-user(style='margin:0 2px',:title='reservation(classItem) + "人预约"')
          |{{reservation(classItem)}}
          span.glyphicon.glyphicon-book(style='margin:0 2px',:title='books(classItem) + "本绘本"')
          |{{books(classItem)}}
      div
        p(style='padding-bottom:7px;cursor:pointer',v-on:click='$emit("view", classItem)',title='点击查看课程详情') {{classItem.name}}
      div.btn-group.btn-group-xs(style='align-self:flex-end')
        a.btn.btn-primary(:href='"./class/" + classItem._id')
          |查看
          //span.badge(style='margin-left:3px') {{reservation(classItem)}}
        button.btn.btn-danger(v-on:click='$emit("delete", classItem)',title='删除')
          span.glyphicon.glyphicon-trash
  div(style='display:flex')
    button.btn.btn-xs.btn-default(v-on:click='$emit("add")',style='margin:3px auto;border:none;color:#555',title='创建课程')
      span.glyphicon.glyphicon-plus
</template>

<script>
/**
 * --------------------------------------------------------------------------
 * class-list.js display a list of classes in table > td
 * --------------------------------------------------------------------------
 */

module.exports = {
  props: {
    data: Array // array of class object
  },
  data: function() {
    return {};
  },
  computed: {},
  filters: {
    displayTime: function(date) {
      return moment(date).format('HH:mm');
    }
  },
  methods: {
    reservation: function(cItem) {
      if (cItem) {
        var booking = cItem.booking || [];
        if (booking.length === 0) return 0;
        else {
          var reservation = 0;
          booking.forEach(function(val, index, array) {
            reservation += (val.quantity || 0);
          });
          return reservation;
        }
      } else {
        return undefined;
      }
    },
    books: function(cItem) {
      var books = cItem.books || [];
      return books.length;
    }
  }
};
</script>