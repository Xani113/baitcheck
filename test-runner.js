/**
 * BaitCheck TDD Test Runner
 * Evaluates test-messages.json against the local detection engine.
 */

async function runAllTests() {
  const resultsContainer = document.getElementById('results');
  const summaryContainer = document.getElementById('summary');
  if (resultsContainer) resultsContainer.innerHTML = '<p>Loading tests and rules...</p>';

  try {
    const [messagesRes, rulesRes] = await Promise.all([
      fetch('test-messages.json'),
      fetch('rules.json')
    ]);

    const testCases = await messagesRes.json();
    const rules = await rulesRes.json();

    let passed = 0;
    let falseAlarms = 0;
    let missedScams = 0;
    let html = '';

    for (const tc of testCases) {
      const result = window.BaitEngine.analyze(tc.input, rules);
      const verdict = result.verdict; // 'LOOKS SAFE', 'BE CAREFUL', 'LIKELY SCAM'

      let isPass = false;
      if (tc.expected_verdict === verdict) {
        isPass = true;
      } else if (tc.expected_verdict === 'LIKELY SCAM' && (verdict === 'LIKELY SCAM' || verdict === 'BE CAREFUL')) {
        // High caution or scam on a scam test case
        isPass = true;
      } else if (tc.expected_verdict === 'LOOKS SAFE' && verdict === 'LOOKS SAFE') {
        isPass = true;
      }

      if (tc.must_not_be && verdict === tc.must_not_be) {
        isPass = false;
      }

      if (isPass) {
        passed++;
      } else {
        if (tc.expected_verdict === 'LOOKS SAFE' && verdict !== 'LOOKS SAFE') {
          falseAlarms++;
        } else {
          missedScams++;
        }
      }

      html += `
        <div class="test-row ${isPass ? 'pass' : 'fail'}">
          <div>
            <strong style="color: #38bdf8;">[${tc.id}] (${tc.language} - ${tc.category})</strong>
            <p style="margin: 4px 0; font-size: 13px; color: #cbd5e1;">"${tc.input}"</p>
            <div style="font-size: 12px; color: #94a3b8;">
              Score: <strong>${result.score}/100</strong> | Signals: ${result.reasons.join('; ') || 'None'}
            </div>
          </div>
          <div style="text-align: right; min-width: 140px;">
            <span class="badge ${isPass ? 'badge-pass' : 'badge-fail'}">
              ${isPass ? 'PASSED' : 'FAILED'}
            </span>
            <div style="font-size: 11px; margin-top: 4px; color: #94a3b8;">
              Exp: ${tc.expected_verdict}<br>Got: <strong style="color: white;">${verdict}</strong>
            </div>
          </div>
        </div>
      `;
    }

    const accuracy = Math.round((passed / testCases.length) * 100);

    if (summaryContainer) {
      summaryContainer.style.display = 'grid';
      summaryContainer.innerHTML = `
        <div>
          <div class="metric-value" style="color: ${accuracy >= 90 ? '#4ade80' : '#f87171'};">${accuracy}%</div>
          <div class="metric-label">Overall Accuracy (${passed}/${testCases.length})</div>
        </div>
        <div>
          <div class="metric-value" style="color: ${falseAlarms === 0 ? '#4ade80' : '#f87171'};">${falseAlarms}</div>
          <div class="metric-label">False Alarms (Safe marked as Scam)</div>
        </div>
        <div>
          <div class="metric-value" style="color: ${missedScams === 0 ? '#4ade80' : '#fbbf24'};">${missedScams}</div>
          <div class="metric-label">Missed Scams</div>
        </div>
      `;
    }

    if (resultsContainer) resultsContainer.innerHTML = html;
    console.log(`[TDD Tests] Accuracy: ${accuracy}% | Passed: ${passed}/${testCases.length} | False Alarms: ${falseAlarms}`);
    return { accuracy, passed, total: testCases.length, falseAlarms, missedScams };
  } catch (err) {
    console.error('Test execution failed:', err);
    if (resultsContainer) resultsContainer.innerHTML = `<p style="color: #ef4444;">Error running tests: ${err.message}</p>`;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runAllTests };
}
