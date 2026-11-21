const { checkSlotRules, validatePatient, parseId, parseDateTime } = require('../src/utils/validators');

const now = new Date(2026, 7, 1, 12, 0);
const slot = (text) => checkSlotRules(parseDateTime(text), now);

describe('checkSlotRules', () => {
  test('accepts the first slot of the day (09:00)', () => {
    expect(slot('2026-08-10 09:00')).toBeNull();
  });

  test('accepts the last slot of the day (16:30)', () => {
    expect(slot('2026-08-10 16:30')).toBeNull();
  });

  test('rejects 17:00 because the slot would end after closing time', () => {
    expect(slot('2026-08-10 17:00')).toMatch(/working hours/);
  });

  test('rejects a slot before opening time (08:30)', () => {
    expect(slot('2026-08-10 08:30')).toMatch(/working hours/);
  });

  test('rejects a time that is not on a 30-minute boundary (09:15)', () => {
    expect(slot('2026-08-10 09:15')).toMatch(/boundary/);
  });

  test('rejects a time in the past', () => {
    expect(slot('2026-07-30 10:00')).toMatch(/future/);
  });
});

describe('parseDateTime', () => {
  test('parses a valid date and time', () => {
    expect(parseDateTime('2026-08-10 09:30')).toEqual(new Date(2026, 7, 10, 9, 30));
  });

  test('rejects malformed values', () => {
    expect(parseDateTime('hello')).toBeNull();
    expect(parseDateTime('2026-08-10 9:30')).toBeNull();
    expect(parseDateTime(undefined)).toBeNull();
  });

  test('rejects dates that do not exist (30 February)', () => {
    expect(parseDateTime('2026-02-30 10:00')).toBeNull();
  });
});

describe('validatePatient', () => {
  test('accepts a valid patient', () => {
    expect(validatePatient({ full_name: 'Ama Mensah', email: 'ama@mail.com', phone: '0244-111-222' })).toEqual([]);
  });

  test('reports every missing or invalid field', () => {
    expect(validatePatient({ full_name: '  ', email: 'not-an-email' })).toHaveLength(3);
  });
});

describe('parseId', () => {
  test('only accepts positive whole numbers', () => {
    expect(parseId('5')).toBe(5);
    expect(parseId('0')).toBeNull();
    expect(parseId('abc')).toBeNull();
    expect(parseId('1.5')).toBeNull();
  });
});
