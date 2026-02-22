// Subscription plans
export const PLAN_PRICES = {
  TRIAL: 0,
  DAILY: 5000,
  WEEKLY: 25000,
  MONTHLY: 70000,
  GRANDFATHER: 0,
} as const;

export const PLAN_DURATIONS_MS = {
  TRIAL: 12 * 60 * 60 * 1000, // 12 hours
  DAILY: 24 * 60 * 60 * 1000, // 1 day
  WEEKLY: 7 * 24 * 60 * 60 * 1000, // 7 days
  MONTHLY: 30 * 24 * 60 * 60 * 1000, // 30 days
} as const;

// Grandfather cutoff: 02.11.2025 18:00 Tashkent (13:00 UTC)
export const GRANDFATHER_CUTOFF = new Date('2025-11-02T13:00:00.000Z');

// VIP limits
export const MAX_VIP_USERS = 1000;
export const VIP_QUALIFICATION_THRESHOLD = 5; // dispatchers blocked

// Auto-blocker limits
export const MAX_AI_BLOCKED_USERS = 22000;

// Subscription cache
export const SUBSCRIPTION_CACHE_TTL = 60; // seconds
export const SUBSCRIPTION_CACHE_PREFIX = 'sub:';

// Message queue
export const QUEUE_OVERFLOW_LIMIT = 100;
export const DEDUP_CLEANUP_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes
export const DEDUP_WINDOW_MS = 10 * 60 * 1000; // 10 minutes for DB dedup

// Filter pipeline
export const MAX_MESSAGE_LENGTH = 300;
export const MAX_MENTIONS = 2;
export const MAX_EMOJIS = 3;
export const MAX_EMPTY_LINES = 3;
export const MAX_GROUPS_FOR_SPAM = 15;
export const SPAM_MESSAGE_LIMIT = 10;
export const SPAM_TIME_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
export const PHONE_SPAM_GROUP_LIMIT = 15;
export const PHONE_SPAM_TIME_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

// Telegram
export const TARGET_GROUP_ID = '-1003131208840';
export const REPORT_GROUP_ID = '-1003303026585';

// VIP referral cashback
export const CASHBACK_PERCENT = 50;
export const MIN_CASHBACK_AMOUNT = 25000;

// Daily report
export const MAX_DB_BACKUPS = 50;
