/* Copyright 2016-2017 Chuanyu Wang */
(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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

},{}],2:[function(require,module,exports){
/**
 * --------------------------------------------------------------------------
 * setting.js setting page main entry module
 * --------------------------------------------------------------------------
 */
var util = require('./services/util');
var consumeChart = null;
var passiveChart = null;

// DOM Ready =============================================================
$(document).ready(function() {
    init();
});

// Functions =============================================================

function init() {
    //moment.locale('zh-CN');
    bootbox.setLocale('zh_CN');

    // register vintage Theme for echarts
    var colorPalette = ['#d87c7c', '#919e8b', '#d7ab82', '#6e7074', '#61a0a8', '#efa18d', '#787464', '#cc7e63', '#724e58', '#4b565b'];
    echarts.registerTheme('vintage', {
        color: colorPalette,
        backgroundColor: '#00000',
        graph: {
            color: colorPalette
        }
    });

    // initialize chart instance
    consumeChart = echarts.init(document.getElementById('consume_chart'), 'vintage');
    passiveChart = echarts.init(document.getElementById('chart2'), 'vintage');
    passiveChart2 = echarts.init(document.getElementById('chart3'), 'vintage');
    passiveChart3 = echarts.init(document.getElementById('chart4'), 'vintage');

    // initialize the classroom table
    $('#classroom_table').bootstrapTable({
        locale: 'zh-CN',
        url: '/api/setting/classrooms',
        columns: [{}, {}, {
            formatter: visibilityFormatter
        }, {
            formatter: actionFormatter,
            events: handleActions
        }]
    });

    $('#clsroom_dlg').on('show.bs.modal', function(event) {
        var button = $(event.relatedTarget); // Button that triggered the modal
        if (button.data('action') == "add") {
            // create a new classroom
            var modal = $(this);
            modal.find('.modal-title').text("添加教室");
            modal.find('input[name=id]').val("").prop("disabled", false).closest(".form-group").removeClass("has-error");
            modal.find('input[name=name]').val("").closest(".form-group").removeClass("has-error");

            modal.find('#add_room').show();
            modal.find('#edit_room').hide();
        }
    });

    $('#add_room').click(handleAddNewClassRoom);
    $('#edit_room').click(handleEditClassRoom);
    $('#saveBasic').click(handleSaveBasic);
    // handle user refresh the chart
    $('div.tab-pane#analytics #refresh').click(refreshChart);
    // handle user change the chart filters
    $('div.tab-pane#analytics select').change(function(event) {
        refreshChart();
    });
    // refresh the chart when user switch to analytics tab first time
    $('a[href="#analytics"]').one('shown.bs.tab', function(e) {
        refreshChart();
        //e.target // newly activated tab
        //e.relatedTarget // previous active tab
    });
    // refresh the chart when user switch to analytics tab first time
    $('a[href="#hint"]').one('shown.bs.tab', function(e) {
        refreshPassiveChart();
    });
};

function handleSaveBasic(event) {
    var form = $(this).closest('form');
    var basicInfo = {};
    // validate the input
    var hasError = false;

    // get the tenant contact
    basicInfo.contact = form.find('input[name=contact]').val().trim();
    if (!basicInfo.contact || basicInfo.contact.length == 0) {
        form.find('input[name=contact]').closest(".form-group").addClass("has-error");
        hasError = true;
    } else {
        form.find('input[name=contact]').closest(".form-group").removeClass("has-error");
    }

    // get the tenant address
    basicInfo.address = form.find('input[name=address]').val().trim();
    if (!basicInfo.address || basicInfo.address.length == 0) {
        form.find('input[name=address]').closest(".form-group").addClass("has-error");
        hasError = true;
    } else {
        form.find('input[name=address]').closest(".form-group").removeClass("has-error");
    }

    if (hasError) return;

    var request = $.ajax("/api/setting/basic", {
        type: "PATCH",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(basicInfo),
        dataType: "json"
    });
    request.fail(function(jqXHR, textStatus, errorThrown) {
        util.showAlert("更新综合设置失败", jqXHR);
    });
};

function handleAddNewClassRoom(event) {
    var modal = $(this).closest('.modal');
    var newRoom = {};

    // validate the input
    var hasError = false;
    // get the classroom id
    newRoom.id = modal.find('input[name=id]').val().trim();
    if (!newRoom.id || newRoom.id.length == 0) {
        modal.find('input[name=id]').closest(".form-group").addClass("has-error");
        hasError = true;
    } else {
        modal.find('input[name=id]').closest(".form-group").removeClass("has-error");
    }
    // get the classroom name
    newRoom.name = modal.find('input[name=name]').val().trim();
    if (!newRoom.name || newRoom.name.length == 0) {
        modal.find('input[name=name]').closest(".form-group").addClass("has-error");
        hasError = true;
    } else {
        modal.find('input[name=name]').closest(".form-group").removeClass("has-error");
    }

    // get the classroom visibility
    newRoom.visibility = modal.find('input[name=visibility]:checked').val();

    if (!hasError) {
        modal.modal('hide');
        addNewClassroom(newRoom);
    }
};

function handleEditClassRoom(event) {
    var modal = $(this).closest('.modal');
    var room = {};

    // validate the input
    var hasError = false;
    // get the classroom id
    room.id = modal.find('input[name=id]').val().trim();
    // get the classroom name
    room.name = modal.find('input[name=name]').val().trim();
    if (!room.name || room.name.length == 0) {
        modal.find('input[name=name]').closest(".form-group").addClass("has-error");
        hasError = true;
    } else {
        modal.find('input[name=name]').closest(".form-group").removeClass("has-error");
    }

    // get the classroom visibility
    room.visibility = modal.find('input[name=visibility]:checked').val();

    if (!hasError) {
        modal.modal('hide');
        var request = editClassroom(room);
        request.done(function(data, textStatus, jqXHR) {
            $('#classroom_table').bootstrapTable('refresh');
        });
    }
};

function addNewClassroom(room) {
    $.ajax("/api/setting/classrooms", {
        type: "POST",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(room),
        success: function(data) {
            $('#classroom_table').bootstrapTable('insertRow', { index: 0, row: room });
        },
        error: function(jqXHR, status, err) {
            util.showAlert("添加教室失败", jqXHR);
        },
        dataType: "json"
    });
};

function editClassroom(room) {
    var request = $.ajax("/api/setting/classrooms/" + room.id, {
        type: "PATCH",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(room),
        dataType: "json"
    });
    request.fail(function(jqXHR, textStatus, errorThrown) {
        util.showAlert("修改教室失败", jqXHR);
    });
    return request;
};

function refreshChart() {
    var filter = {
        "unit": $("div#analytics select#unit").val(),
        "year": parseInt($("div#analytics select#year").val())
    };

    var drawChartFunc = function(consumptionQueryResult, depositQueryResult) {
        if (filter.unit == "month") {
            drawChart(preChartData(consumptionQueryResult[0], depositQueryResult[0]), filter.year, '月');
        } else if (filter.unit == "week") {
            drawChart(preChartData(consumptionQueryResult[0], depositQueryResult[0]), filter.year, '周');
        }
    };

    var errorFunc = function(jqXHR, textStatus, errorThrown) {
        util.showAlert("刷新图表失败", jqXHR);
    };

    //Execute the function drawChartFunc when both ajax requests are successful, or errorFunc if either one has an error.
    // errorFunc is called only once even if both ajax requests have error
    var consumptionQuery = $.get("/api/analytics/consumption", filter, "json");
    var depositQuery = $.get("/api/analytics/deposit", filter, "json");
    $.when(consumptionQuery, depositQuery).then(drawChartFunc, errorFunc);
};

function preChartData(consumptionData, depositData) {
    var chartData = {
        xAxis: [],
        series0: [], // consumption value list
        series1: []  // deposit value list
    };

    if (!consumptionData && !depositData) {
        return chartData;
    }

    var i = 0, j = 0;
    while (i < consumptionData.length || j < depositData.length) {
        var c = i < consumptionData.length ? consumptionData[i] : null;
        var d = j < depositData.length ? depositData[j] : null;

        if (c && d) {
            if (c._id == d._id) {
                chartData.xAxis.push(c._id);
                chartData.series0.push(Math.round(c.total * 10) / 10);
                chartData.series1.push(Math.round(d.total * 10) / 10);
                i++;
                j++;
            } else if (c._id < d._id) {
                chartData.xAxis.push(c._id);
                chartData.series0.push(Math.round(c.total * 10) / 10);
                chartData.series1.push(0);
                i++;
            } else if (c._id > d._id) {
                chartData.xAxis.push(d._id);
                chartData.series0.push(0);
                chartData.series1.push(Math.round(d.total * 10) / 10);
                j++;
            }
        } else if (c) {
            chartData.xAxis.push(c._id);
            chartData.series0.push(Math.round(c.total * 10) / 10);
            chartData.series1.push(0);
            i++;
        } else if (d) {
            chartData.xAxis.push(d._id);
            chartData.series0.push(0);
            chartData.series1.push(Math.round(d.total * 10) / 10);
            j++;
        }
    }

    return chartData;
};

function drawChart(data, year, unitName) {
    // resize the chart according to its parent dom size
    consumeChart.resize();
    // define the options of charts
    var option = {
        title: {
            text: year + '年课时消费明细',
            top: 'top',
            left: 'center'
        },
        tooltip: {
            trigger: 'axis'
        },
        toolbox: {
            feature: {
                dataView: { readOnly: true }
            }
        },
        legend: {
            data: ['消费课时', "充值课时"],
            top: 'bottom'
        },
        xAxis: {
            name: unitName,
            data: data.xAxis
        },
        yAxis: {
            name: "课时"
        },
        series: [{
            name: '消费课时',
            type: 'bar',
            barGap: 0,
            data: data.series0
        }, {
            name: '充值课时',
            type: 'bar',
            data: data.series1
        }]
    };

    // Apply the chart options to create/update chart instance
    consumeChart.setOption(option);
};

function refreshPassiveChart() {
    // all effective members, {'<id>':{_id:String, membership:Object,since:string,name:String,contact:String}}
    var effectiveMembers = {}; // default value
    var request = $.get("/api/analytics/passive", null, "json");
    request.done(function(data, textStatus, jqXHR) {
        var rawUserData = data.effectiveMembers || [];
        rawUserData.forEach(function(value, index, array) {
            effectiveMembers[value._id] = value;
        });
    });
    request.done(function(data, textStatus, jqXHR) {
        var userList = [], chartData = [];
        var lastBook = data.lastBook || [];
        // the lastBook is sorted from newest to oldest at server side
        for (var i = 0; i < lastBook.length; i++) {
            var value = lastBook[i];
            effectiveMembers[value._id].hasBooking = true;
            var last = moment(value.last);
            var toNow = moment().diff(last, 'days');
            if (toNow <= 0) continue; // ignore negative
            userList.push(effectiveMembers[value._id].name);
            chartData.push(toNow);
        }
        renderPassiveChart1(userList, chartData);
        renderPassiveChart2(effectiveMembers);
        renderPassiveChart3(effectiveMembers);
    });
    request.fail(function(jqXHR, textStatus, errorThrown) {
        util.showAlert("刷新图表失败", jqXHR);
    });
};

function renderPassiveChart1(userList, chartData) {
    // only display the top 20
    var topN = 20;
    if (userList.length > topN) {
        userList.splice(0, userList.length - topN);
        chartData.splice(0, chartData.length - topN);
    }
    // resize the chart according to its parent dom size
    passiveChart.resize();
    // define the options of charts
    var option = {
        title: {
            text: '长期未约课会员排名-前20',
            subtext: '(不包含过期或未激活会员)',
            top: 'top',
            left: 'center'
        },
        tooltip: {
            trigger: 'axis'
        },
        toolbox: {
            feature: {
                dataView: { readOnly: true }
            }
        },
        legend: {
            data: ['未约课天数'],
            top: 'bottom'
        },
        xAxis: {
            name: "天",
            type: 'value'
        },
        yAxis: {
            name: "宝宝姓名",
            type: 'category',
            data: userList,
        },
        series: [{
            name: '未约课天数',
            type: 'bar',
            barGap: 0,
            data: chartData
        }]
    };

    // Apply the chart options to create/update chart instance
    passiveChart.setOption(option);
};

function renderPassiveChart2(all) {
    var noBookingUsers = [];
    var users = Object.keys(all);
    for (var i = 0; i < users.length; i++) {
        if (!all[users[i]].hasBooking) {
            noBookingUsers.push(all[users[i]]);
        }
    }
    var sortBySince = function(a, b) {
        if (moment(a.since).isBefore(b.since)) return 1;
        else return -1;
    };
    noBookingUsers.sort(sortBySince);
    var userList = [], chartData = [];
    // skip less two weeks
    noBookingUsers.forEach(function(value, index, array) {
        var off = moment().diff(value.since, 'days');
        if (off > 14) {
            userList.push(value.name);
            chartData.push(off);
        }
    });
    // resize the chart according to its parent dom size
    passiveChart2.resize();
    // define the options of charts
    var option = {
        title: {
            text: '新会员未约课排名-2周以上',
            subtext: '(不包含过期或未激活会员)',
            top: 'top',
            left: 'center'
        },
        tooltip: {
            trigger: 'axis'
        },
        toolbox: {
            feature: {
                dataView: { readOnly: true }
            }
        },
        legend: {
            data: ['未约课天数'],
            top: 'bottom'
        },
        xAxis: {
            name: "天",
            type: 'value'
        },
        yAxis: {
            name: "宝宝姓名",
            type: 'category',
            data: userList,
        },
        series: [{
            name: '未约课天数',
            type: 'bar',
            barGap: 0,
            data: chartData
        }]
    };

    // Apply the chart options to create/update chart instance
    passiveChart2.setOption(option);
};

function round(value) {
    return Math.round(value * 10) / 10;
}

function renderPassiveChart3(all) {
    // refer to http://echarts.baidu.com/demo.html#scatter-aqi-color
    var chartData = [];
    var now = moment();
    var users = Object.keys(all);
    for (var i = 0; i < users.length; i++) {
        var user = all[users[i]];
        var card = user.membership[0];
        var days2expire = moment(card.expire).diff(now, 'days');
        if (days2expire > 100) continue;
        days2expire = days2expire == 0 ? 1 : days2expire;
        chartData.push([days2expire, round(card.credit), round(card.credit / days2expire), user.name]);
    }
    // resize the chart according to its parent dom size
    passiveChart3.resize();
    // define the options of charts
    var option = {
        title: {
            text: '课时在有效期内分布-100天内',
            subtext: '(不包含过期或未激活会员)',
            top: 'top',
            left: 'center'
        },
        tooltip: {
            borderWidth: 1,
            formatter: function(obj) {
                var value = obj.value;
                return '<div style="border-bottom: 1px solid rgba(255,255,255,.3); font-size: 18px;padding-bottom: 7px;margin-bottom: 7px">'
                    + '会员：' + value[3]
                    + '</div>'
                    + '过期天数：' + value[0] + '<br>'
                    + '剩余课时：' + value[1] + '<br>'
                    + 'CPD：' + value[2] + '<br>';
            }
        },
        grid: {
            x2: 120
        },
        visualMap: [
            {
                left: 'right',
                top: '20%',
                dimension: 2,
                min: 0.1,
                max: 1,
                itemWidth: 30,
                itemHeight: 120,
                calculable: true,
                precision: 0.01,
                text: ['CPD-消费压力\n(课时/剩余天数)'],
                textGap: 30,
                inRange: {
                    symbolSize: [10, 70]
                },
                outOfRange: {
                    symbolSize: [10, 70],
                    color: ['rgba(4,4,4,.5)']
                },
                controller: {
                    inRange: {
                        color: ['#c23531']
                    },
                    outOfRange: {
                        color: ['#444']
                    }
                },
                formatter: function (value) {
                    return Math.round(value * 10) / 10; // 范围标签显示内容
                }
            }
        ],
        toolbox: {
            feature: {
                dataView: { readOnly: true }
            }
        },
        legend: {
            data: ['会员分布'],
            top: 'bottom'
        },
        xAxis: {
            name: "过期天数",
            type: 'value',
            nameLocation: 'middle'
        },
        yAxis: {
            name: "剩余课时",
            type: 'value'
        },
        series: [{
            name: '会员分布',
            type: 'scatter',
            data: chartData
        }]
    };

    // Apply the chart options to create/update chart instance
    passiveChart3.setOption(option);
};

function visibilityFormatter(value, row, index) {
    if (value == 'internal') return '是';
    else return '否';
};

function actionFormatter(value, row, index) {
    return [
        '<button type="button" class="edit-room btn btn-primary btn-xs">',
        '  <span class="glyphicon glyphicon-edit"></span> 修改',
        '</button>',
        '<button type="button" style="margin-left:6px" class="remove-room btn btn-danger btn-xs">',
        '  <span class="glyphicon glyphicon-trash"></span> 删除',
        '</button>'
    ].join('');
};

// event handler defined in setting.jade file for removing classroom
var handleActions = {
    'click .remove-room': function(e, value, row, index) {
        bootbox.confirm({
            message: "确定永久删除此教室吗？<br><small>删除后，教室中的课程将无法显示或预约，并且已经预约的课时也不会返还到会员卡中</small>",
            callback: function(ok) {
                if (!ok) return;

                $.ajax("/api/setting/classrooms/" + row.id, {
                    type: "DELETE",
                    contentType: "application/json; charset=utf-8",
                    data: {},
                    success: function(data) {
                        if (data && data.n == 1 && data.ok == 1) {
                            $('#classroom_table').bootstrapTable('removeByUniqueId', row.id);
                        } else {
                            console.error("remove class room " + row.id + " fails");
                        }
                    },
                    error: function(jqXHR, status, err) {
                        util.showAlert("删除教室失败", jqXHR);
                    },
                    dataType: "json"
                });
            },
            buttons: {
                confirm: {
                    className: "btn-danger"
                }
            }
        });
    },
    'click .edit-room': function(e, value, row, index) {
        // edit a classroom
        var modal = $('#clsroom_dlg');
        modal.find('.modal-title').text("修改教室");
        modal.find('input[name=id]').val(row.id).prop("disabled", true).closest(".form-group").removeClass("has-error");
        modal.find('input[name=name]').val(row.name).closest(".form-group").removeClass("has-error");
        modal.find('input[name=visibility]').prop('checked', row.visibility == 'internal');
        modal.find('#add_room').hide();
        modal.find('#edit_room').show();

        modal.modal('show');
    }
};
},{"./services/util":1}]},{},[2]);
