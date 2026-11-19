const patientModel = require('../models/patientModel');
const appointmentModel = require('../models/appointmentModel');
const HttpError = require('../utils/httpError');
const { checkSlotRules, parseDateTime, formatDateTime } = require('../utils/validators');
const { calculateRefund } = require('../utils/refund');
const { logEvent } = require('../utils/auditLogger');
const { enqueueJob } = require('./queueService');
const { DAILY_CAP, JOB_TYPES } = require('../config/constants');

async function enqueueSafely(type, data) {
  try {
    await enqueueJob(type, data);
  } catch (err) {
    console.error(`Could not enqueue ${type} job:`, err.message);
  }
}

function waitlistOffer(patientId, doctorId, day) {
  return {
    waitlist: {
      message: 'You can join the waitlist for this doctor and day',
      method: 'POST',
      url: '/api/waitlist',
      body: { patient_id: patientId, doctor_id: doctorId, day },
    },
  };
}

async function bookAppointment(patientId, doctorId, apptDatetimeInput) {
  const apptDate = parseDateTime(apptDatetimeInput);
  if (!apptDate) {
    throw new HttpError(400, 'appt_datetime must be a valid date in the format "YYYY-MM-DD HH:mm"');
  }
  const ruleError = checkSlotRules(apptDate);
  if (ruleError) throw new HttpError(422, ruleError);

  const patient = await patientModel.findById(patientId);
  if (!patient) throw new HttpError(404, 'Patient not found');

  const apptDatetime = formatDateTime(apptDate);
  const day = apptDatetime.slice(0, 10);

  const conn = await appointmentModel.getConnection();
  let appointmentId;
  try {
    await conn.beginTransaction();

    const doctor = await appointmentModel.lockDoctor(conn, doctorId);
    if (!doctor) throw new HttpError(404, 'Doctor not found');

    const bookedToday = await appointmentModel.countBookedOnDay(conn, doctorId, day);
    if (bookedToday >= DAILY_CAP) {
      throw new HttpError(409, 'Doctor is fully booked on this day', waitlistOffer(patientId, doctorId, day));
    }

    appointmentId = await appointmentModel.create(conn, {
      patientId,
      doctorId,
      apptDatetime,
      amountPaid: doctor.consultation_fee,
    });
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    if (err.code === 'ER_DUP_ENTRY') {
      throw new HttpError(409, 'This slot is already booked', waitlistOffer(patientId, doctorId, day));
    }
    throw err;
  } finally {
    conn.release();
  }

  const appointment = await appointmentModel.findById(appointmentId);
  await logEvent('APPOINTMENT_BOOKED', appointment);
  await enqueueSafely(JOB_TYPES.CONFIRMATION, {
    appointment_id: appointment.id,
    email: appointment.patient_email,
    patient_name: appointment.patient_name,
    doctor_name: appointment.doctor_name,
    appt_datetime: appointment.appt_datetime,
  });
  return appointment;
}

async function cancelAppointment(id) {
  const now = new Date();
  const conn = await appointmentModel.getConnection();
  let appointment;
  let refund;
  try {
    await conn.beginTransaction();

    appointment = await appointmentModel.findByIdForUpdate(conn, id);
    if (!appointment) throw new HttpError(404, 'Appointment not found');
    if (appointment.status === 'cancelled') throw new HttpError(409, 'Appointment is already cancelled');

    const apptDate = parseDateTime(appointment.appt_datetime);
    if (apptDate <= now) throw new HttpError(422, 'Past appointments cannot be cancelled');

    refund = calculateRefund(appointment.amount_paid, apptDate, now);
    await appointmentModel.markCancelled(conn, id, refund.amount, formatDateTime(now));
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }

  const result = {
    appointment_id: appointment.id,
    status: 'cancelled',
    amount_paid: appointment.amount_paid,
    refund_percent: refund.percent,
    refund_amount: refund.amount,
  };
  await logEvent('APPOINTMENT_CANCELLED', result);

  await enqueueSafely(JOB_TYPES.SLOT_FREED, {
    doctor_id: appointment.doctor_id,
    appt_datetime: appointment.appt_datetime,
  });
  return result;
}

module.exports = { bookAppointment, cancelAppointment };
