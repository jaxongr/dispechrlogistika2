/**
 * Matnni tozalash va normalizatsiya qilish utilitylari
 */

// Zero-width va invisible belgilarni o'chirish
const INVISIBLE_CHARS =
  /[\u200B\u200C\u200D\u200E\u200F\u00AD\u034F\u061C\uFEFF\u2028\u2029\u2060\u2061\u2062\u2063\u2064\u206A-\u206F]/g;

// Ko'p bo'sh qatorlarni bittaga kamaytirish
const MULTIPLE_NEWLINES = /\n{3,}/g;

// Ko'p bo'shliqlarni bittaga kamaytirish
const MULTIPLE_SPACES = /[ \t]{2,}/g;

/**
 * Xabar matnini tozalash
 */
export function cleanText(text: string): string {
  if (!text) return '';

  return text
    .replace(INVISIBLE_CHARS, '')
    .replace(MULTIPLE_SPACES, ' ')
    .replace(MULTIPLE_NEWLINES, '\n\n')
    .trim();
}

/**
 * HTML teglarini o'chirish
 */
export function stripHtml(text: string): string {
  return text.replace(/<[^>]*>/g, '');
}

/**
 * Matndan emoji sonini hisoblash
 */
export function countEmojis(text: string): number {
  const emojiRegex =
    /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{231A}-\u{231B}\u{23E9}-\u{23F3}\u{23F8}-\u{23FA}\u{25AA}-\u{25AB}\u{25B6}\u{25C0}\u{25FB}-\u{25FE}\u{2614}-\u{2615}\u{2648}-\u{2653}\u{267F}\u{2693}\u{26A1}\u{26AA}-\u{26AB}\u{26BD}-\u{26BE}\u{26C4}-\u{26C5}\u{26CE}\u{26D4}\u{26EA}\u{26F2}-\u{26F3}\u{26F5}\u{26FA}\u{26FD}\u{2702}\u{2705}\u{2708}-\u{270D}\u{270F}]/gu;
  const matches = text.match(emojiRegex);
  return matches ? matches.length : 0;
}

/**
 * Matndan @mention sonini hisoblash
 */
export function countMentions(text: string): number {
  const mentions = text.match(/@\w+/g);
  return mentions ? mentions.length : 0;
}

/**
 * Ketma-ket bo'sh qatorlar sonini hisoblash
 */
export function countConsecutiveEmptyLines(text: string): number {
  let maxConsecutive = 0;
  let current = 0;

  const lines = text.split('\n');
  for (const line of lines) {
    if (line.trim() === '') {
      current++;
      maxConsecutive = Math.max(maxConsecutive, current);
    } else {
      current = 0;
    }
  }

  return maxConsecutive;
}

/**
 * Matn hashini hisoblash (dublikat tekshirish uchun)
 */
export function textHash(text: string): string {
  const cleaned = text
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\wа-яёўқғҳ\s]/gi, '')
    .trim();

  // Simple hash (FNV-1a variant)
  let hash = 2166136261;
  for (let i = 0; i < cleaned.length; i++) {
    hash ^= cleaned.charCodeAt(i);
    hash = (hash * 16777619) >>> 0;
  }
  return hash.toString(36);
}

/**
 * Matnning qisqartirilgan ko'rinishi (preview uchun)
 */
export function truncate(text: string, maxLength = 100): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}
