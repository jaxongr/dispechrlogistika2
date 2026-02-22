import { registerAs } from '@nestjs/config';

export default registerAs('telegram', () => ({
  botToken: process.env.TELEGRAM_BOT_TOKEN,
  apiId: parseInt(process.env.TELEGRAM_API_ID || '0', 10),
  apiHash: process.env.TELEGRAM_API_HASH || '',
  targetGroupId: process.env.TARGET_GROUP_ID || '-1003131208840',
  reportGroupId: process.env.REPORT_GROUP_ID || '-1003303026585',
  sessions: [
    process.env.TELEGRAM_SESSION_STRING,
    process.env.TELEGRAM_SESSION_STRING_2,
    process.env.TELEGRAM_SESSION_STRING_3,
    process.env.TELEGRAM_SESSION_STRING_4,
    process.env.TELEGRAM_SESSION_STRING_5,
  ].filter(Boolean),
}));
