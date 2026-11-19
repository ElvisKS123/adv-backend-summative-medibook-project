const appointmentModel = require('../models/appointmentModel');
const appointmentService = require('../services/appointmentService');
const HttpError = require('../utils/httpError');
const { parseId } = require('../utils/validators');

async function bookAppointment(req, res) {
  const { patient_id, doctor_id, appt_datetime } = req.body || {};
  const patientId = parseId(patient_id);
  const doctorId = parseId(doctor_id);
  if (!patientId || !doctorId) {
    throw new HttpError(400, 'patient_id and doctor_id must be positive integers');
  }

  const appointment = await appointmentService.bookAppointment(patientId, doctorId, appt_datetime);
  res.status(201).json(appointment);
}

async function getAppointment(req, res) {
  const id = parseId(req.params.id);
  if (!id) throw new HttpError(400, 'Appointment id must be a positive integer');

  const appointment = await appointmentModel.findById(id);
  if (!appointment) throw new HttpError(404, 'Appointment not found');
  res.json(appointment);
}

async function cancelAppointment(req, res) {
  const id = parseId(req.params.id);
  if (!id) throw new HttpError(400, 'Appointment id must be a positive integer');

  const result = await appointmentService.cancelAppointment(id);
  res.json(result);
}

module.exports = { bookAppointment, getAppointment, cancelAppointment };
