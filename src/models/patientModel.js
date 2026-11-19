const db = require('../config/db');

async function findAll() {
  const [rows] = await db.query('SELECT * FROM patients ORDER BY id');
  return rows;
}

async function findById(id) {
  const [rows] = await db.query('SELECT * FROM patients WHERE id = ?', [id]);
  return rows[0];
}

async function create({ full_name, email, phone }) {
  const [result] = await db.query(
    'INSERT INTO patients (full_name, email, phone) VALUES (?, ?, ?)',
    [full_name, email, phone]
  );
  return findById(result.insertId);
}

async function update(id, { full_name, email, phone }) {
  await db.query(
    'UPDATE patients SET full_name = ?, email = ?, phone = ? WHERE id = ?',
    [full_name, email, phone, id]
  );
  return findById(id);
}

async function remove(id) {
  const [result] = await db.query('DELETE FROM patients WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

module.exports = { findAll, findById, create, update, remove };
