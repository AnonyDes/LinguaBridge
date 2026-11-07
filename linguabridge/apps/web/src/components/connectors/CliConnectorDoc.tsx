'use client';

import React, { useState } from 'react';

export const CliConnectorDoc: React.FC = () => {
  const [subTab, setSubTab] = useState<'overview' | 'commands' | 'terminal' | 'cicd'>('overview');
  const [cliInput, setCliInput] = useState('lb audit');
  const [cliOutput, setCliOutput] = useState<string>(
    '🛡️ LINGUABRIDGE SOVEREIGN INFRASTRUCTURE AUDIT:\n' +
    '  • Fastify API Gateway: Dual Route (/v1 & /api/v1) READY\n' +
    '  • Database: Supabase PostgreSQL Connected & Migrations Current\n' +
    '  • Zero-Drift AST Validator: Operational (SHA-256 fingerprinting)\n' +
    '  • Certified Sovereign Packs: Ewondo, Fulfulde, Haoussa, Kanuri, Pidgin\n' +
    '  • Quarantined Templates: Bulu, Duala, Basaa isolated\n' +
    '  • Status: 100% Production Ready (Exit Code: 0)'
  );

  const handleRunCommand = (cmdToRun?: string) => {
    const cmd = (cmdToRun || cliInput).trim();
    if (!cmd) return;

    if (cmd.startsWith('lb verify')) {
      if (cmd.includes('500 FCFA') && cmd.includes('5000 FCFA')) {
        setCliOutput(
          '❌ ZERO-DRIFT VIOLATION DETECTED!\n' +
          '  Source Entity:     amount "5000 FCFA" (normalized: 5000_FCFA)\n' +
          '  Translated Entity: amount "500 FCFA" (normalized: 500_FCFA)\n' +
          '  Issue: AMOUNT_MUTATION - Financial value drift from 5000 to 500!\n' +
          '  Exit Code: 1 (Build blocked to prevent financial loss)'
        );
      } else {
        setCliOutput(
          '✅ ZERO-DRIFT VERIFIED CLEANLY:\n' +
          '  Entities Extracted: 1 amount (5000_FCFA)\n' +
          '  AST Fingerprint: sha256:d8b2e176...\n' +
          '  Status: 100% Exact Invariance Guaranteed\n' +
          '  Exit Code: 0 (Safe for financial production)'
        );
      }
    } else if (cmd.startsWith('lb translate')) {
      setCliOutput(
        '🌍 LINGUABRIDGE TRANSLATE (Ewondo ewo-CM):\n' +
        '  Source:     "Transférez 5000 FCFA au 699123456"\n' +
        '  Target:     "Lóm móni 5000 FCFA é be 699123456"\n' +
        '  Entities:   amount (5000_FCFA), phone (237699123456)\n' +
        '  Fingerprint Match: Exact (0 drift)\n' +
        '  Latency:    1.8ms (Translation Memory hit)'
      );
    } else if (cmd.startsWith('lb pack lint')) {
      setCliOutput(
        '🔍 PACK LINT: language-packs/cameroon/ewo-CM\n' +
        '  ✓ manifest.json schema conforms to LanguagePackManifest v1\n' +
        '  ✓ ISO 639-3 standard verified: "ewo"\n' +
        '  ✓ Certified financial glossary: 42 certified terms loaded\n' +
        '  ✓ Isolation check: Compliant (Certified Production Approved)\n' +
        '  Exit Code: 0'
      );
    } else if (cmd.startsWith('lb audit')) {
      setCliOutput(
        '🛡️ LINGUABRIDGE SOVEREIGN INFRASTRUCTURE AUDIT:\n' +
        '  • Fastify API Gateway: Dual Route (/v1 & /api/v1) READY\n' +
        '  • Database: Supabase PostgreSQL Connected & Migrations Current\n' +
        '  • Zero-Drift AST Validator: Operational (SHA-256 fingerprinting)\n' +
        '  • Certified Sovereign Packs: Ewondo, Fulfulde, Haoussa, Kanuri, Pidgin\n' +
        '  • Quarantined Templates: Bulu, Duala, Basaa isolated\n' +
        '  • Status: 100% Production Ready (Exit Code: 0)'
      );
    } else {
      setCliOutput(`Commande non reconnue : ${cmd}\nCommandes disponibles : lb translate, lb verify, lb pack lint, lb audit`);
    }
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
              Développeur CLI (Outil en Ligne de Commande `lb`)
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
              Binary v0.1.0
            </span>
          </div>
          <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: '#64748b' }}>
            Binaire autonome et scriptable pour les développeurs, pipelines d'intégration continue CI/CD et audits d'invariance en pré-déploiement.
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
          { id: 'commands', label: '💻 Commandes & Drapeaux' },
          { id: 'terminal', label: '🖥️ Terminal Interactif Web' },
          { id: 'cicd', label: '🔄 Intégration CI/CD' },
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
              Le Couteau Suisse de l'Ingénieur Bancaire
            </h4>
            <p style={{ margin: 0, fontSize: '13px', color: '#475569', lineHeight: 1.6 }}>
              Le CLI <code>lb</code> (ou <code>linguabridge</code>) permet de valider les traductions en ligne de commande, d'auditer l'isolation des packs linguistiques, de tester l'invariance financière avant toute mise en production et de lancer un mock local hors-ligne.
            </p>
          </div>
        </div>
      )}

      {/* Commands */}
      {subTab === 'commands' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[
            { cmd: 'lb translate "<texte>" -t <lang>', desc: 'Traduit un texte bancaire avec extraction d\'entités et affiche le rapport.' },
            { cmd: 'lb verify -s "<source>" -t "<cible>"', desc: 'Vérifie si les entités financières et devises sont strictement identiques.' },
            { cmd: 'lb pack lint <chemin>', desc: 'Vérifie la conformité formelle d\'un pack de langue contre le schéma officiel.' },
            { cmd: 'lb audit', desc: 'Lance un diagnostic complet de l\'infrastructure, API, passerelle et base Supabase.' },
          ].map((c, idx) => (
            <div key={idx} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px 16px', backgroundColor: '#ffffff' }}>
              <code style={{ fontSize: '13px', fontWeight: 700, color: '#15803d' }}>{c.cmd}</code>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>{c.desc}</p>
            </div>
          ))}
        </div>
      )}

      {/* Terminal */}
      {subTab === 'terminal' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Raccourcis :</span>
            <button
              onClick={() => { setCliInput('lb audit'); handleRunCommand('lb audit'); }}
              style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '4px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', cursor: 'pointer' }}
            >
              lb audit
            </button>
            <button
              onClick={() => { setCliInput('lb verify -s "5000 FCFA" -t "5000 FCFA"'); handleRunCommand('lb verify -s "5000 FCFA" -t "5000 FCFA"'); }}
              style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '4px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', cursor: 'pointer' }}
            >
              lb verify (Succès)
            </button>
            <button
              onClick={() => { setCliInput('lb verify -s "5000 FCFA" -t "500 FCFA"'); handleRunCommand('lb verify -s "5000 FCFA" -t "500 FCFA"'); }}
              style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '4px', backgroundColor: '#fee2e2', border: '1px solid #fca5a5', color: '#991b1b', cursor: 'pointer' }}
            >
              lb verify (Dérive)
            </button>
          </div>

          <div style={{ backgroundColor: '#0f172a', borderRadius: '8px', padding: '16px', color: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ color: '#4ade80', fontWeight: 700 }}>$</span>
              <input
                type="text"
                value={cliInput}
                onChange={(e) => setCliInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRunCommand()}
                style={{
                  flex: 1,
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#f8fafc',
                  fontFamily: 'monospace',
                  fontSize: '13px',
                  outline: 'none',
                }}
              />
              <button
                onClick={() => handleRunCommand()}
                style={{
                  backgroundColor: '#16a34a',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '4px 12px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Exécuter
              </button>
            </div>
            <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: '12px', color: '#e2e8f0', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
              {cliOutput}
            </pre>
          </div>
        </div>
      )}

      {/* CI/CD */}
      {subTab === 'cicd' && (
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
{`name: LinguaBridge Sovereign Invariance Check

on: [push, pull_request]

jobs:
  zero-drift-audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - run: pnpm install
      - name: Formally verify zero drift
        run: pnpm --filter @linguabridge/cli run test`}
          </pre>
        </div>
      )}
    </div>
  );
};
