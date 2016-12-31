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
        var colorPalette = ['#d87c7c','#919e8b', '#d7ab82', '#6e7074','#61a0a8','#efa18d', '#787464', '#cc7e63', '#724e58', '#4b565b'];
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
        $.ajax("api/setting/classrooms", {
            type : "POST",
            contentType : "application/json; charset=utf-8",
            data : JSON.stringify(room),
            success : function (data) {
                $('#classroom_table').bootstrapTable('insertRow', {index: 0, row: room});
            },
            error : function (jqXHR, status, err) {
                bootbox.dialog({
                    message : jqXHR.responseJSON ? jqXHR.responseJSON.message : jqXHR.responseText,
                    title : "添加教室失败",
                    buttons : {
                        danger : {
                            label : "确定",
                            className : "btn-danger",
                        }
                    }
                });
            },
            dataType : "json"
        });
    };

    function refreshChart() {
        var unit = $("div#analytics select#unit").val();
        var year = parseInt($("div#analytics select#year").val());
        $.ajax("api/analytics/consumption", {
            type : "GET",
            //contentType : "application/x-www-form-urlencoded; charset=UTF-8",
            data : {
                "year" : year,
                "unit" : unit
            },
            success : function (data) {
                if (unit == "month") {
                    drawChart(preChartData(data), year, '月');
                } else if (unit == "week") {
                    drawChart(preChartData(data), year, '周');
                }
            },
            error : function (jqXHR, status, err) {
                bootbox.dialog({
                    message : jqXHR.responseJSON ? jqXHR.responseJSON.message : jqXHR.responseText,
                    title : "刷新图表失败",
                    buttons : {
                        danger : {
                            label : "确定",
                            className : "btn-danger",
                        }
                    }
                });
            },
            dataType : "json"
        });
    };

    function preChartData(data) {
        var chartData = {
            xAxis: [],
            series0: []
        };

        if (!data || data.length == 0) {
            return chartData;
        }

        for (var i=0; i<data.length; i++) {
            chartData.xAxis.push(data[i]._id);
            chartData.series0.push(Math.round(data[i].total*10)/10);
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
                    dataView: {readOnly: true}
                }
            },
            legend: {
                data:['消费课时'],
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
                data: data.series0
            }]
        };

        // Apply the chart options to create/update chart instance
        consumeChart.setOption(option);
    };

    // event handler defined in setting.jade file for removing classroom
    window.handleDeleteClassroom = {
        'click .remove' : function (e, value, row, index) {
            bootbox.confirm({ 
                message : "确定永久删除此教室吗？<br><small>删除后，教室中的课程将无法显示或预约，并且已经预约的课时也不会返还到会员卡中</small>", 
                callback : function(result) {
                    if (!result) { // user cancel
                        return ;
                    }

                    $.ajax("api/setting/classrooms/" + row.id, {
                        type : "DELETE",
                        contentType : "application/json; charset=utf-8",
                        data : {},
                        success : function (data) {
                            if (data && data.n == 1 && data.ok == 1) {
                                $('#classroom_table').bootstrapTable('removeByUniqueId', row.id);
                            } else {
                                console.error("remove class room " + row.id + " fails");
                            }
                        },
                        error : function (jqXHR, status, err) {
                            bootbox.dialog({
                                message : jqXHR.responseJSON ? jqXHR.responseJSON.message : jqXHR.responseText,
                                title : "删除教室失败",
                                buttons : {
                                    danger : {
                                        label : "确定",
                                        className : "btn-danger",
                                    }
                                }
                            });
                        },
                        dataType : "json"
                    });
                },
                buttons : {
                    confirm : {
                        className : "btn-danger"
                    }
                }
            });
        }
    };
})(jQuery);
