/**
 * BaitCheck Explainable Detection Engine (engine.js)
 * Autonomous on-device rule evaluation. No network egress.
 */

(function (global) {
  'use strict';

  function extractUrls(text) {
    if (!text) return [];
    var urlRegex = /(https?:\/\/[^\s]+)/gi;
    var matches = text.match(urlRegex);
    return matches ? Array.from(new Set(matches)) : [];
  }

  function defangLink(url) {
    if (!url) return '';
    return url.replace('http://', 'hxxp://').replace('https://', 'hxxps://');
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function analyze(text, rules) {
    if (!text || typeof text !== 'string') {
      return {
        score: 0,
        verdict: 'LOOKS SAFE',
        verdictKey: 'verdict_safe',
        reasons: [],
        reasonKeys: [],
        highlightedHtml: '',
        suspiciousLinks: [],
        actions: ['action_stay_vigilant']
      };
    }

    var cleanText = text.trim();
    var urls = extractUrls(cleanText);
    var ruleset = rules || {};
    var whitelist = ruleset.whitelist || [];
    var signals = ruleset.signals || [];
    var thresholds = ruleset.thresholds || { safeMax: 20, cautionMax: 54, dangerMin: 55 };

    // 1. Whitelist Check (False Alarm Suppression)
    var isWhitelisted = false;
    for (var i = 0; i < whitelist.length; i++) {
      var wl = whitelist[i];
      var rx = new RegExp(wl.regex, 'i');
      if (rx.test(cleanText)) {
        if (!wl.mustNotHaveLinks || urls.length === 0) {
          isWhitelisted = true;
          break;
        }
      }
    }

    if (isWhitelisted) {
      return {
        score: 0,
        verdict: 'LOOKS SAFE',
        verdictKey: 'verdict_safe',
        reasons: ['Normal transaction notification or personal communication without scam indicators.'],
        reasonKeys: ['reason_safe_clean'],
        highlightedHtml: escapeHtml(cleanText),
        suspiciousLinks: [],
        actions: [
          'Never share OTPs or passwords with callers, even if they claim to be bank officials.',
          'Verify transaction details on your official banking app if uncertain.'
        ],
        actionKeys: ['action_safe_1', 'action_safe_2']
      };
    }

    // 2. Signal Matching
    var score = 0;
    var firedSignals = [];
    var reasonKeys = [];
    var matchedRanges = [];

    for (var j = 0; j < signals.length; j++) {
      var sig = signals[j];
      var sigRegex = new RegExp(sig.regex, 'i');
      var match = sigRegex.exec(cleanText);

      if (match) {
        score += sig.weight;
        firedSignals.push(sig);
        if (sig.reason_key && reasonKeys.indexOf(sig.reason_key) === -1) {
          reasonKeys.push(sig.reason_key);
        }
        matchedRanges.push({
          start: match.index,
          end: match.index + match[0].length
        });
      }
    }

    // Additional link presence weight
    if (urls.length > 0 && score > 0) {
      score += 15;
    }

    // Phone number in message accompanied by threat
    if (/(\+91\d{10}|\b\d{10}\b)/.test(cleanText) && score >= 25) {
      score += 15;
    }

    score = Math.min(100, Math.max(0, score));

    var verdict = 'LOOKS SAFE';
    var verdictKey = 'verdict_safe';

    if (score >= thresholds.dangerMin) {
      verdict = 'LIKELY SCAM';
      verdictKey = 'verdict_danger';
    } else if (score >= thresholds.safeMax) {
      verdict = 'BE CAREFUL';
      verdictKey = 'verdict_caution';
    }

    // 3. Highlight suspicious phrases securely
    var highlightedHtml = escapeHtml(cleanText);
    for (var u = 0; u < urls.length; u++) {
      var originalUrl = urls[u];
      var safeDefanged = defangLink(originalUrl);
      var safeSpan = '<span class="flagged-link" title="Untrusted link">' + escapeHtml(safeDefanged) + '</span>';
      highlightedHtml = highlightedHtml.split(escapeHtml(originalUrl)).join(safeSpan);
    }

    // 4. Action steps mapped by verdict
    var actionKeys = [];
    if (verdict === 'LIKELY SCAM') {
      actionKeys = ['action_danger_1', 'action_danger_2', 'action_danger_3'];
    } else if (verdict === 'BE CAREFUL') {
      actionKeys = ['action_caution_1', 'action_caution_2', 'action_caution_3'];
    } else {
      actionKeys = ['action_safe_1', 'action_safe_2'];
    }

    return {
      score: score,
      verdict: verdict,
      verdictKey: verdictKey,
      reasons: firedSignals.map(function (s) { return s.id; }),
      reasonKeys: reasonKeys,
      highlightedHtml: highlightedHtml,
      suspiciousLinks: urls.map(defangLink),
      actions: actionKeys,
      actionKeys: actionKeys
    };
  }

  var BaitEngine = {
    analyze: analyze,
    extractUrls: extractUrls,
    defangLink: defangLink,
    escapeHtml: escapeHtml
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = BaitEngine;
  } else {
    global.BaitEngine = BaitEngine;
  }
})(typeof window !== 'undefined' ? window : global);
