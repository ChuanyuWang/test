<template lang="pug">
div(style="padding-right:0")
  div.input-group.mb-7
    span.input-group-addon 状态:
    select.form-control(v-model='filter',style="width:100px")
      option(value='active') {{$t('status_active')}}
      option(value='inactive') {{$t('status_inactive')}}
      option(value='deleted') 已删除
      option(value='all') 全部
  div.media-list(style="height:70vh;overflow:auto")
    template(v-for='(teacher, index) in data')
      div.media.teacher-list-item(@click='setSelectedIndex(index)',:class='[index === selectedIndex ? "selected-teacher" : ""]', v-show='teacher.status === filter || filter === "all"')
        div.media-left
          a(href='#')
            //img.media-object(src='/img/user.png')
            span.glyphicon.glyphicon-user(:class='{"deleted-teacher":teacher.status === "deleted", "text-danger": teacher.status === "inactive"}')
        div.media-body
          h5.media-heading {{teacher.name}}
          div(v-if='!teacher._id') <未保存>
  div(style='display:flex')
    button.btn.btn-default(v-on:click='$emit("add")',style='margin:3px auto;border:none;color:#555',title='添加老师')
      span.glyphicon.glyphicon-plus
</template>

<script>
/**
 * --------------------------------------------------------------------------
 * teacher-list.js display a list of teachers in table > td
 * --------------------------------------------------------------------------
 */

export default {
  props: {
    data: Array // array of teacher object
  },
  data: function() {
    return {
      filter: "active",
      selectedIndex: -1
    };
  },
  computed: {},
  filters: {},
  methods: {
    setSelectedIndex: function(newIndex) {
      var oldSelection = this.selectedIndex;
      this.selectedIndex = typeof newIndex === "number" ? newIndex : -1;
      this.$emit("selectedChange", this.selectedIndex, oldSelection);
    }
  }
};
</script>

<style lang='less'>
.selected-teacher {
  border-right: 4px solid #337ab7;
  color: #337ab7;
}

.teacher-list-item:hover {
  background-color: aliceblue;
  cursor: pointer;
}

.teacher-list-item {
  margin-top: 0px;
  padding: 7px 0px;
}

.deleted-teacher {
  color: #777;
}
</style>
