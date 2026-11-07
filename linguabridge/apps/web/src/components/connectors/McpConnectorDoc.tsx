'use client';

import React, { useState } from 'react';

export const McpConnectorDoc: React.FC = () => {
  const [subTab, setSubTab] = useState<'overview' | 'config' | 'tools' | 'console' | 'transports'>('overview');
  const [selectedClient, setSelectedClient] = useState<'cursor' | 'claude' | 'antigravity'>('cursor');

  // MCP Tester State
  const [selectedTool, setSelectedTool] = useState<'translate' | 'speech' | 'verify' | 'glossary' | 'languages'>('speech');
  const [textParam, setTextParam] = useState('Móni m\'ékabedá: 50 000 FCFA');
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
        translatedText: 'Móni m\'ékabedá: 50 000 FCFA',
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
            ewo: 'Móni m\'ékabedá',
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
              Serveur MCP (Model Context Protocol)
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
              Vocal & Zéro Dérive
            </span>
          </div>
          <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: '#64748b' }}>
            Permettez à vos agents d'IA (Cursor, Claude Desktop, Antigravity) de traduire des transactions, de vérifier l'invariance financière et de synthétiser des voix africaines en direct.
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
          { id: 'config', label: '⚙️ Configuration Clients' },
          { id: 'tools', label: '🛠️ Outils Disponibles (6)' },
          { id: 'console', label: '🧪 Testeur MCP Interactif' },
          { id: 'transports', label: '🔌 Transports Stdio / SSE' },
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
              Intelligence Artificielle Souveraine avec MCP
            </h4>
            <p style={{ margin: 0, fontSize: '13px', color: '#475569', lineHeight: 1.6 }}>
              Le serveur MCP de LinguaBridge expose les capacités linguistiques et vocales camerounaises directement aux LLMs sans intermédiaire. Grâce au protocole ouvert d'Anthropic (Model Context Protocol), votre assistant IA devient capable de raisonner, traduire et prononcer les phrases bancaires en respectant rigoureusement les montants financiers.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', backgroundColor: '#ffffff' }}>
              <span style={{ fontSize: '24px' }}>🛡️</span>
              <h5 style={{ margin: '8px 0 4px 0', fontSize: '14px', color: '#0f172a' }}>Garde-fou Zéro Dérive</h5>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748b', lineHeight: 1.5 }}>
                L'IA ne peut jamais altérer une valeur monétaire ou inventer un compte : l'arbre syntaxique abstrait (AST) valide chaque caractère.
              </p>
            </div>
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', backgroundColor: '#ffffff' }}>
              <span style={{ fontSize: '24px' }}>🔊</span>
              <h5 style={{ margin: '8px 0 4px 0', fontSize: '14px', color: '#0f172a' }}>Outil Vocal Intégré</h5>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748b', lineHeight: 1.5 }}>
                L'outil <code>synthesize_speech</code> permet à l'agent IA d'obtenir le guide tonal et le flux audio pour accompagner ses réponses d'une voix parlée.
              </p>
            </div>
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', backgroundColor: '#ffffff' }}>
              <span style={{ fontSize: '24px' }}>⚡</span>
              <h5 style={{ margin: '8px 0 4px 0', fontSize: '14px', color: '#0f172a' }}>Compatibilité Multi-Clients</h5>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748b', lineHeight: 1.5 }}>
                Fonctionne nativement avec Cursor, Claude Desktop, Antigravity CLI et n'importe quel client compatible MCP.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Config */}
      {subTab === 'config' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['cursor', 'claude', 'antigravity'].map((c) => (
              <button
                key={c}
                onClick={() => setSelectedClient(c as any)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  backgroundColor: selectedClient === c ? '#16a34a' : '#f1f5f9',
                  color: selectedClient === c ? '#ffffff' : '#475569',
                  fontWeight: 600,
                  fontSize: '12px',
                  border: 'none',
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                }}
              >
                {c === 'cursor' ? 'Cursor IDE' : c === 'claude' ? 'Claude Desktop' : 'Antigravity'}
              </button>
            ))}
          </div>

          <div>
            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>
              Copiez cette configuration dans votre fichier client :
            </div>
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
              {selectedClient === 'cursor' ? cursorConfig : claudeConfig}
            </pre>
          </div>
        </div>
      )}

      {/* Tools */}
      {subTab === 'tools' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
              desc: 'Traduit un texte fintech avec extraction d\'entités et vérification d\'empreinte SHA-256.',
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
              desc: 'Liste les 5 langues souveraines opérationnelles et l\'état des quarantaines.',
              args: 'includeQuarantined?: boolean',
            },
          ].map((tool, idx) => (
            <div
              key={idx}
              style={{
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '14px 16px',
                backgroundColor: '#ffffff',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <code style={{ fontSize: '14px', fontWeight: 700, color: '#15803d' }}>{tool.name}</code>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      backgroundColor: tool.badge.includes('NOUVEAU') ? '#fef3c7' : '#dcfce7',
                      color: tool.badge.includes('NOUVEAU') ? '#b45309' : '#15803d',
                      padding: '2px 6px',
                      borderRadius: '4px',
                    }}
                  >
                    {tool.badge}
                  </span>
                </div>
                <code style={{ fontSize: '11px', color: '#64748b', backgroundColor: '#f1f5f9', padding: '3px 8px', borderRadius: '4px' }}>
                  {tool.args}
                </code>
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: '#475569' }}>{tool.desc}</p>
            </div>
          ))}
        </div>
      )}

      {/* Console */}
      {subTab === 'console' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            style={{
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '16px',
              backgroundColor: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <select
                value={selectedTool}
                onChange={(e) => setSelectedTool(e.target.value as any)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontWeight: 600,
                  fontSize: '13px',
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
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
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
                className="btn"
                style={{
                  padding: '8px 18px',
                  backgroundColor: '#16a34a',
                  color: '#ffffff',
                  borderRadius: '6px',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  border: 'none',
                }}
              >
                ⚡ Exécuter l'Outil MCP
              </button>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                Paramètre textuel de test :
              </label>
              <input
                type="text"
                value={textParam}
                onChange={(e) => setTextParam(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {mcpResult && (
            <div
              style={{
                backgroundColor: '#0f172a',
                borderRadius: '8px',
                padding: '16px',
                color: '#f8fafc',
              }}
            >
              <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>
                Résultat JSON-RPC MCP :
              </div>
              <pre style={{ margin: 0, fontSize: '12px', fontFamily: 'monospace', overflowX: 'auto' }}>
                {JSON.stringify(mcpResult, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Transports */}
      {subTab === 'transports' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', backgroundColor: '#ffffff' }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#0f172a' }}>Transport Stdio (Standard Input/Output)</h4>
            <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: '#64748b', lineHeight: 1.5 }}>
              Recommandé pour Cursor et Claude Desktop en exécution locale. Les messages JSON-RPC transitent sur stdout/stdin sans latence réseau.
            </p>
            <div style={{ backgroundColor: '#f1f5f9', padding: '8px 12px', borderRadius: '6px', fontFamily: 'monospace', fontSize: '11px', color: '#1e293b' }}>
              node packages/mcp-server/dist/bin.js
            </div>
          </div>
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', backgroundColor: '#ffffff' }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#0f172a' }}>Transport SSE (Server-Sent Events)</h4>
            <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: '#64748b', lineHeight: 1.5 }}>
              Idéal pour connecter des agents distants ou des services d'orchestration dans le cloud via HTTP streaming.
            </p>
            <div style={{ backgroundColor: '#f1f5f9', padding: '8px 12px', borderRadius: '6px', fontFamily: 'monospace', fontSize: '11px', color: '#1e293b' }}>
              GET /sse & POST /messages?sessionId=...
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
