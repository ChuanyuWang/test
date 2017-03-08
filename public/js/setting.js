(function ($) {

    var consumeChart = null;

    // DOM Ready =============================================================
    $(document).ready(function () {
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

        $('#clsroom_dlg').on('show.bs.modal', function (event) {
            var button = $(event.relatedTarget); // Button that triggered the modal
            if (button.data('action') == "add") {
                // create a new classroom
                var modal = $(this);
                modal.find('.modal-title').text("添加教室");
                modal.find('input[name=id]').val("").closest(".form-group").removeClass("has-error");
                modal.find('input[name=name]').val("").closest(".form-group").removeClass("has-error");

                modal.find('#add_room').show();
            } else if (button.data('action') == "edit") {
                //TODO
            }
        });

        $('#add_room').click(handleAddNewClassRoom);
        // handle user refresh the chart
        $('#refresh').click(refreshChart);
        // handle user change the chart filters
        $('div.tab-pane#analytics select').change(function (event) {
            refreshChart();
        });
        // refresh the chart when user switch to analytics tab first time
        $('a[href="#analytics"]').on('shown.bs.tab', function (e) {
            refreshChart();
            //e.target // newly activated tab
            //e.relatedTarget // previous active tab
        })
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

        if (!hasError) {
            modal.modal('hide');
            addNewClassroom(newRoom);
        }
    };

    function addNewClassroom(room) {
        $.ajax("/api/setting/classrooms", {
            type: "POST",
            contentType: "application/json; charset=utf-8",
            data: JSON.stringify(room),
            success: function (data) {
                $('#classroom_table').bootstrapTable('insertRow', { index: 0, row: room });
            },
            error: function (jqXHR, status, err) {
                bootbox.dialog({
                    message: jqXHR.responseJSON ? jqXHR.responseJSON.message : jqXHR.responseText,
                    title: "添加教室失败",
                    buttons: {
                        danger: {
                            label: "确定",
                            className: "btn-danger",
                        }
                    }
                });
            },
            dataType: "json"
        });
    };

    function refreshChart() {
        var filter = {
            "unit": $("div#analytics select#unit").val(),
            "year": parseInt($("div#analytics select#year").val())
        };

        var drawChartFunc = function (consumptionQueryResult, depositQueryResult) {
            if (filter.unit == "month") {
                drawChart(preChartData(consumptionQueryResult[0], depositQueryResult[0]), filter.year, '月');
            } else if (filter.unit == "week") {
                drawChart(preChartData(consumptionQueryResult[0], depositQueryResult[0]), filter.year, '周');
            }
        };

        var errorFunc = function (jqXHR, textStatus, errorThrown) {
            bootbox.dialog({
                message: jqXHR.responseJSON ? jqXHR.responseJSON.message : jqXHR.responseText,
                title: "刷新图表失败",
                buttons: {
                    danger: {
                        label: "确定",
                        className: "btn-danger",
                    }
                }
            });
        };

        //Execute the function drawChartFunc when both ajax requests are successful, or errorFunc if either one has an error.
        // errorFunc is called only once even if both ajax requests have error
        var consumptionQuery = $.get("api/analytics/consumption", filter, "json");
        var depositQuery = $.get("api/analytics/deposit", filter, "json");
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

        var i=0,j=0;
        while ( i < consumptionData.length || j < depositData.length ) {
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

    // event handler defined in setting.jade file for removing classroom
    window.handleDeleteClassroom = {
        'click .remove': function (e, value, row, index) {
            bootbox.confirm({
                message: "确定永久删除此教室吗？<br><small>删除后，教室中的课程将无法显示或预约，并且已经预约的课时也不会返还到会员卡中</small>",
                callback: function (result) {
                    if (!result) { // user cancel
                        return;
                    }

                    $.ajax("/api/setting/classrooms/" + row.id, {
                        type: "DELETE",
                        contentType: "application/json; charset=utf-8",
                        data: {},
                        success: function (data) {
                            if (data && data.n == 1 && data.ok == 1) {
                                $('#classroom_table').bootstrapTable('removeByUniqueId', row.id);
                            } else {
                                console.error("remove class room " + row.id + " fails");
                            }
                        },
                        error: function (jqXHR, status, err) {
                            bootbox.dialog({
                                message: jqXHR.responseJSON ? jqXHR.responseJSON.message : jqXHR.responseText,
                                title: "删除教室失败",
                                buttons: {
                                    danger: {
                                        label: "确定",
                                        className: "btn-danger",
                                    }
                                }
                            });
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
        }
    };
})(jQuery);
