const {
  FULL_REFUND_HOURS,
  HALF_REFUND_HOURS,
  FULL_REFUND_PERCENT,
  HALF_REFUND_PERCENT,
} = require('../config/constants');

const MS_PER_HOUR = 60 * 60 * 1000;

function calculateRefund(amountPaid, appointmentTime, cancelTime) {
  const hoursNotice = (appointmentTime - cancelTime) / MS_PER_HOUR;

  let percent = 0;
  if (hoursNotice > FULL_REFUND_HOURS) {
    percent = FULL_REFUND_PERCENT;
  } else if (hoursNotice >= HALF_REFUND_HOURS) {
    percent = HALF_REFUND_PERCENT;
  }

  const amount = Math.round(amountPaid * percent) / 100;
  return { percent, amount };
}

module.exports = { calculateRefund };
