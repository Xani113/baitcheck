import { ScanResult, ThreatRedFlag, ThreatVerdict } from './types';

const SUSPICIOUS_TLDS = ['.top', '.xyz', '.buzz', '.fit', '.tk', '.ml', '.ga', '.cf', '.gq', '.icu', '.club', '.work', '.click', '.live'];
const SHORTENERS = ['bit.ly', 'tinyurl.com', 'is.gd', 'buff.ly', 't.co', 'cutt.ly', 'rb.gy'];

const URGENCY_TRIGGERS = [
  /immediately/i,
  /within \d+ hours?/i,
  /account.*(blocked|suspended)/i,
  /suspended.*today/i,
  /(power supply|electricity).*(disconnect|cut)/i,
  /kyc.*(expired|update|verify)/i,
  /pan.*card.*link/i,
  /urgent.*action/i,
  /police.*warrant/i,
  /digital.*arrest/i
];

const BRAND_PATTERNS = [
  { name: 'State Bank of India', regex: /\b(sbi|yono|state bank)\b/i, officialDomains: ['sbi.co.in', 'onlinesbi.sbi'] },
  { name: 'HDFC Bank', regex: /\b(hdfc|hdfcbank)\b/i, officialDomains: ['hdfcbank.com'] },
  { name: 'ICICI Bank', regex: /\b(icici|imobile)\b/i, officialDomains: ['icicibank.com'] },
  { name: 'India Post', regex: /\b(indiapost|india post|speed post|parcel)\b/i, officialDomains: ['indiapost.gov.in'] },
  { name: 'Income Tax Department', regex: /\b(income tax|itr|refund)\b/i, officialDomains: ['incometax.gov.in'] }
];

export function extractUrls(text: string): string[] {
  const urlRegex = /(https?:\/\/[^\s]+)/gi;
  const matches = text.match(urlRegex);
  return matches ? Array.from(new Set(matches)) : [];
}

export function analyzeHeuristics(messageText: string): ScanResult {
  const redFlags: ThreatRedFlag[] = [];
  let score = 5; // Baseline
  let detectedBrand: string | null = null;
  let scamType = 'Unclassified Message';
  const urls = extractUrls(messageText);

  // 1. Check APK download links (Critical)
  if (/\.apk(\?|\b|$)/i.test(messageText)) {
    score += 50;
    redFlags.push({
      category: 'MALWARE_APK',
      severity: 'CRITICAL',
      title: 'Suspicious Android APK Download Link',
      description: 'The message invites downloading an .apk file. Legitimate banks and government services NEVER distribute apps via direct links outside official app stores.'
    });
    scamType = 'Malicious APK Distribution';
  }

  // 2. Check Urgency
  for (const trigger of URGENCY_TRIGGERS) {
    if (trigger.test(messageText)) {
      score += 25;
      redFlags.push({
        category: 'URGENCY',
        severity: 'HIGH',
        title: 'Psychological Urgency & Coercion Tactics',
        description: 'Scammers manufacture artificial time pressure ("blocked today", "immediate disconnection") to prevent rational verification.'
      });
      break;
    }
  }

  // 3. Task / Part-time Job Scam Patterns (e.g., YouTube video liking, Telegram recruitment)
  const isJobScam = /\b(work[\s-]from[\s-]home|part[\s-]time[\s-]job|daily[\s-]earn|like youtube|rating hotels)\b/i.test(messageText) ||
    (/\b(telegram|t\.me)\b/i.test(messageText) && /\b(earn|job|salary|income|hr)\b/i.test(messageText));

  if (isJobScam) {
    score += 45;
    scamType = 'Part-Time Task & Daily Earning Scam';
    detectedBrand = 'Fake Corporate Recruitment / Telegram Syndicate';
    redFlags.push({
      category: 'PAYMENT_TRAP',
      severity: 'CRITICAL',
      title: 'Unrealistic Earnings / Task Scam Pattern',
      description: 'Promises of easy daily income for liking videos or doing tasks are designed to extract advance security fees or recruit into crypto fraud.'
    });
  }

  // 4. Utility / Electricity Extortion Scam
  const isUtilityScam = /(power supply|electricity).*(disconnect|cut)/i.test(messageText) &&
    /(\d{10}|\+91\d{10})/i.test(messageText);

  if (isUtilityScam) {
    score += 45;
    scamType = 'Utility Bill Disconnection Extortion';
    detectedBrand = 'State Electricity Department';
    redFlags.push({
      category: 'PAYMENT_TRAP',
      severity: 'CRITICAL',
      title: 'Fake Officer Phone Number & Disconnection Threat',
      description: 'Official electricity boards never list personal 10-digit mobile numbers in SMS alerts or threaten same-night disconnection.'
    });
  }

  // 5. Check Brand Impersonation & Spoofed Domains
  for (const brand of BRAND_PATTERNS) {
    if (brand.regex.test(messageText)) {
      detectedBrand = brand.name;

      for (const urlStr of urls) {
        try {
          const parsed = new URL(urlStr);
          const hostname = parsed.hostname.toLowerCase();
          
          const isOfficial = brand.officialDomains.some(d => hostname === d || hostname.endsWith('.' + d));
          if (brand.officialDomains.length > 0 && !isOfficial) {
            score += 45;
            redFlags.push({
              category: 'BRAND_SPOOF',
              severity: 'CRITICAL',
              title: `Fake ${brand.name} Domain Detected`,
              description: `The URL (${hostname}) does NOT belong to the official ${brand.name} registry (${brand.officialDomains.join(', ')}).`
            });
            scamType = `${brand.name} Phishing Portal`;
          }
        } catch {
          // invalid url
        }
      }
      break;
    }
  }

  // 6. URL & TLD Checks
  for (const urlStr of urls) {
    try {
      const parsed = new URL(urlStr);
      const host = parsed.hostname.toLowerCase();

      // Telegram links for untrusted channels
      if (host === 't.me' && isJobScam) {
        score += 25;
        redFlags.push({
          category: 'DECEPTIVE_URL',
          severity: 'HIGH',
          title: 'Suspicious Telegram Funnel',
          description: 'Victims are lured into encrypted Telegram channels where untraceable payments and fake trading tasks occur.'
        });
      }

      // Shorteners
      if (SHORTENERS.some(s => host.includes(s))) {
        score += 20;
        redFlags.push({
          category: 'DECEPTIVE_URL',
          severity: 'MEDIUM',
          title: 'Obfuscated Link Shortener',
          description: `The link (${host}) hides the real destination IP or phishing server.`
        });
      }

      // High-risk TLDs
      if (SUSPICIOUS_TLDS.some(tld => host.endsWith(tld))) {
        score += 25;
        redFlags.push({
          category: 'DECEPTIVE_URL',
          severity: 'HIGH',
          title: `High-Risk Top Level Domain (${host.split('.').pop()})`,
          description: 'Uses cheap/free domains commonly abused by scam syndicates to evade security filters.'
        });
      }
    } catch {
      // Ignored
    }
  }

  // 7. Normal Bank OTP Check (False Positive Mitigation)
  const isLikelyLegitOtp = /\b(OTP|One Time Password)\b/i.test(messageText) &&
    /\b(do not share|valid for|INR|Rs\.)\b/i.test(messageText) &&
    urls.length === 0;

  if (isLikelyLegitOtp) {
    score = 0;
  }

  // Cap score
  score = Math.min(100, Math.max(0, score));

  let verdict: ThreatVerdict = 'SAFE';
  if (score >= 60) verdict = 'DANGEROUS_PHISHING';
  else if (score >= 25) verdict = 'SUSPICIOUS';

  return {
    riskScore: score,
    verdict,
    impersonatedEntity: detectedBrand,
    scamType: scamType !== 'Unclassified Message' ? scamType : (verdict === 'SAFE' ? 'Legitimate Notification' : 'Suspicious Message'),
    summary: verdict === 'SAFE' 
      ? 'No high-risk threat indicators found in this communication.'
      : `High probability fraudulent message targeting ${detectedBrand || 'recipients'} using deceptive techniques.`,
    riskExplanation: verdict === 'SAFE'
      ? 'This message displays patterns typical of verified system notifications or standard OTP verifications. Always keep OTPs private.'
      : 'This communication exhibits classic social engineering tactics. Attackers impersonate authoritative institutions, manufacture urgency, and lure victims to untrusted links or phone numbers.',
    redFlags,
    suspiciousLinks: urls,
    safeRemedies: verdict === 'SAFE'
      ? ['Never share this OTP with anyone, even if they claim to be bank officials.', 'Verify transaction amount before approving.']
      : [
          'DO NOT CLICK on any links or download any files attached.',
          'Never call the phone numbers listed inside the message; contact the entity only via their official app/website.',
          'If you already provided banking passwords or card numbers, immediately freeze your account via your official banking app.',
          'Report this cybercrime incident at https://cybercrime.gov.in or dial the National Cyber Crime Helpline: 1930.'
        ],
    analyzedAt: new Date().toISOString(),
    engineUsed: 'heuristic_engine'
  };
}
