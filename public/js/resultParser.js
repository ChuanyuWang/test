define([], function() {
    var resultParser = {};

    resultParser.parseResult = function(result, baseline) {
        if (!result.RESULT[0]['content']["primary"]) {
            return resultParser.parseResultInScope(result, baseline, null, 'counter');
        } else {
            var testAim = [];
            testAim = result.RESULT[0]['content']["primary"][0].split('/');
            return resultParser.parseResultInScope(result, baseline, testAim[0], testAim[1]);
        }
    }
    resultParser.parseResultInScope = function(result, baseline, scope, kt) {
        var res = {
            name : result.CASE_NAME,
            data : NaN,
            baseline : NaN,
            diff : NaN,
            CV : 0,
            kValues : NaN,
            bValues : NaN
        };
        if (result.RESULT.length == 0 || !result.RESULT[0]["content"])
            return res;

        if (scope == null) {
            var memoryInfo = parseEndurance(result.RESULT);
            res.data = memoryInfo.leak;
            res.kValues = memoryInfo.k;
            res.bValues = memoryInfo.b;
        } else {
            var resultArray = resultParser.filterExtremeValue(result.RESULT, scope, kt);
            res.data = resultParser.average(resultArray, scope, kt);
            if (baseline) {
                if (baseline.RESULT[0]['content'].hasOwnProperty(scope)) {
                    var baselineArray = resultParser.filterExtremeValue(baseline.RESULT, scope, kt);
                    res.baseline = resultParser.average(baselineArray, scope, kt);
                }
                res.diff = diff(res.baseline, res.data);
            }
            res.CV = calculateCV(resultArray, scope, kt);
        }
        return res;
    }

    resultParser.average = function(testData, timeType, ct) {
        if (testData == null || testData.length == 0) {
            return NaN;
        }
        var total = 0;
        for (var i = 0; i < testData.length; i++) {
            total += Number(testData[i]["content"][timeType][ct]);
        }
        return total / testData.length;
    };

    resultParser.filterExtremeValue = function(testData, testScope, kpiType) {
        if (testData == null || testData.length == 0) {
            return [];
        } else if (testData.length < 6) {
            return testData;
        }
        var sortFn = function(a, b) {
            var value1 = Number(a["content"][testScope][kpiType]);
            var value2 = Number(b["content"][testScope][kpiType]);
            if (value1 > value2)
                return 1;
            else if (value1 < value2)
                return -1;
            else
                return 0;
        };
        // sort the array from small to big
        var data = testData.slice();
        data.sort(sortFn);
        //Box plot
        var isOdd = data.length % 2 == 1 ? true : false;
        var leftData = isOdd ? data.slice(0, (data.length - 1) / 2) : data.slice(0, data.length / 2);
        var rightData = isOdd ? data.slice(leftData.length + 1, data.length) : data.slice(leftData.length, data.length);
        var Q1 = findMid(leftData, leftData.length % 2 == 1 ? true : false, testScope, kpiType);
        var Q2 = findMid(data, isOdd, testScope, kpiType);
        var Q3 = findMid(rightData, rightData.length % 2 == 1 ? true : false, testScope, kpiType);
        var range = Q3 - Q1;
        var minFarout = Q1 - 1.5 * range;
        var maxFarout = Q3 + 1.5 * range;
        if (testScope != null) {
            for (var i = 0; i < data.length; i++) {

                if (data[i]["content"][testScope][kpiType] < minFarout) {
                    var minIndex = i;
                }
                if (data[i]["content"][testScope][kpiType] <= maxFarout) {
                    var maxIndex = i;
                }
            }
        } else {
            for (var i = 0; i < data.length; i++) {

                if (data[i]["content"][kpiType] < minFarout) {
                    var minIndex = i;
                }
                if (data[i]["content"][kpiType] <= maxFarout) {
                    var maxIndex = i;
                }
            }
        }
        return data.slice(minIndex != undefined ? minIndex + 1 : 0, maxIndex < data.length - 1 ? maxIndex + 1 : data.length);
    }
    function findMid(data, isOdd, ct, timeType) {

        return isOdd ? data[(data.length - 1) / 2]["content"][ct][timeType] : (data[(data.length - 2) / 2]["content"][ct][timeType] + data[data.length / 2]["content"][ct][timeType]) / 2;

    }

    // analysis memory leak
    function parseEndurance(testData) {
        if (testData == null || testData.length == 0) {
            return {
                "k" : NaN,
                "leak" : NaN
            };
        }

        var memoryCommit = movingAverage(testData);
        var sumX = 0;
        var sumY = 0;
        var sumXY = 0;
        var sumSquareX = 0;
        var len = memoryCommit.length;
        for (var i = Math.floor(len * 0.3); i < len; i++) {
            var x = i;
            var y = Number(memoryCommit[i]) / (1024 * 1024);
            sumX += x;
            sumY += y;
            sumXY += x * y;
            sumSquareX += x * x;
        }
        var n = Math.ceil(len * 0.7);
        var k = (n * sumXY - sumX * sumY) / (n * sumSquareX - sumX * sumX);
        var b = (sumSquareX * sumY - sumX * sumXY) / (n * sumSquareX - sumX * sumX);
        var y0 = k * Math.floor(len * 0.3) + b;
        var yn = k * (len - 1) + b;
        var memoryLeak = yn - y0;

        return {
            "k" : k,
            "b" : b,
            "leak" : memoryLeak
        };
    };

    function movingAverage(testData) {
        var commitArray = [];
        var window = 2;
        var sum = 0;
        var len = testData[0]["content"]["counter"].length;
        for (var i = 0; i < len; i++) {
            if (i < window) {
                for (var j = 0; j < i + window + 1; j++) {
                    sum += Number(testData[0]["content"]["counter"][j]["memory"]["commit"]);
                }
                commitArray[i] = sum / (i + window + 1);
                sum = 0;
            } else if (i > len - window - 1) {
                for (var j = len - 1; j > i - window - 1; j--) {
                    sum += Number(testData[0]["content"]["counter"][j]["memory"]["commit"]);
                }
                commitArray[i] = sum / (window + len - i);
                sum = 0;
            } else {
                for (var j = i - window; j < i + window + 1; j++) {
                    sum += Number(testData[0]["content"]["counter"][j]["memory"]["commit"]);
                }
                commitArray[i] = sum / (window * 2 + 1);
                sum = 0;
            }
        }
        return commitArray;
    }

    // for performance load testing result
    function calculateCV(testData, testScope, ct) {
        var mean = resultParser.average(testData, testScope, ct);
        var total = 0;
        if (testScope == null) {
            for (var i = 0; i < testData.length; i++) {
                var value = Number(testData[i]["content"][ct]);
                total += (value - mean) * (value - mean);
            }
        } else {
            for (var i = 0; i < testData.length; i++) {
                var value = Number(testData[i]["content"][testScope][ct]);
                total += (value - mean) * (value - mean);
            }
        }
        var SD = Math.sqrt(total / testData.length);
        var CV = SD / mean;
        return CV;
    };

    function diff(base, result) {
        if (!base || !result)
            return NaN;
        return (result - base) / base;
    }

    return resultParser;
});
