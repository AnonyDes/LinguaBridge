'use client';

import React, { useState } from 'react';
import {
  BookOpen,
  Terminal,
  Monitor,
  RefreshCw,
  Play,
} from 'lucide-react';

export const CliConnectorDoc: React.FC = () => {
  const [subTab, setSubTab] = useState<'overview' | 'commands' | 'terminal' | 'cicd'>('overview');
  const [cliInput, setCliInput] = useState('lb audit');
  const [cliOutput, setCliOutput] = useState<string>(
    '[AUDIT] LINGUABRIDGE SOVEREIGN INFRASTRUCTURE AUDIT:\n' +
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
          '[VIOLATION] ZERO-DRIFT VIOLATION DETECTED!\n' +
          '  Source Entity:     amount "5000 FCFA" (normalized: 5000_FCFA)\n' +
          '  Translated Entity: amount "500 FCFA" (normalized: 500_FCFA)\n' +
          '  Issue: AMOUNT_MUTATION - Financial value drift from 5000 to 500!\n' +
          '  Exit Code: 1 (Build blocked to prevent financial loss)'
        );
      } else {
        setCliOutput(
          '[OK] ZERO-DRIFT VERIFIED CLEANLY:\n' +
          '  Entities Extracted: 1 amount (5000_FCFA)\n' +
          '  AST Fingerprint: sha256:d8b2e176...\n' +
          '  Status: 100% Exact Invariance Guaranteed\n' +
          '  Exit Code: 0 (Safe for financial production)'
        );
      }
    } else if (cmd.startsWith('lb translate')) {
      setCliOutput(
        '[TRANSLATE] LINGUABRIDGE TRANSLATE (Ewondo ewo-CM):\n' +
        '  Source:     "Transférez 5000 FCFA au 699123456"\n' +
        '  Target:     "Lóm móni 5000 FCFA é be 699123456"\n' +
        '  Entities:   amount (5000_FCFA), phone (237699123456)\n' +
        '  Fingerprint Match: Exact (0 drift)\n' +
        '  Latency:    1.8ms (Translation Memory hit)'
      );
    } else if (cmd.startsWith('lb pack lint')) {
      setCliOutput(
        '[LINT] PACK LINT: language-packs/cameroon/ewo-CM\n' +
        '  [OK] manifest.json schema conforms to LanguagePackManifest v1\n' +
        '  [OK] ISO 639-3 standard verified: "ewo"\n' +
        '  [OK] Certified financial glossary: 42 certified terms loaded\n' +
        '  [OK] Isolation check: Compliant (Certified Production Approved)\n' +
        '  Exit Code: 0'
      );
    } else if (cmd.startsWith('lb audit')) {
      setCliOutput(
        '[AUDIT] LINGUABRIDGE SOVEREIGN INFRASTRUCTURE AUDIT:\n' +
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

  const subTabs = [
    { id: 'overview', label: "Vue d'ensemble", icon: <BookOpen size={14} /> },
    { id: 'commands', label: 'Commandes & Drapeaux', icon: <Terminal size={14} /> },
    { id: 'terminal', label: 'Terminal Interactif Web', icon: <Monitor size={14} /> },
    { id: 'cicd', label: 'Intégration CI/CD', icon: <RefreshCw size={14} /> },
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
              Développeur CLI (Outil en Ligne de Commande `lb`)
            </h2>
            <span
              className="ax-pill ax-pill--active"
              style={{
                fontSize: '10px',
                padding: '3px 8px',
              }}
            >
              Binary v0.1.0
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
            Binaire autonome et scriptable pour les développeurs, pipelines d&apos;intégration continue CI/CD et audits d&apos;invariance en pré-déploiement.
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
              Le Couteau Suisse de l&apos;Ingénieur Bancaire
            </h4>
            <p
              style={{
                margin: 0,
                fontSize: '13px',
                color: 'var(--muted, rgba(10, 10, 10, 0.6))',
                lineHeight: 1.6,
              }}
            >
              Le CLI <code>lb</code> (ou <code>linguabridge</code>) permet de valider les traductions en ligne de commande, d&apos;auditer l&apos;isolation des packs linguistiques, de tester l&apos;invariance financière avant toute mise en production et de lancer un mock local hors-ligne.
            </p>
          </div>
        </div>
      )}

      {/* Commands */}
      {subTab === 'commands' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[
            { cmd: 'lb translate "<texte>" -t <lang>', desc: "Traduit un texte bancaire avec extraction d'entités et affiche le rapport." },
            { cmd: 'lb verify -s "<source>" -t "<cible>"', desc: 'Vérifie si les entités financières et devises sont strictement identiques.' },
            { cmd: 'lb pack lint <chemin>', desc: "Vérifie la conformité formelle d'un pack de langue contre le schéma officiel." },
            { cmd: 'lb audit', desc: "Lance un diagnostic complet de l'infrastructure, API, passerelle et base Supabase." },
          ].map((c, idx) => (
            <div
              key={idx}
              style={{
                border: '1px solid var(--line, rgba(10, 10, 10, 0.12))',
                borderRadius: 'var(--radius, 4px)',
                padding: '12px 16px',
                backgroundColor: 'var(--paper, #ffffff)',
              }}
            >
              <code
                style={{
                  fontSize: '12.5px',
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono, monospace)',
                  color: 'var(--green-deep, #08751A)',
                }}
              >
                {c.cmd}
              </code>
              <p
                style={{
                  margin: '4px 0 0 0',
                  fontSize: '12px',
                  color: 'var(--muted, rgba(10, 10, 10, 0.6))',
                }}
              >
                {c.desc}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Terminal */}
      {subTab === 'terminal' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: '11px',
                fontFamily: 'var(--font-mono, monospace)',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                fontWeight: 600,
                color: 'var(--muted, rgba(10, 10, 10, 0.6))',
              }}
            >
              Raccourcis :
            </span>
            <button
              onClick={() => { setCliInput('lb audit'); handleRunCommand('lb audit'); }}
              className="chip"
              style={{ fontSize: '11px', padding: '4px 10px' }}
            >
              lb audit
            </button>
            <button
              onClick={() => { setCliInput('lb verify -s "5000 FCFA" -t "5000 FCFA"'); handleRunCommand('lb verify -s "5000 FCFA" -t "5000 FCFA"'); }}
              className="chip"
              style={{ fontSize: '11px', padding: '4px 10px' }}
            >
              lb verify (Succès)
            </button>
            <button
              onClick={() => { setCliInput('lb verify -s "5000 FCFA" -t "500 FCFA"'); handleRunCommand('lb verify -s "5000 FCFA" -t "500 FCFA"'); }}
              className="chip"
              style={{
                fontSize: '11px',
                padding: '4px 10px',
                borderColor: 'rgba(220, 38, 38, 0.35)',
                color: '#B91C1C',
                backgroundColor: '#FEF2F2',
              }}
            >
              lb verify (Dérive)
            </button>
          </div>

          <div
            style={{
              backgroundColor: 'var(--ink-2, #171717)',
              borderRadius: 'var(--radius, 4px)',
              padding: '16px',
              color: 'var(--bone, #F3F2ED)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              border: '1px solid var(--line-invert, rgba(255, 255, 255, 0.14))',
            }}
          >
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span
                style={{
                  color: 'var(--green-glow, #4FE066)',
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono, monospace)',
                }}
              >
                $
              </span>
              <input
                type="text"
                value={cliInput}
                onChange={(e) => setCliInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRunCommand()}
                style={{
                  flex: 1,
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: 'var(--bone, #F3F2ED)',
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '12.5px',
                  outline: 'none',
                }}
              />
              <button
                onClick={() => handleRunCommand()}
                className="btn btn-primary"
                style={{
                  padding: '4px 12px',
                  fontSize: '11px',
                  gap: '4px',
                  height: '28px',
                }}
              >
                <Play size={10} strokeWidth={2.5} />
                Exécuter
              </button>
            </div>
            <pre
              style={{
                margin: 0,
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '12px',
                color: 'var(--bone, #F3F2ED)',
                lineHeight: 1.5,
                whiteSpace: 'pre-wrap',
                borderTop: '1px solid var(--line-invert, rgba(255, 255, 255, 0.14))',
                paddingTop: '10px',
              }}
            >
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
