var express = require('express');
var router = express.Router();
var mongojs = require('mongojs');
var helper = require('../../helper');

var NORMAL_FIELDS = {
};

// Below APIs are visible to anonymous users

router.get('/', function (req, res, next) {
    return next(new Error("Not implementation"));
});

// Below APIs are visible to authenticated users by current tenant
router.all(helper.isAuthenticated);

// Below APIs are only visible to authenticated users with 'admin' role
router.all(helper.requireRole("admin"));

router.post('/', function (req, res, next) {
    return next(new Error("Not implementation"));
});

router.patch('/:courseID', function (req, res, next) {
    return next(new Error("Not implementation"));
});

router.delete ('/:courseID', function (req, res, next) {
    return next(new Error("Not implementation"));
});

module.exports = router;
