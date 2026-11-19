const db = require('../config/db');
const { DAILY_CAP, BUSY_DAY_THRESHOLD } = require('../config/constants');

async function getDoctorsReport() {
  const [rows] = await db.query(
    `SELECT
       d.id AS doctor_id,
       d.full_name,
       d.specialty,
       COUNT(CASE WHEN a.status = 'booked' THEN 1 END) AS total_appointments,
       COUNT(CASE WHEN a.status = 'cancelled' THEN 1 END) AS cancelled_appointments,
       COALESCE(SUM(a.amount_paid - COALESCE(a.refund_amount, 0)), 0) AS revenue_collected
     FROM doctors d
     LEFT JOIN appointments a ON a.doctor_id = d.id
     GROUP BY d.id
     ORDER BY revenue_collected DESC, d.id`
  );
  return rows;
}

async function getBusyDaysReport() {
  const [rows] = await db.query(
    `SELECT
       d.id AS doctor_id,
       d.full_name,
       DATE(a.appt_datetime) AS day,
       COUNT(*) AS booked_slots,
       ROUND(COUNT(*) / ? * 100, 1) AS utilization_pct
     FROM appointments a
     JOIN doctors d ON d.id = a.doctor_id
     WHERE a.status = 'booked'
     GROUP BY d.id, DATE(a.appt_datetime)
     HAVING COUNT(*) > ? * ?
     ORDER BY day, d.id`,
    [DAILY_CAP, DAILY_CAP, BUSY_DAY_THRESHOLD]
  );
  return rows;
}

module.exports = { getDoctorsReport, getBusyDaysReport };
