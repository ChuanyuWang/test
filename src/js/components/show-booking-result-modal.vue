/**
 * --------------------------------------------------------------------------
 * view-member-course-modal.js modal dailog for view member's classes of one course
 * --------------------------------------------------------------------------
 */

<style>

</style>

<template lang="jade">
div.modal.fade(tabindex='-1',data-backdrop='static')
  div.modal-dialog
    div.modal-content
      div.modal-header
        button.close(type="button",data-dismiss="modal",aria-label="Close")
          span(aria-hidden="true") &times
        h4.modal-title {{$t('booking_summary_title')}}
      div.modal-body(style='max-height:600px;overflow:auto')
        p(style='color:#777') {{$t('booking_summary_description')}}
        div(style='margin-bottom:7px').panel.panel-success
          div.panel-heading {{$t('booking_successful_summary')}}
            span.badge(style='margin-left:3px') {{newBookingCount}}
          div.panel-body(style='padding:7px')
            ul(style='padding-left:25px')
              li(v-for='cls in result.classSummary') {{cls.name}}
                span.badge(style='margin-left:3px;background-color:#50a751') {{cls.newbookings.length}}人
                ul(style='padding-left:25px')
                  li(v-for='value in cls.newbookings') 会员{{value.member | getMemberName(result)}}预约成功（1人）
        div(style='margin-bottom:7px').panel.panel-danger
          div.panel-heading {{$t('booking_fail_summary')}}
            span.badge(style='margin-left:3px') {{failBookingCount}}
          div.panel-body(style='padding:7px')
            ul(style='padding-left:25px')
              li(v-for='(member, id) in result.memberSummary',v-if='member.errors.length')
                a(:href='"../member/" + id',target='_blank') {{member.name}}
                span.badge(style='margin-left:3px;background-color:#d25957') {{member.errors.length}}节
                ul(style='padding-left:25px')
                  li(v-for='value in member.errors') 预约课程{{value.class}}失败(1人)</br><i>{{value.message}}</i>
      div.modal-footer
        button.btn.btn-default(type="button",data-dismiss="modal") {{$t('dialog_ok')}}
</template>

<script>

module.exports = {
    props: {
    },
    data: function() {
        return {
            result: {} // the result of adding members/classes into course
        };
    },
    watch: {
    },
    computed: {
        newBookingCount: function() {
            var count = 0;
            var classSummary = this.result.classSummary || {};
            Object.keys(classSummary).forEach(function(classID) {
                var res = classSummary[classID];
                count += res.newbookings.length;
            });
            return count;
        },
        failBookingCount: function() {
            var count = 0;
            var memberSummary = this.result.memberSummary || {};
            Object.keys(memberSummary).forEach(function(memberID) {
                var res = memberSummary[memberID];
                count += res.errors.length;
            });
            return count;
        }
    },
    filters: {
        getMemberName: function(value, result) {
            var memberSummary = result.memberSummary || {};
            if (!value) return ''
            return memberSummary[value].name;
        }
    },
    methods: {
        show: function(result) {
            this.result = result || {};
            $(this.$el).modal('show');
        }
    },
    mounted: function() {
    }
};
</script>