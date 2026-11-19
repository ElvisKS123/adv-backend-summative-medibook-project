const db = require('../config/db');

async function getConnection() {
  return db.getConnection();
}

async function findById(id) {
  const [rows] = await db.query(
    `SELECT a.id, a.patient_id, p.full_name AS patient_name, p.email AS patient_email,
            a.doctor_id, d.full_name AS doctor_name, d.specialty, d.room,
            a.appt_datetime, a.amount_paid, a.status, a.booked_on, a.cancelled_at, a.refund_amount
     FROM appointments a
     JOIN patients p ON p.id = a.patient_id
     JOIN doctors d ON d.id = a.doctor_id
     WHERE a.id = ?`,
    [id]
  );
  return rows[0];
}

async function lockDoctor(conn, doctorId) {
  const [rows] = await conn.query(
    'SELECT id, consultation_fee FROM doctors WHERE id = ? FOR UPDATE',
    [doctorId]
  );
  return rows[0];
}

async function countBookedOnDay(conn, doctorId, day) {
  const [rows] = await conn.query(
    `SELECT COUNT(*) AS total FROM appointments
     WHERE doctor_id = ? AND status = 'booked' AND DATE(appt_datetime) = ?`,
    [doctorId, day]
  );
  return rows[0].total;
}

async function create(conn, { patientId, doctorId, apptDatetime, amountPaid }) {
  const [result] = await conn.query(
    'INSERT INTO appointments (patient_id, doctor_id, appt_datetime, amount_paid) VALUES (?, ?, ?, ?)',
    [patientId, doctorId, apptDatetime, amountPaid]
  );
  return result.insertId;
}

async function findByIdForUpdate(conn, id) {
  const [rows] = await conn.query('SELECT * FROM appointments WHERE id = ? FOR UPDATE', [id]);
  return rows[0];
}

async function markCancelled(conn, id, refundAmount, cancelledAt) {
  await conn.query(
    `UPDATE appointments
     SET status = 'cancelled', cancelled_at = ?, refund_amount = ?
     WHERE id = ?`,
    [cancelledAt, refundAmount, id]
  );
}

module.exports = { getConnection, findById, lockDoctor, countBookedOnDay, create, findByIdForUpdate, markCancelled };
