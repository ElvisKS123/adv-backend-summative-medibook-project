module.exports = {
  DAILY_CAP: 12,
  SLOT_MINUTES: 30,
  OPENING_HOUR: 9,
  CLOSING_HOUR: 17,

  FULL_REFUND_HOURS: 48,
  HALF_REFUND_HOURS: 24,
  FULL_REFUND_PERCENT: 100,
  HALF_REFUND_PERCENT: 50,

  BUSY_DAY_THRESHOLD: 0.8,
  STATS_DAYS: 7,

  JOBS_QUEUE: 'medibook:jobs',
  WAITLIST_PREFIX: 'medibook:waitlist',
  WAITLIST_PROCESSING: 'medibook:waitlist-processing',
  WAITLIST_FAILED: 'medibook:waitlist-failed',

  JOB_TYPES: {
    CONFIRMATION: 'send-confirmation',
    SLOT_FREED: 'slot-freed',
  },
};
