export type ThreatVerdict = 'SAFE' | 'SUSPICIOUS' | 'DANGEROUS_PHISHING';

export interface ThreatRedFlag {
  category: 'URGENCY' | 'DECEPTIVE_URL' | 'BRAND_SPOOF' | 'CREDENTIAL_HARVEST' | 'MALWARE_APK' | 'PAYMENT_TRAP';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
}

export interface ScanResult {
  riskScore: number; // 0 - 100
  verdict: ThreatVerdict;
  impersonatedEntity: string | null;
  scamType: string;
  summary: string;
  riskExplanation: string;
  redFlags: ThreatRedFlag[];
  suspiciousLinks: string[];
  safeRemedies: string[];
  analyzedAt: string;
  engineUsed: 'hybrid_ai' | 'heuristic_engine';
}
