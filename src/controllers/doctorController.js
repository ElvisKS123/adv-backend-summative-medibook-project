const doctorModel = require('../models/doctorModel');
const HttpError = require('../utils/httpError');
const { parseId, validateDoctor } = require('../utils/validators');

async function findDoctorOrFail(idParam) {
  const id = parseId(idParam);
  if (!id) throw new HttpError(400, 'Doctor id must be a positive integer');

  const doctor = await doctorModel.findById(id);
  if (!doctor) throw new HttpError(404, 'Doctor not found');
  return doctor;
}

function checkBody(body) {
  const errors = validateDoctor(body);
  if (errors.length > 0) throw new HttpError(400, 'Invalid doctor data', { details: errors });
}

async function getAllDoctors(req, res) {
  res.json(await doctorModel.findAll());
}

async function getDoctor(req, res) {
  res.json(await findDoctorOrFail(req.params.id));
}

async function createDoctor(req, res) {
  checkBody(req.body);
  const doctor = await doctorModel.create(req.body);
  res.status(201).json(doctor);
}

async function updateDoctor(req, res) {
  const doctor = await findDoctorOrFail(req.params.id);
  checkBody(req.body);
  res.json(await doctorModel.update(doctor.id, req.body));
}

async function deleteDoctor(req, res) {
  const doctor = await findDoctorOrFail(req.params.id);
  await doctorModel.remove(doctor.id);
  res.status(204).end();
}

async function getDoctorStats(req, res) {
  const doctor = await findDoctorOrFail(req.params.id);
  const summary = await doctorModel.getSummaryStats(doctor.id);
  const upcomingDays = await doctorModel.getDailyStats(doctor.id);
  res.json({ doctor_id: doctor.id, full_name: doctor.full_name, ...summary, upcoming_days: upcomingDays });
}

module.exports = { getAllDoctors, getDoctor, createDoctor, updateDoctor, deleteDoctor, getDoctorStats };
