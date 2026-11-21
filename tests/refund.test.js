const { calculateRefund } = require('../src/utils/refund');

const HOUR = 60 * 60 * 1000;
const appointment = new Date(2026, 7, 10, 9, 0);
const hoursBefore = (hours) => new Date(appointment.getTime() - hours * HOUR);

describe('calculateRefund', () => {
  test('more than 48 hours notice gives a 100% refund', () => {
    expect(calculateRefund(150, appointment, hoursBefore(72))).toEqual({ percent: 100, amount: 150 });
  });

  test('just over 48 hours notice gives a 100% refund', () => {
    expect(calculateRefund(150, appointment, hoursBefore(48.01))).toEqual({ percent: 100, amount: 150 });
  });

  test('exactly 48 hours notice gives a 50% refund', () => {
    expect(calculateRefund(150, appointment, hoursBefore(48))).toEqual({ percent: 50, amount: 75 });
  });

  test('between 24 and 48 hours notice gives a 50% refund', () => {
    expect(calculateRefund(120, appointment, hoursBefore(30))).toEqual({ percent: 50, amount: 60 });
  });

  test('exactly 24 hours notice gives a 50% refund', () => {
    expect(calculateRefund(150, appointment, hoursBefore(24))).toEqual({ percent: 50, amount: 75 });
  });

  test('just under 24 hours notice gives no refund', () => {
    expect(calculateRefund(150, appointment, hoursBefore(23.99))).toEqual({ percent: 0, amount: 0 });
  });

  test('a few hours notice gives no refund', () => {
    expect(calculateRefund(150, appointment, hoursBefore(2))).toEqual({ percent: 0, amount: 0 });
  });

  test('half refund is rounded to cents', () => {
    expect(calculateRefund(99.99, appointment, hoursBefore(36)).amount).toBe(50);
  });
});
