/**
 * BaitCheck — Website & E-Commerce Store Inspection Engine
 * Combines LinkEngine heuristic analysis with an interactive 10-point consumer trust checklist.
 */

import { LinkEngine } from './engine-link.js';

export const WEBSITE_CHECKLIST_QUESTIONS = [
  { id: 'q_contact', text: 'Does the website display a clear physical office address and verifiable phone number?', riskIfNo: true, weight: 15 },
  { id: 'q_gstin', text: 'Is an official GSTIN number or corporate business registration details displayed?', riskIfNo: true, weight: 15 },
  { id: 'q_refund', text: 'Is there a clear, realistic return and refund policy published?', riskIfNo: true, weight: 10 },
  { id: 'q_upi_only', text: 'Does the checkout force payment ONLY via direct UPI transfer to a personal mobile/VPA?', riskIfYes: true, weight: 35 },
  { id: 'q_unrealistic_discount', text: 'Are branded products advertised with unbelievable 70% to 90% discounts?', riskIfYes: true, weight: 30 },
  { id: 'q_social_ad', text: 'Did you discover this brand-new online store solely via an Instagram or Facebook sponsored ad?', riskIfYes: true, weight: 15 },
  { id: 'q_fake_reviews', text: 'Are the product reviews exclusively 5 stars with generic text and identical dates?', riskIfYes: true, weight: 15 },
  { id: 'q_countdown_timer', text: 'Is there an aggressive countdown timer urging you to checkout in minutes?', riskIfYes: true, weight: 15 },
  { id: 'q_domain_mismatch', text: 'Does the website domain name fail to match the company or brand being sold?', riskIfYes: true, weight: 25 },
  { id: 'q_no_cod', text: 'Is Cash on Delivery (COD) disabled or does it demand an advance delivery fee?', riskIfYes: true, weight: 20 }
];

export class WebsiteEngine {
  constructor(brandsData = {}, tldsData = {}, shortenersData = {}) {
    this.linkEngine = new LinkEngine(brandsData, tldsData, shortenersData);
  }

  analyze(rawUrl, answers = {}) {
    const linkResult = this.linkEngine.analyze(rawUrl);
    const signals = [...linkResult.signals];
    let totalScore = linkResult.score;

    let checklistQuestionsChecked = 0;
    let checklistPassed = 0;

    for (const q of WEBSITE_CHECKLIST_QUESTIONS) {
      const ans = answers[q.id]; // 'yes' | 'no' | 'not_sure'
      if (!ans) continue;

      checklistQuestionsChecked++;

      if (q.riskIfYes && ans === 'yes') {
        signals.push({
          id: `SITE_RISK_${q.id.toUpperCase()}`,
          severity: 'danger',
          weight: q.weight,
          title: q.text,
          evidence: 'Consumer Checklist Warning'
        });
        totalScore += q.weight;
      } else if (q.riskIfNo && ans === 'no') {
        signals.push({
          id: `SITE_LACK_${q.id.toUpperCase()}`,
          severity: 'warn',
          weight: q.weight,
          title: `Missing standard trust credential: ${q.text}`,
          evidence: 'Consumer Checklist Warning'
        });
        totalScore += q.weight;
      } else if ((q.riskIfYes && ans === 'no') || (q.riskIfNo && ans === 'yes')) {
        checklistPassed++;
      }
    }

    totalScore = Math.min(100, totalScore);

    let band = 'safe';
    if (totalScore >= 55) band = 'danger';
    else if (totalScore >= 25) band = 'caution';

    return {
      score: totalScore,
      band,
      signals,
      linkResult,
      checklistStats: {
        checked: checklistQuestionsChecked,
        passed: checklistPassed,
        total: WEBSITE_CHECKLIST_QUESTIONS.length
      },
      checksRun: linkResult.checksRun + checklistQuestionsChecked,
      checksPassed: linkResult.checksPassed + checklistPassed
    };
  }
}
