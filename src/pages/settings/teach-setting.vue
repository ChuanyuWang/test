<template lang="pug">
div.row
  teach-list.col-sm-3(:data='data',style='padding-top:15px',@selectedChange='selectionChangedListener',@add='addUnsaveOne',ref='teachList')
  teach-detail.col-sm-9(:data='selectedTeacher',style='padding-top:15px',@update='saveChange',@create='addTeacher',@delete='removeTeacher')
</template>

<script>
/**
 * --------------------------------------------------------------------------
 * teach-setting display a panel for teacher settings
 * --------------------------------------------------------------------------
 */

import teacher_list from "./teach-list.vue";
import teacher_detail from "./teach-detail.vue";
import teacher_service from "../../services/teachers";

export default {
  name: "teacher-setting",
  props: {
    //data: Array // array of teacher object
  },
  data: function() {
    return {
      selectedIndex: -1,
      data: [] // loaded in created event
    };
  },
  components: {
    "teach-list": teacher_list,
    "teach-detail": teacher_detail
  },
  computed: {
    selectedTeacher: function() {
      return this.data[this.selectedIndex];
    }
  },
  filters: {},
  methods: {
    selectionChangedListener: function(index, oldIndex) {
      this.selectedIndex = index;
    },
    saveChange: function(params) {
      var vm = this;
      var request = teacher_service.update(params._id, params);
      request.done(function(data, textStatus, jqXHR) {
        vm.data.splice(vm.selectedIndex, 1, data);
      });
    },
    addUnsaveOne: function() {
      this.data.push({ name: "", status: "active" });
      this.$refs.teachList.setSelectedIndex(this.data.length - 1);
    },
    addTeacher: function(params) {
      var vm = this;
      var request = teacher_service.add(params);
      request.done(function(data, textStatus, jqXHR) {
        vm.data.splice(vm.selectedIndex, 1, data);
      });
    },
    removeTeacher: function(id) {
      var vm = this;
      if (!id && vm.selectedIndex > -1) {
        // remove unsaved teacher after creating
        vm.data.splice(vm.selectedIndex, 1);
        return;
      }
      var request = teacher_service.remove(id);
      request.done(function(data, textStatus, jqXHR) {
        if (data.deletedCount === 1) {
          // teacher is deleted
          vm.data.splice(vm.selectedIndex, 1);
        } else {
          // teacher's status is marked as deleted
          vm.data.splice(vm.selectedIndex, 1, data);
        }
      });
    }
  },
  created: function() {
    var vm = this;
    var request = teacher_service.getAll();
    request.done(function(data, textStatus, jqXHR) {
      vm.data = data || [];
    });
  }
};
</script>

<style lang='less'></style>
