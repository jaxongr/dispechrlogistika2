import { Injectable, Logger } from '@nestjs/common';

// 11 country codes for foreign phone detection
const FOREIGN_COUNTRY_CODES: Record<string, string> = {
  '+7': 'Rossiya/Qozog\'iston',
  '+374': 'Armaniston',
  '+992': 'Tojikiston',
  '+996': 'Qirg\'iziston',
  '+993': 'Turkmaniston',
  '+994': 'Ozarbayjon',
  '+995': 'Gruziya',
  '+380': 'Ukraina',
  '+375': 'Belarus',
  '+86': 'Xitoy',
  '+90': 'Turkiya',
};

// Regex patterns for each code
const FOREIGN_PHONE_PATTERNS: Array<{ code: string; country: string; pattern: RegExp }> = [
  { code: '+7', country: 'Rossiya/Qozog\'iston', pattern: /\+7[\s.-]?\d{3}[\s.-]?\d{3}[\s.-]?\d{2}[\s.-]?\d{2}/g },
  { code: '+374', country: 'Armaniston', pattern: /\+374[\s.-]?\d{2}[\s.-]?\d{6}/g },
  { code: '+992', country: 'Tojikiston', pattern: /\+992[\s.-]?\d{2}[\s.-]?\d{3}[\s.-]?\d{4}/g },
  { code: '+996', country: 'Qirg\'iziston', pattern: /\+996[\s.-]?\d{3}[\s.-]?\d{3}[\s.-]?\d{3}/g },
  { code: '+993', country: 'Turkmaniston', pattern: /\+993[\s.-]?\d{2}[\s.-]?\d{6}/g },
  { code: '+994', country: 'Ozarbayjon', pattern: /\+994[\s.-]?\d{2}[\s.-]?\d{3}[\s.-]?\d{2}[\s.-]?\d{2}/g },
  { code: '+995', country: 'Gruziya', pattern: /\+995[\s.-]?\d{3}[\s.-]?\d{3}[\s.-]?\d{3}/g },
  { code: '+380', country: 'Ukraina', pattern: /\+380[\s.-]?\d{2}[\s.-]?\d{3}[\s.-]?\d{2}[\s.-]?\d{2}/g },
  { code: '+375', country: 'Belarus', pattern: /\+375[\s.-]?\d{2}[\s.-]?\d{3}[\s.-]?\d{2}[\s.-]?\d{2}/g },
  { code: '+86', country: 'Xitoy', pattern: /\+86[\s.-]?\d{3}[\s.-]?\d{4}[\s.-]?\d{4}/g },
  { code: '+90', country: 'Turkiya', pattern: /\+90[\s.-]?\d{3}[\s.-]?\d{3}[\s.-]?\d{2}[\s.-]?\d{2}/g },
];

export interface ForeignPhoneResult {
  hasForeignPhone: boolean;
  phones: Array<{ phone: string; code: string; country: string }>;
}

@Injectable()
export class ForeignPhoneService {
  private readonly logger = new Logger(ForeignPhoneService.name);

  detect(text: string): ForeignPhoneResult {
    const phones: Array<{ phone: string; code: string; country: string }> = [];

    for (const { code, country, pattern } of FOREIGN_PHONE_PATTERNS) {
      pattern.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(text)) !== null) {
        phones.push({ phone: match[0], code, country });
      }
    }

    return {
      hasForeignPhone: phones.length > 0,
      phones,
    };
  }

  isForeignCode(phone: string): { isForeign: boolean; country?: string } {
    const cleaned = phone.replace(/[\s.-]/g, '');
    for (const [code, country] of Object.entries(FOREIGN_COUNTRY_CODES)) {
      if (cleaned.startsWith(code) && !cleaned.startsWith('+998')) {
        return { isForeign: true, country };
      }
    }
    return { isForeign: false };
  }
}
