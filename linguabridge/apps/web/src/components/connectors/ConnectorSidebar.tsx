'use client';

import React from 'react';

export type ConnectorTab =
  | 'api'
  | 'mcp'
  | 'plugin'
  | 'sdk'
  | 'webhooks'
  | 'cli'
  | 'apikeys'
  | 'analytics'
  | 'packs';

interface ConnectorSidebarProps {
  activeTab: ConnectorTab;
  onSelectTab: (tab: ConnectorTab) => void;
  apiHealth?: 'healthy' | 'degraded' | 'offline';
  dbHealth?: 'connected' | 'error';
}

export const ConnectorSidebar: React.FC<ConnectorSidebarProps> = ({
  activeTab,
  onSelectTab,
  apiHealth = 'healthy',
  dbHealth = 'connected',
}) => {
  const connectorItems = [
    {
      id: 'api' as ConnectorTab,
      label: 'Passerelle REST API',
      badge: 'v1 / OpenAPI',
      icon: '🚀',
      desc: 'Accès intégral : Traduction, Voix TTS, AST Guard & Langues',
    },
    {
      id: 'mcp' as ConnectorTab,
      label: 'Serveur MCP',
      badge: 'Cursor / Claude',
      icon: '🤖',
      desc: 'Outils natifs & Synthèse vocale pour assistants IA',
    },
    {
      id: 'plugin' as ConnectorTab,
      label: 'Extension Chrome MV3',
      badge: 'Web Banking',
      icon: '🧩',
      desc: 'Hover-to-Speak 220ms & Traduction DOM complète',
    },
    {
      id: 'sdk' as ConnectorTab,
      label: 'SDKs JavaScript & React',
      badge: 'TS / UI Kit',
      icon: '📦',
      desc: 'Client unifié, Chat IA Bancaire & Hooks React',
    },
    {
      id: 'webhooks' as ConnectorTab,
      label: 'Webhooks & Événements',
      badge: 'HMAC-SHA256',
      icon: '⚡',
      desc: 'Flux transactionnels bancaires signés & traçabilité',
    },
    {
      id: 'cli' as ConnectorTab,
      label: 'Développeur CLI (lb)',
      badge: 'Terminal',
      icon: '💻',
      desc: 'Vérification zéro dérive, audit & simulation',
    },
  ];

  const governanceItems = [
    {
      id: 'apikeys' as ConnectorTab,
      label: 'Clés d\'API & Base de Données',
      badge: 'Supabase',
      icon: '🔑',
      desc: 'Gestion des credentials & pooler PostgreSQL',
    },
    {
      id: 'analytics' as ConnectorTab,
      label: 'TM Analytics & Performance',
      badge: 'Sub-ms Cache',
      icon: '📊',
      desc: 'Débit, latence et taux de réutilisation TM',
    },
    {
      id: 'packs' as ConnectorTab,
      label: 'Language Pack Governance',
      badge: '5 Souverains',
      icon: '🛡️',
      desc: 'Ewondo, Fulfulde, Haoussa, Kanuri, Pidgin',
    },
  ];

  return (
    <aside
      style={{
        width: '300px',
        minWidth: '300px',
        backgroundColor: '#ffffff',
        borderRight: '1px solid #e2e8f0',
        padding: '24px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        boxSizing: 'border-box',
      }}
    >
      {/* Brand & Infrastructure Status */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span style={{ fontSize: '20px' }}>🌍</span>
          <span style={{ fontWeight: 800, fontSize: '15px', color: '#0f172a', letterSpacing: '-0.3px' }}>
            LINGUABRIDGE
          </span>
          <span
            style={{
              fontSize: '10px',
              fontWeight: 700,
              backgroundColor: '#dcfce7',
              color: '#15803d',
              padding: '2px 6px',
              borderRadius: '4px',
              textTransform: 'uppercase',
            }}
          >
            Souverain
          </span>
        </div>
        <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
          Portail Développeur & Connecteurs
        </p>

        {/* Live Pill Status */}
        <div
          style={{
            marginTop: '12px',
            padding: '8px 12px',
            backgroundColor: '#f8fafc',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            fontSize: '11px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#64748b' }}>API Fastify :</span>
            <span style={{ fontWeight: 700, color: apiHealth === 'healthy' ? '#16a34a' : '#dc2626' }}>
              ● {apiHealth === 'healthy' ? 'Port 3001 (Actif)' : 'Hors-ligne'}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#64748b' }}>Base Supabase :</span>
            <span style={{ fontWeight: 700, color: dbHealth === 'connected' ? '#16a34a' : '#dc2626' }}>
              ● {dbHealth === 'connected' ? 'PostgreSQL (OK)' : 'Erreur'}
            </span>
          </div>
        </div>
      </div>

      {/* Group 1: External Connectors */}
      <div>
        <div
          style={{
            fontSize: '11px',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.8px',
            color: '#94a3b8',
            marginBottom: '10px',
            paddingLeft: '8px',
          }}
        >
          Connecteurs Externes
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {connectorItems.map((item) => {
            const isSelected = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className="btn"
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  width: '100%',
                  textAlign: 'left',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  backgroundColor: isSelected ? '#f0fdf4' : 'transparent',
                  border: isSelected ? '1px solid #bbf7d0' : '1px solid transparent',
                  borderLeft: isSelected ? '4px solid #16a34a' : '4px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <span style={{ fontSize: '18px', lineHeight: 1, marginTop: '2px' }}>{item.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span
                      style={{
                        fontWeight: isSelected ? 700 : 600,
                        fontSize: '13px',
                        color: isSelected ? '#15803d' : '#1e293b',
                      }}
                    >
                      {item.label}
                    </span>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 600,
                        backgroundColor: isSelected ? '#dcfce7' : '#f1f5f9',
                        color: isSelected ? '#166534' : '#64748b',
                        padding: '1px 5px',
                        borderRadius: '4px',
                      }}
                    >
                      {item.badge}
                    </span>
                  </div>
                  <p
                    style={{
                      margin: '2px 0 0 0',
                      fontSize: '11px',
                      color: isSelected ? '#166534' : '#64748b',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {item.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Group 2: Governance & Platform */}
      <div>
        <div
          style={{
            fontSize: '11px',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.8px',
            color: '#94a3b8',
            marginBottom: '10px',
            paddingLeft: '8px',
          }}
        >
          Gouvernance & Moteur
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {governanceItems.map((item) => {
            const isSelected = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className="btn"
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  width: '100%',
                  textAlign: 'left',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  backgroundColor: isSelected ? '#f0fdf4' : 'transparent',
                  border: isSelected ? '1px solid #bbf7d0' : '1px solid transparent',
                  borderLeft: isSelected ? '4px solid #16a34a' : '4px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <span style={{ fontSize: '18px', lineHeight: 1, marginTop: '2px' }}>{item.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span
                      style={{
                        fontWeight: isSelected ? 700 : 600,
                        fontSize: '13px',
                        color: isSelected ? '#15803d' : '#1e293b',
                      }}
                    >
                      {item.label}
                    </span>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 600,
                        backgroundColor: isSelected ? '#dcfce7' : '#f1f5f9',
                        color: isSelected ? '#166534' : '#64748b',
                        padding: '1px 5px',
                        borderRadius: '4px',
                      }}
                    >
                      {item.badge}
                    </span>
                  </div>
                  <p
                    style={{
                      margin: '2px 0 0 0',
                      fontSize: '11px',
                      color: isSelected ? '#166534' : '#64748b',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {item.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};
