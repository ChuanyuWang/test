/* Copyright 2016-2017 Chuanyu Wang */
(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * --------------------------------------------------------------------------
 * course_view.js 
 * Entry module of view course page
 * --------------------------------------------------------------------------
 */

// DOM Ready =============================================================
$(document).ready(function () {
    init();
});

// Functions =============================================================

function init() {
    console.log("course_view moudle init...");
    //TODO, localization 
    moment.locale('zh-CN');
    bootbox.setLocale('zh_CN');
    loadCourse($('#course-root').data('course-id'));
};

/**
 * Retrieve course object according to ID and update the page
 * 
 * @param {String} coureID 
 */
function loadCourse(coureID) {
    if (!ignoreEdit()) return;
    $.get('/api/courses/' + coureID, null, 'json').done(function (data, textStatus, jqXHR) {
        updatePage(data);
    }).fail(function (jqXHR, textStatus, errorThrown) {
        //alert("error");
    }).always(function () {
        //alert("finished");
    });
};

/**
 * Update the page according to course object
 * @param {Object} course 
 */
function updatePage(course) {
    //TODO
    console.log(course);
    updateCourseHead(course);
};

/**
 * Update the head part of page according to course object
 * @param {Object} coure 
 */
function updateCourseHead(course) {
    //TODO
    var head = $('#course-root div.head');
    head.empty();
    head.append(genLabel('名称', course.name ,'name'));
    head.append(genLabel('创建时间', moment(course.createDate).format('ll') ,'createDate'));
    head.append(genLabel('状态', getStatusName(course.status) ,'status'));
};

function getStatusName(value) {
    if (value == "inprogress") return '进行中';
    if (value == "closed") return '结束';
    return value;
};

function genLabel(name, value, prop) {
    return [
        '<div class="row">',
        '  <div class="col-sm-2">',
        '    <label>' + name + ':</label>',
        '  </div>',
        '  <div class="col-sm-8">' + value + '</div>',
        '</div>'
    ].join('');
};

/**
 * Display the warning message if user has unsaved data or change
 * @return {Boolean} true ignore unsaved change;otherwise false
 */
function ignoreEdit() {
    // TODO
    return true;
};
},{}]},{},[1]);
