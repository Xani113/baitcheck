/**
 * BaitCheck — TDD Automated Test Suite Runner (Node.js)
 * Evaluates 60+ ground-truth test cases across Messages, Links, Emails, Numbers, QR/UPI, and Altered Messages.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { MessageEngine } from './js/engine-message.js';
import { LinkEngine } from './js/engine-link.js';
import { EmailEngine } from './js/engine-email.js';
import { NumberEngine } from './js/engine-number.js';
import { QREngine } from './js/engine-qr.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadJson(relPath) {
  const fullPath = path.join(__dirname, relPath);
  return JSON.parse(fs.readFileSync(fullPath, 'utf8'));
}

const testInputs = loadJson('test-inputs.json');
const rulesData = loadJson('data/rules.json');
const knownScamsData = loadJson('data/known-scams.json');
const brandsData = loadJson('data/brands.json');
const tldsData = loadJson('data/tlds.json');
const shortenersData = loadJson('data/shorteners.json');
const disposableData = loadJson('data/disposable-domains.json');

const messageEngine = new MessageEngine(rulesData, knownScamsData, brandsData, tldsData, shortenersData);
const linkEngine = new LinkEngine(brandsData, tldsData, shortenersData);
const emailEngine = new EmailEngine(brandsData, disposableData, tldsData);
const numberEngine = new NumberEngine();
const qrEngine = new QREngine(brandsData, tldsData, shortenersData);

console.log('='.repeat(70));
console.log(`Running BaitCheck Ground-Truth Test Suite (${testInputs.tests.length} test cases)...`);
console.log('='.repeat(70));

let passedCount = 0;
let falseAlarmsOnSafe = 0;
const failures = [];

for (const tc of testInputs.tests) {
  let result;
  if (tc.type === 'message') {
    result = messageEngine.analyze(tc.text);
  } else if (tc.type === 'link') {
    result = linkEngine.analyze(tc.text);
  } else if (tc.type === 'email') {
    result = emailEngine.analyze(tc.text);
  } else if (tc.type === 'number') {
    result = numberEngine.analyze(tc.text);
  } else if (tc.type === 'qr') {
    result = qrEngine.analyze(tc.text);
  } else {
    result = messageEngine.analyze(tc.text);
  }

  let passed = true;
  let reason = '';

  // 1. Check expected band match
  if (tc.expectedBand && result.band !== tc.expectedBand) {
    passed = false;
    reason += `Expected band '${tc.expectedBand}', got '${result.band}' (score ${result.score}). `;
  }

  // 2. Check pattern matching expectation
  if (tc.shouldMatchPattern === true) {
    if (!result.matches || result.matches.length === 0) {
      passed = false;
      reason += 'Expected known pattern match, but none matched. ';
    }
  } else if (tc.shouldMatchPattern === false) {
    if (result.matches && result.matches.length > 0 && result.matches[0].isMatch) {
      passed = false;
      reason += `Genuine item falsely matched pattern ${result.matches[0].template?.id}. `;
    }
  }

  // 3. Check for false alarms on genuine safe samples
  if (tc.expectedBand === 'safe' && result.band !== 'safe') {
    falseAlarmsOnSafe++;
  }

  if (passed) {
    passedCount++;
  } else {
    failures.push({
      id: tc.id,
      text: tc.text ? tc.text.slice(0, 60) + '...' : '',
      reason,
      score: result.score,
      band: result.band
    });
  }
}

const passRate = (passedCount / testInputs.tests.length) * 100;

console.log(`\nRESULTS SUMMARY:`);
console.log(`Total Cases:    ${testInputs.tests.length}`);
console.log(`Passed:         ${passedCount}`);
console.log(`Failed:         ${failures.length}`);
console.log(`Pass Rate:      ${passRate.toFixed(1)}% (Target: >= 90%)`);
console.log(`False Alarms:   ${falseAlarmsOnSafe} (Target: 0)`);

if (failures.length > 0) {
  console.log(`\nFAILURES (${failures.length}):`);
  for (const f of failures) {
    console.log(`  [FAIL] ${f.id}: ${f.reason} -> "${f.text}"`);
  }
}

console.log('='.repeat(70));

if (passRate >= 90 && falseAlarmsOnSafe === 0) {
  console.log('✓ TEST SUITE PASSED EXCELLENTLY (>= 90% pass rate & 0 false alarms on genuine samples)!');
  process.exit(0);
} else {
  console.error('✗ TEST SUITE FAILED TO MEET CRITERIA.');
  process.exit(1);
}
