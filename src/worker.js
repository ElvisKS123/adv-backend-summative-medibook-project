require('dotenv').config();
const redis = require('./config/redis');
const { bookAppointment } = require('./services/appointmentService');
const { waitlistKey } = require('./services/queueService');
const { logEvent } = require('./utils/auditLogger');
const { parseDateTime } = require('./utils/validators');
const { JOBS_QUEUE, WAITLIST_PROCESSING, WAITLIST_FAILED, JOB_TYPES } = require('./config/constants');

const listener = redis.duplicate();
listener.on('error', (err) => console.error('Redis listener error:', err.message));

async function sendConfirmation(data) {
  await logEvent('CONFIRMATION_SENT', {
    appointment_id: data.appointment_id,
    to: data.email,
    message: `Hi ${data.patient_name}, your appointment with ${data.doctor_name} on ${data.appt_datetime} is confirmed.`,
  });
}

async function returnToWaitlist(entry) {
  const { doctor_id, day } = JSON.parse(entry);
  await redis
    .multi()
    .lPush(waitlistKey(doctor_id, day), entry)
    .lRem(WAITLIST_PROCESSING, 1, entry)
    .exec();
}

async function promoteFromWaitlist({ doctor_id, appt_datetime }) {
  if (parseDateTime(appt_datetime) <= new Date()) return;

  const key = waitlistKey(doctor_id, appt_datetime.slice(0, 10));

  while (true) {
    const entry = await redis.lMove(key, WAITLIST_PROCESSING, 'LEFT', 'RIGHT');
    if (!entry) return;

    const { patient_id } = JSON.parse(entry);
    try {
      const appointment = await bookAppointment(patient_id, doctor_id, appt_datetime);
      await redis.lRem(WAITLIST_PROCESSING, 1, entry);
      await logEvent('WAITLIST_PROMOTED', { appointment_id: appointment.id, patient_id, doctor_id, appt_datetime });
      return;
    } catch (err) {
      await logEvent('WAITLIST_PROMOTION_FAILED', { patient_id, doctor_id, appt_datetime, reason: err.message });

      if (err.status === 404) {
        await redis
          .multi()
          .rPush(WAITLIST_FAILED, entry)
          .lRem(WAITLIST_PROCESSING, 1, entry)
          .exec();
      } else {
        await returnToWaitlist(entry);
        return;
      }
    }
  }
}

async function recoverUnfinished() {
  const entries = await redis.lRange(WAITLIST_PROCESSING, 0, -1);
  for (const entry of entries) {
    await returnToWaitlist(entry);
  }
}

async function handleJob(job) {
  if (job.type === JOB_TYPES.CONFIRMATION) {
    await sendConfirmation(job.data);
  } else if (job.type === JOB_TYPES.SLOT_FREED) {
    await promoteFromWaitlist(job.data);
  } else {
    console.error('Unknown job type:', job.type);
  }
}

async function start() {
  await redis.connect();
  await listener.connect();
  await recoverUnfinished();
  console.log('Worker is waiting for jobs...');

  while (true) {
    const { element } = await listener.blPop(JOBS_QUEUE, 0);
    try {
      const job = JSON.parse(element);
      await handleJob(job);
      console.log(`Processed job: ${job.type}`);
    } catch (err) {
      console.error('Job failed:', err.message);
    }
  }
}

start().catch((err) => {
  console.error('Worker stopped:', err.message);
  process.exit(1);
});
