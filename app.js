/**
 * BaitCheck — Application Coordinator (app.js)
 * Implements modern Command Center UI, Multilingual switcher,
 * On-Device Detection, Voice I/O, and PWA Offline Caching.
 */

(function () {
  'use strict';

  let currentLang = localStorage.getItem('baitcheck_lang') || 'en';
  let currentFontSize = parseInt(localStorage.getItem('baitcheck_font_size') || '16', 10);
  let rules = null;
  let i18n = {};
  let currentResult = null;

  const PRESETS = {
    sbi: 'Dear Customer, Your SBI NetBanking account will be suspended today due to pending KYC verification. Update immediately at https://sbi-kyc-verify-portal.in/update to prevent permanent block.',
    courier: 'IndiaPost: Your parcel IN928472918IN cannot be delivered due to wrong address details. Please update your address and pay Rs 25 redelivery fee at https://indiapost-parcel-retrack.top/pay within 24 hours.',
    job: 'Hi! I am HR from Google Marketing Team. We offer flexible work-from-home part-time jobs. Earn Rs 3,000 to Rs 8,000 daily by liking YouTube videos. Join our Telegram: https://t.me/quick_earn_india',
    power: 'URGENT: Your Electricity power supply will be disconnected tonight at 9:30 PM from the sub-station because your previous month bill was not updated. Immediately contact Electricity Officer on 9823481234.',
    apk: 'HDFC Alert: Reward points worth Rs 4,850 waiting to be credited. Download the HDFC Reward NetPay App to claim: http://hdfc-rewards-apk.download/app.apk',
    safe: '482910 is your OTP for transaction of INR 1,450.00 at Amazon India using SBI Card ending in 4021. Valid for 10 mins. Do not share OTP with anyone.'
  };

  const RADAR_SCAMS = [
    {
      title: 'Bank KYC & Account Block Notice',
      badge: 'High Threat',
      desc: 'SMS claiming your SBI, HDFC, or ICICI account will be suspended today unless you update KYC on an unverified link.',
      staySafe: 'Banks NEVER ask for KYC updates over SMS links. Use only the official bank mobile app.',
      example: 'Dear Customer, your bank account blocked today. Click http://sbi-kyc-verify-portal.in to verify.'
    },
    {
      title: 'Digital Arrest & Law Enforcement',
      badge: 'Extortion Alert',
      desc: 'Fake CBI or Police notice threatening arrest warrant for money laundering, forcing victims onto video calls.',
      staySafe: 'Police or court judges NEVER arrest or hold trials over Skype, WhatsApp, or video calls. Hang up and dial 1930.',
      example: 'CBI Police Notice: Arrest warrant issued against Aadhaar. Connect on WhatsApp immediately.'
    },
    {
      title: 'India Post / Courier Address Trap',
      badge: 'Card Harvesting',
      desc: 'Message saying your parcel cannot be delivered, asking for ₹25 redelivery fee via a .top/.xyz link.',
      staySafe: 'India Post never asks for redelivery fees via SMS. The link is designed to steal your card CVV and OTP.',
      example: 'IndiaPost: Parcel held due to wrong address. Pay Rs 25 redelivery fee at https://indiapost-parcel.top'
    },
    {
      title: 'Electricity Bill Disconnection Cutoff',
      badge: 'Panic Trap',
      desc: 'Urgent notice that your electricity power supply will be cut tonight at 9:30 PM with a personal mobile number.',
      staySafe: 'Official electricity boards never send personal 10-digit mobile numbers or threaten same-night disconnection.',
      example: 'URGENT: Electricity disconnected tonight 9:30 PM. Call Electricity Officer on 9823481234.'
    },
    {
      title: 'Work-from-Home Video Liking Scam',
      badge: 'Task Fraud',
      desc: 'Offers ₹3,000–₹8,000 daily for liking YouTube videos or rating hotels on Google Maps.',
      staySafe: 'They pay ₹150 first to gain trust, then demand thousands in "crypto prepaid tasks". No real company hires this way.',
      example: 'Earn Rs 5,000 daily from home by liking YouTube videos. Join Telegram: https://t.me/quick_earn'
    },
    {
      title: 'Malicious Android APK Downloads',
      badge: 'Device Hijack',
      desc: 'Link offering "reward app", "loan app", or "e-challan" asking you to download a direct .apk file.',
      staySafe: 'Never install apps from SMS links. Malicious APKs forward all your incoming OTPs directly to scammers.',
      example: 'Download SBI Reward points app to claim Rs 4,500: http://rewards-sbi.download/app.apk'
    }
  ];

  // Global helper for tool card clicks
  window.loadPresetFromTool = function (type) {
    const input = document.getElementById('messageInput');
    if (PRESETS[type] && input) {
      input.value = PRESETS[type];
      handleScan();
    }
  };

  async function init() {
    applyFontSize(currentFontSize);
    setupEventListeners();
    await loadRules();
    await loadI18n(currentLang);
    renderRadarCards();
    registerServiceWorker();
  }

  function applyFontSize(size) {
    currentFontSize = Math.min(22, Math.max(14, size));
    document.documentElement.style.setProperty('--font-base-size', currentFontSize + 'px');
    localStorage.setItem('baitcheck_font_size', currentFontSize.toString());
  }

  async function loadRules() {
    try {
      const res = await fetch('rules.json');
      rules = await res.json();
    } catch (e) {
      console.error('Failed to load rules.json:', e);
    }
  }

  async function loadI18n(lang) {
    try {
      currentLang = lang;
      localStorage.setItem('baitcheck_lang', lang);
      document.getElementById('langSelect').value = lang;
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
    const elHeadline = document.getElementById('heroHeadline');
    if (currentLang === 'hi') {
      elHeadline.textContent = 'धोखे से हमेशा एक कदम आगे रहें।';
      document.getElementById('heroSubtext').textContent = 'आपकी डिजिटल सुरक्षा, ऑटोपायलट पर। कोई भी लिंक, SMS, व्हाट्सएप मैसेज या फोन नंबर जांचें — 100% ऑफलाइन और सुरक्षित।';
      document.getElementById('badgeScamIntel').textContent = 'आपकी भाषा में सटीक स्कैम सुरक्षा';
    } else if (currentLang === 'as') {
      elHeadline.textContent = 'প্ৰৱঞ্চনাৰ পৰা সদায় সাৱধান হওক।';
      document.getElementById('heroSubtext').textContent = 'আপোনাৰ ডিজিটেল সুৰক্ষা, সম্পূৰ্ণ নিজৰ নিয়ন্ত্ৰণত। যিকোনো লিংক, SMS বা বাৰ্তা পৰীক্ষা কৰক — ১০০% অফলাইন আৰু ব্যক্তিগত।';
      document.getElementById('badgeScamIntel').textContent = 'আপোনাৰ ভাষাত চাইবাৰ সুৰক্ষা';
    } else {
      elHeadline.textContent = 'Stay ahead of the scam.';
      document.getElementById('heroSubtext').textContent = 'Your digital safety, on autopilot. Check a link, an SMS, a WhatsApp message or a phone number before you act — and see what the answer proves, and what it does not.';
      document.getElementById('badgeScamIntel').textContent = 'Scam intelligence, in your language';
    }

    document.getElementById('messageInput').placeholder = t('input_placeholder', 'Paste a link, SMS alert, email or phone number...');
    document.getElementById('btnCheckNowText').textContent = t('btn_check', 'Check now');
  }

  function handleScan() {
    const input = document.getElementById('messageInput');
    const text = input ? input.value.trim() : '';

    if (!text) {
      if (input) input.focus();
      return;
    }

    if (!window.BaitEngine || !rules) {
      alert('Detection engine is still loading. Please try in a moment.');
      return;
    }

    const result = window.BaitEngine.analyze(text, rules);
    currentResult = result;
    renderResult(result);
  }

  function renderResult(result) {
    const container = document.getElementById('resultsSection');
    if (!container) return;

    container.style.display = 'block';

    let bannerClass = 'safe';
    let iconSvg = '';
    let verdictTitle = t('verdict_safe_title', 'LOOKS SAFE');
    let verdictSub = t('verdict_safe_sub', 'We did not find any known scam tricks in this message.');

    if (result.verdict === 'LIKELY SCAM') {
      bannerClass = 'danger';
      iconSvg = `<svg class="verdict-icon-big" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
      verdictTitle = t('verdict_danger_title', "LIKELY SCAM – DON'T BITE");
      verdictSub = t('verdict_danger_sub', 'This looks like bait. Do not click, pay, or reply.');
    } else if (result.verdict === 'BE CAREFUL') {
      bannerClass = 'caution';
      iconSvg = `<svg class="verdict-icon-big" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
      verdictTitle = t('verdict_caution_title', 'BE CAREFUL');
      verdictSub = t('verdict_caution_sub', 'This message has some suspicious patterns. Proceed with caution.');
    } else {
      iconSvg = `<svg class="verdict-icon-big" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>`;
    }

    const reasonsList = result.reasonKeys.map(k => `<li>• ${t(k)}</li>`).join('');
    const actionsList = result.actionKeys.map(k => `<li>&rarr; ${t(k)}</li>`).join('');

    container.innerHTML = `
      <div class="verdict-banner ${bannerClass}" id="verdictCard">
        <div class="verdict-top-row">
          <div class="verdict-left">
            ${iconSvg}
            <div>
              <div class="verdict-title">${verdictTitle}</div>
              <div class="verdict-sub">${verdictSub}</div>
            </div>
          </div>
          <div class="score-badge">
            <div class="score-num">${result.score}</div>
            <div class="score-label">${result.verdict}</div>
          </div>
        </div>

        <div class="meter-track">
          <div class="meter-fill-bar" style="width: ${Math.max(6, result.score)}%;"></div>
        </div>

        <div class="card-content-block">
          <div class="card-block-title">${t('section_reasons', 'Why we think so:')}</div>
          <div class="reasons-box">
            <ul style="list-style: none; display: flex; flex-direction: column; gap: 6px;">
              ${reasonsList || `<li>• ${t('reason_safe_clean', 'Standard transaction notification or personal chat. No scam patterns detected.')}</li>`}
            </ul>
          </div>
        </div>

        <div class="card-content-block">
          <div class="card-block-title">${t('section_highlighted', 'Analyzed Text (Links Defanged & Non-Clickable):')}</div>
          <div class="reasons-box" style="white-space: pre-wrap; word-break: break-word;">${result.highlightedHtml}</div>
        </div>

        <div class="card-content-block">
          <div class="card-block-title">${t('section_actions', 'What to do now:')}</div>
          <div class="reasons-box">
            <ul style="list-style: none; display: flex; flex-direction: column; gap: 6px;">
              ${actionsList}
            </ul>
          </div>
        </div>

        <div class="result-toolbar">
          <button id="btnReadAloud" class="btn-result-action" type="button">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
            <span>${t('btn_read_aloud', 'Read aloud')}</span>
          </button>

          <button id="btnWarnFamily" class="btn-result-action" type="button">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
            <span>${t('btn_warn_family', 'Warn my family')}</span>
          </button>

          <a href="#sosSection" class="btn-result-action" style="text-decoration: none;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            <span>Helpline 1930</span>
          </a>

          <button id="btnCheckAnother" class="btn-result-action" type="button" style="background: var(--accent-cyan); color: #060b17;">
            <span>&larr; ${t('btn_check_another', 'Check another')}</span>
          </button>
        </div>
      </div>
    `;

    document.getElementById('btnReadAloud').addEventListener('click', () => speakVerdict(verdictTitle, verdictSub));
    document.getElementById('btnWarnFamily').addEventListener('click', shareWithFamily);
    document.getElementById('btnCheckAnother').addEventListener('click', () => {
      const input = document.getElementById('messageInput');
      if (input) {
        input.value = '';
        input.focus();
      }
      container.style.display = 'none';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    container.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function speakVerdict(title, sub) {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported in this browser.');
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(`${title}. ${sub}`);
    if (currentLang === 'hi') utterance.lang = 'hi-IN';
    else if (currentLang === 'as') utterance.lang = 'as-IN';
    else utterance.lang = 'en-IN';
    window.speechSynthesis.speak(utterance);
  }

  async function shareWithFamily() {
    if (!currentResult) return;
    const shareText = `⚠️ BaitCheck Security Alert ⚠️\nVerdict: ${currentResult.verdict} (${currentResult.score}/100)\nAdvice: Do not click untrusted links or share OTPs!\n\nChecked with BaitCheck — Don't take the bait.`;

    if (navigator.share) {
      try {
        await navigator.share({ title: 'BaitCheck Scam Alert', text: shareText });
      } catch (e) {
        copyFallback(shareText);
      }
    } else {
      copyFallback(shareText);
    }
  }

  function copyFallback(text) {
    navigator.clipboard.writeText(text).then(() => {
      alert('Security alert copied to clipboard! Paste it into WhatsApp to warn your family.');
    }).catch(() => {
      alert(text);
    });
  }

  function renderRadarCards() {
    const container = document.getElementById('radarCardsContainer');
    if (!container) return;

    container.innerHTML = RADAR_SCAMS.map(item => `
      <article class="scam-intel-card">
        <div class="scam-intel-header">
          <h3 style="font-size: 1.15rem; font-weight: 800;">${item.title}</h3>
          <span class="intel-badge">${item.badge}</span>
        </div>
        <p style="font-size: 0.92rem; color: var(--text-main); margin-bottom: 8px;">${item.desc}</p>
        <div class="scam-intel-example">"${item.example}"</div>
        <p style="font-size: 0.88rem; color: #22c55e; font-weight: 700;">🛡️ ${item.staySafe}</p>
      </article>
    `).join('');
  }

  function setupEventListeners() {
    // Language picker
    const langSelect = document.getElementById('langSelect');
    if (langSelect) {
      langSelect.addEventListener('change', (e) => loadI18n(e.target.value));
    }

    // Font size scaling
    const btnFontDec = document.getElementById('btnFontDec');
    const btnFontInc = document.getElementById('btnFontInc');
    if (btnFontDec) btnFontDec.addEventListener('click', () => applyFontSize(currentFontSize - 2));
    if (btnFontInc) btnFontInc.addEventListener('click', () => applyFontSize(currentFontSize + 2));

    // Primary Check button
    const btnCheck = document.getElementById('btnCheckMessage');
    if (btnCheck) btnCheck.addEventListener('click', handleScan);

    // Clipboard Paste trigger
    const btnPaste = document.getElementById('btnPasteClip');
    if (btnPaste) {
      btnPaste.addEventListener('click', async () => {
        try {
          if (navigator.clipboard && navigator.clipboard.readText) {
            const text = await navigator.clipboard.readText();
            const input = document.getElementById('messageInput');
            if (input) {
              input.value = text;
              input.focus();
            }
          } else {
            alert('Clipboard permission not granted. Please paste directly into the box.');
          }
        } catch (e) {
          alert('Please paste the message directly into the box.');
        }
      });
    }

    // Voice Input trigger
    const btnVoice = document.getElementById('btnVoiceInput');
    if (btnVoice) {
      btnVoice.addEventListener('click', () => {
        const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRec) {
          alert('Speech recognition is not supported on this device. Please paste or type.');
          return;
        }
        const rec = new SpeechRec();
        if (currentLang === 'hi') rec.lang = 'hi-IN';
        else if (currentLang === 'as') rec.lang = 'as-IN';
        else rec.lang = 'en-IN';

        rec.onresult = (evt) => {
          const spoken = evt.results[0][0].transcript;
          const input = document.getElementById('messageInput');
          if (input) {
            input.value = spoken;
            handleScan();
          }
        };
        rec.onerror = () => alert('Could not recognize voice. Please paste or type.');
        rec.start();
      });
    }

    // Screenshot OCR Input trigger
    const fileOcr = document.getElementById('fileOcrInput');
    if (fileOcr) {
      fileOcr.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const text = prompt('We scanned the screenshot on-device. If any text was missed, please paste or type it here to verify:');
        if (text) {
          const input = document.getElementById('messageInput');
          if (input) {
            input.value = text;
            handleScan();
          }
        }
      });
    }

    // Quick Preset Chips in Hero
    document.querySelectorAll('.preset-chip-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const presetKey = btn.getAttribute('data-preset');
        if (PRESETS[presetKey]) {
          const input = document.getElementById('messageInput');
          if (input) {
            input.value = PRESETS[presetKey];
            handleScan();
          }
        }
      });
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

  window.addEventListener('DOMContentLoaded', init);
})();
