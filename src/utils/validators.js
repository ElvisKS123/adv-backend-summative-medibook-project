const { SLOT_MINUTES, OPENING_HOUR, CLOSING_HOUR } = require('../config/constants');

const DATETIME_PATTERN = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function parseDateTime(value) {
  if (typeof value !== 'string') return null;

  const match = value.trim().match(DATETIME_PATTERN);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6] || 0);
  const date = new Date(year, month - 1, day, hour, minute, second);

  const isSame =
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day &&
    date.getHours() === hour &&
    date.getMinutes() === minute &&
    date.getSeconds() === second;

  return isSame ? date : null;
}

function parseDate(value) {
  if (typeof value !== 'string' || !DATE_PATTERN.test(value)) return null;
  return parseDateTime(`${value} 00:00`);
}

function formatDateTime(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  );
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[0-9+\-\s]{7,20}$/;
const MAX_FEE = 999999.99;

function isNonEmptyString(value, maxLength) {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= maxLength;
}

function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function validatePatient(body = {}) {
  const errors = [];
  if (!isNonEmptyString(body.full_name, 100)) errors.push('full_name is required (max 100 characters)');
  if (typeof body.email !== 'string' || body.email.length > 150 || !EMAIL_PATTERN.test(body.email)) {
    errors.push('email must be a valid email address');
  }
  if (typeof body.phone !== 'string' || !PHONE_PATTERN.test(body.phone)) {
    errors.push('phone must be 7-20 characters (digits, spaces, + or -)');
  }
  return errors;
}

function validateDoctor(body = {}) {
  const errors = [];
  if (!isNonEmptyString(body.full_name, 100)) errors.push('full_name is required (max 100 characters)');
  if (!isNonEmptyString(body.specialty, 100)) errors.push('specialty is required (max 100 characters)');
  const fee = body.consultation_fee;
  if (typeof fee !== 'number' || !Number.isFinite(fee) || fee < 0 || fee > MAX_FEE) {
    errors.push(`consultation_fee must be a number between 0 and ${MAX_FEE}`);
  }
  if (!isNonEmptyString(body.room, 10)) errors.push('room is required (max 10 characters)');
  return errors;
}

function checkSlotRules(date, now = new Date()) {
  if (date <= now) {
    return 'Appointments can only be booked in the future';
  }
  if (date.getSeconds() !== 0 || date.getMinutes() % SLOT_MINUTES !== 0) {
    return `Appointments must start on a ${SLOT_MINUTES}-minute boundary`;
  }
  const startMinute = date.getHours() * 60 + date.getMinutes();
  const isTooEarly = startMinute < OPENING_HOUR * 60;
  const endsTooLate = startMinute + SLOT_MINUTES > CLOSING_HOUR * 60;
  if (isTooEarly || endsTooLate) {
    const hour = (h) => `${String(h).padStart(2, '0')}:00`;
    return `Appointments must be within working hours ${hour(OPENING_HOUR)}-${hour(CLOSING_HOUR)}`;
  }
  return null;
}

module.exports = {
  parseId, validatePatient, validateDoctor, checkSlotRules, parseDateTime, parseDate, formatDateTime,
};
