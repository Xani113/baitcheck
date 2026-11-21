import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PhishGuard AI — Digital Communication Threat Intelligence',
  description: 'AI-powered detection of fraudulent SMS, WhatsApp messages, and deceptive links.',
  keywords: ['cybersecurity', 'phishing detector', 'smishing', 'whatsapp fraud', 'scam detector'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="cyber-grid min-h-screen bg-[#070b14] text-slate-100 antialiased selection:bg-cyan-500 selection:text-black">
        {children}
      </body>
    </html>
  );
}
