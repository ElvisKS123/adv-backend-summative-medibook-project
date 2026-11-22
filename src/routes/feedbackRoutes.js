const express = require('express');
const controller = require('../controllers/feedbackController');

const router = express.Router();

router.get('/', controller.showFeedbackForm);

module.exports = router;
