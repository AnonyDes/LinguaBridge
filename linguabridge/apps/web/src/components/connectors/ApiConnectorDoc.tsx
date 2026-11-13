'use client';

import React, { useState } from 'react';
import {
  BookOpen,
  Lock,
  Radio,
  Code2,
  FlaskConical,
  AlertTriangle,
  ShieldCheck,
  Volume2,
  Zap,
  Play,
} from 'lucide-react';

export const ApiConnectorDoc: React.FC = () => {
  const [subTab, setSubTab] = useState<'overview' | 'auth' | 'endpoints' | 'snippets' | 'console' | 'errors'>('overview');

  // Live Console State
  const [method, setMethod] = useState<'POST_TRANSLATE' | 'POST_TTS' | 'GET_LANGUAGES' | 'POST_VERIFY' | 'GET_HEALTH'>('POST_TRANSLATE');
  const [sourceText, setSourceText] = useState('Solde de votre compte Orange Money: 25 000 FCFA. Frais: 350 FCFA vers le 699123456.');
  const [targetLang, setTargetLang] = useState('ewo-CM');
  const [consoleKey, setConsoleKey] = useState('');
  const [consoleResponse, setConsoleResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const handleExecuteRequest = async () => {
    setLoading(true);
    const start = performance.now();
    const headers = { 'Content-Type': 'application/json', ...(consoleKey.trim() ? { 'X-API-Key': consoleKey.trim() } : {}) };
    try {
      if (method === 'POST_TRANSLATE') {
        const res = await fetch(`${apiBase}/v1/translate`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            text: sourceText,
            targetLang,
            sourceLang: 'fr',
            domain: 'financial',
            providerPreference: 'openrouter',
            privacyPolicy: 'allow_external',
          }),
        });
        const data = await res.json();
        setConsoleResponse({
          status: res.status,
          latencyMs: Math.round(performance.now() - start),
          payload: data,
        });
      } else if (method === 'POST_TTS') {
        const res = await fetch(`${apiBase}/v1/speech/synthesize`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            text: "Móni m'ékabedá: 25 000 FCFA",
            lang: targetLang,
          }),
        });
        const data = res.headers.get('content-type')?.includes('audio/')
          ? { audioBytes: (await res.arrayBuffer()).byteLength }
          : await res.json();
        setConsoleResponse({
          status: res.status,
          latencyMs: Math.round(performance.now() - start),
          payload: data,
        });
      } else if (method === 'GET_LANGUAGES') {
        const res = await fetch(`${apiBase}/v1/languages`);
        const data = await res.json();
        setConsoleResponse({
          status: res.status,
          latencyMs: Math.round(performance.now() - start),
          payload: data,
        });
      } else if (method === 'POST_VERIFY') {
        const res = await fetch(`${apiBase}/v1/verify`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            sourceText: 'Paiement de 15 000 FCFA',
            translatedText: 'Móni yá 15 000 FCFA',
          }),
        });
        const data = await res.json();
        setConsoleResponse({
          status: res.status,
          latencyMs: Math.round(performance.now() - start),
          payload: data,
        });
      } else {
        const res = await fetch(`${apiBase}/v1/health`);
        const data = await res.json();
        setConsoleResponse({
          status: res.status,
          latencyMs: Math.round(performance.now() - start),
          payload: data,
        });
      }
    } catch (error) {
      setConsoleResponse({
        status: 0,
        latencyMs: Math.round(performance.now() - start),
        payload: { error: error instanceof Error ? error.message : 'Request failed' },
      });
    } finally {
      setLoading(false);
    }
  };

  const subTabs = [
    { id: 'overview', label: "Vue d'ensemble", icon: <BookOpen size={14} /> },
    { id: 'auth', label: 'Authentification', icon: <Lock size={14} /> },
    { id: 'endpoints', label: 'Spécification des Endpoints', icon: <Radio size={14} /> },
    { id: 'snippets', label: 'Exemples de Code', icon: <Code2 size={14} /> },
    { id: 'console', label: 'Console Interactive Live', icon: <FlaskConical size={14} /> },
    { id: 'errors', label: "Codes d'Erreur", icon: <AlertTriangle size={14} /> },
  ] as const;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Connector Header */}
      <div
        style={{
          borderBottom: '1px solid var(--line, rgba(10, 10, 10, 0.12))',
          paddingBottom: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '16px',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2
              style={{
                fontFamily: 'var(--font-heading, "Manrope", sans-serif)',
                fontSize: '20px',
                fontWeight: 800,
                color: 'var(--ink, #0A0A0A)',
                margin: 0,
                letterSpacing: '-0.02em',
              }}
            >
              Passerelle REST API (Fastify 5 & OpenAPI 3.1)
            </h2>
            <span
              className="ax-pill ax-pill--active"
              style={{
                fontSize: '10px',
                padding: '3px 8px',
              }}
            >
              Accès Total Illimité
            </span>
          </div>
          <p
            style={{
              margin: '6px 0 0 0',
              fontSize: '13px',
              color: 'var(--muted, rgba(10, 10, 10, 0.6))',
              lineHeight: 1.5,
              maxWidth: '680px',
            }}
          >
            Connectez n&apos;importe quelle application bancaire, ERP ou service backend à l&apos;intégralité du moteur LinguaBridge : Traduction, Synthèse Vocale TTS, Garde-fou AST et Registre des Langues.
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span
            style={{
              fontSize: '10px',
              fontFamily: 'var(--font-mono, monospace)',
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: 'var(--muted, rgba(10, 10, 10, 0.6))',
            }}
          >
            Base URL
          </span>
          <div
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontWeight: 600,
              fontSize: '12px',
              color: 'var(--green-deep, #08751A)',
              backgroundColor: 'var(--ws, #F6F6F4)',
              padding: '3px 8px',
              borderRadius: 'var(--radius-xs, 2px)',
              border: '1px solid var(--line, rgba(10, 10, 10, 0.12))',
              marginTop: '4px',
            }}
          >
            http://localhost:3001/v1
          </div>
        </div>
      </div>

      {/* Sub-navigation Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '6px',
          borderBottom: '1px solid var(--line, rgba(10, 10, 10, 0.12))',
          paddingBottom: '2px',
          overflowX: 'auto',
        }}
      >
        {subTabs.map((tab) => {
          const isSelected = subTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id)}
              className="btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 12px',
                borderRadius: 'var(--radius, 4px) var(--radius, 4px) 0 0',
                borderBottom: isSelected
                  ? '2px solid var(--green, #12B82A)'
                  : '2px solid transparent',
                color: isSelected
                  ? 'var(--green-deep, #08751A)'
                  : 'var(--muted, rgba(10, 10, 10, 0.6))',
                fontWeight: isSelected ? 700 : 500,
                fontSize: '12.5px',
                cursor: 'pointer',
                background: isSelected ? 'var(--ws, #F6F6F4)' : 'transparent',
                border: 'none',
                borderBottomStyle: 'solid',
                borderBottomWidth: '2px',
                borderBottomColor: isSelected ? 'var(--green, #12B82A)' : 'transparent',
                whiteSpace: 'nowrap',
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* SubTab Content */}
      {subTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            style={{
              backgroundColor: 'var(--ws, #F6F6F4)',
              padding: '16px 18px',
              borderRadius: 'var(--radius, 4px)',
              border: '1px solid var(--line, rgba(10, 10, 10, 0.12))',
            }}
          >
            <h4
              style={{
                margin: '0 0 8px 0',
                fontSize: '14px',
                fontFamily: 'var(--font-heading, "Manrope", sans-serif)',
                fontWeight: 700,
                color: 'var(--ink, #0A0A0A)',
              }}
            >
              Philosophie de Conception : &quot;Accès Total&quot;
            </h4>
            <p
              style={{
                margin: 0,
                fontSize: '13px',
                color: 'var(--muted, rgba(10, 10, 10, 0.6))',
                lineHeight: 1.6,
              }}
            >
              L&apos;API LinguaBridge ne bride aucune fonctionnalité. Dès qu&apos;un développeur branche son système via notre API REST, il obtient un accès direct et sans restriction à la traduction financière contextuelle, à la synthèse vocale d&apos;appoint en langues camerounaises (avec respect des contours tonals), et à l&apos;analyseur d&apos;invariance d&apos;entités financières (Zéro Dérive).
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            <div
              style={{
                border: '1px solid var(--line, rgba(10, 10, 10, 0.12))',
                borderRadius: 'var(--radius, 4px)',
                padding: '16px',
                backgroundColor: 'var(--paper, #ffffff)',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '4px',
                  backgroundColor: 'var(--green-soft, #E9F9EC)',
                  border: '1px solid rgba(18, 184, 42, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--green-deep, #08751A)',
                  marginBottom: '10px',
                }}
              >
                <ShieldCheck size={18} strokeWidth={2} />
              </div>
              <h5
                style={{
                  margin: '0 0 4px 0',
                  fontSize: '13.5px',
                  fontWeight: 700,
                  color: 'var(--ink, #0A0A0A)',
                }}
              >
                Invariance Monétaire AST
              </h5>
              <p
                style={{
                  margin: 0,
                  fontSize: '12px',
                  color: 'var(--muted, rgba(10, 10, 10, 0.6))',
                  lineHeight: 1.5,
                }}
              >
                Chaque phrase traduite fait l&apos;objet d&apos;une extraction d&apos;entités (montants, devises, téléphones). Aucune divergence n&apos;est tolérée.
              </p>
            </div>

            <div
              style={{
                border: '1px solid var(--line, rgba(10, 10, 10, 0.12))',
                borderRadius: 'var(--radius, 4px)',
                padding: '16px',
                backgroundColor: 'var(--paper, #ffffff)',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '4px',
                  backgroundColor: 'var(--green-soft, #E9F9EC)',
                  border: '1px solid rgba(18, 184, 42, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--green-deep, #08751A)',
                  marginBottom: '10px',
                }}
              >
                <Volume2 size={18} strokeWidth={2} />
              </div>
              <h5
                style={{
                  margin: '0 0 4px 0',
                  fontSize: '13.5px',
                  fontWeight: 700,
                  color: 'var(--ink, #0A0A0A)',
                }}
              >
                Synthèse Vocale Africaine
              </h5>
              <p
                style={{
                  margin: 0,
                  fontSize: '12px',
                  color: 'var(--muted, rgba(10, 10, 10, 0.6))',
                  lineHeight: 1.5,
                }}
              >
                Génération de guides tonals et fichiers audio pour l&apos;alphabétisation financière et l&apos;accessibilité vocale des populations.
              </p>
            </div>

            <div
              style={{
                border: '1px solid var(--line, rgba(10, 10, 10, 0.12))',
                borderRadius: 'var(--radius, 4px)',
                padding: '16px',
                backgroundColor: 'var(--paper, #ffffff)',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '4px',
                  backgroundColor: 'var(--green-soft, #E9F9EC)',
                  border: '1px solid rgba(18, 184, 42, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--green-deep, #08751A)',
                  marginBottom: '10px',
                }}
              >
                <Zap size={18} strokeWidth={2} />
              </div>
              <h5
                style={{
                  margin: '0 0 4px 0',
                  fontSize: '13.5px',
                  fontWeight: 700,
                  color: 'var(--ink, #0A0A0A)',
                }}
              >
                Mémoire de Traduction Sub-ms
              </h5>
              <p
                style={{
                  margin: 0,
                  fontSize: '12px',
                  color: 'var(--muted, rgba(10, 10, 10, 0.6))',
                  lineHeight: 1.5,
                }}
              >
                Cache en mémoire et persistance Supabase assurant un temps de réponse moyen de 1.8 ms sur les phrases récurrentes.
              </p>
            </div>
          </div>
        </div>
      )}

      {subTab === 'auth' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            style={{
              backgroundColor: 'var(--paper, #ffffff)',
              padding: '20px',
              borderRadius: 'var(--radius, 4px)',
              border: '1px solid var(--line, rgba(10, 10, 10, 0.12))',
            }}
          >
            <h4
              style={{
                margin: '0 0 10px 0',
                fontSize: '14px',
                fontFamily: 'var(--font-heading, "Manrope", sans-serif)',
                fontWeight: 700,
                color: 'var(--ink, #0A0A0A)',
              }}
            >
              Authentification par En-tête HTTP
            </h4>
            <p
              style={{
                margin: '0 0 14px 0',
                fontSize: '13px',
                color: 'var(--muted, rgba(10, 10, 10, 0.6))',
                lineHeight: 1.5,
              }}
            >
              Toutes les requêtes vers l&apos;API de production doivent inclure votre clé d&apos;API secrète dans l&apos;en-tête <code>Authorization</code> ou <code>x-api-key</code> :
            </p>
            <div
              style={{
                backgroundColor: 'var(--ink-2, #171717)',
                color: 'var(--bone, #F3F2ED)',
                padding: '12px 16px',
                borderRadius: 'var(--radius, 4px)',
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '12.5px',
                border: '1px solid var(--line-invert, rgba(255, 255, 255, 0.14))',
              }}
            >
              Authorization: Bearer lb_live_9a7d3b1e8f2c...
            </div>
          </div>
        </div>
      )}

      {subTab === 'endpoints' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[
            {
              method: 'POST',
              path: '/v1/translate',
              desc: "Traduction financière avec vérification d'empreinte SHA-256 et zéro dérive.",
              params: '{ text: string, targetLang: string, sourceLang?: string, domain?: string }',
            },
            {
              method: 'POST',
              path: '/v1/translate/batch',
              desc: 'Traduction groupée matricielle pour le traitement haute cadence bancaire.',
              params: '{ items: Array<{ id: string, text: string }>, targetLang: string }',
            },
            {
              method: 'POST',
              path: '/v1/speech/synthesize',
              desc: 'Synthèse vocale native avec modèle acoustique africain et contours tonals.',
              params: '{ text: string, lang: string, rate?: number, pitch?: number }',
            },
            {
              method: 'POST',
              path: '/v1/verify',
              desc: "Vérification formelle d'invariance des montants et numéros entre source et cible.",
              params: '{ sourceText: string, translatedText: string }',
            },
            {
              method: 'GET',
              path: '/v1/languages',
              desc: 'Liste des 5 langues nationales certifiées et statut des quarantaines.',
              params: 'None (paramètre optionnel ?includeQuarantined=true)',
            },
            {
              method: 'GET',
              path: '/v1/health',
              desc: 'Statut de santé du serveur, utilisation mémoire et réactivité.',
              params: 'None',
            },
          ].map((ep, idx) => (
            <div
              key={idx}
              style={{
                border: '1px solid var(--line, rgba(10, 10, 10, 0.12))',
                borderRadius: 'var(--radius, 4px)',
                padding: '12px 16px',
                backgroundColor: 'var(--paper, #ffffff)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '16px',
                flexWrap: 'wrap',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      fontWeight: 700,
                      fontSize: '10.5px',
                      padding: '2px 7px',
                      borderRadius: 'var(--radius-xs, 2px)',
                      backgroundColor: ep.method === 'POST' ? '#dbeafe' : 'var(--green-soft, #E9F9EC)',
                      color: ep.method === 'POST' ? '#1d4ed8' : 'var(--green-deep, #08751A)',
                      fontFamily: 'var(--font-mono, monospace)',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {ep.method}
                  </span>
                  <span
                    style={{
                      fontWeight: 700,
                      fontSize: '13px',
                      fontFamily: 'var(--font-mono, monospace)',
                      color: 'var(--ink, #0A0A0A)',
                    }}
                  >
                    {ep.path}
                  </span>
                </div>
                <p
                  style={{
                    margin: '4px 0 0 0',
                    fontSize: '12px',
                    color: 'var(--muted, rgba(10, 10, 10, 0.6))',
                  }}
                >
                  {ep.desc}
                </p>
              </div>
              <div
                style={{
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono, monospace)',
                  color: 'var(--muted, rgba(10, 10, 10, 0.6))',
                  backgroundColor: 'var(--ws, #F6F6F4)',
                  padding: '4px 8px',
                  borderRadius: 'var(--radius-xs, 2px)',
                  border: '1px solid var(--line, rgba(10, 10, 10, 0.12))',
                }}
              >
                {ep.params}
              </div>
            </div>
          ))}
        </div>
      )}

      {subTab === 'snippets' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <h5
              style={{
                margin: '0 0 8px 0',
                fontSize: '12px',
                fontFamily: 'var(--font-mono, monospace)',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: 'var(--muted, rgba(10, 10, 10, 0.6))',
              }}
            >
              cURL (Requête Directe)
            </h5>
            <pre
              style={{
                backgroundColor: 'var(--ink-2, #171717)',
                color: 'var(--bone, #F3F2ED)',
                padding: '14px 16px',
                borderRadius: 'var(--radius, 4px)',
                fontSize: '12px',
                fontFamily: 'var(--font-mono, monospace)',
                border: '1px solid var(--line-invert, rgba(255, 255, 255, 0.14))',
                overflowX: 'auto',
                margin: 0,
                lineHeight: 1.5,
              }}
            >
{`curl -X POST http://localhost:3001/v1/translate \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{
    "text": "Solde disponible: 25 000 FCFA. Frais: 350 FCFA vers 699123456",
    "targetLang": "ewo-CM",
    "domain": "financial"
  }'`}
            </pre>
          </div>

          <div>
            <h5
              style={{
                margin: '0 0 8px 0',
                fontSize: '12px',
                fontFamily: 'var(--font-mono, monospace)',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: 'var(--muted, rgba(10, 10, 10, 0.6))',
              }}
            >
              TypeScript / Node.js (Fetch natif)
            </h5>
            <pre
              style={{
                backgroundColor: 'var(--ink-2, #171717)',
                color: 'var(--bone, #F3F2ED)',
                padding: '14px 16px',
                borderRadius: 'var(--radius, 4px)',
                fontSize: '12px',
                fontFamily: 'var(--font-mono, monospace)',
                border: '1px solid var(--line-invert, rgba(255, 255, 255, 0.14))',
                overflowX: 'auto',
                margin: 0,
                lineHeight: 1.5,
              }}
            >
{`const response = await fetch('http://localhost:3001/v1/translate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + process.env.LINGUABRIDGE_API_KEY
  },
  body: JSON.stringify({
    text: 'Solde de votre compte: 50 000 FCFA',
    targetLang: 'fuv-CM' // Fulfulde
  })
});
const { translatedText, violations } = await response.json();
console.log('Traduction:', translatedText);`}
            </pre>
          </div>
        </div>
      )}

      {subTab === 'console' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            style={{
              border: '1px solid var(--line, rgba(10, 10, 10, 0.12))',
              borderRadius: 'var(--radius, 4px)',
              padding: '16px',
              backgroundColor: 'var(--paper, #ffffff)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                type="password"
                value={consoleKey}
                onChange={(e) => setConsoleKey(e.target.value)}
                placeholder="Scoped API key for protected routes"
                aria-label="Scoped API key"
                autoComplete="off"
                style={{ padding: '7px 12px', borderRadius: 'var(--radius, 4px)', border: '1px solid var(--line-strong, rgba(10, 10, 10, 0.32))' }}
              />
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as any)}
                style={{
                  padding: '7px 12px',
                  borderRadius: 'var(--radius, 4px)',
                  border: '1px solid var(--line-strong, rgba(10, 10, 10, 0.32))',
                  fontWeight: 600,
                  fontSize: '12.5px',
                  fontFamily: 'var(--font-body, sans-serif)',
                  backgroundColor: 'var(--paper, #ffffff)',
                  color: 'var(--ink, #0A0A0A)',
                }}
              >
                <option value="POST_TRANSLATE">POST /v1/translate (Traduction)</option>
                <option value="POST_TTS">POST /v1/speech/synthesize (Voix TTS)</option>
                <option value="POST_VERIFY">POST /v1/verify (Zéro Dérive)</option>
                <option value="GET_LANGUAGES">GET /v1/languages (5 Langues)</option>
                <option value="GET_HEALTH">GET /v1/health (Santé)</option>
              </select>

              {(method === 'POST_TRANSLATE' || method === 'POST_TTS') && (
                <select
                  value={targetLang}
                  onChange={(e) => setTargetLang(e.target.value)}
                  style={{
                    padding: '7px 12px',
                    borderRadius: 'var(--radius, 4px)',
                    border: '1px solid var(--line-strong, rgba(10, 10, 10, 0.32))',
                    fontSize: '12.5px',
                    fontFamily: 'var(--font-body, sans-serif)',
                    backgroundColor: 'var(--paper, #ffffff)',
                    color: 'var(--ink, #0A0A0A)',
                  }}
                >
                  <option value="ewo-CM">Ewondo (ewo-CM)</option>
                  <option value="fuv-CM">Fulfulde (fuv-CM)</option>
                  <option value="hau-CM">Haoussa (hau-CM)</option>
                  <option value="knc-CM">Kanuri (knc-CM)</option>
                  <option value="pcm-CM">Pidgin (pcm-CM)</option>
                </select>
              )}

              <button
                onClick={handleExecuteRequest}
                disabled={loading}
                className="btn btn-primary"
                style={{
                  padding: '7px 16px',
                  fontSize: '12.5px',
                  gap: '6px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                <Play size={12} strokeWidth={2.5} />
                {loading ? 'Exécution...' : 'Exécuter la Requête'}
              </button>
            </div>

            {method === 'POST_TRANSLATE' && (
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono, monospace)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    fontWeight: 600,
                    color: 'var(--muted, rgba(10, 10, 10, 0.6))',
                    marginBottom: '4px',
                  }}
                >
                  Texte source bancaire à traduire :
                </label>
                <input
                  type="text"
                  value={sourceText}
                  onChange={(e) => setSourceText(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius, 4px)',
                    border: '1px solid var(--line-strong, rgba(10, 10, 10, 0.32))',
                    fontSize: '13px',
                    fontFamily: 'var(--font-body, sans-serif)',
                    boxSizing: 'border-box',
                    backgroundColor: 'var(--paper, #ffffff)',
                    color: 'var(--ink, #0A0A0A)',
                  }}
                />
              </div>
            )}
          </div>

          {consoleResponse && (
            <div
              style={{
                backgroundColor: 'var(--ink-2, #171717)',
                borderRadius: 'var(--radius, 4px)',
                padding: '16px',
                color: 'var(--bone, #F3F2ED)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                border: '1px solid var(--line-invert, rgba(255, 255, 255, 0.14))',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11.5px', fontFamily: 'var(--font-mono, monospace)', color: 'var(--muted-invert, rgba(255, 255, 255, 0.62))' }}>
                  Statut HTTP : <strong style={{ color: consoleResponse.status >= 200 && consoleResponse.status < 300 ? 'var(--green-glow, #4FE066)' : '#ff8a8a' }}>{consoleResponse.status || 'Network error'}</strong>
                </span>
                <span style={{ fontSize: '11.5px', fontFamily: 'var(--font-mono, monospace)', color: 'var(--muted-invert, rgba(255, 255, 255, 0.62))' }}>
                  Latence : <strong style={{ color: '#38bdf8' }}>{consoleResponse.latencyMs} ms</strong>
                </span>
              </div>
              <pre
                style={{
                  margin: 0,
                  fontSize: '12px',
                  fontFamily: 'var(--font-mono, monospace)',
                  overflowX: 'auto',
                  lineHeight: 1.5,
                  color: 'var(--bone, #F3F2ED)',
                }}
              >
                {JSON.stringify(consoleResponse.payload, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {subTab === 'errors' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            { code: '400 Bad Request', reason: 'Payload invalide ou texte source vide.' },
            { code: '401 Unauthorized', reason: "Clé d'API absente, invalide ou révoquée." },
            { code: '422 Unprocessable Entity', reason: "Dérive financière détectée par l'AST Guard (montant altéré)." },
            { code: '503 Service Unavailable', reason: 'Langue non encore installée ou en quarantaine strict.' },
          ].map((err, idx) => (
            <div
              key={idx}
              style={{
                border: '1px solid rgba(220, 38, 38, 0.25)',
                backgroundColor: '#FEF2F2',
                padding: '10px 14px',
                borderRadius: 'var(--radius, 4px)',
                display: 'flex',
                gap: '12px',
                alignItems: 'center',
              }}
            >
              <span
                style={{
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono, monospace)',
                  color: '#B91C1C',
                  fontSize: '12px',
                }}
              >
                {err.code}
              </span>
              <span style={{ fontSize: '12.5px', color: '#7f1d1d' }}>{err.reason}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
