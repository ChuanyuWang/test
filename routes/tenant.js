var express = require('express');
var router = express.Router();
var helper = require('../helper');

router.get('/booking', function(req, res, next) {
    if (!req.tenant || !req.tenant.name) {
        //tenant not found
        return next();
    }

    // get the list of public rooms
    var all_rooms = req.tenant.classroom || [];
    var public_rooms = all_rooms.filter(function(value, index, array) {
        return value.visibility != 'internal';
    });

    res.render('bqsq/booking', {
        title: '会员约课',
        contact: req.tenant.contact,
        tel: helper.getTel(req.tenant.contact),
        address: req.tenant.address,
        addressLink: req.tenant.addressLink || '#',
        classroom: public_rooms
    });
});

// Functions =============================================================


// Route other request to base pages =====================================

router.use('/course', require('./course'));
router.use(require('./base'));

module.exports = router;
