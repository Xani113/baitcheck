/**
 * BaitCheck — Message Engine (PS01 Hero Detector)
 * Analyzes SMS, WhatsApp, and email messages with altered-pattern matching and multi-script NLP.
 */

import { PatternMatcher } from './pattern-matcher.js';
import { LinkEngine } from './engine-link.js';

export class MessageEngine {
  constructor(rulesData = {}, knownScamsData = {}, brandsData = {}, tldsData = {}, shortenersData = {}) {
    this.rules = rulesData.messageRules || [];
    this.whitelists = rulesData.whitelist || [];
    this.thresholds = rulesData.thresholds || { safeMax: 24, cautionMax: 54, dangerMin: 55 };
    
    this.patternMatcher = new PatternMatcher(knownScamsData.templates || []);
    this.linkEngine = new LinkEngine(brandsData, tldsData, shortenersData);
  }

  /**
   * Extracts all URLs from text.
   */
  extractUrls(text) {
    if (!text) return [];
    const urlRegex = /(https?:\/\/[^\s]+|(?:www\.)?[a-zA-Z0-9-]+\.(?:top|xyz|club|site|online|live|shop|vip|apk|info|com|in|co\.in|org|net)[^\s]*)/gi;
    const matches = text.match(urlRegex) || [];
    return Array.from(new Set(matches));
  }

  /**
   * Checks if message satisfies genuine whitelist criteria (0 false alarms).
   */
  checkWhitelist(text, hasUrls) {
    if (hasUrls) return null; // Whitelisted genuine alerts must not contain links

    for (const wl of this.whitelists) {
      const reg = new RegExp(wl.regex, 'i');
      if (reg.test(text)) {
        if (wl.negativeGuard) {
          const negReg = new RegExp(wl.negativeGuard, 'i');
          if (negReg.test(text)) continue;
        }
        return wl.id;
      }
    }
    return null;
  }

  /**
   * Main analysis entrypoint.
   */
  analyze(rawMessage) {
    if (!rawMessage || typeof rawMessage !== 'string' || !rawMessage.trim()) {
      return {
        score: 0,
        band: 'safe',
        signals: [],
        matches: [],
        checksRun: 14,
        checksPassed: 14,
        highlightedWords: [],
        isAltered: false
      };
    }

    const text = rawMessage.trim();
    const urls = this.extractUrls(text);
    const hasUrls = urls.length > 0;

    // Check Whitelist first
    const whitelistHit = this.checkWhitelist(text, hasUrls);
    if (whitelistHit) {
      return {
        score: 0,
        band: 'safe',
        signals: [],
        matches: [],
        checksRun: 14,
        checksPassed: 14,
        highlightedWords: [],
        isAltered: false,
        whitelistHit
      };
    }

    const signals = [];
    const highlightedWords = [];
    let checksRun = 14;
    let checksPassed = 0;

    // 1. Altered-Message & Pattern Matching
    const patternResult = this.patternMatcher.findBestMatch(text);
    const { bestTemplate, similarity, isMatch, isResemblance, isObfuscated, obfuscationReasons } = patternResult;

    if (isObfuscated) {
      signals.push({
        id: 'MSG_OBFUSCATION_EVASION',
        severity: 'danger',
        weight: 35,
        title: 'Deliberately altered formatting to evade scam filters',
        evidence: obfuscationReasons.join(', ')
      });
    }

    if (isMatch && bestTemplate) {
      signals.push({
        id: 'MSG_PATTERN_MATCH',
        severity: 'danger',
        weight: 60,
        title: `Matches known pattern: ${bestTemplate.category} (${Math.round(similarity * 100)}% match)`,
        evidence: bestTemplate.id,
        template: bestTemplate,
        similarity
      });
    } else if (isResemblance && bestTemplate) {
      signals.push({
        id: 'MSG_PATTERN_RESEMBLANCE',
        severity: 'warn',
        weight: 30,
        title: `Resembles known pattern: ${bestTemplate.category} (${Math.round(similarity * 100)}% similar)`,
        evidence: bestTemplate.id,
        template: bestTemplate,
        similarity
      });
    } else {
      checksPassed += 2;
    }

    // 2. Direct Rule Matching across EN, HI, Hinglish, Assamese
    for (const rule of this.rules) {
      const reg = new RegExp(rule.regex, 'i');
      const match = text.match(reg);
      if (match) {
        signals.push({
          id: rule.id,
          severity: rule.severity || 'danger',
          weight: rule.weight || 30,
          title: this.getRuleTitle(rule.id),
          evidence: match[0].slice(0, 40)
        });
        highlightedWords.push(match[0]);
      } else {
        checksPassed++;
      }
    }

    // 3. Inspect Embedded URLs using LinkEngine
    for (const url of urls) {
      const linkResult = this.linkEngine.analyze(url);
      if (linkResult.signals.length > 0) {
        for (const ls of linkResult.signals) {
          signals.push({
            id: ls.id,
            severity: ls.severity,
            weight: ls.weight,
            title: ls.title,
            evidence: ls.evidence
          });
        }
        highlightedWords.push(url);
      }
    }

    // Compute final composite score
    let totalScore = 0;
    for (const s of signals) {
      totalScore += s.weight || 20;
    }
    totalScore = Math.min(100, totalScore);

    // Band assignment
    let band = 'safe';
    if (totalScore >= this.thresholds.dangerMin) {
      band = 'danger';
    } else if (totalScore >= this.thresholds.safeMax + 1) {
      band = 'caution';
    }

    // Checks passed calculation
    checksPassed = Math.max(0, checksRun - signals.length);

    return {
      score: totalScore,
      band,
      signals,
      matches: bestTemplate ? [{
        template: bestTemplate,
        similarity,
        isMatch,
        isResemblance
      }] : [],
      checksRun,
      checksPassed,
      highlightedWords: [...new Set(highlightedWords)],
      isAltered: isObfuscated,
      patternResult
    };
  }

  getRuleTitle(ruleId) {
    const titles = {
      MSG_URGENCY: 'Artificial urgency or coercive deadline',
      MSG_CREDENTIAL_DEMAND: 'Requests confidential PIN, OTP, password, or Aadhaar',
      MSG_KYC_EXTORTION: 'Fake KYC expiration or account suspension threat',
      MSG_UTILITY_DISCONNECTION: 'Electricity or power supply cutoff extortion',
      MSG_TASK_JOB_FRAUD: 'Unrealistic work-from-home or YouTube task earning scam',
      MSG_DIGITAL_ARREST: 'Fictitious Digital Arrest, fake CBI or police extortion',
      MSG_LOTTERY_PRIZE: 'Fraudulent lottery or KBC lucky draw jackpot claim',
      MSG_APK_DOWNLOAD: 'Urges downloading untrusted APK or remote control software',
      MSG_PARCEL_CUSTOMS: 'Fake parcel delivery failure or customs fee notice',
      MSG_ECHALLAN_SPOOF: 'Deceptive traffic police e-challan violation alert'
    };
    return titles[ruleId] || 'Suspicious communication pattern';
  }
}
