const express = require('express');
const controller = require('../controllers/patientController');

const router = express.Router();

router.get('/', controller.getAllPatients);
router.get('/:id', controller.getPatient);
router.post('/', controller.createPatient);
router.put('/:id', controller.updatePatient);
router.delete('/:id', controller.deletePatient);

module.exports = router;
