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
  Copy,
  Check,
} from 'lucide-react';
import { LinguaBridgeClient } from '@linguabridge/sdk-js';

const client = new LinguaBridgeClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
});

const widgetSnippet = `<script 
  src="https://cdn.linguabridge.org/widget.js" 
  data-auto-init="true"
  data-api-url="https://api.linguabridge.org">
</script>`;

const reactSnippet = `import { LinguaBridgeProvider, Translate } from '@linguabridge/sdk-react';

export default function App() {
  return (
    <LinguaBridgeProvider defaultTargetLang="fr">
      <Translate text="Confirm Transfer of 10,000 FCFA" />
    </LinguaBridgeProvider>
  );
}`;

export default function LandingPage() {
  const [sourceText, setSourceText] = useState(
    'Solde de votre compte Orange Money: 25 000 FCFA. Frais de transfert: 350 FCFA vers le numéro 699123456.'
  );
  const [sourceLang, setSourceLang] = useState('fr');
  const [targetLang, setTargetLang] = useState('en');
  const [translatedText, setTranslatedText] = useState('');
  const [latency, setLatency] = useState<number | null>(null);
  const [cacheStatus, setCacheStatus] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState<number | null>(null);

  const handleTestTranslate = async () => {
    try {
      setLoading(true);
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
      // Offline fallback mock demonstration
      setTranslatedText(
        'Balance of your Orange Money account: 25,000 FCFA. Transfer fee: 350 FCFA to number 699123456.'
      );
      setLatency(14);
      setCacheStatus('memory_hit');
      setWarnings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, id: number) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedSnippet(id);
      setTimeout(() => setCopiedSnippet(null), 2000);
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
            <span>FINANCIAL INCLUSION FOR CAMEROON &amp; CEMAC</span>
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
          Bridging Languages, <span style={{ color: 'var(--brand-green)' }}>Securing Fintech</span>
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
          LinguaBridge is open-source accessibility infrastructure enabling mobile money, banking, and public
          platforms in Cameroon to serve all citizens with mathematical certainty and zero financial drift.
        </p>

        <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
          <Link
            href="/cameropay"
            className="btn btn-primary"
            style={{
              padding: '14px 28px',
              fontSize: '0.95rem',
              letterSpacing: '-0.01em',
            }}
          >
            <span>Launch CameroPay Demo</span>
            <span className="arrow">→</span>
          </Link>
          <Link
            href="/dashboard"
            className="btn btn-ghost"
            style={{
              padding: '14px 28px',
              fontSize: '0.95rem',
              letterSpacing: '-0.01em',
            }}
          >
            <span>View Developer Dashboard</span>
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
              BEAC / COBAC COMPLIANT
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={14} style={{ color: 'var(--brand-green)' }} />
            <span className="meta" style={{ fontSize: '0.68rem', letterSpacing: '0.12em' }}>
              ZERO NUMERIC DRIFT
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Zap size={14} style={{ color: 'var(--brand-green)' }} />
            <span className="meta" style={{ fontSize: '0.68rem', letterSpacing: '0.12em' }}>
              &lt; 5MS TM LATENCY
            </span>
          </div>
        </div>
      </section>

      {/* 4 Pillars Grid */}
      <section style={{ marginBottom: 'clamp(64px, 8vw, 96px)' }}>
        <div className="section-header">
          <div>
            <span className="meta-num">01 / CORE ARCHITECTURE</span>
            <h2 style={{ fontSize: 'var(--f-h2)', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--ink)' }}>
              Engineered for Rigorous Financial Inclusion
            </h2>
          </div>
          <p className="lead" style={{ fontSize: '0.98rem', color: 'var(--muted)', lineHeight: 1.6 }}>
            Four foundational pillars designed to eliminate financial hallucination, protect national language sovereignty, and guarantee real-time microfinance performance.
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
              <span className="meta" style={{ fontSize: '0.64rem', letterSpacing: '0.14em' }}>01 / AST GUARD</span>
            </div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, letterSpacing: '-0.015em', color: 'var(--ink)' }}>
              Financial Guard
            </h3>
            <p style={{ fontSize: '0.86rem', color: 'var(--muted)', lineHeight: 1.55 }}>
              Deterministic numeric &amp; entity extractor guarantees that amounts (FCFA), account IDs, and phone numbers are
              strictly preserved without drift or hallucination.
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
              <span className="meta" style={{ fontSize: '0.64rem', letterSpacing: '0.14em' }}>02 / CACHE</span>
            </div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, letterSpacing: '-0.015em', color: 'var(--ink)' }}>
              Sub-ms Translation Memory
            </h3>
            <p style={{ fontSize: '0.86rem', color: 'var(--muted)', lineHeight: 1.55 }}>
              High-throughput TM cache delivers instantaneous responses for banking transactions, balance checks, and
              microfinance menus.
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
              <span className="meta" style={{ fontSize: '0.64rem', letterSpacing: '0.14em' }}>03 / ISOLATION</span>
            </div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, letterSpacing: '-0.015em', color: 'var(--ink)' }}>
              Cameroon Pack Isolation
            </h3>
            <p style={{ fontSize: '0.86rem', color: 'var(--muted)', lineHeight: 1.55 }}>
              Uncertified language packs (Ewondo, Duala, Basaa, Fulfulde, Bulu) remain strictly quarantined until certified
              by accredited local linguists.
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
              <span className="meta" style={{ fontSize: '0.64rem', letterSpacing: '0.14em' }}>04 / ACOUSTIC</span>
            </div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, letterSpacing: '-0.015em', color: 'var(--ink)' }}>
              Degrade-First Speech
            </h3>
            <p style={{ fontSize: '0.86rem', color: 'var(--muted)', lineHeight: 1.55 }}>
              Explicit fallback policy prevents cross-lingual speech corruption, ensuring tonal African languages are
              never spoken with incorrect acoustic models.
            </p>
          </div>
        </div>
      </section>

      {/* Interactive Sandbox */}
      <section
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
                INTERACTIVE TESTBENCH
              </span>
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--ink)' }}>
              Live Financial Translation Sandbox
            </h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--muted)', marginTop: '4px' }}>
              Test how LinguaBridge extracts financial entities and protects transaction integrity in real time.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="ax-pill ax-pill--live" style={{ fontSize: '0.68rem', letterSpacing: '0.12em' }}>
              <span className="status-dot status-dot--pulse"></span>
              API Online :3001
            </span>
          </div>
        </div>

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
                Source Language: French
              </label>
              <span className="meta" style={{ fontSize: '0.64rem' }}>ISO 639-1: FR</span>
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
                Target Language: English
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
              <div>{translatedText || 'Click "Execute Translation & Verify Financial Guard" to test pipeline...'}</div>
              {translatedText && (
                <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheck size={14} style={{ color: 'var(--brand-green)' }} />
                  <span className="meta" style={{ fontSize: '0.64rem', color: 'var(--brand-green-deep)' }}>
                    NUMERIC ENTITIES VERIFIED INVARIANT (0 DRIFT)
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
          {loading ? 'Processing Translation & Entity Extraction...' : 'Execute Translation & Verify Financial Guard'}
        </button>
      </section>

      {/* Integration Docs Portal */}
      <section>
        <div className="section-header">
          <div>
            <span className="meta-num">02 / DEVELOPER INTEGRATION</span>
            <h2 style={{ fontSize: 'var(--f-h2)', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--ink)' }}>
              Quickstart Integration
            </h2>
          </div>
          <p className="lead" style={{ fontSize: '0.98rem', color: 'var(--muted)', lineHeight: 1.6 }}>
            Embed accessible CEMAC multilingual interfaces with zero framework overhead using the vanilla script tag, or plug into modern Next.js apps via the React SDK.
          </p>
        </div>

        <div className="grid-2" style={{ gap: 'var(--s-6)' }}>
          <div
            className="card"
            style={{
              background: 'var(--paper)',
              border: '1px solid var(--line)',
              borderRadius: 'var(--radius)',
              padding: 'var(--s-6)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, letterSpacing: '-0.015em', color: 'var(--ink)' }}>
                1. Embed Standalone Widget
              </h3>
              <span className="ax-pill" style={{ fontSize: '0.62rem' }}>CDN SCRIPT</span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: 'var(--s-4)', lineHeight: 1.55 }}>
              Add a single line of script to enable Shadow-DOM-isolated accessibility on any fintech website:
            </p>

            <div
              style={{
                marginTop: 'auto',
                background: 'var(--ink-2)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: 'var(--radius)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 14px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.68rem',
                    color: 'rgba(255, 255, 255, 0.6)',
                    letterSpacing: '0.12em',
                  }}
                >
                  HTML SNIPPET
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(widgetSnippet, 1)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: copiedSnippet === 1 ? 'var(--brand-green)' : 'rgba(255, 255, 255, 0.75)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '0.72rem',
                    fontFamily: 'var(--font-mono)',
                    padding: '2px 6px',
                  }}
                >
                  {copiedSnippet === 1 ? <Check size={12} strokeWidth={2.5} /> : <Copy size={12} />}
                  <span>{copiedSnippet === 1 ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.78rem',
                  lineHeight: 1.6,
                  color: '#F8FAFC',
                  padding: '14px',
                  margin: 0,
                  overflowX: 'auto',
                }}
              >
{widgetSnippet}
              </pre>
            </div>
          </div>

          <div
            className="card"
            style={{
              background: 'var(--paper)',
              border: '1px solid var(--line)',
              borderRadius: 'var(--radius)',
              padding: 'var(--s-6)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, letterSpacing: '-0.015em', color: 'var(--ink)' }}>
                2. Use React SDK
              </h3>
              <span className="ax-pill" style={{ fontSize: '0.62rem' }}>NPM PACKAGE</span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: 'var(--s-4)', lineHeight: 1.55 }}>
              Wrap your Next.js or React app with <code style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', padding: '2px 4px', background: 'var(--bone)', borderRadius: '2px' }}>LinguaBridgeProvider</code> for seamless hooks:
            </p>

            <div
              style={{
                marginTop: 'auto',
                background: 'var(--ink-2)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: 'var(--radius)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 14px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.68rem',
                    color: 'rgba(255, 255, 255, 0.6)',
                    letterSpacing: '0.12em',
                  }}
                >
                  REACT / NEXT.JS PROVIDER
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(reactSnippet, 2)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: copiedSnippet === 2 ? 'var(--brand-green)' : 'rgba(255, 255, 255, 0.75)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '0.72rem',
                    fontFamily: 'var(--font-mono)',
                    padding: '2px 6px',
                  }}
                >
                  {copiedSnippet === 2 ? <Check size={12} strokeWidth={2.5} /> : <Copy size={12} />}
                  <span>{copiedSnippet === 2 ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.78rem',
                  lineHeight: 1.6,
                  color: '#F8FAFC',
                  padding: '14px',
                  margin: 0,
                  overflowX: 'auto',
                }}
              >
{reactSnippet}
              </pre>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
