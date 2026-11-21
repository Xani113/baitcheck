/**
 * BaitCheck — Application Coordinator & UI Controller
 * Zero external dependencies. 100% offline-capable client-side architecture.
 */

import { MessageEngine } from './engine-message.js';
import { LinkEngine } from './engine-link.js';
import { EmailEngine } from './engine-email.js';
import { NumberEngine } from './engine-number.js';
import { QREngine } from './engine-qr.js';
import { WebsiteEngine, WEBSITE_CHECKLIST_QUESTIONS } from './engine-website.js';
import { Router } from './router.js';

class BaitCheckApp {
  constructor() {
    this.currentLang = localStorage.getItem('baitcheck_lang') || 'en';
    this.fontSizeLevel = parseInt(localStorage.getItem('baitcheck_font_scale') || '1', 10); // 0=14px, 1=16px, 2=18px
    this.historyEnabled = localStorage.getItem('baitcheck_history_enabled') === 'true';
    this.forcedTool = 'auto'; // 'auto' | 'message' | 'link' | 'email' | 'number' | 'website' | 'qr'
    this.websiteAnswers = {};

    this.i18n = {};
    this.data = {};
    this.engines = {};
    this.router = null;
  }

  async init() {
    this.applyFontScale();
    await this.loadBundledData();
    this.initEngines();
    this.initRouter();
    this.bindGlobalEvents();
    this.applyLanguage(this.currentLang);
  }

  applyFontScale() {
    const scales = ['14px', '16px', '18px'];
    const scale = scales[this.fontSizeLevel] || '16px';
    document.documentElement.style.fontSize = scale;
  }

  async loadBundledData() {
    try {
      const [rules, scams, brands, tlds, shorteners, disposable, libraryScams, guides, i18nEn, i18nHi, i18nAs] = await Promise.all([
        fetch('data/rules.json').then(r => r.json()),
        fetch('data/known-scams.json').then(r => r.json()),
        fetch('data/brands.json').then(r => r.json()),
        fetch('data/tlds.json').then(r => r.json()),
        fetch('data/shorteners.json').then(r => r.json()),
        fetch('data/disposable-domains.json').then(r => r.json()),
        fetch('data/scams.json').then(r => r.json()),
        fetch('data/guides.json').then(r => r.json()),
        fetch('i18n/en.json').then(r => r.json()),
        fetch('i18n/hi.json').then(r => r.json()),
        fetch('i18n/as.json').then(r => r.json())
      ]);

      this.data = { rules, scams, brands, tlds, shorteners, disposable, libraryScams, guides };
      this.i18n = { en: i18nEn, hi: i18nHi, as: i18nAs };
    } catch (e) {
      console.error('Failed to load bundled data', e);
    }
  }

  initEngines() {
    const { rules, scams, brands, tlds, shorteners, disposable } = this.data;
    this.engines.message = new MessageEngine(rules, scams, brands, tlds, shorteners);
    this.engines.link = new LinkEngine(brands, tlds, shorteners);
    this.engines.email = new EmailEngine(brands, disposable, tlds);
    this.engines.number = new NumberEngine();
    this.engines.qr = new QREngine(brands, tlds, shorteners);
    this.engines.website = new WebsiteEngine(brands, tlds, shorteners);
  }

  initRouter() {
    this.router = new Router({
      '/': () => this.showView('home'),
      '/check/message': () => { this.forcedTool = 'message'; this.showView('home'); },
      '/check/link': () => { this.forcedTool = 'link'; this.showView('home'); },
      '/check/email': () => { this.forcedTool = 'email'; this.showView('home'); },
      '/check/number': () => { this.forcedTool = 'number'; this.showView('home'); },
      '/check/website': () => { this.forcedTool = 'website'; this.showView('home'); },
      '/check/qr': () => { this.forcedTool = 'qr'; this.showView('home'); },
      '/known-scams': () => this.showView('known-scams'),
      '/guides': () => this.showView('guides'),
      '/help': () => this.showView('help'),
      '/history': () => this.showView('history')
    });
  }

  t(key, params = {}) {
    const dict = this.i18n[this.currentLang] || this.i18n.en || {};
    let val = dict[key] || this.i18n.en[key] || key;
    for (const p in params) {
      val = val.replace(new RegExp(`\\{${p}\\}`, 'g'), params[p]);
    }
    return val;
  }

  applyLanguage(lang) {
    this.currentLang = lang;
    localStorage.setItem('baitcheck_lang', lang);
    document.documentElement.lang = lang;

    // Update all data-i18n elements
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      el.textContent = this.t(key);
    });

    // Update placeholders
    document.querySelectorAll('[data-i18n-ph]').forEach(el => {
      const key = el.getAttribute('data-i18n-ph');
      el.placeholder = this.t(key);
    });

    const langSelect = document.getElementById('langSelect');
    if (langSelect) langSelect.value = lang;

    this.updateDetectedChip();
    this.renderCurrentView();
  }

  showView(viewName) {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    document.querySelectorAll('.app-view').forEach(v => v.classList.remove('active'));
    const target = document.getElementById(`view-${viewName}`);
    if (target) {
      target.classList.add('active');
      window.scrollTo(0, 0);
    }

    // Update nav active states (desktop + mobile)
    const isHome = viewName === 'home';
    document.querySelectorAll('.nav-link').forEach(nl => {
      const href = nl.getAttribute('href') || '';
      const matchesHome = isHome && (href === '#/' || href === '#');
      const matchesHash = href === window.location.hash;
      if (matchesHome || matchesHash) {
        nl.classList.add('active');
      } else {
        nl.classList.remove('active');
      }
    });

    document.querySelectorAll('.bottom-tab-link').forEach(tab => {
      const href = tab.getAttribute('href') || '';
      const matchesHome = isHome && (href === '#/' || href === '#');
      const matchesHash = href === window.location.hash;
      if (matchesHome || matchesHash) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });

    this.renderCurrentView(viewName);
  }

  renderCurrentView(viewName = null) {
    const current = viewName || (window.location.hash.replace('#/', '') || 'home');
    if (current === 'home' || current === '') {
      this.updateSegmentedTabs();
    } else if (current === 'known-scams') {
      this.renderKnownScamsView();
    } else if (current === 'guides') {
      this.renderGuidesView();
    } else if (current === 'help') {
      this.renderHelpView();
    } else if (current === 'history') {
      this.renderHistoryView();
    }
  }

  detectInputType(text) {
    if (!text || !text.trim()) return 'message';
    const clean = text.trim();

    if (/^https?:\/\//i.test(clean) || /(?:www\.)?[a-zA-Z0-9-]+\.(?:top|xyz|club|site|online|live|shop|vip|apk|info|com|in|co\.in|org|net)\b/i.test(clean)) {
      if (clean.split(/\s+/).length <= 2) return 'link';
    }
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) return 'email';
    if (/^(\+?91[-\s]?)?[6-9]\d{9}$/.test(clean) || /^140\d{7}$/.test(clean) || /^1800\d{6,7}$/.test(clean)) return 'number';
    if (/^upi:\/\/pay/i.test(clean) || /^[a-zA-Z0-9_.-]+@[a-zA-Z]+$/.test(clean)) return 'qr';
    return 'message';
  }

  updateSegmentedTabs() {
    document.querySelectorAll('.tab-tool').forEach(tab => {
      const tool = tab.getAttribute('data-tool');
      if (tool === this.forcedTool) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });
    this.updateDetectedChip();
  }

  updateDetectedChip() {
    const textarea = document.getElementById('universalInput');
    const detectedChip = document.getElementById('detectedChip');
    if (!detectedChip) return;
    const val = textarea ? textarea.value : '';
    const auto = this.detectInputType(val);
    const effective = this.forcedTool === 'auto' ? auto : this.forcedTool;
    detectedChip.textContent = `${this.t('chip_detected')}: ${this.t('tool_' + effective)}`;
    detectedChip.classList.remove('pulse');
    void detectedChip.offsetWidth;
    detectedChip.classList.add('pulse');
  }

  bindGlobalEvents() {
    // Language Picker
    const langSelect = document.getElementById('langSelect');
    if (langSelect) {
      langSelect.addEventListener('change', (e) => this.applyLanguage(e.target.value));
    }

    // Font Scale Buttons
    const btnFontInc = document.getElementById('btnFontInc');
    const btnFontDec = document.getElementById('btnFontDec');
    if (btnFontInc) {
      btnFontInc.addEventListener('click', () => {
        if (this.fontSizeLevel < 2) {
          this.fontSizeLevel++;
          localStorage.setItem('baitcheck_font_scale', this.fontSizeLevel);
          this.applyFontScale();
        }
      });
    }
    if (btnFontDec) {
      btnFontDec.addEventListener('click', () => {
        if (this.fontSizeLevel > 0) {
          this.fontSizeLevel--;
          localStorage.setItem('baitcheck_font_scale', this.fontSizeLevel);
          this.applyFontScale();
        }
      });
    }

    // Input events on Main Textarea
    const textarea = document.getElementById('universalInput');
    if (textarea) {
      textarea.addEventListener('input', () => {
        this.updateDetectedChip();
      });
    }

    // Segmented Control Buttons
    document.querySelectorAll('.tab-tool').forEach(tab => {
      tab.addEventListener('click', () => {
        this.forcedTool = tab.getAttribute('data-tool');
        this.updateSegmentedTabs();
        if (textarea && textarea.value.trim()) {
          this.runCheck();
        }
      });
    });

    // Quick Tool Cards in Home View
    document.querySelectorAll('.tool-quick-card').forEach(card => {
      card.addEventListener('click', () => {
        const targetTool = card.getAttribute('data-tool-target');
        if (targetTool) {
          this.forcedTool = targetTool;
          this.updateSegmentedTabs();
          if (textarea) {
            textarea.focus();
            textarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
            if (textarea.value.trim()) {
              this.runCheck();
            }
          }
        }
      });
    });

    // Primary Check Button
    const btnCheck = document.getElementById('btnCheck');
    if (btnCheck) {
      btnCheck.addEventListener('click', () => this.runCheck());
    }

    // Paste from Clipboard Button
    const btnPaste = document.getElementById('btnPaste');
    if (btnPaste && textarea) {
      btnPaste.addEventListener('click', async () => {
        try {
          const text = await navigator.clipboard.readText();
          if (text) {
            textarea.value = text;
            textarea.dispatchEvent(new Event('input'));
            this.runCheck();
          }
        } catch (err) {
          textarea.focus();
        }
      });
    }

    // Example Presets
    document.querySelectorAll('.btn-example').forEach(btn => {
      btn.addEventListener('click', () => {
        const exType = btn.getAttribute('data-example');
        this.loadExample(exType);
      });
    });

    // Clear Button
    const btnClear = document.getElementById('btnClear');
    if (btnClear && textarea) {
      btnClear.addEventListener('click', () => {
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
        textarea.value = '';
        const resultContainer = document.getElementById('caseCardContainer');
        if (resultContainer) resultContainer.innerHTML = '';
        this.updateDetectedChip();
        textarea.focus();
      });
    }
  }

  loadExample(type) {
    const textarea = document.getElementById('universalInput');
    if (!textarea) return;

    const presets = {
      kyc: 'Dear customer your SBI bank account has been suspended today due to pending KYC update. Click here to verify your PAN card immediately sbi-kyc-update.top',
      link: 'https://hdfc.bank-verify.xyz/otp-confirm',
      upi: 'upi://pay?pa=refundclaim88@ybl&pn=MerchantRefund&am=3500&cu=INR',
      safe: 'Your OTP for login to SBI NetBanking is 482910. Valid for 10 minutes. Do not share this OTP with anyone.'
    };

    if (presets[type]) {
      textarea.value = presets[type];
      textarea.dispatchEvent(new Event('input'));
      this.runCheck();
    }
  }

  runCheck() {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    const textarea = document.getElementById('universalInput');
    if (!textarea) return;

    const raw = textarea.value.trim();
    if (!raw) {
      textarea.focus();
      return;
    }

    const autoType = this.detectInputType(raw);
    const effectiveType = this.forcedTool === 'auto' ? autoType : this.forcedTool;

    // Line-and-Hook animation trigger
    const lineDraw = document.getElementById('lineDrawIndicator');
    if (lineDraw) {
      lineDraw.classList.remove('drawing');
      void lineDraw.offsetWidth;
      lineDraw.classList.add('drawing');
    }

    let result;
    if (effectiveType === 'link') {
      result = this.engines.link.analyze(raw);
    } else if (effectiveType === 'email') {
      result = this.engines.email.analyze(raw);
    } else if (effectiveType === 'number') {
      result = this.engines.number.analyze(raw);
    } else if (effectiveType === 'qr') {
      result = this.engines.qr.analyze(raw);
    } else if (effectiveType === 'website') {
      result = this.engines.website.analyze(raw, this.websiteAnswers);
    } else {
      result = this.engines.message.analyze(raw);
    }

    this.renderCaseCard(result, raw, effectiveType);

    // Save to local history if enabled
    if (this.historyEnabled) {
      this.saveHistoryEntry(effectiveType, result, raw);
    }
  }

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  renderCaseCard(result, rawInput, type) {
    const container = document.getElementById('caseCardContainer');
    if (!container) return;

    const { score, band, signals, matches, checksRun, checksPassed, highlightedWords, isAltered } = result;

    const bandLabels = {
      safe: this.t('verdict_safe_title'),
      caution: this.t('verdict_caution_title'),
      danger: this.t('verdict_danger_title')
    };

    const bandSubtexts = {
      safe: this.t('verdict_safe_sub'),
      caution: this.t('verdict_caution_sub'),
      danger: this.t('verdict_danger_sub')
    };

    const bandIcons = {
      safe: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
      caution: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
      danger: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`
    };

    // ARIA Live region announcement for accessibility
    const announcer = document.getElementById('ariaAnnouncer');
    if (announcer) {
      announcer.textContent = `Verdict: ${bandLabels[band]}. Score: ${score} out of 100.`;
    }

    // Construct escaped highlighted original text
    let escapedOriginal = this.escapeHtml(rawInput);
    if (highlightedWords && highlightedWords.length > 0) {
      for (const w of highlightedWords) {
        if (!w || w.length < 2) continue;
        const escW = this.escapeHtml(w);
        const re = new RegExp(escW.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        escapedOriginal = escapedOriginal.replace(re, `<mark class="flagged-word">$&</mark>`);
      }
    }

    // Signals HTML
    let signalsHtml = '';
    if (signals && signals.length > 0) {
      signalsHtml = signals.map(s => `
        <div class="signal-item severity-${s.severity}">
          <div class="signal-badge">
            <span class="signal-icon">${s.severity === 'danger' ? '⚠' : '!'}</span>
            <span class="signal-title">${this.escapeHtml(s.title)}</span>
          </div>
          ${s.evidence ? `<div class="signal-evidence"><code>${this.escapeHtml(s.evidence)}</code></div>` : ''}
        </div>
      `).join('');
    } else {
      signalsHtml = `<div class="signals-empty">No suspicious indicators found across standard rules.</div>`;
    }

    // Known Pattern Comparison Block
    let patternBlockHtml = '';
    if (matches && matches.length > 0 && matches[0].template) {
      const match = matches[0];
      const tpl = match.template;
      const simPercent = Math.round(match.similarity * 100);
      patternBlockHtml = `
        <div class="pattern-match-box">
          <div class="pattern-header">
            <span class="pattern-badge">KNOWN PATTERN DETECTED</span>
            <strong>${this.t('pattern_matched_title')}</strong>
          </div>
          <p class="pattern-desc">
            ${this.t('pattern_matched_desc', { category: tpl.category, percent: simPercent })}
          </p>
          <div class="pattern-compare-grid">
            <div class="compare-col">
              <div class="compare-label">${this.t('compare_your_msg')}</div>
              <div class="compare-text">${escapedOriginal}</div>
            </div>
            <div class="compare-col">
              <div class="compare-label">${this.t('compare_known_tpl')} (${tpl.id})</div>
              <div class="compare-text tpl-text">${this.escapeHtml(tpl.text)}</div>
            </div>
          </div>
        </div>
      `;
    }

    // Action items
    const actions = [
      this.t(`action_${band}_1`),
      this.t(`action_${band}_2`),
      this.t(`action_${band}_3`)
    ];
    const actionsHtml = actions.map(act => `<li>${this.escapeHtml(act)}</li>`).join('');

    // HTML Case Card Assembly
    container.innerHTML = `
      <div class="case-card band-${band} line-and-hook-reveal" role="region" aria-label="Analysis Case Card">
        <!-- Header: Verdict & Meter -->
        <div class="card-header">
          <div class="verdict-banner">
            <span class="verdict-icon-box">${bandIcons[band]}</span>
            <div>
              <h2 class="verdict-heading">${bandLabels[band]}</h2>
              <p class="verdict-subtext">${bandSubtexts[band]}</p>
            </div>
          </div>
          <div class="score-pill">
            <span class="score-num">${score}</span>
            <span class="score-den">/ 100</span>
          </div>
        </div>

        <!-- 6px Risk Meter -->
        <div class="meter-bar-track" aria-hidden="true">
          <div class="meter-bar-fill band-${band}" style="width: ${Math.max(5, score)}%;"></div>
        </div>

        <div class="checks-summary-line">
          ${this.t('checks_run_line', { checksRun: checksRun || 14, signalsFound: (signals || []).length })}
        </div>

        <!-- Pattern Matched Alert -->
        ${patternBlockHtml}

        <!-- Highlighted Words in Original Message -->
        <div class="flagged-original-box">
          <div class="section-label">${this.t('highlighted_title')}</div>
          <div class="original-snippet-text">${escapedOriginal}</div>
        </div>

        <!-- Why Flagged List -->
        <div class="card-section">
          <h3 class="section-heading">${this.t('why_flagged_title')}</h3>
          <div class="signals-list">${signalsHtml}</div>
        </div>

        <!-- What to do next -->
        <div class="card-section action-section">
          <h3 class="section-heading">${this.t('what_to_do_title')}</h3>
          <ul class="action-steps-list">${actionsHtml}</ul>
        </div>

        <!-- Action Buttons -->
        <div class="card-actions-bar">
          <button class="btn-action-outline" id="btnActionSpeak" type="button">
            🔊 ${this.t('btn_read_aloud')}
          </button>
          <button class="btn-action-outline" id="btnActionShare" type="button">
            👥 ${this.t('btn_warn_family')}
          </button>
          <a class="btn-action-danger" href="tel:1930">
            📞 ${this.t('btn_report_helpline')}
          </a>
          <button class="btn-action-outline" id="btnActionCopy" type="button">
            📋 ${this.t('btn_copy_summary')}
          </button>
        </div>

        <!-- Collapsible Honest Limits -->
        <details class="honest-limits-accordion">
          <summary>${this.t('what_it_means_title')}</summary>
          <div class="limits-body">
            <p>${this.t('what_it_means_desc')}</p>
          </div>
        </details>
      </div>
    `;

    // Bind Case Card Action Buttons
    const btnActionSpeak = document.getElementById('btnActionSpeak');
    if (btnActionSpeak) {
      btnActionSpeak.addEventListener('click', () => {
        if (!('speechSynthesis' in window)) return;

        // If currently speaking or active, toggle STOP
        if (window.speechSynthesis.speaking || btnActionSpeak.classList.contains('speaking')) {
          window.speechSynthesis.cancel();
          btnActionSpeak.innerHTML = `🔊 ${this.t('btn_read_aloud')}`;
          btnActionSpeak.classList.remove('speaking');
          return;
        }

        // Start reading aloud
        window.speechSynthesis.cancel(); // Clear any queued speech
        const textToSpeak = `${bandLabels[band]}. Score: ${score} out of 100. ${bandSubtexts[band]}`;
        const utter = new SpeechSynthesisUtterance(textToSpeak);
        utter.lang = this.currentLang === 'hi' ? 'hi-IN' : (this.currentLang === 'as' ? 'as-IN' : 'en-IN');

        utter.onstart = () => {
          btnActionSpeak.innerHTML = `⏹️ ${this.t('btn_stop_reading')}`;
          btnActionSpeak.classList.add('speaking');
        };

        utter.onend = () => {
          btnActionSpeak.innerHTML = `🔊 ${this.t('btn_read_aloud')}`;
          btnActionSpeak.classList.remove('speaking');
        };

        utter.onerror = () => {
          btnActionSpeak.innerHTML = `🔊 ${this.t('btn_read_aloud')}`;
          btnActionSpeak.classList.remove('speaking');
        };

        window.speechSynthesis.speak(utter);
      });
    }

    const btnActionShare = document.getElementById('btnActionShare');
    if (btnActionShare) {
      btnActionShare.addEventListener('click', async () => {
        const shareText = `⚠️ BaitCheck Alert: I checked this communication and it received a score of ${score}/100 (${bandLabels[band]}). Please stay safe and do not send money or enter OTP/PIN!`;
        if (navigator.share) {
          try {
            await navigator.share({
              title: 'BaitCheck Scam Warning',
              text: shareText
            });
          } catch (e) {}
        } else {
          navigator.clipboard.writeText(shareText);
          alert('Warning text copied to clipboard. Share it with your family!');
        }
      });
    }

    const btnActionCopy = document.getElementById('btnActionCopy');
    if (btnActionCopy) {
      btnActionCopy.addEventListener('click', () => {
        const summary = `BaitCheck Report\nVerdict: ${bandLabels[band]} (${score}/100)\nChecks Run: ${checksRun}\nFlags: ${(signals || []).map(s => s.title).join('; ')}\nVerification: local on-device check.`;
        navigator.clipboard.writeText(summary);
        btnActionCopy.textContent = '✓ Copied';
        setTimeout(() => { btnActionCopy.textContent = `📋 ${this.t('btn_copy_summary')}`; }, 2000);
      });
    }

    container.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  saveHistoryEntry(type, result, text) {
    try {
      const history = JSON.parse(localStorage.getItem('baitcheck_history') || '[]');
      const masked = text.length > 50 ? text.slice(0, 48) + '...' : text;
      const entry = {
        type,
        band: result.band,
        score: result.score,
        time: new Date().toLocaleTimeString(),
        date: new Date().toLocaleDateString(),
        snippet: masked
      };
      history.unshift(entry);
      if (history.length > 20) history.pop();
      localStorage.setItem('baitcheck_history', JSON.stringify(history));
    } catch (e) {}
  }

  renderKnownScamsView() {
    const listContainer = document.getElementById('scamsLibraryList');
    if (!listContainer || !this.data.libraryScams) return;

    const { categories, scams } = this.data.libraryScams;
    const catsHtml = categories.map((cat, i) => `
      <button class="chip ${i === 0 ? 'active' : ''}" data-cat="${cat}">${cat}</button>
    `).join('');

    const scamsHtml = scams.map(s => `
      <div class="scam-library-card" data-category="${s.category}">
        <div class="scam-header">
          <span class="scam-cat-badge">${s.category}</span>
          <h3 class="scam-title">${s.title}</h3>
        </div>
        <p class="scam-how"><strong>How it works:</strong> ${s.howItWorks}</p>
        <div class="scam-example-box">
          <div class="example-label">What it looks like:</div>
          <code>${s.fakeExample}</code>
        </div>
        <div class="scam-flags-box">
          <strong>Key Red Flags:</strong>
          <ul>${s.redFlags.map(rf => `<li>${rf}</li>`).join('')}</ul>
        </div>
        <div class="scam-action-box">
          <strong>What to do:</strong>
          <ul>${s.whatToDo.map(w => `<li>${w}</li>`).join('')}</ul>
        </div>
      </div>
    `).join('');

    listContainer.innerHTML = `
      <div class="scams-category-bar">${catsHtml}</div>
      <div class="scams-cards-grid">${scamsHtml}</div>
    `;

    listContainer.querySelectorAll('.scams-category-bar .chip').forEach(btn => {
      btn.addEventListener('click', () => {
        listContainer.querySelectorAll('.chip').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const selCat = btn.getAttribute('data-cat');
        listContainer.querySelectorAll('.scam-library-card').forEach(card => {
          if (selCat === 'All' || card.getAttribute('data-category') === selCat) {
            card.style.display = 'block';
          } else {
            card.style.display = 'none';
          }
        });
      });
    });
  }

  renderGuidesView() {
    const guidesContainer = document.getElementById('guidesListContainer');
    if (!guidesContainer || !this.data.guides) return;

    const { guides } = this.data.guides;
    guidesContainer.innerHTML = guides.map(g => `
      <div class="guide-card">
        <div class="guide-meta">
          <span class="guide-tag">GUIDE</span>
          <span class="guide-time">${g.readTime}</span>
        </div>
        <h3 class="guide-title">${g.title}</h3>
        <p class="guide-summary">${g.summary}</p>
        <div class="guide-steps">
          <ol>${g.steps.map(s => `<li>${s}</li>`).join('')}</ol>
        </div>
      </div>
    `).join('');
  }

  renderHelpView() {
    const helpContainer = document.getElementById('helpContentContainer');
    if (!helpContainer) return;

    helpContainer.innerHTML = `
      <div class="emergency-help-card">
        <div class="emergency-badge">IMMEDIATE EMERGENCY ASSISTANCE</div>
        <h2>Lost money to a digital fraud? Act in the "Golden Hour"</h2>
        <p>If you transferred money or gave an OTP to a scammer within the last 24 hours, take these 3 steps immediately:</p>
        <div class="emergency-steps-grid">
          <div class="emergency-step">
            <div class="step-num">1</div>
            <div>
              <strong>Call 1930 Helpline</strong>
              <p>National Cyber Crime Reporting Helpline directly freezes fraudulent recipient accounts in real-time.</p>
              <a href="tel:1930" class="btn-helpline-big">Dial 1930 Now</a>
            </div>
          </div>
          <div class="emergency-step">
            <div class="step-num">2</div>
            <div>
              <strong>Block Bank Cards & UPI</strong>
              <p>Contact your bank immediately to block your debit/credit card and freeze mobile banking.</p>
            </div>
          </div>
          <div class="emergency-step">
            <div class="step-num">3</div>
            <div>
              <strong>Report on Sanchar Saathi</strong>
              <p>Use the Chakshu portal (sancharsaathi.gov.in) to report fraudulent SMS sender headers and mobile numbers.</p>
            </div>
          </div>
        </div>
      </div>

      <div class="faq-container-box">
        <h3>${this.t('faq_title')}</h3>
        <div class="faq-list">
          <details class="faq-item" open>
            <summary>${this.t('faq_1_q')}</summary>
            <p>${this.t('faq_1_a')}</p>
          </details>
          <details class="faq-item">
            <summary>${this.t('faq_2_q')}</summary>
            <p>${this.t('faq_2_a')}</p>
          </details>
          <details class="faq-item">
            <summary>${this.t('faq_3_q')}</summary>
            <p>${this.t('faq_3_a')}</p>
          </details>
          <details class="faq-item">
            <summary>${this.t('faq_4_q')}</summary>
            <p>${this.t('faq_4_a')}</p>
          </details>
        </div>
      </div>
    `;
  }

  renderHistoryView() {
    const historyContainer = document.getElementById('historyContentContainer');
    if (!historyContainer) return;

    const history = JSON.parse(localStorage.getItem('baitcheck_history') || '[]');
    historyContainer.innerHTML = `
      <div class="history-controls-bar">
        <label class="toggle-switch">
          <input type="checkbox" id="chkHistoryToggle" ${this.historyEnabled ? 'checked' : ''}>
          <span>Save check history on this device (OFF by default)</span>
        </label>
        ${history.length > 0 ? `<button class="btn-clear-hist" id="btnClearHistory">Clear All History</button>` : ''}
      </div>
      <div class="history-items-list">
        ${history.length === 0 ? `<div class="history-empty">No checks recorded. History is OFF by default to preserve privacy.</div>` : ''}
        ${history.map(item => `
          <div class="history-item-row band-${item.band}">
            <div class="hist-type-pill">${item.type}</div>
            <div class="hist-snippet"><code>${this.escapeHtml(item.snippet)}</code></div>
            <div class="hist-score">${item.score}/100</div>
            <div class="hist-time">${item.date} ${item.time}</div>
          </div>
        `).join('')}
      </div>
    `;

    const chk = document.getElementById('chkHistoryToggle');
    if (chk) {
      chk.addEventListener('change', (e) => {
        this.historyEnabled = e.target.checked;
        localStorage.setItem('baitcheck_history_enabled', this.historyEnabled);
        this.renderHistoryView();
      });
    }

    const btnClear = document.getElementById('btnClearHistory');
    if (btnClear) {
      btnClear.addEventListener('click', () => {
        localStorage.removeItem('baitcheck_history');
        this.renderHistoryView();
      });
    }
  }
}

// Instantiate and launch application on DOMContentLoaded
window.addEventListener('DOMContentLoaded', () => {
  const app = new BaitCheckApp();
  app.init();
});
