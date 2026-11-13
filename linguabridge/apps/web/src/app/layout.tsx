import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { Languages, Globe, ShieldCheck, Terminal, Cpu, Github, BookOpen, Sparkles, ArrowUpRight } from 'lucide-react';
import { WidgetMount } from '@/components/WidgetMount';
import { AudioMuteControl } from '@/components/AudioMuteControl';
import './globals.css';

export const metadata: Metadata = {
  title: 'LinguaBridge — Multilingual Financial Inclusion Infrastructure',
  description: 'Multilingual accessibility infrastructure platform for financial inclusion in Cameroon and the CEMAC region (SAFINUM Innovate Challenge)',
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="fr">
      <body style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--paper)' }}>
        {/* Compact, always-visible mobile and desktop header */}
        <header className="lb-fixed-header">
          <div className="wrap lb-header-row">
            <Link href="/" className="lb-header-brand" aria-label="LinguaBridge home">
              <span className="lb-logo-mark" aria-hidden="true">
                <svg viewBox="0 0 40 40" width="32" height="32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="40" height="40" rx="11" fill="#111111"/>
                  <path d="M7 27V20C7 12.8 12.8 7 20 7S33 12.8 33 20V27" stroke="#FFFFFF" strokeWidth="3.4" strokeLinecap="round"/>
                  <path d="M7 27H33" stroke="#67DB83" strokeWidth="3.4" strokeLinecap="round"/>
                  <path d="M15 20V27M25 20V27" stroke="#67DB83" strokeWidth="3" strokeLinecap="round"/>
                  <circle cx="20" cy="13" r="2.5" fill="#67DB83"/>
                </svg>
              </span>
              <span className="lb-brand-word">LinguaBridge</span>
            </Link>
            <nav className="lb-header-nav" aria-label="Navigation principale">
              <Link href="/" className="lb-nav-item">Accueil</Link>
              <Link href="/documentation" className="lb-nav-item" style={{ fontWeight: 650 }}>
                Documentation
              </Link>
              <Link href="/dashboard" className="lb-nav-item">
                <span className="lb-nav-full">Extension</span>
                <span className="lb-nav-short">Extension</span>
              </Link>
            </nav>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto', zIndex: 2 }}>
              <AudioMuteControl />
              <a
                className="lb-header-github"
                href="https://github.com/AnonyDes/LinguaBridge"
                target="_blank"
                rel="noreferrer"
                aria-label="LinguaBridge sur GitHub"
              >
                <Github size={19} strokeWidth={2} />
              </a>
            </div>
          </div>
        </header>

        {/* Main Body */}
        <main style={{ flex: 1 }}>{children}</main>

        {/* Sleek, Light, Elegant & Professional Footer */}
        <footer
          style={{
            background: '#FBFBFB',
            color: 'var(--ink)',
            paddingTop: '44px',
            paddingBottom: '28px',
            borderTop: '1px solid var(--line)',
            marginTop: 'auto',
          }}
        >
          <div className="wrap">
            {/* Top Footer Row: Branding & Quick Links */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: '32px',
                paddingBottom: '32px',
                borderBottom: '1px solid var(--line)',
              }}
            >
              {/* Left Column: Brand & SAFINUM Dedication */}
              <div style={{ maxWidth: '460px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '26px',
                      height: '26px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--ink)',
                      color: '#FFFFFF',
                    }}
                  >
                    <Languages size={15} strokeWidth={2.2} style={{ color: 'var(--brand-green)' }} />
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontWeight: 800,
                      fontSize: '1.12rem',
                      letterSpacing: '-0.02em',
                      color: 'var(--ink)',
                    }}
                  >
                    LinguaBridge
                  </span>
                </div>

                <p
                  style={{
                    color: 'var(--muted)',
                    fontSize: '0.88rem',
                    lineHeight: 1.55,
                    marginBottom: '12px',
                  }}
                >
                  LinguaBridge — Conçu pour l&apos;Inclusion Financière au Cameroun (SAFINUM Innovate Challenge).
                </p>

                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <span className="status-dot status-dot--pulse" style={{ background: 'var(--brand-green)', width: '6px', height: '6px' }}></span>
                  <span className="meta" style={{ color: 'var(--brand-green-deep)', fontSize: '0.68rem', fontWeight: 700 }}>
                    CNEF · HUAWEI · AFRILAND FIRST BANK
                  </span>
                </div>
              </div>

              {/* Right Column: Sleek Quick Links */}
              <div>
                <div
                  className="meta"
                  style={{
                    color: 'var(--muted)',
                    fontSize: '0.7rem',
                    marginBottom: '12px',
                    letterSpacing: '0.14em',
                    fontWeight: 700,
                  }}
                >
                  ACCÈS RAPIDE
                </div>

                <nav
                  aria-label="Liens rapides footer"
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: '12px 20px',
                    fontSize: '0.88rem',
                    fontWeight: 550,
                  }}
                >
                  <Link href="/" style={{ color: 'var(--ink)', textDecoration: 'none' }}>
                    Accueil
                  </Link>

                  <Link href="/dashboard" style={{ color: 'var(--ink)', textDecoration: 'none' }}>
                    Extension
                  </Link>

                  {/* Prominent Link to Documentation */}
                  <Link
                    href="/documentation"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      color: 'var(--brand-green-deep)',
                      fontWeight: 700,
                      background: 'var(--green-soft)',
                      padding: '5px 12px',
                      borderRadius: 'var(--radius)',
                      border: '1px solid rgba(18, 184, 42, 0.25)',
                      textDecoration: 'none',
                    }}
                  >
                    <BookOpen size={14} />
                    <span>Documentation</span>
                  </Link>

                  <a
                    href="https://github.com/AnonyDes/LinguaBridge"
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      color: 'var(--muted)',
                      textDecoration: 'none',
                    }}
                  >
                    <span>GitHub</span>
                    <ArrowUpRight size={13} />
                  </a>
                </nav>

                <div
                  style={{
                    marginTop: '16px',
                    fontSize: '0.78rem',
                    color: 'var(--muted)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <ShieldCheck size={14} style={{ color: 'var(--brand-green)' }} />
                  <span>Invariant strict : Δ(Montants) = 0 FCFA · Traitement local sandboxé</span>
                </div>
              </div>
            </div>

            {/* Bottom Row: Legal & Initiative */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '20px',
                flexWrap: 'wrap',
                gap: '12px',
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono)',
                color: 'var(--muted)',
              }}
            >
              <div>
                © 2026 LinguaBridge · Logiciel libre pour l&apos;accessibilité financière au Cameroun &amp; CEMAC.
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <Link href="/documentation#securite" style={{ color: 'inherit' }}>
                  Garanties de sécurité
                </Link>
                <Link href="/documentation#guide" style={{ color: 'inherit' }}>
                  Guide de test
                </Link>
              </div>
            </div>
          </div>
        </footer>

        {/* Global Floating Accessibility Widget */}
        <WidgetMount />
      </body>
    </html>
  );
}
