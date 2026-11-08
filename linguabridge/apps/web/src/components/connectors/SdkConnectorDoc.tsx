'use client';

import React, { useState } from 'react';
import {
  BookOpen,
  Package,
  Code2,
  Layers,
  MessageSquare,
  Terminal,
  ShieldCheck,
  Volume2,
  Send,
} from 'lucide-react';

export const SdkConnectorDoc: React.FC = () => {
  const [subTab, setSubTab] = useState<'overview' | 'install' | 'js' | 'react' | 'chat' | 'examples'>('overview');
  const [demoInput, setDemoInput] = useState('Comment vérifier mon solde bancaire ?');
  const [demoLang, setDemoLang] = useState('ewo-CM');
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'assistant'; text: string; lang?: string }>>([
    { sender: 'assistant', text: "Mbɔ́lɔ́ ! Me ne ntsíngí yá sikóló mɔ́ni. Jé me ne wo kwálí ? (Bonjour ! Je suis l'assistant IA bancaire. En quoi puis-je vous aider ?)", lang: 'ewo-CM' },
  ]);

  const handleSendChat = () => {
    if (!demoInput.trim()) return;
    const userMsg = demoInput;
    setChatMessages((prev) => [...prev, { sender: 'user', text: userMsg }]);
    setDemoInput('');

    setTimeout(() => {
      let reply = 'Asú yá é bábán móni wóe : kóbɔ́ *150# ngé kele é nnam bancaire.';
      if (demoLang === 'fuv-CM') reply = 'Ngam hiwrude ceedee maada : doole a fiya *150# ko a yaha to banki.';
      if (demoLang === 'hau-CM') reply = 'Don duba kuɗin ku : danna *150# ko ku je banki.';
      if (demoLang === 'knc-CM') reply = 'Kubu kəla kura numba : danna *150# ra bankin gədi.';
      if (demoLang === 'pcm-CM') reply = 'To check your money wey remain : dial *150# or enter bank.';

      setChatMessages((prev) => [
        ...prev,
        { sender: 'assistant', text: reply, lang: demoLang },
      ]);
    }, 400);
  };

  const subTabs = [
    { id: 'overview', label: "Vue d'ensemble", icon: <BookOpen size={14} /> },
    { id: 'install', label: 'Installation', icon: <Package size={14} /> },
    { id: 'js', label: 'Client TypeScript / JS', icon: <Code2 size={14} /> },
    { id: 'react', label: 'Composants & Hooks React', icon: <Layers size={14} /> },
    { id: 'chat', label: 'Widget IA Bancaire', icon: <MessageSquare size={14} /> },
    { id: 'examples', label: 'Exemples Complets', icon: <Terminal size={14} /> },
  ] as const;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
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
              SDKs Client (JavaScript, TypeScript & React)
            </h2>
            <span
              className="ax-pill ax-pill--active"
              style={{
                fontSize: '10px',
                padding: '3px 8px',
              }}
            >
              @linguabridge/sdk-js & react
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
            Bibliothèques typées de production pour intégrer la traduction souveraine, la synthèse vocale et les composants conversationnels d'IA bancaire dans vos applications Web et React.
          </p>
        </div>
      </div>

      {/* Sub-tabs */}
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

      {/* Overview */}
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
              Une Suite Modulaire pour Développeurs Front & Fullstack
            </h4>
            <p
              style={{
                margin: 0,
                fontSize: '13px',
                color: 'var(--muted, rgba(10, 10, 10, 0.6))',
                lineHeight: 1.6,
              }}
            >
              Les SDKs LinguaBridge encapsulent toutes les subtilités des dialectes camerounais, de la mise en cache locale et de la protection financière zéro dérive. En quelques lignes de code, vous offrez à vos utilisateurs une expérience bancaire fluide dans leur langue maternelle.
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
                Type Safety Stricte
              </h5>
              <p
                style={{
                  margin: 0,
                  fontSize: '12px',
                  color: 'var(--muted, rgba(10, 10, 10, 0.6))',
                  lineHeight: 1.5,
                }}
              >
                Définitions TypeScript complètes (DTS) avec validation stricte des langues camerounaises certifiées.
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
                <Layers size={18} strokeWidth={2} />
              </div>
              <h5
                style={{
                  margin: '0 0 4px 0',
                  fontSize: '13.5px',
                  fontWeight: 700,
                  color: 'var(--ink, #0A0A0A)',
                }}
              >
                Composants React Clé en Main
              </h5>
              <p
                style={{
                  margin: 0,
                  fontSize: '12px',
                  color: 'var(--muted, rgba(10, 10, 10, 0.6))',
                  lineHeight: 1.5,
                }}
              >
                Composants <code>&lt;BankingChatWidget /&gt;</code> et <code>&lt;Translate /&gt;</code> prêts à brancher.
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
                Accompagnement Vocal Natif
              </h5>
              <p
                style={{
                  margin: 0,
                  fontSize: '12px',
                  color: 'var(--muted, rgba(10, 10, 10, 0.6))',
                  lineHeight: 1.5,
                }}
              >
                Hook <code>useSpeech()</code> gérant automatiquement la lecture audio africaine et le fallback Web Speech API.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Install */}
      {subTab === 'install' && (
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
              Gestionnaire de Paquets (pnpm / npm / yarn)
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
                margin: 0,
                lineHeight: 1.5,
              }}
            >
{`# Installation du client JavaScript / TypeScript
pnpm add @linguabridge/sdk-js

# Pour les applications React & Next.js
pnpm add @linguabridge/sdk-react`}
            </pre>
          </div>
        </div>
      )}

      {/* JS */}
      {subTab === 'js' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
{`import { LinguaBridgeClient } from '@linguabridge/sdk-js';

const client = new LinguaBridgeClient({
  baseUrl: 'http://localhost:3001',
  apiKey: process.env.LINGUABRIDGE_API_KEY
});

// Traduction financière sécurisée
const result = await client.translate({
  text: 'Solde de votre compte: 75 000 FCFA',
  targetLang: 'ewo-CM',
  domain: 'financial'
});

console.log('Traduction:', result.translatedText);
console.log('Zéro Dérive AST:', result.warnings.length === 0 ? 'Conforme' : 'Alerte');`}
          </pre>
        </div>
      )}

      {/* React */}
      {subTab === 'react' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
{`import React from 'react';
import { LinguaBridgeProvider, Translate } from '@linguabridge/sdk-react';

export default function App() {
  return (
    <LinguaBridgeProvider defaultLang="ewo-CM" baseUrl="http://localhost:3001">
      <div className="bank-card">
        <h3>
          <Translate text="Solde de votre compte bancaire" />
        </h3>
        <p className="amount">250 000 FCFA</p>
      </div>
    </LinguaBridgeProvider>
  );
}`}
          </pre>
        </div>
      )}

      {/* Chat */}
      {subTab === 'chat' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            style={{
              border: '1px solid var(--line, rgba(10, 10, 10, 0.12))',
              borderRadius: 'var(--radius, 4px)',
              padding: '16px',
              backgroundColor: 'var(--paper, #ffffff)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '4px',
                    backgroundColor: 'var(--green-soft, #E9F9EC)',
                    border: '1px solid rgba(18, 184, 42, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--green-deep, #08751A)',
                  }}
                >
                  <MessageSquare size={13} strokeWidth={2} />
                </div>
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: '13.5px',
                    color: 'var(--ink, #0A0A0A)',
                    fontFamily: 'var(--font-heading, "Manrope", sans-serif)',
                  }}
                >
                  Aperçu Live : Assistant Bancaire Multilingue
                </span>
              </div>
              <select
                value={demoLang}
                onChange={(e) => setDemoLang(e.target.value)}
                style={{
                  padding: '5px 10px',
                  borderRadius: 'var(--radius, 4px)',
                  border: '1px solid var(--line-strong, rgba(10, 10, 10, 0.32))',
                  fontSize: '12px',
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
            </div>

            <div
              style={{
                height: '220px',
                overflowY: 'auto',
                backgroundColor: 'var(--ws, #F6F6F4)',
                borderRadius: 'var(--radius, 4px)',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                border: '1px solid var(--line, rgba(10, 10, 10, 0.12))',
                marginBottom: '12px',
              }}
            >
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  style={{
                    alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                    backgroundColor: msg.sender === 'user' ? 'var(--ink, #0A0A0A)' : 'var(--paper, #ffffff)',
                    color: msg.sender === 'user' ? 'var(--paper, #ffffff)' : 'var(--ink, #0A0A0A)',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius, 4px)',
                    fontSize: '12px',
                    maxWidth: '85%',
                    border: msg.sender === 'user' ? 'none' : '1px solid var(--line, rgba(10, 10, 10, 0.12))',
                    lineHeight: 1.45,
                  }}
                >
                  {msg.text}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="Posez une question bancaire (ex: solde, virement)..."
                value={demoInput}
                onChange={(e) => setDemoInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: 'var(--radius, 4px)',
                  border: '1px solid var(--line-strong, rgba(10, 10, 10, 0.32))',
                  fontSize: '12.5px',
                  fontFamily: 'var(--font-body, sans-serif)',
                  backgroundColor: 'var(--paper, #ffffff)',
                  color: 'var(--ink, #0A0A0A)',
                }}
              />
              <button
                onClick={handleSendChat}
                className="btn btn-primary"
                style={{
                  padding: '7px 16px',
                  fontSize: '12px',
                  gap: '6px',
                  cursor: 'pointer',
                }}
              >
                <Send size={12} strokeWidth={2} />
                Envoyer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Examples */}
      {subTab === 'examples' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            style={{
              backgroundColor: 'var(--paper, #ffffff)',
              padding: '16px 18px',
              borderRadius: 'var(--radius, 4px)',
              border: '1px solid var(--line, rgba(10, 10, 10, 0.12))',
            }}
          >
            <h4
              style={{
                margin: '0 0 10px 0',
                fontSize: '13.5px',
                fontFamily: 'var(--font-heading, "Manrope", sans-serif)',
                fontWeight: 700,
                color: 'var(--ink, #0A0A0A)',
              }}
            >
              Intégration d'un Guichet Bancaire en Ligne (Next.js 14 App Router)
            </h4>
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
{`'use client';
import { BankingChatWidget } from '@linguabridge/sdk-react';

export default function BankPortalPage() {
  return (
    <main className="p-8">
      <h1>E-Banking Camerounais</h1>
      <BankingChatWidget
        defaultLocale="ewo-CM"
        supportedLocales={['ewo-CM', 'fuv-CM', 'hau-CM', 'knc-CM', 'pcm-CM']}
        voiceEnabled={true}
        onTransactionAction={(action) => console.log('Action bancaire:', action)}
      />
    </main>
  );
}`}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
