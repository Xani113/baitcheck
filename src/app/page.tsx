'use client';

import React, { useState } from 'react';
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
  FileCode2
} from 'lucide-react';
import { ScanResult } from '@/lib/types';

const SAMPLE_PRESETS = [
  {
    label: '🏦 SBI KYC Suspended',
    type: 'Bank Phishing',
    text: 'Dear Customer, Your SBI NetBanking account will be suspended today due to pending KYC verification. Update immediately at https://sbi-kyc-verify-portal.in/update to prevent permanent blockage.'
  },
  {
    label: '📦 India Post Address Failed',
    type: 'Delivery Scam',
    text: 'IndiaPost: Your parcel IN928472918IN cannot be delivered due to wrong address details. Please update your address and pay Rs 25 redelivery fee at https://indiapost-parcel-retrack.top/pay within 24 hours.'
  },
  {
    label: '⚡ Electricity Bill Disconnection',
    type: 'Utility Threat',
    text: 'URGENT: Your Electricity power supply will be disconnected tonight at 9:30 PM from the sub-station because your previous month bill was not updated. Immediately contact Electricity Officer on 9823481234.'
  },
  {
    label: '💼 Part-Time YouTube Job',
    type: 'Task Scam',
    text: 'Hi! I am HR from Google Marketing Team. We offer flexible work-from-home part-time jobs. Earn Rs 3,000 to Rs 8,000 daily by liking YouTube videos and rating hotels. Join our Telegram: https://t.me/quick_earn_india'
  },
  {
    label: '✅ Genuine Bank OTP',
    type: 'Safe Message',
    text: '482910 is your OTP for transaction of INR 1,450.00 at Amazon India using SBI Card ending in 4021. Valid for 10 mins. Do not share OTP with anyone.'
  }
];

export default function Home() {
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedShare, setCopiedShare] = useState(false);

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
        throw new Error('Analysis failed. Please check the network or input text.');
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
    handleScan(presetText);
  };

  const shareToWhatsApp = () => {
    if (!result) return;
    const shareMessage = `⚠️ *PhishGuard Security Alert* ⚠️\n\n*Verdict:* ${result.verdict}\n*Threat Score:* ${result.riskScore}/100\n*Summary:* ${result.summary}\n\n*Identified Threat:* ${result.scamType}\n\n🛡️ Checked via PhishGuard AI Scanner. Stay safe!`;
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
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row items-center justify-between border-b border-slate-800 pb-6 mb-8 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-cyan-950/80 border border-cyan-500/40 rounded-xl glow-accent">
            <ShieldAlert className="w-8 h-8 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                PhishGuard <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">AI DEFENSE</span>
              </h1>
            </div>
            <p className="text-xs text-slate-400">
              Cybersecurity Threat Intelligence for SMS, WhatsApp & Deceptive Links
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
            <Zap className="w-3.5 h-3.5 text-yellow-400" />
            <span>Hybrid Engine</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span>Real-time TLD Scans</span>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Input & Presets */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#0d1527] border border-slate-800 rounded-2xl p-5 shadow-xl">
            <label className="block text-sm font-semibold text-slate-200 mb-2 flex items-center justify-between">
              <span>Paste Suspicious Message / Link</span>
              <span className="text-xs text-slate-500 font-normal">SMS, WhatsApp, Email, URL</span>
            </label>

            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste message text or suspicious link here e.g. 'Your bank account will be blocked today...'"
              rows={6}
              className="w-full bg-[#070b14] border border-slate-800 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all resize-none"
            />

            <div className="mt-4 flex items-center justify-between gap-3">
              <button
                onClick={() => setInputText('')}
                className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
                disabled={loading || !inputText}
              >
                Clear
              </button>

              <button
                onClick={() => handleScan()}
                disabled={loading || !inputText.trim()}
                className="flex-1 max-w-[200px] flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed glow-accent"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Analyze Threat</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Presets */}
          <div className="bg-[#0d1527]/60 border border-slate-800/80 rounded-2xl p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Or Try Live Test Vectors</span>
            </h3>

            <div className="space-y-2">
              {SAMPLE_PRESETS.map((preset, index) => (
                <button
                  key={index}
                  onClick={() => loadPreset(preset.text)}
                  className="w-full text-left p-2.5 rounded-xl border border-slate-800/80 hover:border-cyan-500/40 bg-[#070b14]/50 hover:bg-slate-900/80 transition-all flex items-center justify-between text-xs group"
                >
                  <span className="font-medium text-slate-300 group-hover:text-cyan-400 transition-colors">
                    {preset.label}
                  </span>
                  <span className="text-[10px] text-slate-500 bg-slate-800/60 px-2 py-0.5 rounded">
                    {preset.type}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Helpline Info */}
          <div className="p-4 rounded-xl bg-red-950/20 border border-red-500/20 flex items-center gap-3">
            <PhoneCall className="w-5 h-5 text-red-400 flex-shrink-0" />
            <div className="text-xs">
              <span className="font-semibold text-red-300">National Cyber Crime Helpline (India):</span>
              <p className="text-slate-400">Dial <strong className="text-red-400">1930</strong> immediately if you have suffered financial fraud.</p>
            </div>
          </div>
        </div>

        {/* Right Column: Scan Results */}
        <div className="lg:col-span-7">
          {error && (
            <div className="p-4 rounded-xl bg-red-900/30 border border-red-500/40 text-red-300 text-sm flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!result && !loading && !error && (
            <div className="h-full min-h-[400px] border border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center p-8 text-center text-slate-500">
              <div className="w-16 h-16 rounded-full bg-slate-900/80 border border-slate-800 flex items-center justify-center mb-4">
                <ShieldCheck className="w-8 h-8 text-slate-600" />
              </div>
              <h3 className="text-base font-medium text-slate-300 mb-1">No Message Scanned Yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mb-4">
                Paste any suspicious SMS, WhatsApp notice, or link to inspect security indicators, spoofed domains, and threat severity.
              </p>
              <button
                onClick={() => loadPreset(SAMPLE_PRESETS[0].text)}
                className="text-xs text-cyan-400 hover:underline flex items-center gap-1"
              >
                <span>Click here to test the SBI KYC scam</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          )}

          {loading && (
            <div className="h-full min-h-[400px] bg-[#0d1527] border border-slate-800 rounded-2xl flex flex-col items-center justify-center p-8 text-center space-y-4">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin" />
                <Lock className="w-6 h-6 text-cyan-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Deconstructing Digital Threat</h4>
                <p className="text-xs text-slate-400">Verifying domain certificates, linguistic urgency & TLD registries...</p>
              </div>
            </div>
          )}

          {result && !loading && (
            <div className="space-y-6">
              {/* Verdict Card */}
              <div className={`p-6 rounded-2xl border transition-all ${
                result.verdict === 'DANGEROUS_PHISHING'
                  ? 'bg-red-950/30 border-red-500/40 glow-red'
                  : result.verdict === 'SUSPICIOUS'
                  ? 'bg-amber-950/30 border-amber-500/40'
                  : 'bg-emerald-950/30 border-emerald-500/40 glow-green'
              }`}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    {result.verdict === 'DANGEROUS_PHISHING' ? (
                      <div className="p-3 bg-red-500/20 border border-red-500/40 rounded-xl">
                        <ShieldAlert className="w-7 h-7 text-red-400" />
                      </div>
                    ) : result.verdict === 'SUSPICIOUS' ? (
                      <div className="p-3 bg-amber-500/20 border border-amber-500/40 rounded-xl">
                        <AlertTriangle className="w-7 h-7 text-amber-400" />
                      </div>
                    ) : (
                      <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl">
                        <ShieldCheck className="w-7 h-7 text-emerald-400" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded tracking-wide uppercase ${
                          result.verdict === 'DANGEROUS_PHISHING'
                            ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                            : result.verdict === 'SUSPICIOUS'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}>
                          {result.verdict === 'DANGEROUS_PHISHING' ? 'Critical Phishing Scam' : result.verdict}
                        </span>
                        {result.impersonatedEntity && (
                          <span className="text-xs text-slate-400">
                            Impersonating: <strong className="text-white">{result.impersonatedEntity}</strong>
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-white mt-1">{result.scamType}</h3>
                    </div>
                  </div>

                  {/* Threat Score Gauge */}
                  <div className="text-right">
                    <div className="text-xs text-slate-400">Threat Risk Score</div>
                    <div className={`text-3xl font-extrabold ${
                      result.riskScore >= 65 ? 'text-red-400' : result.riskScore >= 30 ? 'text-amber-400' : 'text-emerald-400'
                    }`}>
                      {result.riskScore}<span className="text-xs text-slate-500 font-normal">/100</span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed border-t border-slate-800/60 pt-3">
                  {result.summary}
                </p>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 mt-4 pt-3 border-t border-slate-800/40">
                  <button
                    onClick={shareToWhatsApp}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/40 border border-emerald-500/40 text-emerald-300 text-xs font-semibold transition-all"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Warn Family on WhatsApp</span>
                  </button>

                  <button
                    onClick={copyReport}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-all"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{copiedShare ? 'Copied!' : 'Copy Summary'}</span>
                  </button>
                </div>
              </div>

              {/* Red Flag Indicators */}
              {result.redFlags.length > 0 && (
                <div className="bg-[#0d1527] border border-slate-800 rounded-2xl p-5">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>Identified Threat Indicators ({result.redFlags.length})</span>
                  </h4>

                  <div className="space-y-3">
                    {result.redFlags.map((flag, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-[#070b14] border border-slate-800/80 flex items-start gap-3">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded mt-0.5 ${
                          flag.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                          flag.severity === 'HIGH' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                          'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}>
                          {flag.severity}
                        </span>
                        <div>
                          <div className="text-xs font-semibold text-slate-200">{flag.title}</div>
                          <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{flag.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Educational Guidance & Immediate Remedies */}
              <div className="bg-[#0d1527] border border-slate-800 rounded-2xl p-5">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                  <Info className="w-4 h-4 text-cyan-400" />
                  <span>Educational Risk Analysis & Emergency Actions</span>
                </h4>

                <p className="text-xs text-slate-300 leading-relaxed mb-4 bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                  {result.riskExplanation}
                </p>

                <div className="space-y-2">
                  <span className="text-[11px] font-semibold text-cyan-300 uppercase tracking-wider">
                    Recommended Protection Steps:
                  </span>
                  {result.safeRemedies.map((remedy, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                      <span>{remedy}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-16 pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
        <div>
          <span>PhishGuard AI — PromptWar Cybersecurity Hackathon Submission</span>
        </div>
        <div className="flex items-center gap-4">
          <span>Target Platform: Vercel</span>
          <span>Engine: Hybrid AI & Cyber Heuristics</span>
        </div>
      </footer>
    </div>
  );
}
