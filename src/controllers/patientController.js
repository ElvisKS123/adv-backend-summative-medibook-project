const patientModel = require('../models/patientModel');
const HttpError = require('../utils/httpError');
const { parseId, validatePatient } = require('../utils/validators');

async function findPatientOrFail(idParam) {
  const id = parseId(idParam);
  if (!id) throw new HttpError(400, 'Patient id must be a positive integer');

  const patient = await patientModel.findById(id);
  if (!patient) throw new HttpError(404, 'Patient not found');
  return patient;
}

function checkBody(body) {
  const errors = validatePatient(body);
  if (errors.length > 0) throw new HttpError(400, 'Invalid patient data', { details: errors });
}

async function getAllPatients(req, res) {
  res.json(await patientModel.findAll());
}

async function getPatient(req, res) {
  res.json(await findPatientOrFail(req.params.id));
}

async function createPatient(req, res) {
  checkBody(req.body);
  const patient = await patientModel.create(req.body);
  res.status(201).json(patient);
}

async function updatePatient(req, res) {
  const patient = await findPatientOrFail(req.params.id);
  checkBody(req.body);
  res.json(await patientModel.update(patient.id, req.body));
}

async function deletePatient(req, res) {
  const patient = await findPatientOrFail(req.params.id);
  await patientModel.remove(patient.id);
  res.status(204).end();
}

module.exports = { getAllPatients, getPatient, createPatient, updatePatient, deletePatient };
