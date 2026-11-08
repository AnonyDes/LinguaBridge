import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Manrope, Inter, IBM_Plex_Mono } from 'next/font/google';
import Link from 'next/link';
import { Languages, Github, Globe, ShieldCheck, Terminal, Cpu } from 'lucide-react';
import { WidgetMount } from '@/components/WidgetMount';
import './globals.css';

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-manrope',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-plex-mono',
  display: 'swap',
});

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
    <html lang="en" className={`${manrope.variable} ${inter.variable} ${plexMono.variable}`}>
      <body style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Nayokan Frosted Swiss Top Header */}
        <header
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 100,
            background: 'rgba(255, 255, 255, 0.92)',
            backdropFilter: 'blur(20px) saturate(160%)',
            WebkitBackdropFilter: 'blur(20px) saturate(160%)',
            borderBottom: '1px solid var(--line)',
            transition: 'border-color var(--dur-fast) var(--easing)',
          }}
        >
          <div
            className="wrap"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '16px',
              paddingBottom: '16px',
              gap: 'var(--s-5)',
            }}
          >
            {/* Brand Logo & Sovereign Metadata */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <Link
                href="/"
                className="nav-logo"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  textDecoration: 'none',
                  color: 'var(--ink)',
                }}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '32px',
                    height: '32px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--ink)',
                    color: 'var(--brand-green)',
                    border: '1px solid var(--line-strong)',
                  }}
                >
                  <Languages size={18} strokeWidth={2} style={{ color: 'var(--brand-green)' }} />
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontWeight: 800,
                    fontSize: '1.2rem',
                    letterSpacing: '-0.025em',
                    color: 'var(--ink)',
                  }}
                >
                  LinguaBridge
                </span>
              </Link>

              <span
                className="ax-pill ax-pill--active"
                style={{
                  fontSize: '0.62rem',
                  letterSpacing: '0.14em',
                  padding: '3px 8px',
                }}
              >
                <span className="status-dot status-dot--pulse" style={{ width: '5px', height: '5px' }}></span>
                CEMAC LIVE
              </span>
            </div>

            {/* Navigation Links & Action */}
            <nav
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--s-6)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--s-5)',
                }}
              >
                <Link
                  href="/"
                  className="nav-link"
                  style={{
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    color: 'var(--ink)',
                    textDecoration: 'none',
                    letterSpacing: '-0.01em',
                  }}
                >
                  Platform &amp; Docs
                </Link>
                <Link
                  href="/cameropay"
                  className="nav-link"
                  style={{
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    color: 'var(--ink)',
                    textDecoration: 'none',
                    letterSpacing: '-0.01em',
                  }}
                >
                  CameroPay Demo
                </Link>
                <Link
                  href="/dashboard"
                  className="nav-link"
                  style={{
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    color: 'var(--ink)',
                    textDecoration: 'none',
                    letterSpacing: '-0.01em',
                  }}
                >
                  Developer Dashboard
                </Link>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-3)' }}>
                <a
                  href="https://github.com/AnonyDes/LinguaBridge"
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-ghost"
                  style={{
                    padding: '8px 14px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    gap: '6px',
                    borderRadius: 'var(--radius)',
                  }}
                >
                  <Github size={14} strokeWidth={1.75} />
                  <span>GitHub</span>
                </a>
              </div>
            </nav>
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
                  Non-commercial open-source multilingual infrastructure for Central Africa. Mathematical zero-drift guarantee for sovereign FinTech transactions.
                </p>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <span className="status-dot status-dot--pulse" style={{ background: 'var(--green-glow)', width: '6px', height: '6px' }}></span>
                  <span className="meta" style={{ color: 'var(--muted-invert)', fontSize: '0.66rem' }}>
                    BEAC / CEMAC SOVEREIGN SPEC
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
                  SOVEREIGN MODULES
                </div>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.88rem', color: 'rgba(255,255,255,0.8)' }}>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShieldCheck size={14} style={{ color: 'var(--brand-green)' }} />
                    <span>Deterministic Financial Guard</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Cpu size={14} style={{ color: 'var(--brand-green)' }} />
                    <span>AST Invariance Validator</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Terminal size={14} style={{ color: 'var(--brand-green)' }} />
                    <span>Fastify 5 REST API (:3001)</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Globe size={14} style={{ color: 'var(--brand-green)' }} />
                    <span>Neural Voice Service (:3002)</span>
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
                  REGIONAL COVERAGE
                </div>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.88rem', color: 'rgba(255,255,255,0.8)' }}>
                  <li>Ewondo (ewo-CM) — Tonal Contour</li>
                  <li>Fulfulde (fub-CM) — North Cameroon</li>
                  <li>Duala, Basaa &amp; Bulu Quarantine</li>
                  <li>CEMAC Multi-Currency Isolation</li>
                  <li>FCFA Currency Invariance Engine</li>
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
                  INTEROPERABILITY
                </div>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.88rem' }}>
                  <li>
                    <Link href="/dashboard" style={{ color: 'rgba(255,255,255,0.85)', textDecoration: 'none' }}>
                      Developer Studio &amp; Dashboard
                    </Link>
                  </li>
                  <li>
                    <Link href="/cameropay" style={{ color: 'rgba(255,255,255,0.85)', textDecoration: 'none' }}>
                      CameroPay FinTech Sandbox
                    </Link>
                  </li>
                  <li>
                    <Link href="/dashboard" style={{ color: 'rgba(255,255,255,0.85)', textDecoration: 'none' }}>
                      Model Context Protocol (MCP)
                    </Link>
                  </li>
                  <li>
                    <Link href="/dashboard" style={{ color: 'rgba(255,255,255,0.85)', textDecoration: 'none' }}>
                      Chrome MV3 Banking Extension
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
