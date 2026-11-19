const db = require('../config/db');
const { DAILY_CAP, STATS_DAYS } = require('../config/constants');

async function findAll() {
  const [rows] = await db.query('SELECT * FROM doctors ORDER BY id');
  return rows;
}

async function findById(id) {
  const [rows] = await db.query('SELECT * FROM doctors WHERE id = ?', [id]);
  return rows[0];
}

async function create({ full_name, specialty, consultation_fee, room }) {
  const [result] = await db.query(
    'INSERT INTO doctors (full_name, specialty, consultation_fee, room) VALUES (?, ?, ?, ?)',
    [full_name, specialty, consultation_fee, room]
  );
  return findById(result.insertId);
}

async function update(id, { full_name, specialty, consultation_fee, room }) {
  await db.query(
    'UPDATE doctors SET full_name = ?, specialty = ?, consultation_fee = ?, room = ? WHERE id = ?',
    [full_name, specialty, consultation_fee, room, id]
  );
  return findById(id);
}

async function remove(id) {
  const [result] = await db.query('DELETE FROM doctors WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

async function getSummaryStats(id) {
  const [rows] = await db.query(
    `SELECT
       COALESCE(SUM(amount_paid - COALESCE(refund_amount, 0)), 0) AS revenue_collected,
       COUNT(CASE WHEN status = 'booked' AND appt_datetime > NOW() THEN 1 END) AS upcoming_appointments,
       ROUND(
         COUNT(CASE WHEN status = 'booked'
                     AND appt_datetime >= CURDATE()
                     AND appt_datetime < CURDATE() + INTERVAL ? DAY THEN 1 END) / ? * 100,
         1) AS utilization_pct
     FROM appointments
     WHERE doctor_id = ?`,
    [STATS_DAYS, DAILY_CAP * STATS_DAYS, id]
  );
  return rows[0];
}

async function getDailyStats(id) {
  const [rows] = await db.query(
    `WITH RECURSIVE days AS (
       SELECT CURDATE() AS day
       UNION ALL
       SELECT day + INTERVAL 1 DAY FROM days WHERE day < CURDATE() + INTERVAL ? DAY
     )
     SELECT
       days.day,
       COUNT(a.id) AS appointments,
       ROUND(COUNT(a.id) / ? * 100, 1) AS utilization_pct
     FROM days
     LEFT JOIN appointments a
       ON a.doctor_id = ?
      AND a.status = 'booked'
      AND DATE(a.appt_datetime) = days.day
     GROUP BY days.day
     ORDER BY days.day`,
    [STATS_DAYS - 1, DAILY_CAP, id]
  );
  return rows;
}

module.exports = { findAll, findById, create, update, remove, getSummaryStats, getDailyStats };
