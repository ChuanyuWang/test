var express = require('express');
var router = express.Router();
var mongojs = require('mongojs');
var helper = require('../../helper');

var NORMAL_FIELDS = {
};

// Below APIs are visible to anonymous users

router.get('/', function(req, res, next) {
    //return next(new Error("Not implementation"));
    res.json([
        {
            "_id": "1",
            "name": "123",
            "createDate": "2017-02-26T02:00:00Z",
            "date": "2017-02-27T02:00:00Z",
            "status": "inprogress",
            "remark": "summar only",
            "classroom": "room1",
            "members": [
                { "id": "123", "name": "Hellen" },
                { "id": "456", "name": "Peter" }
            ]
        },
        {
            "_id": "2",
            "name": "456",
            "createDate": "2017-02-25T02:00:00Z",
            "date": "2017-03-27T02:00:00Z",
            "status": "closed",
            "remark": "winter only",
            "classroom": "room2",
            "members": [
                { "id": "123", "name": "Hellen" },
                { "id": "456", "name": "Peter" },
                { "id": "789", "name": "Joey" }
            ]
        }
    ]);
});

router.get('/:courseID', function(req, res, next) {
    //return next(new Error("Not implementation"));
    switch (req.params.courseID) {
        case '1':
            res.json({
                "_id": "1",
                "name": "123",
                "createDate": "2017-02-26T02:00:00Z",
                "date": "2017-02-27T02:00:00Z",
                "status": "inprogress",
                "remark": "summar only",
                "classroom": "room1",
                "members": [
                    { "id": "123", "name": "Hellen" },
                    { "id": "456", "name": "Peter" }
                ]
            });
            break;
        case '2':
            res.json({
                "_id": "2",
                "name": "456",
                "createDate": "2017-02-25T02:00:00Z",
                "date": "2017-03-27T02:00:00Z",
                "status": "closed",
                "remark": "winter only",
                "classroom": "room2",
                "members": [
                    { "id": "123", "name": "Hellen" },
                    { "id": "456", "name": "Peter" },
                    { "id": "789", "name": "Joey" }
                ]
            });
            break;
        default:
            res.json();
            break;
    }
});

/// Below APIs are visible to authenticated users only
router.all(helper.isAuthenticated);

/// Below APIs are only visible to authenticated users with 'admin' role
router.all(helper.requireRole("admin"));

router.post('/', function(req, res, next) {
    return next(new Error("Not implementation"));
});

router.patch('/:courseID', function(req, res, next) {
    return next(new Error("Not implementation"));
});

router.delete('/:courseID', function(req, res, next) {
    return next(new Error("Not implementation"));
});

module.exports = router;
