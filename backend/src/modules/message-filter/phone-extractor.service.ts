import { Injectable } from '@nestjs/common';
import { extractPhones, normalizePhone, PHONE_PATTERNS } from '../../shared/utils/phone-normalizer.js';

@Injectable()
export class PhoneExtractorService {
  /**
   * Extract all phone numbers from text and normalize them
   */
  extract(text: string): string[] {
    return extractPhones(text);
  }

  /**
   * Normalize a single phone number
   */
  normalize(phone: string): string | null {
    return normalizePhone(phone);
  }

  /**
   * Extract raw phone matches (before normalization)
   */
  extractRaw(text: string): string[] {
    const found: string[] = [];
    for (const pattern of PHONE_PATTERNS) {
      pattern.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(text)) !== null) {
        found.push(match[0]);
      }
    }
    return found;
  }

  /**
   * Count unique phone numbers in text
   */
  countUnique(text: string): number {
    return this.extract(text).length;
  }
}
