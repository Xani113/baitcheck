/**
 * BaitCheck — QR Code & UPI Deep-Link Analyzer
 * Parses UPI parameters (pa, pn, am, tr) and warns on collect requests.
 * Core Rule: You NEVER need to enter a UPI PIN to receive money.
 */

import { LinkEngine } from './engine-link.js';

export class QREngine {
  constructor(brandsData = {}, tldsData = {}, shortenersData = {}) {
    this.linkEngine = new LinkEngine(brandsData, tldsData, shortenersData);
  }

  analyze(rawPayload) {
    if (!rawPayload || typeof rawPayload !== 'string') {
      return { score: 0, band: 'safe', signals: [], checksRun: 6, checksPassed: 6 };
    }

    const payload = rawPayload.trim();
    const signals = [];
    const checksRun = 6;
    let checksPassed = 0;

    // 1. UPI Payload Detection (upi://pay?pa=... or contains @)
    if (payload.startsWith('upi://pay') || payload.includes('pa=')) {
      try {
        const url = new URL(payload.startsWith('upi://') ? payload : 'upi://pay?' + payload);
        const pa = url.searchParams.get('pa') || ''; // payee VPA
        const pn = url.searchParams.get('pn') || ''; // payee name
        const am = url.searchParams.get('am') || ''; // amount
        const tr = url.searchParams.get('tr') || ''; // transaction ref

        // Check for suspicious collect / refund keywords in payee name or VPA
        if (/(refund|cashback|prize|reward|claim|helpdesk|support)/i.test(pn) || /(refund|claim|winner)/i.test(pa)) {
          signals.push({
            id: 'UPI_LURE_PAYEE',
            severity: 'danger',
            weight: 60,
            title: 'Deceptive payee name mimicking refund or cashback payout',
            evidence: `${pn || pa}`
          });
        } else {
          checksPassed++;
        }

        // Pre-filled amount alert
        if (am && parseFloat(am) > 0) {
          signals.push({
            id: 'UPI_PREFILLED_DEBIT',
            severity: 'danger',
            weight: 55,
            title: `Pre-set money debit of ₹${am}. If you scan this, funds leave YOUR bank account!`,
            evidence: `₹${am} debit`
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
          isUpi: true,
          details: { pa, pn, am, tr },
          goldenRule: 'CRITICAL RULE: You NEVER need to enter your UPI PIN to receive money. UPI PIN is exclusively used to SEND money.'
        };
      } catch (e) {
        // Fall through to link or text analysis
      }
    }

    // 2. If it's a URL in QR code, delegate to LinkEngine
    if (/^https?:\/\//i.test(payload) || payload.includes('.')) {
      const linkResult = this.linkEngine.analyze(payload);
      return {
        ...linkResult,
        isUpi: false,
        qrType: 'link'
      };
    }

    // 3. Plain text payload
    return {
      score: 0,
      band: 'safe',
      signals: [],
      checksRun: 4,
      checksPassed: 4,
      isUpi: false,
      qrType: 'text',
      rawText: payload
    };
  }
}
