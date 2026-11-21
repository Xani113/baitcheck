/**
 * BaitCheck — Pattern Matcher & Altered-Message Deobfuscation Engine
 * Identifies known scam templates even when obfuscated with spaced letters, homoglyphs, or leetspeak.
 */

// Cyrillic & Greek homoglyphs to Latin equivalents
const HOMOGLYPHS = {
  'а': 'a', 'А': 'A', 'е': 'e', 'Е': 'E', 'о': 'o', 'О': 'O',
  'р': 'p', 'Р': 'P', 'с': 'c', 'С': 'C', 'у': 'y', 'У': 'Y',
  'х': 'x', 'Х': 'X', 'і': 'i', 'І': 'I', 'ј': 'j', 'Ј': 'J',
  'ѕ': 's', 'Ѕ': 'S', 'в': 'b', 'В': 'B', 'м': 'm', 'М': 'M',
  'н': 'h', 'Н': 'H', 'т': 't', 'Т': 'T', 'к': 'k', 'К': 'K'
};

// Common leetspeak substitutions
const LEETSPEAK = {
  '0': 'o',
  '1': 'l',
  '3': 'e',
  '4': 'a',
  '5': 's',
  '7': 't',
  '@': 'a',
  '$': 's',
  '!': 'i'
};

// Hinglish synonyms and root mapping
const HINGLISH_SYNONYMS = [
  { match: /\b(khata|acct|ac|khate)\b/gi, replace: 'account' },
  { match: /\b(turant|fatafat|jaldi|abhee|jald)\b/gi, replace: 'immediately' },
  { match: /\b(kat|cut|katna|ruk|karega)\b/gi, replace: 'disconnect' },
  { match: /\b(paisa|paise|rupay|rupaye|dhan)\b/gi, replace: 'money' },
  { match: /\b(sampark|baat|call|sampark kare)\b/gi, replace: 'contact' },
  { match: /\b(naukri|kam|kaam)\b/gi, replace: 'job' },
  { match: /\b(inam|inaam|jeeta|jeeti|jackpot)\b/gi, replace: 'lottery prize' },
  { match: /\b(bijli|power|current|vidyut)\b/gi, replace: 'electricity' },
  { match: /\b(shikayat|darj|giraftar|pakda)\b/gi, replace: 'arrest' },
  { match: /\b(ashleel|nude|private|ganda)\b/gi, replace: 'nude video' }
];

export class PatternMatcher {
  constructor(templates = []) {
    this.templates = templates;
  }

  /**
   * Normalizes raw user text for robust comparison.
   * Keeps track of whether obfuscation signals were detected.
   */
  normalizeText(rawText) {
    if (!rawText || typeof rawText !== 'string') {
      return { normalized: '', isObfuscated: false, reasons: [] };
    }

    const reasons = [];
    let text = rawText;

    // 1. Unicode NFKC normalization
    text = text.normalize('NFKC');

    // 2. Detect and strip zero-width characters
    if (/[\u200B-\u200D\uFEFF]/.test(text)) {
      reasons.push('zero_width_chars');
      text = text.replace(/[\u200B-\u200D\uFEFF]/g, '');
    }

    // 3. Detect and replace homoglyphs
    let hasHomoglyphs = false;
    let dehomoglyphed = '';
    for (const ch of text) {
      if (HOMOGLYPHS[ch]) {
        hasHomoglyphs = true;
        dehomoglyphed += HOMOGLYPHS[ch];
      } else {
        dehomoglyphed += ch;
      }
    }
    if (hasHomoglyphs) {
      reasons.push('homoglyphs');
      text = dehomoglyphed;
    }

    // 4. Detect spaced letters (e.g. "O T P", "S B I", "E l e c t r i c i t y")
    const spacedPattern = /\b([a-zA-Z])\s+([a-zA-Z])(?:\s+([a-zA-Z]))+(?:\s+([a-zA-Z]))*\b/g;
    if (spacedPattern.test(text)) {
      reasons.push('spaced_letters');
      text = text.replace(spacedPattern, (match) => match.replace(/\s+/g, ''));
    }

    // Secondary pass for 2-3 single-letter gaps: "p a n", "k y c", "o t p"
    text = text.replace(/\b([a-zA-Z])\s+([a-zA-Z])\b/g, (m, a, b) => {
      const pair = (a + b).toLowerCase();
      if (['in', 'on', 'at', 'to', 'is', 'it', 'he', 'we', 'me', 'my', 'up', 'do', 'go', 'no', 'so', 'as', 'by', 'or', 'if'].includes(pair)) {
        return m;
      }
      reasons.push('spaced_letters');
      return a + b;
    });

    // 5. Replace leetspeak symbols when inside or adjacent to alphabetic words
    let hasLeetspeak = false;
    text = text.replace(/([a-zA-Z0-9@$!]+)/g, (word) => {
      let converted = '';
      let changed = false;
      for (const char of word) {
        if (LEETSPEAK[char] && /[a-zA-Z]/.test(word)) {
          converted += LEETSPEAK[char];
          changed = true;
        } else {
          converted += char;
        }
      }
      if (changed) hasLeetspeak = true;
      return changed ? converted : word;
    });
    if (hasLeetspeak) {
      reasons.push('leetspeak');
    }

    // 6. Entity Masking: URLs, Amounts, Phones, Dates
    text = text.replace(/https?:\/\/[^\s]+/gi, ' <URL> ');
    text = text.replace(/(?:www\.)?[a-zA-Z0-9-]+\.(?:top|xyz|club|site|online|live|shop|vip|apk|info)[^\s]*/gi, ' <URL> ');
    text = text.replace(/(?:Rs\.?|INR|₹)\s*\d+(?:,\d+)*(?:\.\d+)?/gi, ' <AMT> ');
    text = text.replace(/\b\d{1,3}(?:,\d{2,3})+(?:\s*(?:lakh|crore|thousand))?\b/gi, ' <AMT> ');
    text = text.replace(/(?:\+91[-\s]?)?[6-9]\d{9}\b/g, ' <PHONE> ');
    text = text.replace(/\b\d{1,2}[-/:.]\d{1,2}[-/:.]\d{2,4}\b/g, ' <DATE> ');

    // 7. Hinglish Synonym harmonization
    for (const syn of HINGLISH_SYNONYMS) {
      text = text.replace(syn.match, syn.replace);
    }

    // 8. Lowercase and collapse multiple spaces/punctuation
    text = text.toLowerCase();
    text = text.replace(/([a-z])\1{2,}/g, '$1$1');
    text = text.replace(/[^\w\s<>\u0900-\u097F\u0980-\u09FF]/g, ' ');
    text = text.replace(/\s+/g, ' ').trim();

    return {
      normalized: text,
      isObfuscated: reasons.length > 0,
      reasons: [...new Set(reasons)]
    };
  }

  /**
   * Generates character 3-grams from a string.
   */
  get3Grams(str) {
    const s = `_${str}_`;
    const grams = new Set();
    for (let i = 0; i < s.length - 2; i++) {
      grams.add(s.slice(i, i + 3));
    }
    return grams;
  }

  /**
   * Computes Jaccard similarity between two sets of 3-grams.
   */
  jaccard3Gram(setA, setB) {
    if (!setA.size || !setB.size) return 0;
    let intersection = 0;
    for (const g of setA) {
      if (setB.has(g)) intersection++;
    }
    const union = setA.size + setB.size - intersection;
    return union > 0 ? intersection / union : 0;
  }

  /**
   * Computes token set overlap / containment.
   */
  tokenContainment(tokensA, tokensB) {
    if (!tokensA.length || !tokensB.length) return 0;
    const setB = new Set(tokensB);
    let common = 0;
    for (const t of tokensA) {
      if (setB.has(t)) common++;
    }
    return common / Math.max(1, Math.min(tokensA.length, tokensB.length));
  }

  /**
   * Finds the best matching known scam template for the input text.
   */
  findBestMatch(rawText) {
    const normResult = this.normalizeText(rawText);
    const normInput = normResult.normalized;

    if (!normInput || normInput.length < 5) {
      return {
        bestTemplate: null,
        similarity: 0,
        isMatch: false,
        isResemblance: false,
        isObfuscated: normResult.isObfuscated,
        obfuscationReasons: normResult.reasons
      };
    }

    const inputGrams = this.get3Grams(normInput);
    const inputTokens = normInput.split(/\s+/).filter(t => t.length > 1);

    let bestScore = 0;
    let bestTemplate = null;

    for (const tpl of this.templates) {
      const normTpl = this.normalizeText(tpl.text).normalized;
      const tplGrams = this.get3Grams(normTpl);
      const tplTokens = normTpl.split(/\s+/).filter(t => t.length > 1);

      // 1. 3-gram Jaccard score
      const jaccard = this.jaccard3Gram(inputGrams, tplGrams);

      // 2. Token containment score
      const containment = this.tokenContainment(inputTokens, tplTokens);

      // 3. Key phrase bonus
      let keyPhraseHits = 0;
      if (tpl.keyPhrases && tpl.keyPhrases.length > 0) {
        for (const kp of tpl.keyPhrases) {
          const normKp = this.normalizeText(kp).normalized;
          if (normInput.includes(normKp)) {
            keyPhraseHits++;
          }
        }
      }
      const keyPhraseRatio = tpl.keyPhrases && tpl.keyPhrases.length > 0
        ? keyPhraseHits / tpl.keyPhrases.length
        : 0;

      // Category semantic affinity bonus
      let categoryBonus = 0;
      const catLower = tpl.category.toLowerCase();
      if (catLower.includes('electricity') && /(electricity|power|bijli|substation|current)/.test(normInput)) categoryBonus = 0.20;
      if (catLower.includes('kyc') && /(kyc|pan|bank account|suspended|hold|deactivate)/.test(normInput)) categoryBonus = 0.20;
      if (catLower.includes('job') && /(job|earn|work from home|youtube|telegram)/.test(normInput)) categoryBonus = 0.20;
      if (catLower.includes('arrest') && /(arrest|police|cbi|contraband|parcel|skype)/.test(normInput)) categoryBonus = 0.25;
      if (catLower.includes('lottery') && /(lottery|kbc|lucky draw|won|prize)/.test(normInput)) categoryBonus = 0.25;
      if (catLower.includes('sextortion') && /(nude|video call|record|upload to youtube)/.test(normInput)) categoryBonus = 0.25;
      if (catLower.includes('upi') && /(upi|pin|phonepe|refund|collect)/.test(normInput)) categoryBonus = 0.25;
      if (catLower.includes('challan') && /(challan|traffic|vehicle|fine)/.test(normInput)) categoryBonus = 0.25;
      if (catLower.includes('parcel') && /(parcel|india post|address|package)/.test(normInput)) categoryBonus = 0.20;

      // Weighted composite similarity
      const composite = (0.35 * jaccard) + (0.30 * containment) + (0.20 * keyPhraseRatio) + (0.15 * categoryBonus);

      if (composite > bestScore) {
        bestScore = composite;
        bestTemplate = tpl;
      }
    }

    // Match criteria:
    // >= 0.45 or higher with category affinity is a strong pattern match!
    const isMatch = bestScore >= 0.45;
    const isResemblance = bestScore >= 0.32 && bestScore < 0.45;

    return {
      bestTemplate,
      similarity: Math.min(1.0, Math.round(bestScore * 100) / 100),
      isMatch,
      isResemblance,
      isObfuscated: normResult.isObfuscated,
      obfuscationReasons: normResult.reasons,
      normalizedInput: normInput
    };
  }
}
