<style>

</style>

<template lang="jade">
div.row
  teach-list.panel.col-sm-3(:data='dummyData',style='padding-top:15px',@selectedChange='selectionChangedListener',@add='addUnsaveOne',ref='teachList')
  teach-detail.col-sm-9(:data='selectedTeacher',style='padding-top:15px',@update='saveChange',@create='addTeacher',@delete='removeTeacher')
</template>

<script>
/**
 * --------------------------------------------------------------------------
 * teach-setting display a panel for teacher settings
 * --------------------------------------------------------------------------
 */

var teacher_list = require("./teach-list.vue");
var teacher_detail = require("./teach-detail.vue");

module.exports = {
  name: "teacher-setting",
  props: {
    data: Array // array of class object
  },
  data: function() {
    return {
      dummyData: [
        {
          name: "老师1",
          _id: "1",
          status: "active",
          birthday: "2014-12-22T11:46:34.136Z"
        },
        { name: "老师2的名字比较长非常长", _id: "2", status: "inactive" },
        { name: "Bill Gates", _id: "3", status: "active" },
        { name: "deleted one", _id: "4", status: "deleted" }
      ],
      selectedIndex: -1
    };
  },
  components: {
    "teach-list": teacher_list,
    "teach-detail": teacher_detail
  },
  computed: {
    selectedTeacher: function() {
      return this.dummyData[this.selectedIndex];
    }
  },
  filters: {},
  methods: {
    selectionChangedListener: function(index, oldIndex) {
      this.selectedIndex = index;
    },
    saveChange: function(params) {
      this.dummyData.splice(this.selectedIndex, 1, params);
    },
    addUnsaveOne: function() {
      this.dummyData.push({ name: "", status: "inactive" });
      this.$refs.teachList.setSelectedIndex(this.dummyData.length - 1);
    },
    addTeacher: function(params) {
      console.log(params);
      params._id = Math.random() + '';
      this.dummyData.splice(this.selectedIndex, 1, params);
    },
    removeTeacher: function(id) {
      this.dummyData.splice(this.selectedIndex, 1);
    }
  }
};
</script>