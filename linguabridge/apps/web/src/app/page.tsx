'use client';

import React, { useState } from 'react';
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
import { LinguaBridgeClient } from '@linguabridge/sdk-js';

const client = new LinguaBridgeClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
});

export default function LandingPage() {
  const [sourceText, setSourceText] = useState(
    'Solde de votre compte Orange Money: 25 000 FCFA. Frais de transfert: 350 FCFA vers le numéro 699123456.'
  );
  const [sourceLang, setSourceLang] = useState('fr');
  const [targetLang, setTargetLang] = useState('ewo-CM');
  const [translationError, setTranslationError] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [latency, setLatency] = useState<number | null>(null);
  const [cacheStatus, setCacheStatus] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleTestTranslate = async () => {
    try {
      setLoading(true);
      setTranslationError('');
      setTranslatedText('');
      setLatency(null);
      setCacheStatus(null);
      setWarnings([]);
      const res = await client.translate({
        text: sourceText,
        sourceLang,
        targetLang,
        domain: 'financial',
      });
      setTranslatedText(res.translatedText);
      setLatency(res.latencyMs);
      setCacheStatus(res.cacheStatus);
      setWarnings(res.warnings);
    } catch {
      setTranslationError('Translation is unavailable. No simulated result is displayed. Please try again when the translation service is available.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="wrap" style={{ paddingTop: 'clamp(48px, 6vw, 80px)', paddingBottom: 'clamp(64px, 8vw, 112px)' }}>
      {/* Hero Section */}
      <section style={{ textAlign: 'center', marginBottom: 'clamp(64px, 8vw, 96px)' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--s-4)' }}>
          <span
            className="ax-pill ax-pill--active eyebrow-dot"
            style={{
              fontSize: '0.72rem',
              letterSpacing: '0.14em',
              padding: '6px 14px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Globe size={13} strokeWidth={2} style={{ color: 'var(--brand-green-deep)', flexShrink: 0 }} />
            <span>CAMEROONIAN LANGUAGES · DIGITAL FINANCIAL ACCESS</span>
          </span>
        </div>

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
          Financial services should be understandable to everyone. LinguaBridge helps translate banking, mobile money and payment interfaces from French or English into Duala and Ewondo, starting with a desktop browser extension. Our goal is to make the same accessibility available on mobile and through the web.
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
              FRENCH &amp; ENGLISH → DUALA &amp; EWONDO
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
            <p style={{ color: 'var(--muted)', lineHeight: 1.65 }}>Install on Chrome or Edge, open a financial website, and choose a national language. No changes to the bank's website are required.</p>
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

        <div className="grid-4">
          <div
            className="card card-elevate"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--s-3)',
              padding: 'var(--s-6)',
              background: 'var(--paper)',
              border: '1px solid var(--line)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bone)',
                  border: '1px solid var(--line)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ShieldCheck size={22} strokeWidth={2} style={{ color: 'var(--brand-green-deep)' }} />
              </div>
              <span className="meta" style={{ fontSize: '0.64rem', letterSpacing: '0.14em' }}>01 / FINANCIAL SAFETY</span>
            </div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, letterSpacing: '-0.015em', color: 'var(--ink)' }}>
              Protect financial details
            </h3>
            <p style={{ fontSize: '0.86rem', color: 'var(--muted)', lineHeight: 1.55 }}>
              Financial safeguards are designed to preserve amounts, fees, account references and beneficiary details. Critical information must be verified before a transaction.
            </p>
          </div>

          <div
            className="card card-elevate"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--s-3)',
              padding: 'var(--s-6)',
              background: 'var(--paper)',
              border: '1px solid var(--line)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bone)',
                  border: '1px solid var(--line)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Zap size={22} strokeWidth={2} style={{ color: '#D97706' }} />
              </div>
              <span className="meta" style={{ fontSize: '0.64rem', letterSpacing: '0.14em' }}>02 / NO-CODE ADAPTATION</span>
            </div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, letterSpacing: '-0.015em', color: 'var(--ink)' }}>
              Works with existing websites
            </h3>
            <p style={{ fontSize: '0.86rem', color: 'var(--muted)', lineHeight: 1.55 }}>
              Start on desktop with the Chrome or Edge extension. A mobile-friendly browser experience is planned and not yet available.
            </p>
          </div>

          <div
            className="card card-elevate"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--s-3)',
              padding: 'var(--s-6)',
              background: 'var(--paper)',
              border: '1px solid var(--line)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bone)',
                  border: '1px solid var(--line)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <BadgeCheck size={22} strokeWidth={2} style={{ color: 'var(--brand-green-deep)' }} />
              </div>
              <span className="meta" style={{ fontSize: '0.64rem', letterSpacing: '0.14em' }}>03 / NATIONAL LANGUAGES</span>
            </div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, letterSpacing: '-0.015em', color: 'var(--ink)' }}>
              Duala and Ewondo
            </h3>
            <p style={{ fontSize: '0.86rem', color: 'var(--muted)', lineHeight: 1.55 }}>
              Explore translation from French or English into Cameroonian languages. Linguistic coverage and accuracy require review by competent speakers, especially for financial warnings.
            </p>
          </div>

          <div
            className="card card-elevate"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--s-3)',
              padding: 'var(--s-6)',
              background: 'var(--paper)',
              border: '1px solid var(--line)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bone)',
                  border: '1px solid var(--line)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Volume2 size={22} strokeWidth={2} style={{ color: 'var(--brand-green-deep)' }} />
              </div>
              <span className="meta" style={{ fontSize: '0.64rem', letterSpacing: '0.14em' }}>04 / DYNAMIC CONTENT</span>
            </div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, letterSpacing: '-0.015em', color: 'var(--ink)' }}>
              Adapts to new messages
            </h3>
            <p style={{ fontSize: '0.86rem', color: 'var(--muted)', lineHeight: 1.55 }}>
              LinguaBridge aims to translate instructions, errors and security messages as users navigate. Translation quality and coverage are still under testing.
            </p>
          </div>
        </div>
      </section>

      {/* Interactive Sandbox */}
      <section
        id="translation-demo"
        className="card"
        style={{
          background: 'var(--paper)',
          border: '1px solid var(--line)',
          borderRadius: 'var(--radius)',
          padding: 'clamp(24px, 4vw, 40px)',
          marginBottom: 'clamp(64px, 8vw, 96px)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 'var(--s-6)',
            flexWrap: 'wrap',
            gap: 'var(--s-4)',
            paddingBottom: 'var(--s-5)',
            borderBottom: '1px solid var(--line)',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span className="meta" style={{ fontSize: '0.68rem', letterSpacing: '0.14em' }}>
                TRY THE PROTOTYPE
              </span>
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--ink)' }}>
              Try a simulated financial translation
            </h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--muted)', marginTop: '4px' }}>
              Test a simulated balance, transfer fee or warning. No real bank account or confidential information is needed.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="ax-pill ax-pill--live" style={{ fontSize: '0.68rem', letterSpacing: '0.12em' }}>
              <span className="status-dot status-dot--pulse"></span>
              Prototype · simulated data
            </span>
          </div>
        </div>

<div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: 'var(--s-5)' }}>
          <label>From <select aria-label="Source language" value={sourceLang} onChange={(e) => setSourceLang(e.target.value)}><option value="fr">Français</option><option value="en">English</option></select></label>
          <label>To <select aria-label="National language" value={targetLang} onChange={(e) => setTargetLang(e.target.value)}><option value="ewo-CM">Ewondo</option><option value="dua-CM">Duala</option></select></label>
        </div>
        {translationError && <p role="alert" style={{ color: '#B91C1C', marginBottom: 'var(--s-4)' }}>{translationError}</p>}
                <div className="grid-2" style={{ marginBottom: 'var(--s-5)', gap: 'var(--s-5)' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: 'var(--muted)',
                }}
              >
                Source language
              </label>
              <span className="meta" style={{ fontSize: '0.64rem' }}>FR / EN</span>
            </div>
            <textarea
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              rows={4}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--line-strong)',
                background: 'var(--paper)',
                color: 'var(--ink)',
                fontSize: '0.9rem',
                lineHeight: 1.5,
                fontFamily: 'inherit',
                resize: 'vertical',
                outline: 'none',
                transition: 'border-color var(--dur-fast) var(--easing)',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--brand-green)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--line-strong)';
              }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: 'var(--muted)',
                }}
              >
                National language
              </label>
              {latency !== null && (
                <span
                  className="ax-pill"
                  style={{
                    fontSize: '0.65rem',
                    fontFamily: 'var(--font-mono)',
                    fontVariantNumeric: 'tabular-nums',
                    padding: '2px 8px',
                  }}
                >
                  Latency: <strong style={{ color: 'var(--ink)' }}>{latency}ms</strong> | Cache: <strong style={{ color: 'var(--brand-green-deep)' }}>{cacheStatus}</strong>
                </span>
              )}
            </div>
            <div
              style={{
                width: '100%',
                minHeight: '112px',
                padding: '14px',
                borderRadius: 'var(--radius)',
                background: 'var(--bone)',
                border: '1px solid var(--line)',
                fontSize: '0.9rem',
                lineHeight: 1.5,
                color: translatedText ? 'var(--ink)' : 'var(--muted)',
                fontFamily: 'inherit',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>{translatedText || 'Translation will appear here after you run the demo.'}</div>
              {translatedText && (
                <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheck size={14} style={{ color: 'var(--brand-green)' }} />
                  <span className="meta" style={{ fontSize: '0.64rem', color: 'var(--brand-green-deep)' }}>
                    Check all amounts, fees and beneficiary details against the original
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {warnings.length > 0 && (
          <div
            style={{
              marginBottom: 'var(--s-4)',
              padding: '14px 18px',
              background: '#FFF3DE',
              borderRadius: 'var(--radius)',
              border: '1px solid #F59E0B',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <AlertTriangle size={16} strokeWidth={2.2} style={{ color: '#D97706', flexShrink: 0 }} />
              <strong style={{ color: '#92400E', fontSize: '0.85rem' }}>Financial Guard Alerts:</strong>
            </div>
            <ul style={{ margin: '4px 0 0 24px', fontSize: '0.82rem', color: '#92400E' }}>
              {warnings.map((w, idx) => (
                <li key={idx}>{w}</li>
              ))}
            </ul>
          </div>
        )}

        <button
          onClick={handleTestTranslate}
          disabled={loading}
          className="btn btn-primary"
          style={{
            width: '100%',
            padding: '14px',
            fontSize: '0.92rem',
            borderRadius: 'var(--radius)',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? 'Translating...' : 'Translate simulated financial text'}
        </button>
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
              select Duala or Ewondo and translate interface text from French or English.
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
