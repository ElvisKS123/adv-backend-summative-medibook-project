const express = require('express');
const controller = require('../controllers/appointmentController');

const router = express.Router();

router.post('/', controller.bookAppointment);
router.get('/:id', controller.getAppointment);
router.delete('/:id', controller.cancelAppointment);

module.exports = router;
