/**
 * O'zbekiston telefon raqamlarini normalizatsiya qilish
 * Operator kodlari: 33, 50, 55, 65, 66, 67, 69, 70, 71, 73, 74, 75, 77, 78, 88, 90, 91, 93, 94, 95, 97, 98, 99
 */

// O'zbekiston operator kodlari
const UZ_OPERATOR_CODES = new Set([
  '33', '50', '55', '65', '66', '67', '69',
  '70', '71', '73', '74', '75', '77', '78',
  '88', '90', '91', '93', '94', '95', '97', '98', '99',
]);

// Telefon raqam topish uchun regex patternlar (30+ ta)
export const PHONE_PATTERNS: RegExp[] = [
  // Standard international format
  /\+998[\s.-]?\d{2}[\s.-]?\d{3}[\s.-]?\d{2}[\s.-]?\d{2}/g,
  // Without +
  /998[\s.-]?\d{2}[\s.-]?\d{3}[\s.-]?\d{2}[\s.-]?\d{2}/g,
  // 8-digit with operator (9 digits total)
  /\b(33|50|55|65|66|67|69|70|71|73|74|75|77|78|88|90|91|93|94|95|97|98|99)[\s.-]?\d{3}[\s.-]?\d{2}[\s.-]?\d{2}\b/g,
  // With parentheses
  /\+?998\s?\(\d{2}\)\s?\d{3}[\s.-]?\d{2}[\s.-]?\d{2}/g,
  // Hyphenated
  /\+?998-\d{2}-\d{3}-\d{2}-\d{2}/g,
  // Space-separated
  /\+?998\s\d{2}\s\d{3}\s\d{2}\s\d{2}/g,
  // Dot-separated
  /\+?998\.\d{2}\.\d{3}\.\d{2}\.\d{2}/g,
  // Compact 12 digit
  /\b998\d{9}\b/g,
  // With country code in parens
  /\(998\)\s?\d{2}\s?\d{3}\s?\d{2}\s?\d{2}/g,
  // 9 digit (operator + number)
  /\b(33|50|55|65|66|67|69|70|71|73|74|75|77|78|88|90|91|93|94|95|97|98|99)\d{7}\b/g,
  // With 8 prefix (legacy)
  /\b8[\s.-]?\(?(33|50|55|65|66|67|69|70|71|73|74|75|77|78|88|90|91|93|94|95|97|98|99)\)?[\s.-]?\d{3}[\s.-]?\d{2}[\s.-]?\d{2}\b/g,
  // Cyrillic number writing patterns
  /(?:тел|телефон|📞|📱|☎️?|рақам|номер|нoмер|тeл|raқam)[:\s]*\+?998?[\s.-]?\d{2}[\s.-]?\d{3}[\s.-]?\d{2}[\s.-]?\d{2}/gi,
  // With "+" and spaces
  /\+\s?9\s?9\s?8\s?\d\s?\d\s?\d\s?\d\s?\d\s?\d\s?\d\s?\d\s?\d/g,
  // Obfuscated with special chars
  /9[^\d]{0,2}9[^\d]{0,2}8[^\d]{0,2}\d[^\d]{0,2}\d[^\d]{0,2}\d[^\d]{0,2}\d[^\d]{0,2}\d[^\d]{0,2}\d[^\d]{0,2}\d[^\d]{0,2}\d[^\d]{0,2}\d/g,
  // Written out with words between
  /(?:998|узб)[^\d]{0,5}(\d{2})[^\d]{0,5}(\d{3})[^\d]{0,5}(\d{2})[^\d]{0,5}(\d{2})/gi,
  // 10 digits starting with operator code
  /\b(33|50|55|65|66|67|69|70|71|73|74|75|77|78|88|90|91|93|94|95|97|98|99)\s?\d{3}\s?\d{2}\s?\d{2}\b/g,
  // Zero-width chars between digits
  /\+?998[\u200B\u200C\u200D\u00AD]*\d[\u200B\u200C\u200D\u00AD]*\d[\u200B\u200C\u200D\u00AD]*\d[\u200B\u200C\u200D\u00AD]*\d[\u200B\u200C\u200D\u00AD]*\d[\u200B\u200C\u200D\u00AD]*\d[\u200B\u200C\u200D\u00AD]*\d[\u200B\u200C\u200D\u00AD]*\d[\u200B\u200C\u200D\u00AD]*\d/g,
  // Russian 8-prefix style
  /\b8\s?998\s?\d{2}\s?\d{3}\s?\d{2}\s?\d{2}\b/g,
  // With letter O instead of 0
  /\+?998[\s.-]?\d{2}[\s.-]?\d{3}[\s.-]?\d{2}[\s.-]?\d{2}/gi,
  // Brackets around area code
  /\+?998\s?\[\d{2}\]\s?\d{3}[\s.-]?\d{2}[\s.-]?\d{2}/g,
  // Mixed separators
  /\+?998[\s.-]?\d{2}[\s./-]?\d{3}[\s./-]?\d{2}[\s./-]?\d{2}/g,
  // Starting with 0 (local format)
  /\b0(33|50|55|65|66|67|69|70|71|73|74|75|77|78|88|90|91|93|94|95|97|98|99)[\s.-]?\d{3}[\s.-]?\d{2}[\s.-]?\d{2}\b/g,
  // 11 digits starting with 998
  /(?<!\d)998(33|50|55|65|66|67|69|70|71|73|74|75|77|78|88|90|91|93|94|95|97|98|99)\d{7}(?!\d)/g,
  // With emoji between
  /\+?998[\s🔸🔹•·]*\d{2}[\s🔸🔹•·]*\d{3}[\s🔸🔹•·]*\d{2}[\s🔸🔹•·]*\d{2}/g,
  // Reversed writing (common obfuscation)
  /\d{2}[\s.-]?\d{2}[\s.-]?\d{3}[\s.-]?\d{2}[\s.-]?899/g,
  // With Cyrillic letters mixed in
  /\+?998[\sА-яа-яA-Za-z]*\d{2}[\sА-яа-яA-Za-z]*\d{3}[\sА-яа-яA-Za-z]*\d{2}[\sА-яа-яA-Za-z]*\d{2}/g,
  // Compact 9 digit with no separator
  /(?<!\d)(33|50|55|65|66|67|69|70|71|73|74|75|77|78|88|90|91|93|94|95|97|98|99)\d{7}(?!\d)/g,
  // Format: +998 (XX) XXX-XX-XX
  /\+998\s?\(\d{2}\)\s?\d{3}-\d{2}-\d{2}/g,
  // Format with slash separator
  /\+?998\/\d{2}\/\d{3}\/\d{2}\/\d{2}/g,
  // 12 digit compact
  /(?<!\d)998\d{9}(?!\d)/g,
  // Whitespace variations (tabs, nbsp)
  /\+?998[\s\t\u00A0]+\d{2}[\s\t\u00A0]+\d{3}[\s\t\u00A0]+\d{2}[\s\t\u00A0]+\d{2}/g,
];

// Raqamlardan boshqa belgilarni olib tashlash
function stripNonDigits(str: string): string {
  return str.replace(/[^\d]/g, '');
}

/**
 * Telefon raqamni +998XXXXXXXXX formatga normalizatsiya qilish
 * 9, 10, 11, 12 raqamli formatlarni qo'llab-quvvatlaydi
 */
export function normalizePhone(raw: string): string | null {
  const digits = stripNonDigits(raw);

  // 12 raqam: 998XXXXXXXXX
  if (digits.length === 12 && digits.startsWith('998')) {
    const operator = digits.substring(3, 5);
    if (UZ_OPERATOR_CODES.has(operator)) {
      return `+${digits}`;
    }
  }

  // 11 raqam: 8998XXXXXXXX -> strip leading 8
  if (digits.length === 13 && digits.startsWith('8998')) {
    const inner = digits.substring(1);
    const operator = inner.substring(3, 5);
    if (UZ_OPERATOR_CODES.has(operator)) {
      return `+${inner}`;
    }
  }

  // 10 raqam: 0XXXXXXXXX -> strip leading 0
  if (digits.length === 10 && digits.startsWith('0')) {
    const operator = digits.substring(1, 3);
    if (UZ_OPERATOR_CODES.has(operator)) {
      return `+998${digits.substring(1)}`;
    }
  }

  // 9 raqam: XXXXXXXXX (operator + 7 digits)
  if (digits.length === 9) {
    const operator = digits.substring(0, 2);
    if (UZ_OPERATOR_CODES.has(operator)) {
      return `+998${digits}`;
    }
  }

  return null;
}

/**
 * Matndan barcha telefon raqamlarni topish va normalizatsiya qilish
 */
export function extractPhones(text: string): string[] {
  const found = new Set<string>();

  for (const pattern of PHONE_PATTERNS) {
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      const normalized = normalizePhone(match[0]);
      if (normalized) {
        found.add(normalized);
      }
    }
  }

  return Array.from(found);
}

/**
 * Matnda telefon raqam borligini tekshirish
 */
export function hasPhone(text: string): boolean {
  for (const pattern of PHONE_PATTERNS) {
    pattern.lastIndex = 0;
    if (pattern.test(text)) {
      return true;
    }
  }
  return false;
}

/**
 * O'zbekiston operator kodi ekanligini tekshirish
 */
export function isUzOperator(code: string): boolean {
  return UZ_OPERATOR_CODES.has(code);
}
