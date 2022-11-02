<template lang="pug">
div
  div.page-header
    h3 合约备注
  div.row
    div.col-sm-6
      template(v-for="(comment, key) in comments")
        div.media.ms-3
          div.media-left
            span.glyphicon.glyphicon-comment.text-primary(style="font-size: large; opacity: 0.8")
          div.media-body
            //h4.media-heading(style="font-size: small") Title
            p(style="font-size: small") {{ comment.text }}
            p.small(style="color: #777; position: relative") by {{ comment.author }} at {{ comment.posted | formatDateTime }}
              //a.edit(role="button" v-on:click="editComment(key)" style="margin: -3px 3px; position: absolute")
                i.glyphicon.glyphicon-pencil
      small.pull-right(style="color: #777") 共{{ comments.length }}条备注
    div.col-sm-6
      form.form-horizontal
        div.form-group(:class="{ 'has-error': errors.comment }", :title="errors.comment")
          label.control-label.col-sm-2(style="padding-right:0") 新备注:
          div.col-sm-10
            textarea.form-control.has-3-rows(rows="3" v-model.trim="comment" placeholder="合约备注, 添加后无法修改")
        div.form-group
          div.col-sm-offset-2.col-sm-10
            button.btn.btn-primary(type="button" @click="addComment", :disabled="!comment || hasError") 添加备注
</template>
<script>

var serviceUtil = require("../../services/util");

module.exports = {
  name: "contract-comments",
  props: {
    contractId: {
      type: String,
      require: true
    }
  },
  components: {
    "modal-dialog": require("../../components/modal-dialog.vue").default
  },
  data() {
    return {
      comment: "",
      comments: []
    }
  },
  computed: {
    errors() {
      var errors = {};
      if (this.comment.length > 256)
        errors.comment = "备注不超过256个字";
      return errors;
    },
    hasError() {
      var errors = this.errors
      return Object.keys(errors).some(function(key) {
        return true;
      })
    }
  },
  watch: {},
  filters: {
    formatDateTime: function(value) {
      if (!value) return null;
      return moment(value).format('lll');
    },
  },
  methods: {
    addComment() {
      var item = {
        text: this.comment
      };
      this.comment = "";
      var request = serviceUtil.postJSON("/api/contracts/" + this.contractId + "/comments", item);
      request.done((data, textStatus, jqXHR) => {
        this.comments = data || [];
      });
    }
  },
  created() {
    if (this.contractId) {
      var request = serviceUtil.getJSON("/api/contracts/" + this.contractId + "/comments");
      request.done((data, textStatus, jqXHR) => {
        this.comments = data || [];
      });
    }
  },
  mounted() { }
}
</script>
<style lang="less">

</style>
