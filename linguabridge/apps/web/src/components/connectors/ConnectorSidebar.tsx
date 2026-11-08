'use client';

import React from 'react';
import {
  Globe,
  Radio,
  Bot,
  Puzzle,
  Package,
  Zap,
  Terminal,
  Key,
  BarChart3,
  ShieldCheck,
  Server,
  Database,
} from 'lucide-react';

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
  const connectorItems: Array<{
    id: ConnectorTab;
    label: string;
    badge: string;
    icon: React.ReactNode;
    desc: string;
  }> = [
    {
      id: 'api',
      label: 'Passerelle REST API',
      badge: 'v1 / OpenAPI',
      icon: <Radio size={16} strokeWidth={2} />,
      desc: 'Accès intégral : Traduction, Voix TTS, AST Guard & Langues',
    },
    {
      id: 'mcp',
      label: 'Serveur MCP',
      badge: 'Cursor / Claude',
      icon: <Bot size={16} strokeWidth={2} />,
      desc: 'Outils natifs & Synthèse vocale pour assistants IA',
    },
    {
      id: 'plugin',
      label: 'Extension Chrome MV3',
      badge: 'Web Banking',
      icon: <Puzzle size={16} strokeWidth={2} />,
      desc: 'Hover-to-Speak 220ms & Traduction DOM complète',
    },
    {
      id: 'sdk',
      label: 'SDKs JavaScript & React',
      badge: 'TS / UI Kit',
      icon: <Package size={16} strokeWidth={2} />,
      desc: 'Client unifié, Chat IA Bancaire & Hooks React',
    },
    {
      id: 'webhooks',
      label: 'Webhooks & Événements',
      badge: 'HMAC-SHA256',
      icon: <Zap size={16} strokeWidth={2} />,
      desc: 'Flux transactionnels bancaires signés & traçabilité',
    },
    {
      id: 'cli',
      label: 'Développeur CLI (lb)',
      badge: 'Terminal',
      icon: <Terminal size={16} strokeWidth={2} />,
      desc: 'Vérification zéro dérive, audit & simulation',
    },
  ];

  const governanceItems: Array<{
    id: ConnectorTab;
    label: string;
    badge: string;
    icon: React.ReactNode;
    desc: string;
  }> = [
    {
      id: 'apikeys',
      label: "Clés d'API & Base de Données",
      badge: 'Supabase',
      icon: <Key size={16} strokeWidth={2} />,
      desc: 'Gestion des credentials & pooler PostgreSQL',
    },
    {
      id: 'analytics',
      label: 'TM Analytics & Performance',
      badge: 'Sub-ms Cache',
      icon: <BarChart3 size={16} strokeWidth={2} />,
      desc: 'Débit, latence et taux de réutilisation TM',
    },
    {
      id: 'packs',
      label: 'Language Pack Governance',
      badge: '5 Souverains',
      icon: <ShieldCheck size={16} strokeWidth={2} />,
      desc: 'Ewondo, Fulfulde, Haoussa, Kanuri, Pidgin',
    },
  ];

  return (
    <aside
      style={{
        width: '300px',
        minWidth: '300px',
        backgroundColor: 'var(--paper, #ffffff)',
        borderRight: '1px solid var(--line, rgba(10, 10, 10, 0.12))',
        padding: '24px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        boxSizing: 'border-box',
      }}
    >
      {/* Brand & Infrastructure Status */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
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
            <Globe size={14} strokeWidth={2.2} />
          </div>
          <span
            style={{
              fontFamily: 'var(--font-heading, "Manrope", sans-serif)',
              fontWeight: 800,
              fontSize: '14px',
              color: 'var(--ink, #0A0A0A)',
              letterSpacing: '-0.02em',
            }}
          >
            LINGUABRIDGE
          </span>
          <span
            className="ax-pill ax-pill--active"
            style={{
              fontSize: '9px',
              padding: '2px 6px',
              letterSpacing: '0.14em',
            }}
          >
            Souverain
          </span>
        </div>
        <p
          style={{
            margin: 0,
            fontSize: '12px',
            color: 'var(--muted, rgba(10, 10, 10, 0.6))',
            lineHeight: 1.4,
          }}
        >
          Portail Développeur & Connecteurs
        </p>

        {/* Live Pill Status */}
        <div
          style={{
            marginTop: '14px',
            padding: '10px 12px',
            backgroundColor: 'var(--ws, #F6F6F4)',
            borderRadius: 'var(--radius, 4px)',
            border: '1px solid var(--line, rgba(10, 10, 10, 0.12))',
            fontSize: '11px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                color: 'var(--muted, rgba(10, 10, 10, 0.6))',
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '10px',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              <Server size={11} /> API Fastify
            </span>
            <span
              style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontWeight: 600,
                fontSize: '11px',
                color: apiHealth === 'healthy' ? 'var(--green-deep, #08751A)' : '#dc2626',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: apiHealth === 'healthy' ? 'var(--green, #12B82A)' : '#dc2626',
                  display: 'inline-block',
                }}
              />
              {apiHealth === 'healthy' ? 'Port 3001 (Actif)' : 'Hors-ligne'}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                color: 'var(--muted, rgba(10, 10, 10, 0.6))',
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '10px',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              <Database size={11} /> Base Supabase
            </span>
            <span
              style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontWeight: 600,
                fontSize: '11px',
                color: dbHealth === 'connected' ? 'var(--green-deep, #08751A)' : '#dc2626',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: dbHealth === 'connected' ? 'var(--green, #12B82A)' : '#dc2626',
                  display: 'inline-block',
                }}
              />
              {dbHealth === 'connected' ? 'PostgreSQL (OK)' : 'Erreur'}
            </span>
          </div>
        </div>
      </div>

      {/* Group 1: External Connectors */}
      <div>
        <div
          style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: '10px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.14em',
            color: 'var(--muted, rgba(10, 10, 10, 0.6))',
            marginBottom: '10px',
            paddingLeft: '6px',
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
                  padding: '10px 10px',
                  borderRadius: 'var(--radius, 4px)',
                  backgroundColor: isSelected ? 'var(--green-soft, #E9F9EC)' : 'transparent',
                  border: isSelected
                    ? '1px solid rgba(18, 184, 42, 0.25)'
                    : '1px solid transparent',
                  borderLeft: isSelected
                    ? '3px solid var(--green, #12B82A)'
                    : '3px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.15s var(--easing, ease)',
                  boxSizing: 'border-box',
                }}
              >
                <div
                  style={{
                    color: isSelected
                      ? 'var(--green-deep, #08751A)'
                      : 'var(--muted, rgba(10, 10, 10, 0.6))',
                    marginTop: '2px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {item.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '4px',
                    }}
                  >
                    <span
                      style={{
                        fontWeight: isSelected ? 700 : 600,
                        fontSize: '12.5px',
                        color: isSelected
                          ? 'var(--green-deep, #08751A)'
                          : 'var(--ink, #0A0A0A)',
                        letterSpacing: '-0.01em',
                      }}
                    >
                      {item.label}
                    </span>
                    <span
                      style={{
                        fontSize: '9.5px',
                        fontFamily: 'var(--font-mono, monospace)',
                        fontWeight: 600,
                        backgroundColor: isSelected
                          ? 'rgba(18, 184, 42, 0.15)'
                          : 'var(--ws-2, #EFEFEA)',
                        color: isSelected
                          ? 'var(--green-deep, #08751A)'
                          : 'var(--muted, rgba(10, 10, 10, 0.6))',
                        padding: '1px 5px',
                        borderRadius: 'var(--radius-xs, 2px)',
                        letterSpacing: '0.04em',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item.badge}
                    </span>
                  </div>
                  <p
                    style={{
                      margin: '2px 0 0 0',
                      fontSize: '10.5px',
                      color: isSelected
                        ? 'var(--green-deep, #08751A)'
                        : 'var(--muted, rgba(10, 10, 10, 0.6))',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      lineHeight: 1.35,
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
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: '10px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.14em',
            color: 'var(--muted, rgba(10, 10, 10, 0.6))',
            marginBottom: '10px',
            paddingLeft: '6px',
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
                  padding: '10px 10px',
                  borderRadius: 'var(--radius, 4px)',
                  backgroundColor: isSelected ? 'var(--green-soft, #E9F9EC)' : 'transparent',
                  border: isSelected
                    ? '1px solid rgba(18, 184, 42, 0.25)'
                    : '1px solid transparent',
                  borderLeft: isSelected
                    ? '3px solid var(--green, #12B82A)'
                    : '3px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.15s var(--easing, ease)',
                  boxSizing: 'border-box',
                }}
              >
                <div
                  style={{
                    color: isSelected
                      ? 'var(--green-deep, #08751A)'
                      : 'var(--muted, rgba(10, 10, 10, 0.6))',
                    marginTop: '2px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {item.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '4px',
                    }}
                  >
                    <span
                      style={{
                        fontWeight: isSelected ? 700 : 600,
                        fontSize: '12.5px',
                        color: isSelected
                          ? 'var(--green-deep, #08751A)'
                          : 'var(--ink, #0A0A0A)',
                        letterSpacing: '-0.01em',
                      }}
                    >
                      {item.label}
                    </span>
                    <span
                      style={{
                        fontSize: '9.5px',
                        fontFamily: 'var(--font-mono, monospace)',
                        fontWeight: 600,
                        backgroundColor: isSelected
                          ? 'rgba(18, 184, 42, 0.15)'
                          : 'var(--ws-2, #EFEFEA)',
                        color: isSelected
                          ? 'var(--green-deep, #08751A)'
                          : 'var(--muted, rgba(10, 10, 10, 0.6))',
                        padding: '1px 5px',
                        borderRadius: 'var(--radius-xs, 2px)',
                        letterSpacing: '0.04em',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item.badge}
                    </span>
                  </div>
                  <p
                    style={{
                      margin: '2px 0 0 0',
                      fontSize: '10.5px',
                      color: isSelected
                        ? 'var(--green-deep, #08751A)'
                        : 'var(--muted, rgba(10, 10, 10, 0.6))',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      lineHeight: 1.35,
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
