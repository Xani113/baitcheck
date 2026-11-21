const fs = require('fs');
const path = require('path');
const BaitEngine = require('./engine.js');

const testMessages = JSON.parse(fs.readFileSync(path.join(__dirname, 'test-messages.json'), 'utf8'));
const rules = JSON.parse(fs.readFileSync(path.join(__dirname, 'rules.json'), 'utf8'));

console.log('\n======================================================');
console.log('🛡️  BaitCheck TDD Benchmark Verification');
console.log(`Evaluating ${testMessages.length} test cases across EN, HI, Hinglish, Assamese`);
console.log('======================================================\n');

let passed = 0;
let falseAlarms = 0;
let missedScams = 0;

testMessages.forEach((tc, idx) => {
  const res = BaitEngine.analyze(tc.input, rules);
  const verdict = res.verdict;

  let isPass = false;
  if (tc.expected_verdict === verdict) {
    isPass = true;
  } else if (tc.expected_verdict === 'LIKELY SCAM' && (verdict === 'LIKELY SCAM' || verdict === 'BE CAREFUL')) {
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

  const icon = isPass ? '✅' : '❌';
  console.log(`${icon} [${tc.id}] (${tc.language} - ${tc.category})`);
  console.log(`   Score: ${res.score}/100 | Expected: ${tc.expected_verdict} | Got: ${verdict}`);
  if (!isPass) {
    console.log(`   Input: "${tc.input}"`);
  }
});

const accuracy = Math.round((passed / testMessages.length) * 100);
console.log('\n======================================================');
console.log(`Accuracy: ${accuracy}% (${passed}/${testMessages.length})`);
console.log(`False Alarms (Safe flagged as Scam): ${falseAlarms}`);
console.log(`Missed Scams: ${missedScams}`);
console.log('======================================================\n');

if (accuracy < 90 || falseAlarms > 0) {
  console.error('Test suite failed thresholds.');
  process.exit(1);
} else {
  console.log('🎉 TDD Benchmark PASSED! Target >= 90% and 0 False Alarms achieved.');
}
