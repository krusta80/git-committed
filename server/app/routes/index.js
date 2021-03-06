'use strict';
var router = require('express').Router();
module.exports = router;

router.use('/members', require('./members'));
router.use('/users', require('./users'));
router.use('/addresses', require('./addresses'));
router.use('/orders', require('./orders'));
router.use('/categories', require('./categories'));
router.use('/products', require('./products'));
router.use('/reviews', require('./reviews'));

// Make sure this is after all of
// the registered routes!
router.use(function (req, res) {
    res.status(404).end();
});



