const express = require('express');
const controller = require('../controllers/waitlistController');

const router = express.Router();

router.post('/', controller.joinWaitlist);

module.exports = router;
