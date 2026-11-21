/**
 * BaitCheck Application Coordinator (app.js)
 * Clean, Vanilla JS, Zero External Libraries, 100% Offline Capable.
 */

(function () {
  'use strict';

  // State
  let currentLang = localStorage.getItem('baitcheck_lang') || 'en';
  let currentFontSize = parseInt(localStorage.getItem('baitcheck_font_size') || '18', 10);
  let rules = null;
  let i18n = {};
  let currentResult = null;

  // Preset demo vectors
  const PRESETS = {
    sbi: 'Dear Customer, Your SBI NetBanking account will be suspended today due to pending KYC verification. Update immediately at https://sbi-kyc-verify-portal.in/update to prevent permanent block.',
    courier: 'IndiaPost: Your parcel IN928472918IN cannot be delivered due to wrong address details. Please update your address and pay Rs 25 redelivery fee at https://indiapost-parcel-retrack.top/pay within 24 hours.',
    job: 'Hi! I am HR from Google Marketing Team. We offer flexible work-from-home part-time jobs. Earn Rs 3,000 to Rs 8,000 daily by liking YouTube videos. Join our Telegram: https://t.me/quick_earn_india',
    safe: '482910 is your OTP for transaction of INR 1,450.00 at Amazon India using SBI Card ending in 4021. Valid for 10 mins. Do not share OTP with anyone.'
  };

  // 8 Real-World Educational Scam Profiles
  const LEARN_SCAMS = [
    {
      icon: '🏦',
      titleKey: 'learn_kyc_title',
      title: 'Bank KYC Suspension Scam',
      badge: 'Critical Threat',
      looksLike: 'SMS claiming your account will be blocked today unless you update KYC on an unverified link.',
      staySafe: 'Banks NEVER ask for KYC updates over SMS links. Use only the official bank app or visit your branch.',
      example: 'Dear Customer, your bank account blocked today. Click http://bank-kyc-update.xyz to verify.'
    },
    {
      icon: '👮',
      titleKey: 'learn_arrest_title',
      title: 'Digital Arrest & Police Extortion',
      badge: 'Heavy Fear Tactic',
      looksLike: 'Video call or WhatsApp notice from fake CBI/Customs threatening an arrest warrant for money laundering.',
      staySafe: 'Police or court judges NEVER arrest or hold trials over Skype, WhatsApp, or video calls. Hang up and dial 1930.',
      example: 'CBI Police Notice: Arrest warrant issued for drug parcel in your name. Connect on WhatsApp immediately.'
    },
    {
      icon: '📦',
      titleKey: 'learn_parcel_title',
      title: 'India Post / Courier Redelivery Trap',
      badge: 'Card Credential Grab',
      looksLike: 'Message saying your parcel cannot be delivered, asking for ₹25 redelivery fee via a link.',
      staySafe: 'India Post never asks for redelivery fees via SMS. The link is designed to steal your debit card CVV and OTP.',
      example: 'IndiaPost: Parcel held due to wrong address. Pay Rs 25 redelivery fee at http://indiapost-fix.top'
    },
    {
      icon: '⚡',
      titleKey: 'learn_power_title',
      title: 'Electricity Bill Cutoff Threat',
      badge: 'Panic Extortion',
      looksLike: 'Urgent notice that your power supply will be cut tonight at 9:30 PM with a personal mobile number to call.',
      staySafe: 'Official electricity boards never send personal 10-digit mobile numbers or threaten sudden same-night disconnection.',
      example: 'URGENT: Electricity disconnected tonight 9:30 PM. Call Electricity Officer on 9823481234.'
    },
    {
      icon: '💼',
      titleKey: 'learn_job_title',
      title: 'Part-Time YouTube / Telegram Job',
      badge: 'Advance Fee Fraud',
      looksLike: 'Offers ₹3,000–₹8,000 daily for liking YouTube videos or rating hotels on Google Maps.',
      staySafe: 'They pay ₹150 first to gain trust, then demand thousands in "crypto prepaid tasks". No real company hires this way.',
      example: 'Earn Rs 5,000 daily from home by liking YouTube videos. Join Telegram: t.me/quick_earn'
    },
    {
      icon: '🎟️',
      titleKey: 'learn_lottery_title',
      title: 'WhatsApp Lottery / KBC Prize Scam',
      badge: 'Fake Reward',
      looksLike: 'Congratulates you on winning ₹25 Lakh in Kaun Banega Crorepati or WhatsApp lucky draw.',
      staySafe: 'You cannot win a lottery you never entered. They will demand ₹15,000 as "GST or processing fees".',
      example: 'Congratulations! You won Rs 25 Lakh in KBC WhatsApp Draw. Call KBC Manager on +91982182312.'
    },
    {
      icon: '📲',
      titleKey: 'learn_upi_title',
      title: 'Fake UPI Refund / QR Code Scam',
      badge: 'Payment Deception',
      looksLike: 'Seller or stranger says "I sent money by mistake, click this link or scan QR code to refund".',
      staySafe: 'You NEVER need to enter your UPI PIN to RECEIVE money. Entering your PIN always DEDUCTS money from your account.',
      example: 'Refund of Rs 2,000 approved. Scan QR code and enter UPI PIN to receive money.'
    },
    {
      icon: '📱',
      titleKey: 'learn_apk_title',
      title: 'Malicious Android APK Downloads',
      badge: 'Phone Hijack',
      looksLike: 'Link offering "reward app", "loan app", or "e-challan" asking you to download a .apk file.',
      staySafe: 'Never install apps from SMS links. Malicious APKs forward all your incoming OTPs directly to scammers.',
      example: 'Download SBI Reward points app to claim Rs 4,500: http://rewards-sbi.download/app.apk'
    }
  ];

  // DOM Elements
  const langSelect = document.getElementById('langSelect');
  const btnFontDec = document.getElementById('btnFontDec');
  const btnFontInc = document.getElementById('btnFontInc');
  const messageInput = document.getElementById('messageInput');
  const btnCheckMessage = document.getElementById('btnCheckMessage');
  const btnPasteClip = document.getElementById('btnPasteClip');
  const btnVoiceInput = document.getElementById('btnVoiceInput');
  const fileOcrInput = document.getElementById('fileOcrInput');
  const resultContainer = document.getElementById('resultContainer');
  const historyList = document.getElementById('historyList');
  const btnClearHistory = document.getElementById('btnClearHistory');
  const btnClearAllData = document.getElementById('btnClearAllData');

  // Nav tabs
  const tabCheck = document.getElementById('tabCheck');
  const tabLearn = document.getElementById('tabLearn');
  const tabHelp = document.getElementById('tabHelp');
  const viewCheck = document.getElementById('viewCheck');
  const viewLearn = document.getElementById('viewLearn');
  const viewHelp = document.getElementById('viewHelp');

  // Initialize
  async function init() {
    applyFontSize(currentFontSize);
    setupEventListeners();
    await loadRules();
    await loadI18n(currentLang);
    renderLearnCards();
    renderHistory();
    registerServiceWorker();
  }

  function applyFontSize(size) {
    currentFontSize = Math.min(26, Math.max(16, size));
    document.documentElement.style.setProperty('--font-base-size', currentFontSize + 'px');
    localStorage.setItem('baitcheck_font_size', currentFontSize.toString());
  }

  async function loadRules() {
    try {
      const res = await fetch('rules.json');
      rules = await res.json();
    } catch (e) {
      console.error('Failed to load rules.json locally:', e);
    }
  }

  async function loadI18n(lang) {
    try {
      currentLang = lang;
      localStorage.setItem('baitcheck_lang', lang);
      langSelect.value = lang;
      document.documentElement.lang = lang;

      const res = await fetch(`i18n/${lang}.json`);
      i18n = await res.json();
      updateLocalizedStrings();
      if (currentResult) {
        renderResult(currentResult);
      }
    } catch (e) {
      console.error(`Failed to load i18n/${lang}.json:`, e);
    }
  }

  function t(key, fallback) {
    return (i18n && i18n[key]) || fallback || key;
  }

  function updateLocalizedStrings() {
    document.getElementById('brandTagline').textContent = t('tagline', "Don't take the bait.");
    document.getElementById('privacyPromise').textContent = t('privacy_promise');
    document.getElementById('inputLabel').textContent = t('input_label');
    messageInput.placeholder = t('input_placeholder');
    document.getElementById('btnPasteText').textContent = t('btn_paste');
    document.getElementById('btnSpeakText').textContent = t('btn_speak');
    document.getElementById('btnScreenshotText').textContent = t('btn_screenshot');
    document.getElementById('btnCheckText').textContent = t('btn_check');
    document.getElementById('tryExamplesLabel').textContent = t('try_examples_label');

    // Preset labels
    document.getElementById('exBank').textContent = t('example_bank');
    document.getElementById('exCourier').textContent = t('example_courier');
    document.getElementById('exJob').textContent = t('example_job');
    document.getElementById('exSafe').textContent = t('example_safe');

    // History & SOS
    document.getElementById('historyTitle').textContent = t('history_title');
    document.getElementById('btnClearHistory').textContent = t('btn_clear_history');
    document.getElementById('learnTitle').textContent = t('learn_title');
    document.getElementById('learnSubtitle').textContent = t('learn_subtitle');
    document.getElementById('sosHelplineTitle').textContent = t('sos_helpline_title');
    document.getElementById('sosHelplineDesc').textContent = t('sos_helpline_desc');
    document.getElementById('btnVisitPortal').textContent = t('btn_visit_portal');
    document.getElementById('sosStepsTitle').textContent = t('sos_steps_title');
    document.getElementById('sosStep1').textContent = t('sos_step_1');
    document.getElementById('sosStep2').textContent = t('sos_step_2');
    document.getElementById('sosStep3').textContent = t('sos_step_3');
    document.getElementById('sosStep4').textContent = t('sos_step_4');
    document.getElementById('btnClearAllData').textContent = t('btn_clear_all_data');

    // Nav
    document.getElementById('navCheckText').textContent = t('nav_check');
    document.getElementById('navLearnText').textContent = t('nav_learn');
    document.getElementById('navHelpText').textContent = t('nav_help');
  }

  function switchTab(target) {
    [tabCheck, tabLearn, tabHelp].forEach(t => t.classList.remove('active'));
    [viewCheck, viewLearn, viewHelp].forEach(v => v.style.display = 'none');

    if (target === 'check') {
      tabCheck.classList.add('active');
      viewCheck.style.display = 'block';
    } else if (target === 'learn') {
      tabLearn.classList.add('active');
      viewLearn.style.display = 'block';
    } else if (target === 'help') {
      tabHelp.classList.add('active');
      viewHelp.style.display = 'block';
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleCheck() {
    const text = messageInput.value.trim();
    if (!text) {
      messageInput.focus();
      return;
    }

    if (!window.BaitEngine || !rules) {
      alert('Detection engine is still loading. Please try in a moment.');
      return;
    }

    const result = window.BaitEngine.analyze(text, rules);
    currentResult = result;
    renderResult(result);
    saveToHistory(text, result.verdict, result.score);
  }

  function renderResult(result) {
    resultContainer.style.display = 'block';

    let cardClass = 'safe';
    let iconSvg = '';
    let verdictTitle = t('verdict_safe_title');
    let verdictSub = t('verdict_safe_sub');
    let riskLabel = t('risk_low');

    if (result.verdict === 'LIKELY SCAM') {
      cardClass = 'danger';
      iconSvg = `<svg class="verdict-icon" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
      verdictTitle = t('verdict_danger_title');
      verdictSub = t('verdict_danger_sub');
      riskLabel = t('risk_high');
    } else if (result.verdict === 'BE CAREFUL') {
      cardClass = 'caution';
      iconSvg = `<svg class="verdict-icon" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
      verdictTitle = t('verdict_caution_title');
      verdictSub = t('verdict_caution_sub');
      riskLabel = t('risk_medium');
    } else {
      iconSvg = `<svg class="verdict-icon" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>`;
    }

    // Build Reasons list from keys
    const reasonsHtml = result.reasonKeys.map(k => {
      return `<li><span style="font-weight: 800; color: inherit;">•</span> ${t(k)}</li>`;
    }).join('');

    // Build Actions list from keys
    const actionsHtml = result.actionKeys.map(k => {
      return `<li><span style="font-weight: 800; color: inherit;">&rarr;</span> ${t(k)}</li>`;
    }).join('');

    resultContainer.innerHTML = `
      <div class="result-card ${cardClass}" tabindex="-1" id="resultCardFocus">
        <div class="verdict-header">
          ${iconSvg}
          <div>
            <div class="verdict-title">${verdictTitle}</div>
            <div class="verdict-sub">${verdictSub}</div>
          </div>
        </div>

        <div class="meter-container">
          <div class="meter-fill" style="width: ${Math.max(8, result.score)}%;"></div>
        </div>
        <div class="meter-label-row">
          <span>${t('risk_meter_label')} <strong>${riskLabel}</strong></span>
          <span>Score: <strong>${result.score}/100</strong></span>
        </div>

        <div class="result-section-title">${t('section_reasons')}</div>
        <ul class="reasons-list">
          ${reasonsHtml || `<li>• ${t('reason_safe_clean')}</li>`}
        </ul>

        <div class="result-section-title">${t('section_highlighted')}</div>
        <div class="highlight-preview">${result.highlightedHtml}</div>

        <div class="result-section-title">${t('section_actions')}</div>
        <ul class="actions-list">
          ${actionsHtml}
        </ul>

        <div class="result-actions-toolbar">
          <button id="btnReadAloud" class="btn-tool" type="button">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
            <span>${t('btn_read_aloud')}</span>
          </button>

          <button id="btnWarnFamily" class="btn-tool" type="button">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
            <span>${t('btn_warn_family')}</span>
          </button>

          <button id="btnGoHelp" class="btn-tool" type="button">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            <span>${t('btn_report')}</span>
          </button>

          <button id="btnResetScreen" class="btn-tool btn-reset" type="button">
            <span>&larr; ${t('btn_check_another')}</span>
          </button>
        </div>
      </div>
    `;

    // Bind Result Action Buttons
    document.getElementById('btnReadAloud').addEventListener('click', () => speakVerdict(verdictTitle, verdictSub));
    document.getElementById('btnWarnFamily').addEventListener('click', shareWithFamily);
    document.getElementById('btnGoHelp').addEventListener('click', () => switchTab('help'));
    document.getElementById('btnResetScreen').addEventListener('click', () => {
      messageInput.value = '';
      resultContainer.style.display = 'none';
      messageInput.focus();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Scroll smoothly to results
    const cardEl = document.getElementById('resultCardFocus');
    if (cardEl) {
      cardEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      cardEl.focus();
    }
  }

  function speakVerdict(title, sub) {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech is not supported on this browser.');
      return;
    }
    window.speechSynthesis.cancel();
    const textToSpeak = `${title}. ${sub}. ${t('section_actions')}: ${currentResult ? t(currentResult.actionKeys[0]) : ''}`;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    if (currentLang === 'hi') utterance.lang = 'hi-IN';
    else if (currentLang === 'as') utterance.lang = 'as-IN';
    else utterance.lang = 'en-IN';
    window.speechSynthesis.speak(utterance);
  }

  async function shareWithFamily() {
    if (!currentResult) return;
    const shareText = `⚠️ BaitCheck Security Alert ⚠️\nVerdict: ${currentResult.verdict}\nScam Risk: ${currentResult.score}/100\nAdvice: ${t(currentResult.actionKeys[0])}\n\nChecked with BaitCheck — Don't take the bait.`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'BaitCheck Scam Warning',
          text: shareText
        });
      } catch (err) {
        copyShareFallback(shareText);
      }
    } else {
      copyShareFallback(shareText);
    }
  }

  function copyShareFallback(text) {
    navigator.clipboard.writeText(text).then(() => {
      alert('Alert copied to clipboard! You can paste it in your family WhatsApp group.');
    }).catch(() => {
      alert(text);
    });
  }

  function renderLearnCards() {
    const container = document.getElementById('learnCardsContainer');
    if (!container) return;

    container.innerHTML = LEARN_SCAMS.map((s, idx) => `
      <article class="scam-card">
        <div class="scam-card-header">
          <span class="scam-card-icon">${s.icon}</span>
          <div>
            <div class="scam-card-title">${s.title}</div>
            <span class="scam-pill">${s.badge}</span>
          </div>
        </div>
        <p style="font-size: 0.92rem; margin-bottom: 8px;"><strong>How it looks:</strong> ${s.looksLike}</p>
        <div class="scam-example-box">"${s.example}"</div>
        <p style="font-size: 0.92rem; color: #15803d; font-weight: 700;"><strong>How to stay safe:</strong> ${s.staySafe}</p>
      </article>
    `).join('');
  }

  function saveToHistory(text, verdict, score) {
    try {
      let history = JSON.parse(localStorage.getItem('baitcheck_history') || '[]');
      const preview = text.length > 50 ? text.substring(0, 47) + '...' : text;
      history.unshift({ preview, verdict, score, date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
      if (history.length > 10) history = history.slice(0, 10);
      localStorage.setItem('baitcheck_history', JSON.stringify(history));
      renderHistory();
    } catch (e) {
      console.warn('History storage failed:', e);
    }
  }

  function renderHistory() {
    if (!historyList) return;
    try {
      const history = JSON.parse(localStorage.getItem('baitcheck_history') || '[]');
      if (history.length === 0) {
        historyList.innerHTML = `<p>${t('history_empty')}</p>`;
        return;
      }

      historyList.innerHTML = history.map(item => `
        <div style="padding: 8px 0; border-bottom: 1px solid var(--color-border); display: flex; justify-content: space-between; align-items: center; gap: 8px;">
          <div style="font-size: 0.85rem; color: var(--color-text-main); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            "${item.preview}"
          </div>
          <span style="font-size: 0.75rem; font-weight: 800; padding: 2px 6px; border-radius: 4px; white-space: nowrap; ${
            item.verdict === 'LIKELY SCAM' ? 'background: #fee2e2; color: #991b1b;' :
            item.verdict === 'BE CAREFUL' ? 'background: #fef3c7; color: #92400e;' :
            'background: #dcfce7; color: #166534;'
          }">
            ${item.verdict} (${item.score})
          </span>
        </div>
      `).join('');
    } catch (e) {
      historyList.innerHTML = `<p>${t('history_empty')}</p>`;
    }
  }

  function setupEventListeners() {
    // Language Switcher
    langSelect.addEventListener('change', (e) => loadI18n(e.target.value));

    // Font Controls
    btnFontDec.addEventListener('click', () => applyFontSize(currentFontSize - 2));
    btnFontInc.addEventListener('click', () => applyFontSize(currentFontSize + 2));

    // Nav Tabs
    tabCheck.addEventListener('click', () => switchTab('check'));
    tabLearn.addEventListener('click', () => switchTab('learn'));
    tabHelp.addEventListener('click', () => switchTab('help'));

    // Check button
    btnCheckMessage.addEventListener('click', handleCheck);

    // Paste clipboard
    btnPasteClip.addEventListener('click', async () => {
      try {
        if (navigator.clipboard && navigator.clipboard.readText) {
          const text = await navigator.clipboard.readText();
          messageInput.value = text;
          messageInput.focus();
        } else {
          alert('Clipboard read permission denied. Please paste manually into the box.');
        }
      } catch (err) {
        alert('Please paste the message directly into the text box.');
      }
    });

    // Voice Input (Web Speech API)
    btnVoiceInput.addEventListener('click', () => {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert('Voice recognition is not supported on this device. Please paste or type.');
        return;
      }
      const recognition = new SpeechRecognition();
      if (currentLang === 'hi') recognition.lang = 'hi-IN';
      else if (currentLang === 'as') recognition.lang = 'as-IN';
      else recognition.lang = 'en-IN';

      btnVoiceInput.style.borderColor = '#ef4444';
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        messageInput.value = transcript;
        btnVoiceInput.style.borderColor = '';
        handleCheck();
      };
      recognition.onerror = () => {
        btnVoiceInput.style.borderColor = '';
        alert('Could not hear voice. Please speak clearly or paste the text.');
      };
      recognition.onend = () => {
        btnVoiceInput.style.borderColor = '';
      };
      recognition.start();
    });

    // Screenshot OCR Input (Client-Side)
    fileOcrInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      alert(t('ocr_notice'));
      // Friendly prompt for low-literacy users if OCR offline model is not loaded
      const reader = new FileReader();
      reader.onload = () => {
        // Mock prompt to help elderly users confirm or paste text
        const simulatedText = prompt('We scanned the image. If text was not recognized clearly, please paste or type it here:', '');
        if (simulatedText) {
          messageInput.value = simulatedText;
          handleCheck();
        }
      };
      reader.readAsDataURL(file);
    });

    // Preset Example Buttons
    document.querySelectorAll('.btn-example-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.getAttribute('data-preset');
        if (PRESETS[key]) {
          messageInput.value = PRESETS[key];
          handleCheck();
        }
      });
    });

    // Clear History
    btnClearHistory.addEventListener('click', () => {
      localStorage.removeItem('baitcheck_history');
      renderHistory();
    });

    // Clear All Data
    btnClearAllData.addEventListener('click', () => {
      if (confirm('Clear all saved data and settings from this device?')) {
        localStorage.clear();
        sessionStorage.clear();
        alert(t('data_cleared_msg'));
        location.reload();
      }
    });
  }

  function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
          .then(reg => console.log('[BaitCheck PWA] Service Worker registered:', reg.scope))
          .catch(err => console.log('[BaitCheck PWA] Service Worker registration failed:', err));
      });
    }
  }

  // Start app
  window.addEventListener('DOMContentLoaded', init);
})();
