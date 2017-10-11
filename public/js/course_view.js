/* Copyright 2016-2017 Chuanyu Wang */
(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var Vue // late bind
var version
var map = (window.__VUE_HOT_MAP__ = Object.create(null))
var installed = false
var isBrowserify = false
var initHookName = 'beforeCreate'

exports.install = function (vue, browserify) {
  if (installed) { return }
  installed = true

  Vue = vue.__esModule ? vue.default : vue
  version = Vue.version.split('.').map(Number)
  isBrowserify = browserify

  // compat with < 2.0.0-alpha.7
  if (Vue.config._lifecycleHooks.indexOf('init') > -1) {
    initHookName = 'init'
  }

  exports.compatible = version[0] >= 2
  if (!exports.compatible) {
    console.warn(
      '[HMR] You are using a version of vue-hot-reload-api that is ' +
        'only compatible with Vue.js core ^2.0.0.'
    )
    return
  }
}

/**
 * Create a record for a hot module, which keeps track of its constructor
 * and instances
 *
 * @param {String} id
 * @param {Object} options
 */

exports.createRecord = function (id, options) {
  var Ctor = null
  if (typeof options === 'function') {
    Ctor = options
    options = Ctor.options
  }
  makeOptionsHot(id, options)
  map[id] = {
    Ctor: Ctor,
    options: options,
    instances: []
  }
}

/**
 * Make a Component options object hot.
 *
 * @param {String} id
 * @param {Object} options
 */

function makeOptionsHot(id, options) {
  injectHook(options, initHookName, function() {
    var record = map[id]
    if (!record.Ctor) {
      record.Ctor = this.constructor
    }
    record.instances.push(this)
  })
  injectHook(options, 'beforeDestroy', function() {
    var instances = map[id].instances
    instances.splice(instances.indexOf(this), 1)
  })
}

/**
 * Inject a hook to a hot reloadable component so that
 * we can keep track of it.
 *
 * @param {Object} options
 * @param {String} name
 * @param {Function} hook
 */

function injectHook(options, name, hook) {
  var existing = options[name]
  options[name] = existing
    ? Array.isArray(existing) ? existing.concat(hook) : [existing, hook]
    : [hook]
}

function tryWrap(fn) {
  return function (id, arg) {
    try {
      fn(id, arg)
    } catch (e) {
      console.error(e)
      console.warn(
        'Something went wrong during Vue component hot-reload. Full reload required.'
      )
    }
  }
}

exports.rerender = tryWrap(function (id, options) {
  var record = map[id]
  if (!options) {
    record.instances.slice().forEach(function (instance) {
      instance.$forceUpdate()
    })
    return
  }
  if (typeof options === 'function') {
    options = options.options
  }
  if (record.Ctor) {
    record.Ctor.options.render = options.render
    record.Ctor.options.staticRenderFns = options.staticRenderFns
    record.instances.slice().forEach(function (instance) {
      instance.$options.render = options.render
      instance.$options.staticRenderFns = options.staticRenderFns
      instance._staticTrees = [] // reset static trees
      instance.$forceUpdate()
    })
  } else {
    record.options.render = options.render
    record.options.staticRenderFns = options.staticRenderFns
  }
})

exports.reload = tryWrap(function (id, options) {
  var record = map[id]
  if (options) {
    if (typeof options === 'function') {
      options = options.options
    }
    makeOptionsHot(id, options)
    if (record.Ctor) {
      if (version[1] < 2) {
        // preserve pre 2.2 behavior for global mixin handling
        record.Ctor.extendOptions = options
      }
      var newCtor = record.Ctor.super.extend(options)
      record.Ctor.options = newCtor.options
      record.Ctor.cid = newCtor.cid
      record.Ctor.prototype = newCtor.prototype
      if (newCtor.release) {
        // temporary global mixin strategy used in < 2.0.0-alpha.6
        newCtor.release()
      }
    } else {
      for (var key in record.options) {
        if (!(key in options)) {
          delete record.options[key]
        }
      }
      for (var key$1 in options) {
        record.options[key$1] = options[key$1]
      }
    }
  }
  record.instances.slice().forEach(function (instance) {
    if (instance.$vnode && instance.$vnode.context) {
      instance.$vnode.context.$forceUpdate()
    } else {
      console.warn(
        'Root or manually mounted instance modified. Full reload required.'
      )
    }
  })
})

},{}],2:[function(require,module,exports){
/**
 * --------------------------------------------------------------------------
 * add-multi-class-modal.js component for add multi classes modal dailog
 * --------------------------------------------------------------------------
 */

module.exports = {
    template: '#add-multi-class-modal-template',
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
                room: typeof(this.room) === 'string' && this.room.length > 0,
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
            $('#add-multi-class-modal').modal('show')
        },
        handleOK: function() {
            if (this.isValid) {
                this.$emit("ok", this.$data);
                $('#add-multi-class-modal').modal('hide');
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
},{}],3:[function(require,module,exports){
/**
 * --------------------------------------------------------------------------
 * member-select-modal.js component for select one or multi members
 * --------------------------------------------------------------------------
 */

module.exports = {
    template: '#member-select-modal-template',
    props: {
        multiSelection: {
            type: Boolean,
            default: false
        }
    },
    data: function() {
        return {};
    },
    watch: {
    },
    computed: {
    },
    filters: {
    },
    methods: {
        show: function(selectedIDs) {
            // clear existed selected items
            var selections = $(this.$el).find('table.member-table').bootstrapTable('getAllSelections');
            selections = selections.map(function(value) {
                return value._id;
            });
            $(this.$el).find('table.member-table').bootstrapTable('uncheckBy', { field: '_id', values: selections });
            if (selectedIDs && selectedIDs.length) {
                // select the pass in ones
                $(this.$el).find('table.member-table').bootstrapTable('checkBy', { field: '_id', values: selectedIDs });
            }
            $(this.$el).modal('show');
        },
        handleOK: function() {
            $(this.$el).modal('hide');
            var selections = $(this.$el).find('table.member-table').bootstrapTable('getAllSelections');
            this.$emit("ok", selections);
        },
        creditFormatter: function(value, row, index) {
            var membership = row.membership;
            if (membership && membership[0]) {
                // A better way of 'toFixed(1)'
                if (typeof (membership[0].credit) == 'number') {
                    var n = Math.round(membership[0].credit * 10) / 10;
                    return n === 0 ? 0 : n; // handle the "-0" case
                } else {
                    return membership[0].credit;
                }
            } else {
                return undefined;
            }
        }
    },
    mounted: function() {
        var vm = this;
        $(vm.$el).find('table.member-table').bootstrapTable({
            url: '/api/members?status=active', // only display active members
            locale: 'zh-CN',
            columns: [{}, {}, {}, {
                formatter: vm.creditFormatter
            }]
        });
    }
};
},{}],4:[function(require,module,exports){
/**
 * --------------------------------------------------------------------------
 * show-booking-result-modal.js component for display the booking result
 * --------------------------------------------------------------------------
 */

module.exports = {
    template: '#show-booking-result-modal-template',
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
},{}],5:[function(require,module,exports){
(function (global){
;(function(){
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//


module.exports = {
  props: {
    courseid: String // course id
  },
  data: function() {
    return {
      name: '' // member name
    };
  },
  watch: {},
  computed: {
    errors: function() {
      var errors = {};
      return errors;
    },
    hasError: function() {
      var errors = this.errors
      return Object.keys(errors).some(function(key) {
        return true;
      })
    }
  },
  filters: {},
  methods: {
    show: function(value) {
      // TODO, clear error
      $(this.$el).modal('show');
    },
    handleOK: function() {
      if (this.hasError) return;

      this.$emit("ok", this.$data);
      $(this.$el).modal('hide');
    }
  },
  mounted: function() {
    // 'this' is refer to vm instance
    //var vm = this;
  }
};

})()
if (module.exports.__esModule) module.exports = module.exports.default
var __vue__options__ = (typeof module.exports === "function"? module.exports.options: module.exports)
if (__vue__options__.functional) {console.error("[vueify] functional components are not supported and should be defined in plain js files using render functions.")}
__vue__options__.render = function render () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',{staticClass:"modal fade",attrs:{"tabindex":"-1","data-backdrop":"static"}},[_c('div',{staticClass:"modal-dialog"},[_c('div',{staticClass:"modal-content"},[_c('div',{staticClass:"modal-header"},[_vm._m(0),_c('h4',{staticClass:"modal-title"},[_vm._v(_vm._s(_vm.$t('view_member_course_title')))])]),_c('div',{staticClass:"modal-body"},[_c('form',{staticClass:"form-horizontal"},[_c('div',{staticClass:"form-group"},[_c('label',{staticClass:"control-label col-sm-2"},[_vm._v(_vm._s(_vm.$t('member_name')))]),_c('div',{staticClass:"col-sm-6"},[_c('p',{staticClass:"form-control-static"},[_vm._v(_vm._s(_vm.name))])])])]),_c('div',[_c('ul',{staticClass:"nav nav-tabs",attrs:{"role":"tablist"}},[_c('li',{staticClass:"active"},[_c('a',{attrs:{"data-toggle":"tab","href":"#notstarted"}},[_vm._v(_vm._s(_vm.$t('not_started')))])]),_c('li',[_c('a',{attrs:{"data-toggle":"tab","href":"#completed"}},[_vm._v(_vm._s(_vm.$t('completed')))])])]),_vm._m(1)])]),_c('div',{staticClass:"modal-footer"},[_c('button',{staticClass:"btn btn-default",attrs:{"type":"button","data-dismiss":"modal"}},[_vm._v(_vm._s(_vm.$t('dialog_cancel')))]),_c('button',{staticClass:"btn btn-success",attrs:{"type":"button"},on:{"click":_vm.handleOK}},[_vm._v(_vm._s(_vm.$t('dialog_ok')))])])])])])}
__vue__options__.staticRenderFns = [function render () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('button',{staticClass:"close",attrs:{"type":"button","data-dismiss":"modal","aria-label":"Close"}},[_c('span',{attrs:{"aria-hidden":"true"}},[_vm._v("×")])])},function render () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',{staticClass:"tab-content"},[_c('div',{staticClass:"tab-pane active",attrs:{"id":"notstarted"}},[_c('p',[_vm._v("abc")])]),_c('div',{staticClass:"tab-pane",attrs:{"id":"completed"}},[_c('p',[_vm._v("456")])])])}]
if (module.hot) {(function () {  var hotAPI = require("vue-hot-reload-api")
  hotAPI.install((typeof window !== "undefined" ? window['Vue'] : typeof global !== "undefined" ? global['Vue'] : null), true)
  if (!hotAPI.compatible) return
  module.hot.accept()
  if (!module.hot.data) {
    hotAPI.createRecord("data-v-39f7d529", __vue__options__)
  } else {
    hotAPI.reload("data-v-39f7d529", __vue__options__)
  }
})()}
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"vue-hot-reload-api":1}],6:[function(require,module,exports){
/**
 * --------------------------------------------------------------------------
 * course_view.js 
 * Entry module of view course page
 * --------------------------------------------------------------------------
 */
var i18nextplugin = require('./locales/i18nextplugin');
var course_service = require('./services/courses');
var add_multi_class_modal = require('./components/add-multi-class-modal');
var view_member_course_modal = require('./components/view-member-course-modal.vue');
var show_booking_result_modal = require('./components/show-booking-result-modal');
var member_select_modal = require('./components/member-select-modal');

var viewData = {
    course: {},
    classrooms: {}
}

// DOM Ready =============================================================
$(document).ready(function() {
    init();

    //get list of classroom
    $('#roomList option').each(function(index, element) {
        viewData.classrooms[element.value] = element.text;
    });

    var request = course_service.getCourse($('#course_app').data('course-id'));
    request.done(function(data, textStatus, jqXHR) {
        viewData.course = data || {};

        // bootstrap the course view page
        new Vue({ extends: courseApp, data: viewData, el: '#course_app' });
    });
    request.done(function(data, textStatus, jqXHR) {
        loadCourseClasses(data);
    });
});

// Functions =============================================================

function init() {
    console.log("course_view moudle init...");
    // load the i18next plugin to Vue
    Vue.use(i18nextplugin);
    //TODO, localization 
    moment.locale('zh-CN');
    bootbox.setLocale('zh_CN');
}

var courseApp = {
    components: {
        'add-multi-class-modal': add_multi_class_modal,
        'view-member-course-modal': view_member_course_modal,
        'show-booking-result-modal': show_booking_result_modal,
        'member-select-modal': member_select_modal
    },
    computed: {
        membersCount: function() {
            return this.course.members ? this.course.members.length : 0;
        },
        classesCount: function() {
            return this.course.classes ? this.course.classes.length : 0;
        },
        completedClassesCount: function() {
            var now = moment(), count = 0;
            this.sortedClasses.some(function(value, index, array) {
                if (moment(value.date).isBefore(now)) count++;
                else return true;
            });
            return count;
        },
        sortedClasses: function() {
            var classes = this.course.classes || [];
            return classes.sort(function(a, b) {
                if (moment(a.date).isSameOrBefore(b.date)) return -1;
                else return 1;
            });
        },
        progressStatus: function() {
            var progress = {}, vm = this;
            var members = this.course.members || [];
            if (members.length == 0) return progress;
            var now = moment();

            members.forEach(function(member, index, array) {
                var status = {
                    done: 0,
                    absent: 0,
                    left: 0,
                    uninvolved: 0,
                    total: vm.sortedClasses.length
                };
                vm.sortedClasses.forEach(function(cls, index, array) {
                    if (vm.isAbsent(cls, member)) {
                        if (moment(cls.date).isSameOrBefore(now)) status.absent++;
                        else status.uninvolved++;
                    } else {
                        if (moment(cls.date).isSameOrBefore(now)) status.done++;
                        else status.left++;
                    }
                })
                //status.total = status.done + status.absent + status.left + status.uninvolved;
                progress[member.id] = status;
            });
            return progress;
        },
        errors: function() {
            var errors = {};
            if (this.course.name.length == 0)
                errors.name = '名称不能为空';
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
        formatDate: function(value) {
            if (!value) return '?';
            return moment(value).format('ll');
        },
        formatDateTime: function(value) {
            if (!value) return '?';
            return moment(value).format('lll');
        },
        formatClassroom: function(value) {
            return viewData.classrooms[value];
        }
    },
    watch: {},
    methods: {
        isAbsent: function(cls, member) {
            var booking = cls.booking || [];
            var hasReservation = function(value, index, array) {
                return value.member === member.id;
            };
            return !booking.some(hasReservation);
        },
        saveBasicInfo: function() {
            if (this.hasError) return false;
            var request = course_service.updateCourse(this.course._id, {
                status: this.course.status,
                name: this.course.name,
                classroom: this.course.classroom,
                remark: this.course.remark
            });
            request.done(function(data, textStatus, jqXHR) {
                bootbox.alert('班级基本资料更新成功');
            });
        },
        deleteCourse: function() {
            var vm = this;
            bootbox.confirm({
                title: "确定删除班级吗？",
                message: "班级中所有课程，包括已经开始的课程都将被删除，不保留记录",
                buttons: {
                    confirm: {
                        className: "btn-danger"
                    }
                },
                callback: function(ok) {
                    if (ok) {
                        var request = course_service.removeCourse(vm.course._id);
                        request.done(function(data, textStatus, jqXHR) {
                            window.location.href = '../course';
                        });
                    }
                }
            });
        },
        showAddClassDlg: function() {
            this.$refs.modal.room = this.course.classroom;
            this.$refs.modal.show();
        },
        showAddMemberDlg: function(params) {
            var checkedItems = (this.course.members||[]).map(function(value, index, array) {
                return value.id
            });
            this.$refs.memberSelectDlg.show(checkedItems);
        },
        genClassNames: function(count) {
            var count = count || 0;
            var result = [];
            var existed = viewData.course.classes || [];
            var suffix = existed.length + 1;
            for (var i = 0; i < count; i++) {
                var name = viewData.course.name + '-' + suffix;
                while (existed.some(function(val, index, array) {
                    return val.name == name;
                })) {
                    suffix++;
                    name = viewData.course.name + '-' + suffix;
                }
                result.push(name);
                suffix++;
            }
            return result;
        },
        genRepeatClass: function(datetime, startdate, enddate, days) {
            var dates = [];
            var current = moment(startdate);
            while (current.isSameOrBefore(enddate)) {
                if (days.some(function(value, index, array) {
                    return value == current.day();
                })) {
                    var date = moment(current).set({
                        'hours': datetime.hours(),
                        'minutes': datetime.minutes(),
                        'seconds': datetime.seconds(),
                        'milliseconds': datetime.milliseconds()
                    });
                    dates.push(date);
                }
                current.add(1, 'day');
            }
            var names = this.genClassNames(dates.length);
            return names.map(function(value, index, array) {
                return {
                    name: value,
                    date: dates[index].toISOString()
                }
            });
        },
        addClass: function(options) {
            var vm = this;
            var datetime = options.date;
            var result = [];
            if (options.isRepeated) {
                var startdate = options.begin;
                var enddate = options.end;
                var days = options.weekdays || [];
                if (enddate.diff(startdate, 'days') > 180) return bootbox.alert('开始和结束日期不能超过180天');
                result = this.genRepeatClass(datetime, startdate, enddate, days);
            } else {
                result.push({
                    name: this.genClassNames(1)[0],
                    date: datetime.toISOString()
                });
            }
            if (result.length === 0) return bootbox.alert('没有符合所选条件的课程');
            // assign classroom
            result.forEach(function(value, index, array) {
                value.classroom = options.room;
                value.cost = options.cost;
            })
            // create classes
            var request = course_service.addCourseClasses(viewData.course._id, result);
            request.done(function(data, textStatus, jqXHR) {
                var addedClasses = data.addedClasses || [];
                addedClasses.forEach(function(value, index, array) {
                    vm.course.classes.push(value);
                });
                vm.$refs.summaryDlg.show(data.result || {});
                //bootbox.alert('班级课程添加成功');
            });
        },
        removeClass: function(item) {
            var vm = this;
            bootbox.confirm({
                title: "删除课程",
                message: '删除' + moment(item.date).format('ll dddd') + ' 课程吗?<br><small>同时返还相关课时到预约会员的会员卡中</small>',
                buttons: {
                    confirm: {
                        className: "btn-danger"
                    }
                },
                callback: function(ok) {
                    if (!ok) return;
                    var request = course_service.removeCourseClasses(vm.course._id, { 'id': item._id });
                    request.done(function(data, textStatus, jqXHR) {
                        var classes = vm.course.classes;
                        for (var i = 0; i < classes.length; i++) {
                            if (classes[i]._id == item._id) {
                                classes.splice(i, 1);
                                break;
                            }
                        }
                        //bootbox.alert('删除班级课程成功');
                    });
                }
            });
        },
        addMembers: function(selectedMembers) {
            var vm = this;
            var members = this.course.members || [];
            var addedOnes = selectedMembers.filter(function(element, index, array) {
                // filter the new added member
                return !members.some(function(value, index, array) {
                    // find one matched member and return true
                    return value.id == element._id;
                });
            });
        
            if (addedOnes.length > 0) {
                // initialize members property
                if (!this.course.hasOwnProperty('members')) {
                    Vue.set(this.course, 'members', [])
                }
                var result = addedOnes.map(function(value, index, array) {
                    return {
                        id: value._id,
                        name: value.name
                    };
                });
        
                var request = course_service.addCourseMembers(viewData.course._id, result);
                request.done(function(data, textStatus, jqXHR) {
                    result.forEach(function(value, index, array) {
                        vm.course.members.push(value);
                    });
                    vm.course.classes = data.updateClasses || [];
                    vm.$refs.summaryDlg.show(data.result || {});
                    //bootbox.alert('添加班级成员成功');
                });
            }
        },
        removeMember: function(item) {
            var vm = this;
            bootbox.confirm({
                title: "移除班级成员",
                message: '从班级中移除' + item.name + '，并取消此成员所有未开始的课程吗?<br><small>同时返还相关课时到会员卡中</small>',
                buttons: {
                    confirm: {
                        className: "btn-danger"
                    }
                },
                callback: function(ok) {
                    if (!ok) return;
                    var request = course_service.removeCourseMember(vm.course._id, { 'id': item.id });
                    request.done(function(data, textStatus, jqXHR) {
                        var members = vm.course.members;
                        for (var i = 0; i < members.length; i++) {
                            if (members[i].id == item.id) {
                                members.splice(i, 1);
                                break;
                            }
                        }
                        //bootbox.alert('删除班级成员成功');
                    });
                }
            });
        },
        closeAlert: function(e) {
            if (this.course.status == 'closed') {
                bootbox.alert({
                    message: "结束此班级后会删除所有未开始的课程<br><small>确定后，请点击保存进行修改</small>",
                    buttons: {
                        ok: {
                            label: "确定",
                            className: "btn-danger"
                        }
                    }
                });
            }
        },
        showMemberCourse: function(member) {
            //TODO
            //alert(member)
            this.$refs.assignClassDlg.name = member.name;
            this.$refs.assignClassDlg.show();
        }
    },
    mounted: function() {
        // 'this' is refer to vm instance
        var vm = this;
        $(vm.$el).find('#birth_date').datetimepicker({
            format: 'll',
            locale: 'zh-CN'
        });

        $(vm.$el).find('#birth_date').on('dp.change', function(e) {
            // when user clears the input box, the 'e.date' is false value
            vm.birth = e.date === false ? null : e.date;
        });
    }
};

function loadCourseClasses(course) {
    if (!course) return;
    var request = course_service.getCourseClasses(course._id);
    request.done(function(data, textStatus, jqXHR) {
        // initialize classes property
        if (!course.hasOwnProperty('classes')) {
            Vue.set(course, 'classes', [])
        }
        data.forEach(function(value, index, array) {
            course.classes.push(value);
        });
    });
}
},{"./components/add-multi-class-modal":2,"./components/member-select-modal":3,"./components/show-booking-result-modal":4,"./components/view-member-course-modal.vue":5,"./locales/i18nextplugin":9,"./services/courses":11}],7:[function(require,module,exports){
module.exports={
}
},{}],8:[function(require,module,exports){
/* eslint-disable */
/**
 * --------------------------------------------------------------------------
 * This is a i18next language detection plugin use to detect user language in the browser
 * https://github.com/i18next/i18next-browser-languageDetector
 * --------------------------------------------------------------------------
 */
!function(e,t){"object"==typeof exports&&"undefined"!=typeof module?module.exports=t():"function"==typeof define&&define.amd?define(t):e.i18nextBrowserLanguageDetector=t()}(this,function(){"use strict";function e(e){return a.call(i.call(arguments,1),function(t){if(t)for(var o in t)void 0===e[o]&&(e[o]=t[o])}),e}function t(){return{order:["querystring","cookie","localStorage","navigator","htmlTag"],lookupQuerystring:"lng",lookupCookie:"i18next",lookupLocalStorage:"i18nextLng",caches:["localStorage"]}}var o={};o.classCallCheck=function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")},o.createClass=function(){function e(e,t){for(var o=0;o<t.length;o++){var n=t[o];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(e,n.key,n)}}return function(t,o,n){return o&&e(t.prototype,o),n&&e(t,n),t}}();var n=[],a=n.forEach,i=n.slice,r={create:function(e,t,o,n){var a=void 0;if(o){var i=new Date;i.setTime(i.getTime()+60*o*1e3),a="; expires="+i.toGMTString()}else a="";n=n?"domain="+n+";":"",document.cookie=e+"="+t+a+";"+n+"path=/"},read:function(e){for(var t=e+"=",o=document.cookie.split(";"),n=0;n<o.length;n++){for(var a=o[n];" "===a.charAt(0);)a=a.substring(1,a.length);if(0===a.indexOf(t))return a.substring(t.length,a.length)}return null},remove:function(e){this.create(e,"",-1)}},u={name:"cookie",lookup:function(e){var t=void 0;if(e.lookupCookie&&"undefined"!=typeof document){var o=r.read(e.lookupCookie);o&&(t=o)}return t},cacheUserLanguage:function(e,t){t.lookupCookie&&"undefined"!=typeof document&&r.create(t.lookupCookie,e,t.cookieMinutes,t.cookieDomain)}},c={name:"querystring",lookup:function(e){var t=void 0;if("undefined"!=typeof window)for(var o=window.location.search.substring(1),n=o.split("&"),a=0;a<n.length;a++){var i=n[a].indexOf("=");if(i>0){var r=n[a].substring(0,i);r===e.lookupQuerystring&&(t=n[a].substring(i+1))}}return t}},l=void 0;try{l="undefined"!==window&&null!==window.localStorage;var s="i18next.translate.boo";window.localStorage.setItem(s,"foo"),window.localStorage.removeItem(s)}catch(g){l=!1}var f={name:"localStorage",lookup:function(e){var t=void 0;if(e.lookupLocalStorage&&l){var o=window.localStorage.getItem(e.lookupLocalStorage);o&&(t=o)}return t},cacheUserLanguage:function(e,t){t.lookupLocalStorage&&l&&window.localStorage.setItem(t.lookupLocalStorage,e)}},d={name:"navigator",lookup:function(e){var t=[];if("undefined"!=typeof navigator){if(navigator.languages)for(var o=0;o<navigator.languages.length;o++)t.push(navigator.languages[o]);navigator.userLanguage&&t.push(navigator.userLanguage),navigator.language&&t.push(navigator.language)}return t.length>0?t:void 0}},v={name:"htmlTag",lookup:function(e){var t=void 0,o=e.htmlTag||("undefined"!=typeof document?document.documentElement:null);return o&&"function"==typeof o.getAttribute&&(t=o.getAttribute("lang")),t}},h=function(){function n(e){var t=arguments.length<=1||void 0===arguments[1]?{}:arguments[1];o.classCallCheck(this,n),this.type="languageDetector",this.detectors={},this.init(e,t)}return o.createClass(n,[{key:"init",value:function(o){var n=arguments.length<=1||void 0===arguments[1]?{}:arguments[1],a=arguments.length<=2||void 0===arguments[2]?{}:arguments[2];this.services=o,this.options=e(n,this.options||{},t()),this.i18nOptions=a,this.addDetector(u),this.addDetector(c),this.addDetector(f),this.addDetector(d),this.addDetector(v)}},{key:"addDetector",value:function(e){this.detectors[e.name]=e}},{key:"detect",value:function(e){var t=this;e||(e=this.options.order);var o=[];e.forEach(function(e){if(t.detectors[e]){var n=t.detectors[e].lookup(t.options);n&&"string"==typeof n&&(n=[n]),n&&(o=o.concat(n))}});var n=void 0;return o.forEach(function(e){if(!n){var o=t.services.languageUtils.formatLanguageCode(e);t.services.languageUtils.isWhitelisted(o)&&(n=o)}}),n||this.i18nOptions.fallbackLng[0]}},{key:"cacheUserLanguage",value:function(e,t){var o=this;t||(t=this.options.caches),t&&t.forEach(function(t){o.detectors[t]&&o.detectors[t].cacheUserLanguage(e,o.options)})}}]),n}();return h.type="languageDetector",h});
},{}],9:[function(require,module,exports){
/**
 * --------------------------------------------------------------------------
 * i18nextplugin.js is Vue plugin provide global function t (i18next) to Vue
 * --------------------------------------------------------------------------
 */

var i18nextBrowserLanguageDetector = require('./i18nextBrowserLanguageDetector.min');

var resources = {
    'en': { translation: require('./en') },
    'zh': { translation: require('./zh_CN') }
};

var i18nextPlugin = {
    install: function(Vue, options) {
        if (i18next) {
            i18next.use(i18nextBrowserLanguageDetector).init({
                fallbackLng: "zh",
                resources: resources,
                detection: { lookupQuerystring: 'lang' }
            }, function(err, t) {
                if (err) return console.error('init i18next with error' + err);
                Vue.i18next = i18next; // append the global function 'i18next' to Vue
                Vue.prototype.$t = t; // an instance method 't'
            });
        } else {
            console.error('i18next is not found');
        }
    }
};

module.exports = i18nextPlugin;

},{"./en":7,"./i18nextBrowserLanguageDetector.min":8,"./zh_CN":10}],10:[function(require,module,exports){
module.exports={
  "member_name": "姓名",
  "member_contact": "联系方式",
  "dialog_ok": "确定",
  "dialog_cancel": "取消",
  "completed": "已结束",
  "not_started": "未开始",
  "view_member_course_title": "分配会员在此班级的课程"
}
},{}],11:[function(require,module,exports){
/**
 * --------------------------------------------------------------------------
 * courses.js provide API for courses service
 * --------------------------------------------------------------------------
 */

var util = require('./util');

var service = {};

/**
 * Retrieve course object according to ID
 * 
 * @param {String} courseID 
 */
service.getCourse = function(courseID) {
    var request = $.getJSON('/api/courses/' + courseID, null);
    request.fail(function(jqXHR, textStatus, errorThrown) {
        util.showAlert('获取班级失败', jqXHR);
    })
    return request;
};

service.updateCourse = function(courseID, fields) {
    var request = $.ajax("/api/courses/" + courseID, {
        type: "PATCH",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(fields),
        dataType: "json"
    });
    request.fail(function(jqXHR, textStatus, errorThrown) {
        util.showAlert("更新班级失败", jqXHR);
    })
    return request;
};

service.addCourseMembers = function(courseID, fields) {
    var request = $.ajax("/api/courses/" + courseID + '/members', {
        type: "POST",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(fields),
        dataType: "json"
    });
    request.fail(function(jqXHR, textStatus, errorThrown) {
        util.showAlert("添加班级成员失败", jqXHR);
    })
    return request;
};

service.removeCourseMember = function(courseID, fields) {
    var request = $.ajax("/api/courses/" + courseID + '/members', {
        type: "DELETE",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(fields),
        dataType: "json"
    });
    request.fail(function(jqXHR, textStatus, errorThrown) {
        util.showAlert("删除班级成员失败", jqXHR);
    })
    return request;
};

service.addCourseClasses = function(courseID, fields) {
    var request = $.ajax("/api/courses/" + courseID + '/classes', {
        type: "POST",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(fields),
        dataType: "json"
    });
    request.fail(function(jqXHR, textStatus, errorThrown) {
        util.showAlert("添加课程失败", jqXHR);
    })
    return request;
};

service.removeCourseClasses = function(courseID, fields) {
    var request = $.ajax("/api/courses/" + courseID + '/classes', {
        type: "DELETE",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(fields),
        dataType: "json"
    });
    request.fail(function(jqXHR, textStatus, errorThrown) {
        util.showAlert("删除班级课程失败", jqXHR);
    })
    return request;
};

service.removeCourse = function(courseID, fields) {
    var request = $.ajax("/api/courses/" + courseID, {
        type: "DELETE",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(fields),
        dataType: "json"
    });
    request.fail(function(jqXHR, textStatus, errorThrown) {
        util.showAlert("删除班级失败", jqXHR);
    })
    return request;
};

service.getCourseClasses = function(courseID) {
    var request = $.getJSON('/api/classes', { 'courseID': courseID });
    request.fail(function(jqXHR, textStatus, errorThrown) {
        util.showAlert('获取班级课程失败', jqXHR);
    })
    return request;
};

module.exports = service;
},{"./util":12}],12:[function(require,module,exports){
/**
 * --------------------------------------------------------------------------
 * util.js provide common utils for all services
 * --------------------------------------------------------------------------
 */
 
var util = {};

/**
 * 
 * @param {String} title error dialog title
 * @param {Object} jqXHR XHR object of jQuery ajax call
 * @param {String} className default is 'btn-danger'
 */
util.showAlert = function(title, jqXHR, className) {
    //console.error(jqXHR);
    bootbox.alert({
        message: jqXHR.responseJSON ? jqXHR.responseJSON.message : jqXHR.responseText,
        title: title || '错误',
        buttons: {
            ok: {
                label: "确定",
                // alert dialog with danger button by default
                className: className || "btn-danger"
            }
        }
    });
};

module.exports = util;

},{}]},{},[6]);
