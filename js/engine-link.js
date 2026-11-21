/**
 * BaitCheck — Link Inspection Engine
 * Executes 14 structural, reputational, and heuristic checks on extracted URLs.
 */

export class LinkEngine {
  constructor(brandsData = {}, tldsData = {}, shortenersData = {}) {
    this.brands = brandsData.brands || [];
    this.suspiciousTlds = new Set(tldsData.suspiciousTlds || []);
    this.officialGovTlds = tldsData.officialGovTlds || ['gov.in', 'nic.in'];
    this.shorteners = new Set(shortenersData.shorteners || []);
  }

  /**
   * Safely parses a URL string into components without throwing.
   */
  parseUrl(rawUrl) {
    if (!rawUrl || typeof rawUrl !== 'string') return null;
    let urlStr = rawUrl.trim();
    if (!/^https?:\/\//i.test(urlStr)) {
      urlStr = 'http://' + urlStr;
    }
    try {
      const parsed = new URL(urlStr);
      return {
        original: rawUrl,
        full: urlStr,
        protocol: parsed.protocol.replace(':', ''),
        hostname: parsed.hostname.toLowerCase(),
        pathname: parsed.pathname,
        search: parsed.search,
        port: parsed.port,
        username: parsed.username
      };
    } catch (e) {
      return null;
    }
  }

  /**
   * Checks if domain is legitimately an official government portal.
   */
  isOfficialGov(hostname) {
    return this.officialGovTlds.some(govTld => hostname === govTld || hostname.endsWith('.' + govTld));
  }

  /**
   * Checks if domain matches an official brand domain list.
   */
  isOfficialBrand(hostname) {
    for (const b of this.brands) {
      if (b.officialDomains && b.officialDomains.some(d => hostname === d || hostname.endsWith('.' + d))) {
        return b;
      }
    }
    return null;
  }

  /**
   * Analyzes a URL and returns structured security findings.
   */
  analyze(rawUrl) {
    const parsed = this.parseUrl(rawUrl);
    if (!parsed) {
      return {
        score: 40,
        band: 'caution',
        signals: [{
          id: 'LINK_MALFORMED',
          severity: 'warn',
          title: 'Malformed URL structure',
          evidence: rawUrl.slice(0, 40)
        }],
        checksRun: 1,
        checksPassed: 0,
        parsed: null
      };
    }

    const { hostname, protocol, pathname, port, username } = parsed;
    const signals = [];
    let checksRun = 14;
    let checksPassed = 0;

    // Fast-path: If it is an official verified gov domain or official brand domain, it is safe
    if (this.isOfficialGov(hostname) || this.isOfficialBrand(hostname)) {
      return {
        score: 0,
        band: 'safe',
        signals: [],
        checksRun: 14,
        checksPassed: 14,
        parsed
      };
    }

    // 1. IP Host Check
    const isIpHost = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname);
    if (isIpHost) {
      signals.push({
        id: 'LINK_IP_HOST',
        severity: 'danger',
        weight: 45,
        title: 'Raw IP address instead of domain name',
        evidence: hostname
      });
    } else {
      checksPassed++;
    }

    // 2. Protocol Check (HTTPS vs HTTP)
    if (protocol !== 'https') {
      signals.push({
        id: 'LINK_NO_HTTPS',
        severity: 'warn',
        weight: 20,
        title: 'Unencrypted connection (No HTTPS)',
        evidence: protocol + '://'
      });
    } else {
      checksPassed++;
    }

    // 3. Punycode Check
    if (hostname.includes('xn--')) {
      signals.push({
        id: 'LINK_PUNYCODE',
        severity: 'danger',
        weight: 40,
        title: 'Punycode encoded international domain (homograph trick)',
        evidence: hostname
      });
    } else {
      checksPassed++;
    }

    // 4. URL Shortener Check
    const isShortener = this.shorteners.has(hostname) || Array.from(this.shorteners).some(s => hostname.endsWith('.' + s));
    if (isShortener) {
      signals.push({
        id: 'LINK_SHORTENER',
        severity: 'warn',
        weight: 25,
        title: 'URL shortener hides actual destination',
        evidence: hostname
      });
    } else {
      checksPassed++;
    }

    // 5. Suspicious / Abused TLD Check
    const domainParts = hostname.split('.');
    const tld = domainParts.length > 1 ? domainParts[domainParts.length - 1] : '';
    if (this.suspiciousTlds.has(tld)) {
      signals.push({
        id: 'LINK_SUSPICIOUS_TLD',
        severity: 'danger',
        weight: 35,
        title: `High-risk suspicious top-level domain (.${tld})`,
        evidence: '.' + tld
      });
    } else {
      checksPassed++;
    }

    // 6. Indian Brand Lookalike Check (e.g. sbi-kyc-update, hdfc.bank-verify)
    let brandLookalikeFound = null;
    for (const b of this.brands) {
      for (const kw of b.keywords) {
        if (hostname.includes(kw) && !this.isOfficialBrand(hostname)) {
          brandLookalikeFound = { brand: b.name, kw };
          break;
        }
      }
      if (brandLookalikeFound) break;
    }
    if (brandLookalikeFound) {
      signals.push({
        id: 'LINK_BRAND_LOOKALIKE',
        severity: 'danger',
        weight: 45,
        title: `Impersonates trusted institution (${brandLookalikeFound.brand})`,
        evidence: `${brandLookalikeFound.kw} in ${hostname}`
      });
    } else {
      checksPassed++;
    }

    // 7. Gov / Bank Spoof Check
    const hasGovWord = /\b(gov|nic|parivahan|police|cbi|incometax|uidai)\b/i.test(hostname);
    if (hasGovWord && !this.isOfficialGov(hostname)) {
      signals.push({
        id: 'LINK_GOV_SPOOF',
        severity: 'danger',
        weight: 45,
        title: 'Claims official government status on non-gov domain',
        evidence: hostname
      });
    } else {
      checksPassed++;
    }

    // 8. Credential Path Keywords
    const hasCredPath = /(login|verify|kyc|pan|otp|password|update|claim|refund|confirm|banking)/i.test(pathname);
    if (hasCredPath) {
      signals.push({
        id: 'LINK_CREDENTIAL_PATH',
        severity: 'danger',
        weight: 30,
        title: 'Credential harvesting keywords in link path',
        evidence: pathname.slice(0, 30)
      });
    } else {
      checksPassed++;
    }

    // 9. Excessive Subdomains or Hyphens
    const hyphenCount = (hostname.match(/-/g) || []).length;
    if (domainParts.length > 4 || hyphenCount >= 3) {
      signals.push({
        id: 'LINK_EXCESSIVE_DELIMITERS',
        severity: 'warn',
        weight: 25,
        title: 'Excessive hyphens or subdomains masquerading as trusted brand',
        evidence: hostname
      });
    } else {
      checksPassed++;
    }

    // 10. Direct APK or Dangerous Executable Download
    const isApk = /\.(apk|exe|bat|scr|msi|vbs|jar)$/i.test(pathname);
    if (isApk) {
      signals.push({
        id: 'LINK_APK_FILE',
        severity: 'danger',
        weight: 50,
        title: 'Direct Android application (APK) / executable download',
        evidence: pathname.slice(pathname.lastIndexOf('.'))
      });
    } else {
      checksPassed++;
    }

    // 11. Userinfo / @ Trick (e.g. http://sbi.co.in@evil.com)
    if (username || rawUrl.includes('@')) {
      signals.push({
        id: 'LINK_AT_TRICK',
        severity: 'danger',
        weight: 45,
        title: 'Embedded "@" authentication trick to deceive viewers',
        evidence: '@ in URL'
      });
    } else {
      checksPassed++;
    }

    // 12. Non-Standard Port Check
    if (port && !['80', '443'].includes(port)) {
      signals.push({
        id: 'LINK_NON_STANDARD_PORT',
        severity: 'warn',
        weight: 25,
        title: `Non-standard web port (:${port})`,
        evidence: ':' + port
      });
    } else {
      checksPassed++;
    }

    // 13. Excessive Digits in Hostname
    const digitCount = (hostname.replace(/\./g, '').match(/\d/g) || []).length;
    if (!isIpHost && digitCount > 5) {
      signals.push({
        id: 'LINK_EXCESSIVE_DIGITS',
        severity: 'warn',
        weight: 20,
        title: 'Suspicious random digits in domain name',
        evidence: hostname
      });
    } else {
      checksPassed++;
    }

    // 14. Extreme URL Length / Base64 Payload
    if (rawUrl.length > 180 || /data:text|base64/i.test(rawUrl)) {
      signals.push({
        id: 'LINK_OBFUSCATED_LENGTH',
        severity: 'warn',
        weight: 20,
        title: 'Abnormally long or obfuscated URL payload',
        evidence: `${rawUrl.length} characters`
      });
    } else {
      checksPassed++;
    }

    // Compute composite score
    let totalScore = 0;
    for (const s of signals) {
      totalScore += s.weight || 20;
    }
    totalScore = Math.min(100, totalScore);

    // Band assignment:
    // 0-24: safe ("No warning signs found")
    // 25-54: caution ("Be careful")
    // 55-100: danger ("Likely scam — don't bite")
    let band = 'safe';
    if (totalScore >= 55) {
      band = 'danger';
    } else if (totalScore >= 25) {
      band = 'caution';
    }

    return {
      score: totalScore,
      band,
      signals,
      checksRun,
      checksPassed,
      parsed
    };
  }
}
