export const TASHKENT_TZ = 'Asia/Tashkent';
export const UTC_OFFSET_HOURS = 5;
export const UTC_OFFSET_MS = UTC_OFFSET_HOURS * 60 * 60 * 1000;

export function nowTashkent(): Date {
  return new Date(
    new Date().toLocaleString('en-US', { timeZone: TASHKENT_TZ }),
  );
}

export function toTashkent(date: Date): Date {
  return new Date(
    date.toLocaleString('en-US', { timeZone: TASHKENT_TZ }),
  );
}

export function startOfDayTashkent(date?: Date): Date {
  const d = date ? toTashkent(date) : nowTashkent();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDayTashkent(date?: Date): Date {
  const d = date ? toTashkent(date) : nowTashkent();
  d.setHours(23, 59, 59, 999);
  return d;
}

export function formatTashkent(date: Date): string {
  return date.toLocaleString('ru-RU', {
    timeZone: TASHKENT_TZ,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function tashkentMidnightCron(): string {
  // 00:05 Tashkent = 19:05 UTC (previous day)
  return '5 19 * * *';
}
