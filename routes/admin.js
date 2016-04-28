var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function (req, res) {
    res.render('admin');
});

function isAuthenticated(req, res, next) {
    if (req.user) {
        next()
    } else {
        res.status(401).send('Unauthorized Request');
    }
};

module.exports = router;
