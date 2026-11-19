const express = require('express');
const controller = require('../controllers/doctorController');

const router = express.Router();

router.get('/', controller.getAllDoctors);
router.get('/:id', controller.getDoctor);
router.get('/:id/stats', controller.getDoctorStats);
router.post('/', controller.createDoctor);
router.put('/:id', controller.updateDoctor);
router.delete('/:id', controller.deleteDoctor);

module.exports = router;
