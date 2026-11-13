import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { Languages, Globe, ShieldCheck, Terminal, Cpu, Github } from 'lucide-react';
import { WidgetMount } from '@/components/WidgetMount';
import './globals.css';

export const metadata: Metadata = {
  title: 'LinguaBridge — Multilingual Financial Inclusion Infrastructure',
  description: 'Multilingual accessibility infrastructure platform for financial inclusion in Cameroon and the CEMAC region',
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en" >
      <body style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
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
            <nav className="lb-header-nav" aria-label="Main navigation">
              <Link href="/" className="lb-nav-item">Home</Link>
              <Link href="/dashboard" className="lb-nav-item"><span className="lb-nav-full">Get the extension</span><span className="lb-nav-short">Extension</span></Link>
              <Link href="/voices" className="lb-nav-item">Voices</Link>
            </nav>
            <a className="lb-header-github" href="https://github.com/AnonyDes/LinguaBridge" target="_blank" rel="noreferrer" aria-label="LinguaBridge on GitHub">
              <Github size={19} strokeWidth={2} />
            </a>
          </div>
        </header>

        {/* Main Body */}
        <main style={{ flex: 1 }}>{children}</main>

        {/* Nayokan Swiss Editorial Multi-Column Footer */}
        <footer
          style={{
            background: 'var(--ink)',
            color: 'var(--paper)',
            paddingTop: '64px',
            paddingBottom: '36px',
            borderTop: '1px solid var(--line-strong)',
            marginTop: 'auto',
          }}
        >
          <div className="wrap">
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 'var(--s-7)',
                paddingBottom: '48px',
                borderBottom: '1px solid var(--line-invert)',
              }}
            >
              {/* Col 1: Brand & Sovereign Mission */}
              <div style={{ maxWidth: '340px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '28px',
                      height: '28px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--paper)',
                      color: 'var(--ink)',
                    }}
                  >
                    <Languages size={16} strokeWidth={2} style={{ color: 'var(--brand-green-deep)' }} />
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontWeight: 800,
                      fontSize: '1.15rem',
                      letterSpacing: '-0.02em',
                      color: 'var(--paper)',
                    }}
                  >
                    LinguaBridge
                  </span>
                </div>
                <p
                  style={{
                    color: 'var(--muted-invert)',
                    fontSize: '0.88rem',
                    lineHeight: 1.6,
                    marginBottom: '16px',
                  }}
                >
                  Open-source accessibility tools helping people understand financial services in Cameroonian languages.
                </p>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <span className="status-dot status-dot--pulse" style={{ background: 'var(--green-glow)', width: '6px', height: '6px' }}></span>
                  <span className="meta" style={{ color: 'var(--muted-invert)', fontSize: '0.66rem' }}>
                    CAMEROONIAN LANGUAGE ACCESSIBILITY
                  </span>
                </div>
              </div>

              {/* Col 2: Sovereign Modules */}
              <div>
                <div
                  className="meta"
                  style={{
                    color: 'var(--muted-invert)',
                    fontSize: '0.72rem',
                    marginBottom: '16px',
                    letterSpacing: '0.16em',
                  }}
                >
                  FINANCIAL ACCESSIBILITY
                </div>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.88rem', color: 'rgba(255,255,255,0.8)' }}>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShieldCheck size={14} style={{ color: 'var(--brand-green)' }} />
                    <span>Financial detail safeguards</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Cpu size={14} style={{ color: 'var(--brand-green)' }} />
                    <span>Translation review & validation</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Terminal size={14} style={{ color: 'var(--brand-green)' }} />
                    <span>Desktop browser extension</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Globe size={14} style={{ color: 'var(--brand-green)' }} />
                    <span>Mobile-friendly access planned</span>
                  </li>
                </ul>
              </div>

              {/* Col 3: Language Coverage */}
              <div>
                <div
                  className="meta"
                  style={{
                    color: 'var(--muted-invert)',
                    fontSize: '0.72rem',
                    marginBottom: '16px',
                    letterSpacing: '0.16em',
                  }}
                >
                  LANGUAGE FOCUS
                </div>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.88rem', color: 'rgba(255,255,255,0.8)' }}>
                  <li>Ewondo (ewo-CM) — financial vocabulary pack</li>
                  <li>French &amp; English source interfaces</li>
                  <li>Fulfulde, Haoussa, Kanuri &amp; Pidgin — research and test packs</li>
                  <li>Basaa and Bulu — future language packs</li>
                  <li>Amounts and fees safeguards</li>
                </ul>
              </div>

              {/* Col 4: Documentation & Access */}
              <div>
                <div
                  className="meta"
                  style={{
                    color: 'var(--muted-invert)',
                    fontSize: '0.72rem',
                    marginBottom: '16px',
                    letterSpacing: '0.16em',
                  }}
                >
                  GET STARTED
                </div>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.88rem' }}>
                  <li>
                    <Link href="/dashboard" style={{ color: 'rgba(255,255,255,0.85)', textDecoration: 'none' }}>
                      Browser extension &amp; access
                    </Link>
                  </li>
                  <li>
                    <Link href="/dashboard" style={{ color: 'rgba(255,255,255,0.85)', textDecoration: 'none' }}>
                      Other developer integrations (optional)
                    </Link>
                  </li>
                  <li>
                    <Link href="/dashboard" style={{ color: 'rgba(255,255,255,0.85)', textDecoration: 'none' }}>
                      Source code on GitHub
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            {/* Bottom Row: Exact Invariant String Guarantee */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '28px',
                flexWrap: 'wrap',
                gap: 'var(--s-4)',
                fontSize: '0.76rem',
                fontFamily: 'var(--font-mono)',
                color: 'var(--muted-invert)',
              }}
            >
              <div>
                <strong>LinguaBridge Platform</strong> — Non-commercial open-source multilingual infrastructure for Central Africa.
              </div>
              <div>
                CEMAC Region / Cameroon Financial Inclusion Initiative
              </div>
            </div>
          </div>
        </footer>

        {/* Global Floating Accessibility Widget (Invariant) */}
        <WidgetMount />
      </body>
    </html>
  );
}
