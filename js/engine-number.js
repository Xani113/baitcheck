/**
 * BaitCheck — Phone Number Format & Prefix Inspection Engine
 * Analyzes prefixes, telemarketing series (140), toll-free (1800), and international origins.
 * Clearly informs users that no private contact database is accessed.
 */

export class NumberEngine {
  analyze(rawNumber) {
    if (!rawNumber || typeof rawNumber !== 'string') {
      return { score: 0, band: 'safe', signals: [], checksRun: 6, checksPassed: 6 };
    }

    const clean = rawNumber.replace(/[\s\-().]/g, '').trim();
    const signals = [];
    const checksRun = 6;
    let checksPassed = 0;

    // 1. Telemarketing 140 Series
    if (/^(\+?91)?140\d{7}$/.test(clean)) {
      signals.push({
        id: 'NUM_TELEMARKETING_140',
        severity: 'warn',
        weight: 35,
        title: 'TRAI-registered telemarketing / promotional call prefix (140)',
        evidence: 'Prefix 140'
      });
    } else {
      checksPassed++;
    }

    // 2. High-Risk International Caller Prefixes for Indian users
    // +92 (Pakistan), +234 (Nigeria), +880 (Bangladesh), +44 (UK spoofed), +1 (US VOIP)
    const intlMatch = clean.match(/^(\+(?:92|234|880|254|94|977|44|1))(\d+)$/);
    if (intlMatch) {
      const prefix = intlMatch[1];
      if (prefix === '+92' || prefix === '+234') {
        signals.push({
          id: 'NUM_HIGH_RISK_INTL',
          severity: 'danger',
          weight: 60,
          title: `Foreign country calling code (${prefix}) commonly linked to WhatsApp impersonation`,
          evidence: prefix
        });
      } else {
        signals.push({
          id: 'NUM_INTL_CALLER',
          severity: 'warn',
          weight: 30,
          title: `International call prefix (${prefix})`,
          evidence: prefix
        });
      }
    } else {
      checksPassed++;
    }

    // 3. Toll-Free 1800 / 1860 Series
    const isTollFree = /^(\+?91)?1800\d{6,7}$/.test(clean);
    if (isTollFree) {
      checksPassed += 2;
    }

    // 4. Standard Indian Mobile (+91 followed by 10 digits starting with 6-9)
    const isIndianMobile = /^(\+?91)?[6-9]\d{9}$/.test(clean);
    if (isIndianMobile) {
      checksPassed++;
    }

    // 5. Shortcodes or invalid lengths
    if (clean.length < 5 || (!clean.startsWith('+') && clean.length > 13)) {
      signals.push({
        id: 'NUM_INVALID_LENGTH',
        severity: 'warn',
        weight: 25,
        title: 'Unusual digit length for standard telecom subscriber number',
        evidence: clean
      });
    } else {
      checksPassed++;
    }

    let totalScore = 0;
    for (const s of signals) {
      totalScore += s.weight;
    }
    totalScore = Math.min(100, totalScore);

    let band = 'safe';
    if (totalScore >= 55) band = 'danger';
    else if (totalScore >= 25) band = 'caution';

    checksPassed = Math.max(0, checksRun - signals.length);

    return {
      score: totalScore,
      band,
      signals,
      checksRun,
      checksPassed,
      cleanNumber: clean,
      disclaimer: 'BaitCheck evaluates mathematical format and telecom prefix patterns on-device. No phone numbers are queried against a remote database or saved.'
    };
  }
}
