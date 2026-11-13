'use client';

import React from 'react';
import Link from 'next/link';
import {
  Globe,
  ShieldCheck,
  Zap,
  BadgeCheck,
  Volume2,
  AlertTriangle,
  Github,
  ArrowUpRight,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="wrap" style={{ paddingTop: 'clamp(48px, 6vw, 80px)', paddingBottom: 'clamp(64px, 8vw, 112px)' }}>
      {/* Hero Section */}
      <section style={{ textAlign: 'center', marginBottom: 'clamp(64px, 8vw, 96px)' }}>

        <h1
          className="hero-type"
          style={{
            fontSize: 'var(--f-hero)',
            fontWeight: 800,
            letterSpacing: '-0.025em',
            lineHeight: 1.12,
            marginBottom: 'var(--s-4)',
            color: 'var(--ink)',
            maxWidth: '920px',
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          Your money. <span style={{ color: 'var(--brand-green)' }}>Your language.</span>
        </h1>

        <p
          className="lead"
          style={{
            fontSize: '1.125rem',
            color: 'var(--muted)',
            maxWidth: '720px',
            margin: '0 auto var(--s-7)',
            lineHeight: 1.6,
          }}
        >
          Financial services should be understandable to everyone. LinguaBridge helps translate banking, mobile money and payment interfaces from French or English into Ewondo, Fulfulde, Haoussa, Kanuri and Cameroon Pidgin, starting with a desktop browser extension. Our goal is to make the same accessibility available on mobile and through the web.
        </p>

        <div className="lb-hero-actions">
          <a href="https://github.com/AnonyDes/LinguaBridge" target="_blank" rel="noreferrer"
            className="lb-hero-github" aria-label="Explore LinguaBridge on GitHub">
            <Github size={23} strokeWidth={2} />
            <span>Explore on GitHub</span>
            <span className="lb-hero-github-arrow"><ArrowUpRight size={22} strokeWidth={2.5} /></span>
          </a>
          <Link href="/dashboard" className="lb-hero-extension">
            <span>Get the browser extension</span>
            <span className="lb-extension-triangle" aria-hidden="true" />
          </Link>
        </div>

        {/* Sovereign Protocol Badges */}
        <div
          style={{
            marginTop: 'var(--s-7)',
            paddingTop: 'var(--s-5)',
            borderTop: '1px solid var(--line)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: 'clamp(16px, 3vw, 40px)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="status-dot status-dot--pulse"></span>
            <span className="meta" style={{ fontSize: '0.68rem', letterSpacing: '0.12em' }}>
              DESKTOP EXTENSION AVAILABLE FOR TESTING
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={14} style={{ color: 'var(--brand-green)' }} />
            <span className="meta" style={{ fontSize: '0.68rem', letterSpacing: '0.12em' }}>
              FINANCIAL DATA SAFEGUARDS
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Zap size={14} style={{ color: 'var(--brand-green)' }} />
            <span className="meta" style={{ fontSize: '0.68rem', letterSpacing: '0.12em' }}>
              FRENCH &amp; ENGLISH → CAMEROONIAN LANGUAGES
            </span>
          </div>
        </div>
      </section>

      {/* SAFINUM user journey and delivery roadmap */}
      <section style={{ marginBottom: 'clamp(56px, 8vw, 96px)' }} aria-label="How LinguaBridge works">
        <div className="section-header">
          <div>
            <span className="meta-num">01 / ACCESS FOR EVERYONE</span>
            <h2>One solution, built for desktop and mobile</h2>
          </div>
          <p className="lead">Our first delivery is a browser extension. Direct web access and a mobile-friendly experience are next steps, clearly marked as in development.</p>
        </div>
        <div className="grid-3">
          <article className="card" style={{ padding: 'var(--s-6)', border: '1px solid var(--line)', background: '#fff', minWidth: 0 }}>
            <span className="meta-num" style={{ color: 'var(--brand-green-deep)' }}>AVAILABLE FOR TESTING</span>
            <h3 style={{ margin: '14px 0' }}>Desktop extension</h3>
            <p style={{ color: 'var(--muted)', lineHeight: 1.65 }}>Install on Chrome or Edge, open a financial website, and choose a national language. No changes to the bank&apos;s website are required.</p>
            <Link href="/dashboard" style={{ display: 'inline-block', marginTop: 18, color: 'var(--brand-green-deep)', fontWeight: 700 }}>Explore the extension →</Link>
          </article>
          <article className="card" style={{ padding: 'var(--s-6)', border: '1px solid var(--line)', background: '#fff', minWidth: 0 }}>
            <span className="meta-num" style={{ color: '#946200' }}>BÊTA · IN DEVELOPMENT</span>
            <h3 style={{ margin: '14px 0' }}>Direct web access</h3>
            <p style={{ color: 'var(--muted)', lineHeight: 1.65 }}>Our goal is to offer an accessible web experience without requiring a desktop extension. This option is not available yet.</p>
          </article>
          <article className="card" style={{ padding: 'var(--s-6)', border: '1px solid var(--line)', background: '#fff', minWidth: 0 }}>
            <span className="meta-num" style={{ color: '#946200' }}>PLANNED</span>
            <h3 style={{ margin: '14px 0' }}>Mobile accessibility</h3>
            <p style={{ color: 'var(--muted)', lineHeight: 1.65 }}>We are working toward phone-friendly access so people can understand digital financial services on the devices they already use.</p>
          </article>
        </div>
      </section>
      <section style={{ marginBottom: 'clamp(56px, 8vw, 96px)' }} aria-label="Financial safety">
        <div className="section-header">
          <div><span className="meta-num">02 / SAFETY FIRST</span><h2>Understand the message. Preserve the numbers.</h2></div>
          <p className="lead">Financial translation must protect what matters: amounts in FCFA, fees, account references, telephone numbers and beneficiary details.</p>
        </div>
        <div className="grid-2">
          <div className="card" style={{ padding: 'var(--s-6)', border: '1px solid var(--line)', minWidth: 0 }}>
            <h3 style={{ marginBottom: 12 }}>Built for financial information</h3>
            <p style={{ color: 'var(--muted)', lineHeight: 1.65 }}>LinguaBridge is designed to identify and preserve sensitive financial values when translating interface text. A translation should never silently change the amount being sent or the destination number.</p>
          </div>
          <div className="card" style={{ padding: 'var(--s-6)', border: '1px solid var(--line)', minWidth: 0 }}>
            <h3 style={{ marginBottom: 12 }}>Privacy and responsible testing</h3>
            <p style={{ color: 'var(--muted)', lineHeight: 1.65 }}>We aim to minimize the financial information processed. The current prototype is for testing: verify the original message before completing a transaction, and never enter passwords or PINs into the demo.</p>
          </div>
        </div>
      </section>
      {/* 4 Pillars Grid */}
      <section style={{ marginBottom: 'clamp(64px, 8vw, 96px)' }}>
        <div className="section-header">
          <div>
            <span className="meta-num">03 / WHY LINGUABRIDGE</span>
            <h2 style={{ fontSize: 'var(--f-h2)', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--ink)' }}>
              Understand financial services, step by step
            </h2>
          </div>
          <p className="lead" style={{ fontSize: '0.98rem', color: 'var(--muted)', lineHeight: 1.6 }}>
            From checking a balance to reviewing fees and transfer warnings, LinguaBridge helps people follow financial journeys in a language they understand.
          </p>
        </div>

        <div className="lb-benefits">
          {[
            { number: '01', title: 'Financial details', description: 'Designed to keep amounts, fees and beneficiary references intact during translation. Verify the original before any payment.' },
            { number: '02', title: 'Works with existing websites', description: 'Start with the Chrome or Edge desktop extension. No changes to a bank’s source code are required.' },
            { number: '03', title: 'Cameroonian languages', description: 'French and English interfaces, with Ewondo and additional national-language resources under active review.' },
            { number: '04', title: 'Messages as you browse', description: 'The extension aims to handle new instructions and alerts as pages change. Coverage is still being tested.' },
          ].map(item => (
            <article className="lb-benefit" key={item.number}>
              <span className="lb-benefit-number">{item.number}</span>
              <div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Browser extension installation: primary SAFINUM integration path */}
      <section id="extension" style={{ marginBottom: 'var(--s-8)' }}>
        <div className="section-header">
          <div>
            <span className="meta-num">04 / GET STARTED</span>
            <h2 style={{ fontSize: 'var(--f-h2)', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--ink)' }}>
              One language layer, wherever you access financial services
            </h2>
          </div>
          <p className="lead" style={{ fontSize: '0.98rem', color: 'var(--muted)', lineHeight: 1.6 }}>
            Our current approach is a desktop browser extension for Chrome and Edge. We are also working toward direct web access and mobile compatibility. API and SDK connections remain optional for developers.
          </p>
        </div>
        <div className="grid-2" style={{ gap: 'var(--s-6)' }}>
          <div className="card" style={{ padding: 'var(--s-6)', background: 'var(--paper)', border: '1px solid var(--line)' }}>
            <span className="meta-num">01 / INSTALL</span>
            <h3 style={{ marginTop: 'var(--s-3)', marginBottom: 'var(--s-3)' }}>Add LinguaBridge to your browser</h3>
            <p style={{ color: 'var(--muted)', lineHeight: 1.6 }}>
              Download the current prototype build from GitHub Actions. Extract the archive,
              then open <code>chrome://extensions</code> or <code>edge://extensions</code>,
              enable Developer mode and select “Load unpacked”.
            </p>
            <a className="btn btn-primary" style={{ display: 'inline-flex', marginTop: 'var(--s-5)' }}
              href="/dashboard">
              Explore extension access
            </a>
            <p style={{ color: 'var(--muted)', fontSize: '0.78rem', marginTop: 'var(--s-3)' }}>
              Desktop Chrome and Edge prototype. Web and mobile access are planned, not yet released.
            </p>
          </div>
          <div className="card" style={{ padding: 'var(--s-6)', background: 'var(--paper)', border: '1px solid var(--line)' }}>
            <span className="meta-num">02 / TRANSLATE</span>
            <h3 style={{ marginTop: 'var(--s-3)', marginBottom: 'var(--s-3)' }}>Choose your language and browse</h3>
            <p style={{ color: 'var(--muted)', lineHeight: 1.6 }}>
              On desktop, visit a banking, mobile money or payment website. Open LinguaBridge,
              select an available Cameroonian language and translate interface text from French or English.
              The extension is designed to work without changes to the original website.
            </p>
            <p style={{ color: 'var(--muted)', lineHeight: 1.6, marginTop: 'var(--s-4)' }}>
              Translation coverage is still being tested. Always check amounts, fees,
              account details and security warnings against the original before acting.
            </p>
            <a className="btn btn-ghost" style={{ display: 'inline-flex', marginTop: 'var(--s-4)' }}
              href="https://github.com/AnonyDes/LinguaBridge/blob/main/linguabridge/apps/extension/EDGE_DESKTOP.md">
              Read installation instructions
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
