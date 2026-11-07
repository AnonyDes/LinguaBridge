'use client';

import React, { useState } from 'react';

export const SdkConnectorDoc: React.FC = () => {
  const [subTab, setSubTab] = useState<'overview' | 'install' | 'js' | 'react' | 'chat' | 'examples'>('overview');
  const [demoInput, setDemoInput] = useState('Comment vérifier mon solde bancaire ?');
  const [demoLang, setDemoLang] = useState('ewo-CM');
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'assistant'; text: string; lang?: string }>>([
    { sender: 'assistant', text: 'Mbɔ́lɔ́ ! Me ne ntsíngí yá sikóló mɔ́ni. Jé me ne wo kwálí ? (Bonjour ! Je suis l\'assistant IA bancaire. En quoi puis-je vous aider ?)', lang: 'ewo-CM' },
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div
        style={{
          borderBottom: '1px solid #e2e8f0',
          paddingBottom: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              SDKs Client (JavaScript, TypeScript & React)
            </h2>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                backgroundColor: '#dcfce7',
                color: '#15803d',
                padding: '3px 8px',
                borderRadius: '6px',
              }}
            >
              @linguabridge/sdk-js & react
            </span>
          </div>
          <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: '#64748b' }}>
            Bibliothèques typées de production pour intégrer la traduction souveraine, la synthèse vocale et les composants conversationnels d'IA bancaire dans vos applications Web et React.
          </p>
        </div>
      </div>

      {/* Sub-tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '1px solid #e2e8f0',
          paddingBottom: '2px',
        }}
      >
        {[
          { id: 'overview', label: '📖 Vue d\'ensemble' },
          { id: 'install', label: '📦 Installation' },
          { id: 'js', label: '⚡ Client TypeScript / JS' },
          { id: 'react', label: '⚛️ Composants & Hooks React' },
          { id: 'chat', label: '💬 Widget IA Bancaire' },
          { id: 'examples', label: '💻 Exemples Complets' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSubTab(tab.id as any)}
            className="btn"
            style={{
              padding: '8px 14px',
              borderRadius: '6px 6px 0 0',
              borderBottom: subTab === tab.id ? '2px solid #16a34a' : '2px solid transparent',
              color: subTab === tab.id ? '#15803d' : '#64748b',
              fontWeight: subTab === tab.id ? 700 : 500,
              fontSize: '13px',
              cursor: 'pointer',
              background: 'transparent',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {subTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '15px', color: '#0f172a' }}>
              Une Suite Modulaire pour Développeurs Front & Fullstack
            </h4>
            <p style={{ margin: 0, fontSize: '13px', color: '#475569', lineHeight: 1.6 }}>
              Les SDKs LinguaBridge encapsulent toutes les subtilités des dialectes camerounais, de la mise en cache locale et de la protection financière zéro dérive. En quelques lignes de code, vous offrez à vos utilisateurs une expérience bancaire fluide dans leur langue maternelle.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', backgroundColor: '#ffffff' }}>
              <span style={{ fontSize: '24px' }}>🛡️</span>
              <h5 style={{ margin: '8px 0 4px 0', fontSize: '14px', color: '#0f172a' }}>Type Safety Stricte</h5>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748b', lineHeight: 1.5 }}>
                Définitions TypeScript complètes (DTS) avec validation stricte des langues camerounaises certifiées.
              </p>
            </div>
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', backgroundColor: '#ffffff' }}>
              <span style={{ fontSize: '24px' }}>⚛️</span>
              <h5 style={{ margin: '8px 0 4px 0', fontSize: '14px', color: '#0f172a' }}>Composants React Clé en Main</h5>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748b', lineHeight: 1.5 }}>
                Composants <code>&lt;BankingChatWidget /&gt;</code> et <code>&lt;Translate /&gt;</code> prêts à brancher.
              </p>
            </div>
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', backgroundColor: '#ffffff' }}>
              <span style={{ fontSize: '24px' }}>🔊</span>
              <h5 style={{ margin: '8px 0 4px 0', fontSize: '14px', color: '#0f172a' }}>Accompagnement Vocal Natif</h5>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748b', lineHeight: 1.5 }}>
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
            <h5 style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#0f172a' }}>Gestionnaire de Paquets (pnpm / npm / yarn)</h5>
            <pre
              style={{
                backgroundColor: '#0f172a',
                color: '#f8fafc',
                padding: '14px',
                borderRadius: '8px',
                fontSize: '12px',
                margin: 0,
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
              backgroundColor: '#0f172a',
              color: '#f8fafc',
              padding: '14px',
              borderRadius: '8px',
              fontSize: '12px',
              overflowX: 'auto',
              margin: 0,
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
              backgroundColor: '#0f172a',
              color: '#f8fafc',
              padding: '14px',
              borderRadius: '8px',
              fontSize: '12px',
              overflowX: 'auto',
              margin: 0,
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
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', backgroundColor: '#ffffff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>💬</span>
                <span style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>
                  Aperçu Live : Assistant Bancaire Multilingue
                </span>
              </div>
              <select
                value={demoLang}
                onChange={(e) => setDemoLang(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
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
                backgroundColor: '#f8fafc',
                borderRadius: '6px',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                border: '1px solid #e2e8f0',
                marginBottom: '12px',
              }}
            >
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  style={{
                    alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                    backgroundColor: msg.sender === 'user' ? '#16a34a' : '#ffffff',
                    color: msg.sender === 'user' ? '#ffffff' : '#0f172a',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    maxWidth: '85%',
                    border: msg.sender === 'user' ? 'none' : '1px solid #e2e8f0',
                    lineHeight: 1.4,
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
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '12px',
                }}
              />
              <button
                onClick={handleSendChat}
                className="btn"
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#16a34a',
                  color: '#ffffff',
                  borderRadius: '6px',
                  fontWeight: 700,
                  fontSize: '12px',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Envoyer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Examples */}
      {subTab === 'examples' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#0f172a' }}>
              Intégration d'un Guichet Bancaire en Ligne (Next.js 14 App Router)
            </h4>
            <pre
              style={{
                backgroundColor: '#0f172a',
                color: '#f8fafc',
                padding: '14px',
                borderRadius: '8px',
                fontSize: '12px',
                overflowX: 'auto',
                margin: 0,
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
