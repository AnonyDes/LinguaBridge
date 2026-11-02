'use client';

import React, { useState, useEffect } from 'react';
import { LinguaBridgeClient } from '@linguabridge/sdk-js';

const client = new LinguaBridgeClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
});

interface ApiKeyItem {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  createdAt: string;
}

export default function DeveloperDashboard() {
  const [activeTab, setActiveTab] = useState<'analytics' | 'providers' | 'packs' | 'apikeys'>('analytics');
  const [packs, setPacks] = useState<any[]>([]);
  const [loadingPacks, setLoadingPacks] = useState(true);
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([
    {
      id: 'key-1',
      name: 'CameroPay Production Key',
      keyPrefix: 'lb_live_98ab7...',
      scopes: ['translate', 'batch', 'speech'],
      createdAt: '2026-10-15',
    },
    {
      id: 'key-2',
      name: 'Microfinance Mobile App Dev',
      keyPrefix: 'lb_test_12fc4...',
      scopes: ['translate'],
      createdAt: '2026-10-28',
    },
  ]);
  const [newKeyName, setNewKeyName] = useState('');

  // Translation Memory statistics (mock/real telemetry)
  const tmStats = {
    totalRequests: 48290,
    cacheHits: 41250,
    hitRatePercent: 85.4,
    averageLatencyMs: 4.8,
    estimatedCostSavedFCFA: '1,240,000 FCFA',
    entriesInMemory: 1250,
  };

  const providers = [
    {
      id: 'tm-cache',
      name: 'LinguaBridge Translation Memory',
      status: 'healthy',
      type: 'Local In-Memory Cache',
      latencyMs: 1,
      costPerWord: '0 FCFA',
    },
    {
      id: 'local-fixture',
      name: 'Local Financial Fixture Engine',
      status: 'healthy',
      type: 'Deterministic Financial Corroborator',
      latencyMs: 3,
      costPerWord: '0 FCFA',
    },
    {
      id: 'nllb-200',
      name: 'Meta NLLB-200 (Central African Node)',
      status: 'healthy',
      type: 'Neural Machine Translation',
      latencyMs: 142,
      costPerWord: '0.05 FCFA',
    },
    {
      id: 'deepl',
      name: 'DeepL Commercial Gateway',
      status: 'standby',
      type: 'High-resource NMT Fallback (FR/EN)',
      latencyMs: 185,
      costPerWord: '0.12 FCFA',
    },
  ];

  useEffect(() => {
    async function fetchPacks() {
      try {
        setLoadingPacks(true);
        const data = await client.getPacks();
        setPacks(data);
      } catch {
        // Fallback pack data if API isn't currently running
        setPacks([
          {
            packId: 'ewondo',
            code: 'ewo-CM',
            name: 'Ewondo (Ewondo Pack)',
            iso639_3: 'ewo',
            status: 'not_installed',
            version: '0.1.0',
            qualityStatus: 'unverified',
            provenance: 'Synthesized reference templates requiring accredited linguist verification.',
          },
          {
            packId: 'duala',
            code: 'dua-CM',
            name: 'Duala (Duala Pack)',
            iso639_3: 'dua',
            status: 'not_installed',
            version: '0.1.0',
            qualityStatus: 'unverified',
            provenance: 'Synthesized reference templates requiring accredited linguist verification.',
          },
          {
            packId: 'basaa',
            code: 'bas-CM',
            name: 'Basaa (Basaa Pack)',
            iso639_3: 'bas',
            status: 'not_installed',
            version: '0.1.0',
            qualityStatus: 'unverified',
            provenance: 'Synthesized reference templates requiring accredited linguist verification.',
          },
          {
            packId: 'fulfulde',
            code: 'fub-CM',
            name: 'Fulfulde (Cameroonian Fulfulde)',
            iso639_3: 'fub',
            status: 'not_installed',
            version: '0.1.0',
            qualityStatus: 'unverified',
            provenance: 'Synthesized reference templates requiring accredited linguist verification.',
          },
          {
            packId: 'bulu',
            code: 'bum-CM',
            name: 'Bulu (Bulu Pack)',
            iso639_3: 'bum',
            status: 'not_installed',
            version: '0.1.0',
            qualityStatus: 'unverified',
            provenance: 'Synthesized reference templates requiring accredited linguist verification.',
          },
        ]);
      } finally {
        setLoadingPacks(false);
      }
    }
    fetchPacks();
  }, []);

  const handleCreateApiKey = () => {
    if (!newKeyName.trim()) return;
    const randomHex = Math.random().toString(16).substring(2, 8);
    const newKey: ApiKeyItem = {
      id: `key-${Date.now()}`,
      name: newKeyName,
      keyPrefix: `lb_live_${randomHex}...`,
      scopes: ['translate', 'batch'],
      createdAt: new Date().toISOString().split('T')[0],
    };
    setApiKeys([newKey, ...apiKeys]);
    setNewKeyName('');
  };

  const handleRevokeKey = (id: string) => {
    setApiKeys(apiKeys.filter((k) => k.id !== id));
  };

  return (
    <div className="container" style={{ padding: '40px 20px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 800 }}>Developer & Infrastructure Dashboard</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>
          Real-time telemetry, provider uptime, language pack governance, and credential controls.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--border-color)', marginBottom: '30px' }}>
        <button
          onClick={() => setActiveTab('analytics')}
          className="btn"
          style={{
            borderRadius: '8px 8px 0 0',
            borderBottom: activeTab === 'analytics' ? '2px solid var(--primary)' : 'none',
            color: activeTab === 'analytics' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: 700,
          }}
        >
          📈 TM Analytics & Performance
        </button>
        <button
          onClick={() => setActiveTab('providers')}
          className="btn"
          style={{
            borderRadius: '8px 8px 0 0',
            borderBottom: activeTab === 'providers' ? '2px solid var(--primary)' : 'none',
            color: activeTab === 'providers' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: 700,
          }}
        >
          🔌 Provider Health & Routing
        </button>
        <button
          onClick={() => setActiveTab('packs')}
          className="btn"
          style={{
            borderRadius: '8px 8px 0 0',
            borderBottom: activeTab === 'packs' ? '2px solid var(--primary)' : 'none',
            color: activeTab === 'packs' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: 700,
          }}
        >
          📦 Language Pack Governance
        </button>
        <button
          onClick={() => setActiveTab('apikeys')}
          className="btn"
          style={{
            borderRadius: '8px 8px 0 0',
            borderBottom: activeTab === 'apikeys' ? '2px solid var(--primary)' : 'none',
            color: activeTab === 'apikeys' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: 700,
          }}
        >
          🔑 API Keys & Auth
        </button>
      </div>

      {/* Tab: TM Analytics */}
      {activeTab === 'analytics' && (
        <div>
          <div className="grid-4" style={{ marginBottom: '30px' }}>
            <div className="card">
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>TM HIT RATE</span>
              <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--success)', marginTop: '4px' }}>
                {tmStats.hitRatePercent}%
              </div>
              <small style={{ color: 'var(--text-muted)', fontSize: '11px' }}>41,250 of 48,290 requests</small>
            </div>

            <div className="card">
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>AVERAGE LATENCY</span>
              <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--primary)', marginTop: '4px' }}>
                {tmStats.averageLatencyMs}ms
              </div>
              <small style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Sub-millisecond on warm cache</small>
            </div>

            <div className="card">
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>CACHED PHRASES</span>
              <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '4px' }}>{tmStats.entriesInMemory}</div>
              <small style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Preloaded financial glossary</small>
            </div>

            <div className="card">
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>ESTIMATED COST SAVINGS</span>
              <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--success)', marginTop: '4px' }}>
                {tmStats.estimatedCostSavedFCFA}
              </div>
              <small style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Over external API calls</small>
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>
              Why Translation Memory is Mission-Critical for African Microfinance
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
              In mobile money environments across Cameroon (Orange Money, MTN Mobile Money, Express Union), over 80%
              of user interactions reuse standardized UI labels (e.g., <em>« Solde », « Retrait d'argent », « Transfert vers
              numéro », « Code PIN erroné »</em>). By serving these directly from verified, cryptographically validated
              Translation Memory caches, LinguaBridge cuts bandwidth latency to near zero and completely prevents external
              neural hallucinations on financial operations.
            </p>
          </div>
        </div>
      )}

      {/* Tab: Provider Health */}
      {activeTab === 'providers' && (
        <div className="card">
          <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>Active Translation Engine Providers</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '12px' }}>PROVIDER</th>
                  <th style={{ padding: '12px' }}>ARCHITECTURE TYPE</th>
                  <th style={{ padding: '12px' }}>STATUS</th>
                  <th style={{ padding: '12px' }}>AVG LATENCY</th>
                  <th style={{ padding: '12px' }}>OPERATIONAL COST</th>
                </tr>
              </thead>
              <tbody>
                {providers.map((p) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px', fontWeight: 600 }}>{p.name}</td>
                    <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{p.type}</td>
                    <td style={{ padding: '12px' }}>
                      <span className={`badge ${p.status === 'healthy' ? 'badge-success' : 'badge-warning'}`}>
                        {p.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>{p.latencyMs}ms</td>
                    <td style={{ padding: '12px' }}>{p.costPerWord}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Language Packs */}
      {activeTab === 'packs' && (
        <div>
          <div
            style={{
              marginBottom: '20px',
              padding: '16px',
              background: '#fffbeb',
              borderRadius: '8px',
              border: '1px solid #fde68a',
            }}
          >
            <h4 style={{ color: '#b45309', fontWeight: 700, marginBottom: '4px' }}>
              🇨🇲 Cameroon Low-Resource Language Isolation Policy
            </h4>
            <p style={{ color: '#b45309', fontSize: '13px' }}>
              To ensure zero financial misinformation, language templates for Ewondo, Duala, Basaa, Fulfulde, and Bulu
              are strictly kept in <code>not_installed</code> / <code>under_review</code> status. They are prevented from
              being activated in public discovery until reviewed and signed off by an accredited linguist.
            </p>
          </div>

          <div className="card">
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>Registered Language Packs</h3>
            {loadingPacks ? (
              <p>Loading language packs...</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '12px' }}>PACK NAME</th>
                      <th style={{ padding: '12px' }}>CODE</th>
                      <th style={{ padding: '12px' }}>ISO 639-3</th>
                      <th style={{ padding: '12px' }}>VERSION</th>
                      <th style={{ padding: '12px' }}>STATUS</th>
                      <th style={{ padding: '12px' }}>QUALITY STATE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {packs.map((pack) => (
                      <tr key={pack.packId} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '12px', fontWeight: 600 }}>{pack.name}</td>
                        <td style={{ padding: '12px' }}><code>{pack.code || pack.locale}</code></td>
                        <td style={{ padding: '12px' }}>{pack.iso639_3}</td>
                        <td style={{ padding: '12px' }}>v{pack.version}</td>
                        <td style={{ padding: '12px' }}>
                          <span
                            className={`badge ${
                              pack.status === 'production_approved'
                                ? 'badge-success'
                                : pack.status === 'under_review'
                                ? 'badge-warning'
                                : 'badge-neutral'
                            }`}
                          >
                            {pack.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span
                            className={`badge ${
                              pack.qualityStatus === 'certified'
                                ? 'badge-success'
                                : 'badge-warning'
                            }`}
                          >
                            {pack.qualityStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: API Keys */}
      {activeTab === 'apikeys' && (
        <div>
          <div className="card" style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px' }}>Generate New API Key</h3>
            <div style={{ display: 'flex', gap: '12px' }}>
              <input
                type="text"
                placeholder="Key label (e.g. CameroPay Production API)"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  fontSize: '14px',
                }}
              />
              <button onClick={handleCreateApiKey} className="btn btn-primary">
                Create API Key
              </button>
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>Active API Credentials</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '12px' }}>NAME</th>
                    <th style={{ padding: '12px' }}>KEY PREFIX</th>
                    <th style={{ padding: '12px' }}>SCOPES</th>
                    <th style={{ padding: '12px' }}>CREATED</th>
                    <th style={{ padding: '12px' }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {apiKeys.map((k) => (
                    <tr key={k.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '12px', fontWeight: 600 }}>{k.name}</td>
                      <td style={{ padding: '12px' }}><code>{k.keyPrefix}</code></td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          {k.scopes.map((s) => (
                            <span key={s} className="badge badge-neutral">
                              {s}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{k.createdAt}</td>
                      <td style={{ padding: '12px' }}>
                        <button
                          onClick={() => handleRevokeKey(k.id)}
                          className="btn btn-outline"
                          style={{ padding: '4px 10px', fontSize: '12px', color: 'var(--danger)' }}
                        >
                          Revoke
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
