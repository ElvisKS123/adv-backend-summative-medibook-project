const patientModel = require('../models/patientModel');
const doctorModel = require('../models/doctorModel');
const queueService = require('../services/queueService');
const HttpError = require('../utils/httpError');
const { parseId, parseDate } = require('../utils/validators');

async function joinWaitlist(req, res) {
  const { patient_id, doctor_id, day } = req.body || {};
  const patientId = parseId(patient_id);
  const doctorId = parseId(doctor_id);
  if (!patientId || !doctorId) {
    throw new HttpError(400, 'patient_id and doctor_id must be positive integers');
  }

  const date = parseDate(day);
  if (!date) throw new HttpError(400, 'day must be a valid date in the format "YYYY-MM-DD"');

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date < today) throw new HttpError(422, 'Cannot join a waitlist for a past day');

  const patient = await patientModel.findById(patientId);
  if (!patient) throw new HttpError(404, 'Patient not found');

  const doctor = await doctorModel.findById(doctorId);
  if (!doctor) throw new HttpError(404, 'Doctor not found');

  const position = await queueService.addToWaitlist(patientId, doctorId, day);
  res.status(201).json({ message: 'Added to the waitlist', patient_id: patientId, doctor_id: doctorId, day, position });
}

module.exports = { joinWaitlist };
