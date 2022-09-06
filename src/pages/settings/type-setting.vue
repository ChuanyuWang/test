<template lang="pug">
div.container
  div.row
    div.col-xs-6
      div.btn-group(role='group')
        button.btn.btn-success(type='button',@click='addClassroom()') 添加
      template(v-for='(type, index) in types')
        div.panel.panel-default
          div.panel-heading {{type.name}} 
            button.btn.btn-success.pull-right(type='button',@click='addClassroom()') 添加
            span.label.label-default ABC
          div.panel-body
            div {{type.visiable}}
    div.col-xs-6
      div TBD
</template>

<script>
/**
 * --------------------------------------------------------------------------
 * type-setting display a panel for type settings
 * --------------------------------------------------------------------------
 */

module.exports = {
  name: "type-setting",
  props: {},
  data() {
    return {
      types: [{
        id: "123",
        name: "光影故事屋",
        status: "open",
        visiable: true
      }],
      products: [{
        name: "456",

      }]
    };
  },
  components: {},
  computed: {},
  filters: {},
  methods: {},
  created() { }
};
</script>

<style lang='less'>
</style>
