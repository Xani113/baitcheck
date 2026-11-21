/**
 * BaitCheck — Email Inspection Engine
 * Detects free-mail masquerading, disposable domains, and brand impersonation in email senders.
 */

export class EmailEngine {
  constructor(brandsData = {}, disposableData = {}, tldsData = {}) {
    this.brands = brandsData.brands || [];
    this.disposableDomains = new Set(disposableData.disposableDomains || []);
    this.freeMailProviders = new Set(disposableData.freeMailProviders || [
      'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'
    ]);
    this.suspiciousTlds = new Set(tldsData.suspiciousTlds || []);
  }

  isDisposable(domain) {
    if (this.disposableDomains.has(domain)) return true;
    for (const d of this.disposableDomains) {
      if (domain === d || domain.endsWith('.' + d)) return true;
    }
    return false;
  }

  analyze(rawEmail, headers = '') {
    if (!rawEmail || typeof rawEmail !== 'string') {
      return { score: 0, band: 'safe', signals: [], checksRun: 8, checksPassed: 8 };
    }

    const email = rawEmail.trim().toLowerCase();
    const signals = [];
    const checksRun = 8;
    let checksPassed = 0;

    // 1. Basic Email Syntax Check
    const emailRegex = /^[^\s@]+@([^\s@]+\.[^\s@]+)$/;
    const match = email.match(emailRegex);
    if (!match) {
      signals.push({
        id: 'EML_SYNTAX_INVALID',
        severity: 'danger',
        weight: 45,
        title: 'Invalid or malformed email address syntax',
        evidence: email.slice(0, 30)
      });
      return { score: 45, band: 'caution', signals, checksRun, checksPassed: 0 };
    }

    const [, domain] = match;
    const localPart = email.split('@')[0];

    // 2. Disposable Email Domain Check
    if (this.isDisposable(domain)) {
      signals.push({
        id: 'EML_DISPOSABLE_DOMAIN',
        severity: 'danger',
        weight: 60,
        title: 'Sent from temporary / disposable burner email domain',
        evidence: domain
      });
    } else {
      checksPassed++;
    }

    // 3. Free-Mail Masquerading as Official Bank or Brand
    const isFreeMail = this.freeMailProviders.has(domain);
    let spoofedBrand = null;
    for (const b of this.brands) {
      for (const kw of b.keywords) {
        if (localPart.includes(kw) || email.includes(kw)) {
          spoofedBrand = b.name;
          break;
        }
      }
      if (spoofedBrand) break;
    }

    if (isFreeMail && spoofedBrand) {
      signals.push({
        id: 'EML_FREEMAIL_BRAND_SPOOF',
        severity: 'danger',
        weight: 65,
        title: `Free personal email (@${domain}) pretending to be official ${spoofedBrand}`,
        evidence: email
      });
    } else {
      checksPassed++;
    }

    // 4. Domain Brand Impersonation on Unofficial Domains (e.g. hdfc-update.top)
    let domainBrandMatch = null;
    if (!isFreeMail) {
      for (const b of this.brands) {
        for (const kw of b.keywords) {
          if (domain.includes(kw)) {
            const isOfficial = b.officialDomains && b.officialDomains.some(od => domain === od || domain.endsWith('.' + od));
            if (!isOfficial) {
              domainBrandMatch = b.name;
              break;
            }
          }
        }
        if (domainBrandMatch) break;
      }
    }
    if (domainBrandMatch) {
      signals.push({
        id: 'EML_BRAND_LOOKALIKE_DOMAIN',
        severity: 'danger',
        weight: 55,
        title: `Sender domain impersonates trusted institution (${domainBrandMatch})`,
        evidence: domain
      });
    }

    // 5. Suspicious TLD Domain Check
    const domainParts = domain.split('.');
    const tld = domainParts[domainParts.length - 1];
    if (this.suspiciousTlds.has(tld)) {
      signals.push({
        id: 'EML_SUSPICIOUS_TLD',
        severity: 'danger',
        weight: 45,
        title: `Sender domain uses high-risk top-level domain (.${tld})`,
        evidence: '.' + tld
      });
    } else {
      checksPassed++;
    }

    // 6. Random Gibberish Local Part
    const digitCount = (localPart.match(/\d/g) || []).length;
    if (localPart.length > 15 && digitCount > 6) {
      signals.push({
        id: 'EML_GIBBERISH_USER',
        severity: 'warn',
        weight: 25,
        title: 'Randomized automated bot username pattern',
        evidence: localPart
      });
    } else {
      checksPassed++;
    }

    // 7. Header Parsing (SPF/DKIM/DMARC) if provided
    if (headers && typeof headers === 'string') {
      if (/spf=fail/i.test(headers) || /dmarc=fail/i.test(headers)) {
        signals.push({
          id: 'EML_AUTH_FAILED',
          severity: 'danger',
          weight: 40,
          title: 'Email authentication check failed (SPF/DMARC forgery)',
          evidence: 'SPF/DMARC Fail'
        });
      } else {
        checksPassed += 2;
      }
    } else {
      checksPassed += 2;
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
      email,
      domain
    };
  }
}
