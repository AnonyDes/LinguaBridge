'use client';

import React, { useState } from 'react';
import {
  BookOpen,
  Settings,
  Wrench,
  FlaskConical,
  Cable,
  ShieldCheck,
  Volume2,
  Layers,
  Play,
} from 'lucide-react';

export const McpConnectorDoc: React.FC = () => {
  const [subTab, setSubTab] = useState<'overview' | 'config' | 'tools' | 'console' | 'transports'>('overview');
  const [selectedClient, setSelectedClient] = useState<'cursor' | 'claude' | 'antigravity'>('cursor');

  // MCP Tester State
  const [selectedTool, setSelectedTool] = useState<'translate' | 'speech' | 'verify' | 'glossary' | 'languages'>('speech');
  const [textParam, setTextParam] = useState("Móni m'ékabedá: 50 000 FCFA");
  const [langParam, setLangParam] = useState('ewo-CM');
  const [mcpResult, setMcpResult] = useState<any>(null);

  const handleTestMcp = () => {
    if (selectedTool === 'speech') {
      setMcpResult({
        tool: 'synthesize_speech',
        status: 'success',
        available: true,
        lang: langParam,
        text: textParam,
        phoneticSpelling: 'mɔ́-ní m-é-ka-be-dá',
        tonalContour: ['High', 'High', 'Low', 'High'],
        durationMs: 420,
        accentProfile: 'Central Cameroon (Yaoundé Beti standard)',
        audioSimulation: 'WAV 16kHz PCM stream ready for client playback',
      });
    } else if (selectedTool === 'translate') {
      setMcpResult({
        tool: 'translate_financial_text',
        sourceText: textParam,
        translatedText: "Móni m'ékabedá: 50 000 FCFA",
        safe: true,
        astViolations: [],
        sha256Fingerprint: 'sha256-8a7c2b3d...',
      });
    } else if (selectedTool === 'verify') {
      setMcpResult({
        tool: 'verify_zero_drift',
        safe: true,
        match: true,
        violations: [],
        sourceFingerprint: 'sha256-8a7c2b3d...',
        translatedFingerprint: 'sha256-8a7c2b3d...',
        explanation: 'Invariance vérifiée : 50 000 FCFA conservé à 100% sans altération.',
      });
    } else if (selectedTool === 'glossary') {
      setMcpResult({
        tool: 'lookup_glossary',
        query: 'Solde',
        matches: [
          {
            fr: 'Solde disponible',
            ewo: "Móni m'ékabedá",
            fuv: 'Ceedee keddiiɗe',
            hau: 'Sauran kuɗi',
            knc: 'Kubu kəla',
            pcm: 'Money wey remain',
          },
        ],
      });
    } else {
      setMcpResult({
        tool: 'list_supported_languages',
        total: 5,
        languages: [
          { code: 'ewo-CM', name: 'Ewondo', status: 'production_approved' },
          { code: 'fuv-CM', name: 'Fulfulde', status: 'production_approved' },
          { code: 'hau-CM', name: 'Haoussa', status: 'production_approved' },
          { code: 'knc-CM', name: 'Kanuri', status: 'production_approved' },
          { code: 'pcm-CM', name: 'Pidgin', status: 'production_approved' },
        ],
      });
    }
  };

  const cursorConfig = `{
  "mcpServers": {
    "linguabridge": {
      "command": "node",
      "args": [
        "c:/Users/LENOVO/Documents/antigravity/focused-maxwell/linguabridge/packages/mcp-server/dist/bin.js"
      ],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}`;

  const claudeConfig = `{
  "mcpServers": {
    "linguabridge": {
      "command": "node",
      "args": [
        "c:/Users/LENOVO/Documents/antigravity/focused-maxwell/linguabridge/packages/mcp-server/dist/bin.js"
      ]
    }
  }
}`;

  const subTabs = [
    { id: 'overview', label: "Vue d'ensemble", icon: <BookOpen size={14} /> },
    { id: 'config', label: 'Configuration Clients', icon: <Settings size={14} /> },
    { id: 'tools', label: 'Outils Disponibles (6)', icon: <Wrench size={14} /> },
    { id: 'console', label: 'Testeur MCP Interactif', icon: <FlaskConical size={14} /> },
    { id: 'transports', label: 'Transports Stdio / SSE', icon: <Cable size={14} /> },
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
              Serveur MCP (Model Context Protocol)
            </h2>
            <span
              className="ax-pill ax-pill--active"
              style={{
                fontSize: '10px',
                padding: '3px 8px',
              }}
            >
              Vocal & Zéro Dérive
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
            Permettez à vos agents d&apos;IA (Cursor, Claude Desktop, Antigravity) de traduire des transactions, de vérifier l&apos;invariance financière et de synthétiser des voix africaines en direct.
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
              Intelligence Artificielle Souveraine avec MCP
            </h4>
            <p
              style={{
                margin: 0,
                fontSize: '13px',
                color: 'var(--muted, rgba(10, 10, 10, 0.6))',
                lineHeight: 1.6,
              }}
            >
              Le serveur MCP de LinguaBridge expose les capacités linguistiques et vocales camerounaises directement aux LLMs sans intermédiaire. Grâce au protocole ouvert d&apos;Anthropic (Model Context Protocol), votre assistant IA devient capable de raisonner, traduire et prononcer les phrases bancaires en respectant rigoureusement les montants financiers.
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
                Garde-fou Zéro Dérive
              </h5>
              <p
                style={{
                  margin: 0,
                  fontSize: '12px',
                  color: 'var(--muted, rgba(10, 10, 10, 0.6))',
                  lineHeight: 1.5,
                }}
              >
                L&apos;IA ne peut jamais altérer une valeur monétaire ou inventer un compte : l&apos;arbre syntaxique abstrait (AST) valide chaque caractère.
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
                Outil Vocal Intégré
              </h5>
              <p
                style={{
                  margin: 0,
                  fontSize: '12px',
                  color: 'var(--muted, rgba(10, 10, 10, 0.6))',
                  lineHeight: 1.5,
                }}
              >
                L&apos;outil <code>synthesize_speech</code> permet à l&apos;agent IA d&apos;obtenir le guide tonal et le flux audio pour accompagner ses réponses d&apos;une voix parlée.
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
                Compatibilité Multi-Clients
              </h5>
              <p
                style={{
                  margin: 0,
                  fontSize: '12px',
                  color: 'var(--muted, rgba(10, 10, 10, 0.6))',
                  lineHeight: 1.5,
                }}
              >
                Fonctionne nativement avec Cursor, Claude Desktop, Antigravity CLI et n&apos;importe quel client compatible MCP.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Config */}
      {subTab === 'config' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            {(['cursor', 'claude', 'antigravity'] as const).map((c) => {
              const isSelected = selectedClient === c;
              return (
                <button
                  key={c}
                  onClick={() => setSelectedClient(c)}
                  className={`chip ${isSelected ? 'on' : ''}`}
                  style={{
                    fontSize: '12px',
                    padding: '6px 14px',
                  }}
                >
                  {c === 'cursor' ? 'Cursor IDE' : c === 'claude' ? 'Claude Desktop' : 'Antigravity'}
                </button>
              );
            })}
          </div>

          <div>
            <div
              style={{
                fontSize: '11px',
                fontFamily: 'var(--font-mono, monospace)',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: 'var(--muted, rgba(10, 10, 10, 0.6))',
                marginBottom: '6px',
              }}
            >
              Copiez cette configuration dans votre fichier client :
            </div>
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
              {selectedClient === 'cursor' ? cursorConfig : claudeConfig}
            </pre>
          </div>
        </div>
      )}

      {/* Tools */}
      {subTab === 'tools' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[
            {
              name: 'synthesize_speech',
              badge: 'NOUVEAU - VOCAL',
              desc: 'Génère la synthèse audio et le profil tonal africain pour prononcer les phrases bancaires.',
              args: 'text: string, lang: string, voiceStyle?: "neutral" | "formal", rate?: number',
            },
            {
              name: 'translate_financial_text',
              badge: 'ZÉRO DÉRIVE',
              desc: "Traduit un texte fintech avec extraction d'entités et vérification d'empreinte SHA-256.",
              args: 'text: string, targetLang: string, sourceLang?: string, domain?: string',
            },
            {
              name: 'verify_zero_drift',
              badge: 'AUDIT FORMEL',
              desc: 'Vérifie si la traduction préserve scrupuleusement les montants monétaires et téléphones.',
              args: 'sourceText: string, translatedText: string',
            },
            {
              name: 'lookup_glossary',
              badge: 'LEXIQUE OFFICIEL',
              desc: 'Recherche les termes financiers consensuels certifiés dans les dictionnaires académiques.',
              args: 'term: string, lang?: string',
            },
            {
              name: 'list_supported_languages',
              badge: 'REGISTRE',
              desc: "Liste les 5 langues souveraines opérationnelles et l'état des quarantaines.",
              args: 'includeQuarantined?: boolean',
            },
          ].map((tool, idx) => (
            <div
              key={idx}
              style={{
                border: '1px solid var(--line, rgba(10, 10, 10, 0.12))',
                borderRadius: 'var(--radius, 4px)',
                padding: '12px 16px',
                backgroundColor: 'var(--paper, #ffffff)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '6px',
                  gap: '8px',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <code
                    style={{
                      fontSize: '13px',
                      fontWeight: 700,
                      fontFamily: 'var(--font-mono, monospace)',
                      color: 'var(--green-deep, #08751A)',
                    }}
                  >
                    {tool.name}
                  </code>
                  <span
                    className={tool.badge.includes('NOUVEAU') ? 'ax-pill' : 'ax-pill ax-pill--active'}
                    style={{
                      fontSize: '9.5px',
                      padding: '2px 6px',
                    }}
                  >
                    {tool.badge}
                  </span>
                </div>
                <code
                  style={{
                    fontSize: '11px',
                    color: 'var(--muted, rgba(10, 10, 10, 0.6))',
                    backgroundColor: 'var(--ws, #F6F6F4)',
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-xs, 2px)',
                    border: '1px solid var(--line, rgba(10, 10, 10, 0.12))',
                  }}
                >
                  {tool.args}
                </code>
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: '12px',
                  color: 'var(--muted, rgba(10, 10, 10, 0.6))',
                }}
              >
                {tool.desc}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Console */}
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
              <select
                value={selectedTool}
                onChange={(e) => setSelectedTool(e.target.value as any)}
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
                <option value="speech">synthesize_speech (Voix & Tons)</option>
                <option value="translate">translate_financial_text (Traduction)</option>
                <option value="verify">verify_zero_drift (Garde-fou)</option>
                <option value="glossary">lookup_glossary (Lexique)</option>
                <option value="languages">list_supported_languages (Registre)</option>
              </select>

              <select
                value={langParam}
                onChange={(e) => setLangParam(e.target.value)}
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

              <button
                onClick={handleTestMcp}
                className="btn btn-primary"
                style={{
                  padding: '7px 16px',
                  fontSize: '12.5px',
                  gap: '6px',
                  cursor: 'pointer',
                }}
              >
                <Play size={12} strokeWidth={2.5} />
                Exécuter l&apos;Outil MCP
              </button>
            </div>

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
                Paramètre textuel de test :
              </label>
              <input
                type="text"
                value={textParam}
                onChange={(e) => setTextParam(e.target.value)}
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
          </div>

          {mcpResult && (
            <div
              style={{
                backgroundColor: 'var(--ink-2, #171717)',
                borderRadius: 'var(--radius, 4px)',
                padding: '16px',
                color: 'var(--bone, #F3F2ED)',
                border: '1px solid var(--line-invert, rgba(255, 255, 255, 0.14))',
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono, monospace)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  color: 'var(--muted-invert, rgba(255, 255, 255, 0.62))',
                  marginBottom: '8px',
                }}
              >
                Résultat JSON-RPC MCP :
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
                {JSON.stringify(mcpResult, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Transports */}
      {subTab === 'transports' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div
            style={{
              border: '1px solid var(--line, rgba(10, 10, 10, 0.12))',
              borderRadius: 'var(--radius, 4px)',
              padding: '16px',
              backgroundColor: 'var(--paper, #ffffff)',
            }}
          >
            <h4
              style={{
                margin: '0 0 8px 0',
                fontSize: '13.5px',
                fontFamily: 'var(--font-heading, "Manrope", sans-serif)',
                fontWeight: 700,
                color: 'var(--ink, #0A0A0A)',
              }}
            >
              Transport Stdio (Standard Input/Output)
            </h4>
            <p
              style={{
                margin: '0 0 12px 0',
                fontSize: '12px',
                color: 'var(--muted, rgba(10, 10, 10, 0.6))',
                lineHeight: 1.5,
              }}
            >
              Recommandé pour Cursor et Claude Desktop en exécution locale. Les messages JSON-RPC transitent sur stdout/stdin sans latence réseau.
            </p>
            <div
              style={{
                backgroundColor: 'var(--ws, #F6F6F4)',
                padding: '8px 12px',
                borderRadius: 'var(--radius-xs, 2px)',
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '11px',
                color: 'var(--ink, #0A0A0A)',
                border: '1px solid var(--line, rgba(10, 10, 10, 0.12))',
              }}
            >
              node packages/mcp-server/dist/bin.js
            </div>
          </div>
          <div
            style={{
              border: '1px solid var(--line, rgba(10, 10, 10, 0.12))',
              borderRadius: 'var(--radius, 4px)',
              padding: '16px',
              backgroundColor: 'var(--paper, #ffffff)',
            }}
          >
            <h4
              style={{
                margin: '0 0 8px 0',
                fontSize: '13.5px',
                fontFamily: 'var(--font-heading, "Manrope", sans-serif)',
                fontWeight: 700,
                color: 'var(--ink, #0A0A0A)',
              }}
            >
              Transport SSE (Server-Sent Events)
            </h4>
            <p
              style={{
                margin: '0 0 12px 0',
                fontSize: '12px',
                color: 'var(--muted, rgba(10, 10, 10, 0.6))',
                lineHeight: 1.5,
              }}
            >
              Idéal pour connecter des agents distants ou des services d&apos;orchestration dans le cloud via HTTP streaming.
            </p>
            <div
              style={{
                backgroundColor: 'var(--ws, #F6F6F4)',
                padding: '8px 12px',
                borderRadius: 'var(--radius-xs, 2px)',
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '11px',
                color: 'var(--ink, #0A0A0A)',
                border: '1px solid var(--line, rgba(10, 10, 10, 0.12))',
              }}
            >
              GET /sse & POST /messages?sessionId=...
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
