<style lang='less'>
.selected-teacher {
  border-right: 2px solid #337ab7;
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

<template lang="pug">
div
  template(v-for='(teacher, index) in data')
    div.media.teacher-list-item(@click='setSelectedIndex(index)',:class='[index === selectedIndex ? "selected-teacher" : ""]')
      div.media-left
        a(href='#')
          //img.media-object(src='/img/user.png')
          span.glyphicon.glyphicon-user(:class='{"deleted-teacher":teacher.status === "deleted", "text-danger": teacher.status === "inactive"}')
      div.media-body
        h5.media-heading {{teacher.name}}
        p(v-if='!teacher._id') <未保存>
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

module.exports = {
  props: {
    data: Array // array of teacher object
  },
  data: function() {
    return {
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