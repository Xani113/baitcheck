'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  Search, 
  ExternalLink, 
  Share2, 
  CheckCircle2, 
  RefreshCw, 
  Lock, 
  Info,
  PhoneCall,
  Sparkles,
  Zap,
  Globe,
  Radio,
  HelpCircle,
  Copy,
  ChevronRight,
  Flame,
  FileCheck2,
  AlertOctagon,
  ArrowRight,
  Layers
} from 'lucide-react';
import { ScanResult } from '@/lib/types';

const SAMPLE_PRESETS = [
  {
    label: '🏦 SBI KYC Blocked',
    type: 'Bank Phishing',
    badge: 'Critical',
    text: 'Dear Customer, Your SBI NetBanking account will be suspended today due to pending KYC verification. Update immediately at https://sbi-kyc-verify-portal.in/update to prevent permanent blockage.'
  },
  {
    label: '📦 India Post Address Trap',
    type: 'Courier Scam',
    badge: 'High',
    text: 'IndiaPost: Your parcel IN928472918IN cannot be delivered due to wrong address details. Please update your address and pay Rs 25 redelivery fee at https://indiapost-parcel-retrack.top/pay within 24 hours.'
  },
  {
    label: '⚡ Power Disconnection Extortion',
    type: 'Utility Fraud',
    badge: 'Critical',
    text: 'URGENT: Your Electricity power supply will be disconnected tonight at 9:30 PM from the sub-station because your previous month bill was not updated. Immediately contact Electricity Officer on 9823481234.'
  },
  {
    label: '💼 Part-Time YouTube Job',
    type: 'Task Scam',
    badge: 'High',
    text: 'Hi! I am HR from Google Marketing Team. We offer flexible work-from-home part-time jobs. Earn Rs 3,000 to Rs 8,000 daily by liking YouTube videos and rating hotels. Join our Telegram: https://t.me/quick_earn_india'
  },
  {
    label: '✅ Verified Bank OTP',
    type: 'Safe Message',
    badge: 'Safe',
    text: '482910 is your OTP for transaction of INR 1,450.00 at Amazon India using SBI Card ending in 4021. Valid for 10 mins. Do not share OTP with anyone.'
  }
];

const QUIZ_QUESTIONS = [
  {
    id: 1,
    sender: 'AX-HDFCBK (SMS)',
    text: 'HDFC Alert: Your NetBanking was accessed from new IP. If not you, block immediately at http://hdfc-security-auth.top/block',
    isScam: true,
    explanation: 'Scam! Legitimate banks never use .top domains or send direct unverified links to "block" accounts. They instruct you to call the back of your card or open official app.'
  },
  {
    id: 2,
    sender: 'VM-SBIINB (SMS)',
    text: '729104 is OTP for login to SBI NetBanking. Generated at 10:45 AM. If not requested by you, call 1800112211.',
    isScam: false,
    explanation: 'Legitimate OTP. It contains a standard verification code, exact timestamp, no hyperlinked web portals, and directs to the official 1800 toll-free helpline.'
  },
  {
    id: 3,
    sender: 'WhatsApp Notice',
    text: 'Electricity Department notice: Pay unpaid bill of Rs 420 to prevent line disconnect. Send screenshot on this WhatsApp to reconnect.',
    isScam: true,
    explanation: 'Scam! Utility boards never ask for payment confirmation via WhatsApp screenshots or personal mobile chats.'
  }
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<'scanner' | 'compare' | 'quiz' | 'sos'>('scanner');
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedShare, setCopiedShare] = useState(false);

  // Quiz state
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizAnswer, setQuizAnswer] = useState<boolean | null>(null);
  const [quizScore, setQuizScore] = useState(0);

  const handleScan = async (textToScan?: string) => {
    const text = textToScan !== undefined ? textToScan : inputText;
    if (!text.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });

      if (!res.ok) {
        throw new Error('Analysis failed. Please verify network connectivity.');
      }

      const data: ScanResult = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Something went wrong during analysis.');
    } finally {
      setLoading(false);
    }
  };

  const loadPreset = (presetText: string) => {
    setInputText(presetText);
    setActiveTab('scanner');
    handleScan(presetText);
  };

  const shareToWhatsApp = () => {
    if (!result) return;
    const shareMessage = `🚨 *PhishGuard Security Alert* 🚨\n\n*Verdict:* ${result.verdict}\n*Threat Score:* ${result.riskScore}/100\n*Scam Type:* ${result.scamType}\n*Summary:* ${result.summary}\n\n🛡️ Verified with PhishGuard AI Scanner. Do not click untrusted links!`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`;
    window.open(whatsappUrl, '_blank');
  };

  const copyReport = () => {
    if (!result) return;
    const text = `PhishGuard AI Scan Report\nVerdict: ${result.verdict} (${result.riskScore}/100)\nTarget: ${result.impersonatedEntity || 'General'}\nSummary: ${result.summary}`;
    navigator.clipboard.writeText(text);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  return (
    <div className="min-h-screen cyber-grid pb-20">
      {/* Top Banner / Ticker */}
      <div className="bg-cyan-950/40 border-b border-cyan-500/20 py-1.5 px-4 text-center">
        <p className="text-[11px] text-cyan-300 font-medium flex items-center justify-center gap-2">
          <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>Active Defense Protocol: Monitoring Smishing, WhatsApp Job Traps & Digital Arrest Scams</span>
        </p>
      </div>

      <div className="max-w-6xl mx-auto px-4 pt-6">
        {/* Navigation Bar */}
        <header className="flex flex-col md:flex-row items-center justify-between gap-4 pb-6 border-b border-slate-800/80 mb-8">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <div className="p-3 bg-gradient-to-br from-cyan-950 to-blue-950 border border-cyan-500/40 rounded-2xl glow-cyan">
                <ShieldAlert className="w-7 h-7 text-cyan-400" />
              </div>
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold tracking-tight text-white">
                  PhishGuard <span className="text-cyan-400 font-black">AI</span>
                </h1>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                  v1.2 Shield
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Autonomous Threat Intelligence & Educational Defense
              </p>
            </div>
          </div>

          {/* Navigation Pill Tabs */}
          <nav className="flex items-center p-1 bg-slate-900/90 border border-slate-800 rounded-xl shadow-inner">
            <button
              onClick={() => setActiveTab('scanner')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'scanner'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Scam Scanner</span>
            </button>

            <button
              onClick={() => setActiveTab('compare')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'compare'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Spot The Fake</span>
            </button>

            <button
              onClick={() => setActiveTab('quiz')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'quiz'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Instincts Quiz</span>
            </button>

            <button
              onClick={() => setActiveTab('sos')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'sos'
                  ? 'bg-red-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-red-400'
              }`}
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Helpline 1930</span>
            </button>
          </nav>
        </header>

        {/* Tab 1: Scanner View */}
        {activeTab === 'scanner' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            {/* Left: Input Console & Quick Presets */}
            <div className="lg:col-span-5 space-y-6">
              <div className="glass-panel rounded-2xl p-6 shadow-2xl relative overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span>Inspect Suspicious Content</span>
                  </label>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {inputText.length}/5000 chars
                  </span>
                </div>

                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Paste SMS text, WhatsApp message, or link e.g. 'Your SBI NetBanking account will be blocked today...'"
                  rows={6}
                  className="w-full bg-[#070b14]/90 border border-slate-800 rounded-xl p-3.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all resize-none shadow-inner"
                />

                <div className="mt-4 flex items-center justify-between gap-3">
                  <button
                    onClick={() => { setInputText(''); setResult(null); }}
                    className="text-xs text-slate-400 hover:text-slate-200 transition-colors font-medium px-2 py-1"
                    disabled={loading || !inputText}
                  >
                    Clear Text
                  </button>

                  <button
                    onClick={() => handleScan()}
                    disabled={loading || !inputText.trim()}
                    className="flex-1 max-w-[210px] flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-cyan-400 to-blue-500 hover:opacity-95 text-black font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed glow-cyan shadow-lg cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-black" />
                        <span>Deconstructing...</span>
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4 text-black" />
                        <span>Analyze Threat</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Realistic Preset Scenarios */}
              <div className="glass-panel rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <Flame className="w-3.5 h-3.5 text-orange-400" />
                    <span>Simulated Attack Vectors</span>
                  </h3>
                  <span className="text-[10px] text-slate-500">1-Click Test</span>
                </div>

                <div className="space-y-2">
                  {SAMPLE_PRESETS.map((preset, index) => (
                    <button
                      key={index}
                      onClick={() => loadPreset(preset.text)}
                      className="w-full text-left p-3 rounded-xl border border-slate-800/80 hover:border-cyan-500/50 bg-[#070b14]/60 hover:bg-slate-900/90 transition-all flex items-center justify-between text-xs group cursor-pointer"
                    >
                      <div>
                        <div className="font-semibold text-slate-200 group-hover:text-cyan-400 transition-colors">
                          {preset.label}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{preset.type}</div>
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
                        preset.badge === 'Critical' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                        preset.badge === 'High' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
                        'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      }`}>
                        {preset.badge}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Scan Results Display */}
            <div className="lg:col-span-7">
              {error && (
                <div className="p-4 rounded-xl bg-red-900/30 border border-red-500/40 text-red-300 text-sm flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {!result && !loading && !error && (
                <div className="h-full min-h-[460px] border border-dashed border-slate-800/80 rounded-2xl flex flex-col items-center justify-center p-8 text-center text-slate-500 bg-[#070b14]/30">
                  <div className="relative mb-4">
                    <div className="w-20 h-20 rounded-full bg-slate-900/80 border border-slate-800 flex items-center justify-center">
                      <ShieldCheck className="w-10 h-10 text-slate-600" />
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-slate-200 mb-1">Defense Radar Idle</h3>
                  <p className="text-xs text-slate-400 max-w-sm mb-5 leading-relaxed">
                    Paste an untrusted SMS, WhatsApp offer, or bank notification on the left to verify domain spoofing, urgency heuristics, and APK risks.
                  </p>
                  <button
                    onClick={() => loadPreset(SAMPLE_PRESETS[0].text)}
                    className="px-4 py-2 rounded-xl bg-slate-900 border border-cyan-500/30 hover:border-cyan-500/60 text-xs text-cyan-300 font-semibold flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <span>Run SBI KYC Simulation</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {loading && (
                <div className="h-full min-h-[460px] glass-panel rounded-2xl flex flex-col items-center justify-center p-8 text-center space-y-4">
                  <div className="relative w-24 h-24 rounded-full border border-cyan-500/30 flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 radar-sweep opacity-75" />
                    <Lock className="w-8 h-8 text-cyan-400 relative z-10 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white">Deconstructing Threat Vectors</h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs">
                      Inspecting URL registries, checking APK payload indicators & cross-referencing brand spoofing patterns...
                    </p>
                  </div>
                </div>
              )}

              {result && !loading && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.35 }}
                  className="space-y-6"
                >
                  {/* Verdict & Score Banner */}
                  <div className={`p-6 rounded-2xl border transition-all ${
                    result.verdict === 'DANGEROUS_PHISHING'
                      ? 'bg-red-950/30 border-red-500/40 glow-red'
                      : result.verdict === 'SUSPICIOUS'
                      ? 'bg-amber-950/30 border-amber-500/40'
                      : 'bg-emerald-950/30 border-emerald-500/40 glow-green'
                  }`}>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3.5">
                        {result.verdict === 'DANGEROUS_PHISHING' ? (
                          <div className="p-3.5 bg-red-500/20 border border-red-500/40 rounded-2xl">
                            <ShieldAlert className="w-8 h-8 text-red-400" />
                          </div>
                        ) : result.verdict === 'SUSPICIOUS' ? (
                          <div className="p-3.5 bg-amber-500/20 border border-amber-500/40 rounded-2xl">
                            <AlertTriangle className="w-8 h-8 text-amber-400" />
                          </div>
                        ) : (
                          <div className="p-3.5 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl">
                            <ShieldCheck className="w-8 h-8 text-emerald-400" />
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`text-[11px] font-black px-2.5 py-0.5 rounded tracking-wider uppercase ${
                              result.verdict === 'DANGEROUS_PHISHING'
                                ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                                : result.verdict === 'SUSPICIOUS'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            }`}>
                              {result.verdict === 'DANGEROUS_PHISHING' ? 'Critical Scam Warning' : result.verdict}
                            </span>
                          </div>
                          <h3 className="text-xl font-extrabold text-white mt-1">{result.scamType}</h3>
                          {result.impersonatedEntity && (
                            <p className="text-xs text-slate-400 mt-0.5">
                              Impersonating Entity: <strong className="text-white font-semibold">{result.impersonatedEntity}</strong>
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Threat Gauge Score */}
                      <div className="text-right sm:border-l sm:border-slate-800/80 sm:pl-6">
                        <div className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">Risk Score</div>
                        <div className={`text-4xl font-black tabular-nums ${
                          result.riskScore >= 60 ? 'text-red-400' : result.riskScore >= 25 ? 'text-amber-400' : 'text-emerald-400'
                        }`}>
                          {result.riskScore}<span className="text-xs text-slate-500 font-normal">/100</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed border-t border-slate-800/60 pt-3.5">
                      {result.summary}
                    </p>

                    {/* Action Bar */}
                    <div className="flex flex-wrap items-center gap-3 mt-4 pt-3.5 border-t border-slate-800/40">
                      <button
                        onClick={shareToWhatsApp}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition-all cursor-pointer"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Warn Family on WhatsApp</span>
                      </button>

                      <button
                        onClick={copyReport}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{copiedShare ? 'Copied to Clipboard!' : 'Copy Report'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Red Flag Indicators */}
                  {result.redFlags.length > 0 && (
                    <div className="glass-panel rounded-2xl p-5">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2">
                        <AlertOctagon className="w-4 h-4 text-amber-400" />
                        <span>Threat Indicators Detected ({result.redFlags.length})</span>
                      </h4>

                      <div className="space-y-2.5">
                        {result.redFlags.map((flag, idx) => (
                          <div key={idx} className="p-3.5 rounded-xl bg-[#070b14]/90 border border-slate-800 flex items-start gap-3">
                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded mt-0.5 ${
                              flag.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                              flag.severity === 'HIGH' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                              'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            }`}>
                              {flag.severity}
                            </span>
                            <div>
                              <div className="text-xs font-bold text-slate-100">{flag.title}</div>
                              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{flag.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Educational Risk Guidance & Emergency Steps */}
                  <div className="glass-panel rounded-2xl p-5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2">
                      <Info className="w-4 h-4 text-cyan-400" />
                      <span>Educational Threat Breakdown & Immediate Actions</span>
                    </h4>

                    <p className="text-xs text-slate-300 leading-relaxed mb-4 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800/80">
                      {result.riskExplanation}
                    </p>

                    <div className="space-y-2">
                      <div className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">
                        Recommended Safeguards:
                      </div>
                      {result.safeRemedies.map((remedy, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                          <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                          <span>{remedy}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        {/* Tab 2: Spot The Fake (Side-by-side Educational Comparison) */}
        {activeTab === 'compare' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="text-center max-w-2xl mx-auto mb-6">
              <h2 className="text-xl font-bold text-white">Visual Breakdown: Real vs. Phishing Smish</h2>
              <p className="text-xs text-slate-400 mt-1">
                Learn the visual anatomy of digital scams. Hover or inspect the differences between official communications and predatory imitations.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Fake Message Card */}
              <div className="p-6 rounded-2xl bg-red-950/20 border border-red-500/40 relative glow-red">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-red-400 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-red-400" />
                    <span>Scam SMS (SBI KYC Phishing)</span>
                  </span>
                  <span className="text-[10px] bg-red-500/20 text-red-300 px-2 py-0.5 rounded font-mono">DANGEROUS</span>
                </div>

                <div className="bg-[#070b14] p-4 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 mb-4 leading-relaxed">
                  "Dear customer your SBI account is blocked today due to pending KYC verification. Click <span className="text-red-400 underline font-bold bg-red-950/50 px-1 py-0.5 rounded">https://sbi-kyc-verify-portal.in</span> to avoid permanent disconnection."
                </div>

                <div className="space-y-2 text-xs text-slate-300">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <span><strong>Fake Domain:</strong> Uses <code>sbi-kyc-verify-portal.in</code> instead of official <code>onlinesbi.sbi</code>.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <span><strong>Synthetic Urgency:</strong> Threatens "blocked today" to trigger panic and hasty clicks.</span>
                  </div>
                </div>
              </div>

              {/* Legitimate Message Card */}
              <div className="p-6 rounded-2xl bg-emerald-950/20 border border-emerald-500/40 relative glow-green">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Genuine Bank Alert (Official SBI)</span>
                  </span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono">SAFE</span>
                </div>

                <div className="bg-[#070b14] p-4 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 mb-4 leading-relaxed">
                  "482910 is your OTP for transaction of INR 1,450.00 at Amazon using SBI Card ending in 4021. Valid for 10 mins. <span className="text-emerald-400 font-bold">Do not share OTP with anyone.</span>"
                </div>

                <div className="space-y-2 text-xs text-slate-300">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span><strong>No External Links:</strong> Legitimate bank alerts never include direct links to enter credentials.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span><strong>Transaction Context:</strong> Mentions exact merchant (Amazon) and masked card digits (4021).</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tab 3: Instincts Quiz */}
        {activeTab === 'quiz' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-xl mx-auto space-y-6"
          >
            <div className="text-center">
              <h2 className="text-xl font-bold text-white">Test Your Phishing Instincts</h2>
              <p className="text-xs text-slate-400 mt-1">Can you identify the scam before it steals credentials?</p>
            </div>

            <div className="glass-panel p-6 rounded-2xl">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-4 border-b border-slate-800 pb-3">
                <span>Scenario {quizIdx + 1} of {QUIZ_QUESTIONS.length}</span>
                <span>Score: <strong className="text-cyan-400 font-bold">{quizScore}</strong></span>
              </div>

              <div className="p-4 bg-[#070b14] border border-slate-800 rounded-xl mb-4 text-xs font-mono text-slate-200">
                <div className="text-[10px] text-cyan-400 font-bold mb-1">Sender: {QUIZ_QUESTIONS[quizIdx].sender}</div>
                "{QUIZ_QUESTIONS[quizIdx].text}"
              </div>

              {quizAnswer === null ? (
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => {
                      const isCorrect = QUIZ_QUESTIONS[quizIdx].isScam === true;
                      setQuizAnswer(isCorrect);
                      if (isCorrect) setQuizScore(s => s + 10);
                    }}
                    className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 hover:bg-red-900/50 text-red-300 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <ShieldAlert className="w-4 h-4" />
                    <span>This is a Scam!</span>
                  </button>

                  <button
                    onClick={() => {
                      const isCorrect = QUIZ_QUESTIONS[quizIdx].isScam === false;
                      setQuizAnswer(isCorrect);
                      if (isCorrect) setQuizScore(s => s + 10);
                    }}
                    className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 hover:bg-emerald-900/50 text-emerald-300 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Legitimate Message</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className={`p-4 rounded-xl border text-xs leading-relaxed ${
                    quizAnswer ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300' : 'bg-red-950/30 border-red-500/40 text-red-300'
                  }`}>
                    <strong className="block font-bold mb-1">{quizAnswer ? '🎯 Correct!' : '⚠️ Incorrect!'}</strong>
                    {QUIZ_QUESTIONS[quizIdx].explanation}
                  </div>

                  <button
                    onClick={() => {
                      setQuizAnswer(null);
                      setQuizIdx((prev) => (prev + 1) % QUIZ_QUESTIONS.length);
                    }}
                    className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>Next Scenario</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Tab 4: Emergency SOS & Helplines */}
        {activeTab === 'sos' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto space-y-6"
          >
            <div className="p-6 rounded-2xl bg-red-950/30 border border-red-500/40 glow-red text-center">
              <PhoneCall className="w-10 h-10 text-red-400 mx-auto mb-3" />
              <h2 className="text-xl font-black text-white">Emergency Cyber Fraud Helpdesk</h2>
              <p className="text-xs text-red-300 mt-1 max-w-md mx-auto">
                If you or a family member have shared banking credentials or transferred funds to a fraudulent link, take these emergency steps within the golden hour:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="glass-panel p-5 rounded-2xl">
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">Step 1: National Helpline</span>
                <h3 className="text-2xl font-black text-white mt-1">Dial 1930</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Indian National Cyber Crime Reporting Portal helpline. Acts immediately to freeze fraudulent money trails.
                </p>
                <a
                  href="https://cybercrime.gov.in"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:underline font-semibold"
                >
                  <span>Visit cybercrime.gov.in</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="glass-panel p-5 rounded-2xl">
                <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Step 2: Bank Card Freeze</span>
                <h3 className="text-base font-bold text-white mt-1">Emergency Bank Hotlines</h3>
                <ul className="text-xs text-slate-300 mt-2 space-y-1">
                  <li><strong>SBI:</strong> 1800 11 2211 / 1800 425 3800</li>
                  <li><strong>HDFC:</strong> 1800 1600 / 1800 2600</li>
                  <li><strong>ICICI:</strong> 1800 1080</li>
                  <li><strong>Axis:</strong> 1860 419 5555</li>
                </ul>
              </div>
            </div>
          </motion.div>
        )}

        {/* Footer */}
        <footer className="mt-16 pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <div>
            <span>PhishGuard AI — PromptWar Cybersecurity Hackathon Submission</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Powered by Next.js & Framer Motion</span>
            <span>Zero-Config Vercel Ready</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
