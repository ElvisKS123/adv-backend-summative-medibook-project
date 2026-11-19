const redis = require('../config/redis');
const HttpError = require('../utils/httpError');
const { JOBS_QUEUE, WAITLIST_PREFIX } = require('../config/constants');

function waitlistKey(doctorId, day) {
  return `${WAITLIST_PREFIX}:${doctorId}:${day}`;
}

async function enqueueJob(type, data) {
  await redis.rPush(JOBS_QUEUE, JSON.stringify({ type, data }));
}

async function addToWaitlist(patientId, doctorId, day) {
  const key = waitlistKey(doctorId, day);
  const entry = JSON.stringify({ patient_id: patientId, doctor_id: doctorId, day });

  const existingPosition = await redis.lPos(key, entry);
  if (existingPosition !== null) {
    throw new HttpError(409, 'Patient is already on the waitlist for this day');
  }
  return redis.rPush(key, entry);
}

module.exports = { waitlistKey, enqueueJob, addToWaitlist };
