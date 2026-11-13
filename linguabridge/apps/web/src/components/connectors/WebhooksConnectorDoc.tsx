'use client';

import React, { useState } from 'react';
import {
  BookOpen,
  ShieldCheck,
  Zap,
  FlaskConical,
  Code2,
  Lock,
  RefreshCw,
  FileText,
  Send,
} from 'lucide-react';

export const WebhooksConnectorDoc: React.FC = () => {
  const [subTab, setSubTab] = useState<'overview' | 'security' | 'events' | 'simulator' | 'code'>('overview');

  // Simulator State
  const [webhookUrl, setWebhookUrl] = useState('https://api.ma-banque.cm/webhooks/linguabridge');
  const [eventType, setEventType] = useState('transaction.settled');
  const [amount, setAmount] = useState('150 000 FCFA');
  const [secretKey, setSecretKey] = useState('whsec_98f4a2b1c8e7d6...');
  const [deliveryResult, setDeliveryResult] = useState<any>(null);

  const handleSimulateWebhook = () => {
    const timestamp = Math.floor(Date.now() / 1000);
    const eventId = 'evt_' + Math.random().toString(36).substring(2, 10);
    const mockSignature = 'sha256=d8a4f91e3b5c7e2a1f0d8b4c9e7a2b1f0d8b4c9e7a2b1f0d8b4c9e7a2b1f0d8b';

    setDeliveryResult({
      status: 200,
      eventId,
      timestamp,
      headers: {
        'Content-Type': 'application/json',
        'x-linguabridge-event': eventType,
        'x-linguabridge-delivery': eventId,
        'x-linguabridge-timestamp': timestamp.toString(),
        'x-linguabridge-signature': mockSignature,
      },
      payload: {
        id: eventId,
        event: eventType,
        created: timestamp,
        data: {
          transactionId: 'TXN-984210',
          amount,
          currency: 'XAF',
          account: 'CM21-10005-00123-45678901234-56',
          status: 'COMPLETED',
          settlementChannel: 'BEAC_SYGMA',
          auditHash: 'sha256-a9b8c7...',
        },
      },
      verifiedWithTimingSafeHMAC: true,
    });
  };

  const subTabs = [
    { id: 'overview', label: "Vue d'ensemble", icon: <BookOpen size={14} /> },
    { id: 'security', label: 'Sécurité & Signature HMAC', icon: <ShieldCheck size={14} /> },
    { id: 'events', label: 'Événements Supportés', icon: <Zap size={14} /> },
    { id: 'simulator', label: "Simulateur d'Envoi Live", icon: <FlaskConical size={14} /> },
    { id: 'code', label: 'Vérification Signature (Node.js)', icon: <Code2 size={14} /> },
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
              Webhooks Bancaires & Bus d&apos;Événements d&apos;Entreprise
            </h2>
            <span
              className="ax-pill ax-pill--active"
              style={{
                fontSize: '10px',
                padding: '3px 8px',
              }}
            >
              HMAC-SHA256 Signé
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
            Flux d&apos;événements transactionnels bancaires en temps réel : notifications sécurisées, audits d&apos;invariance et intégration Core Banking asynchrone.
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
              Architecture Événementielle pour Systèmes Bancaires
            </h4>
            <p
              style={{
                margin: 0,
                fontSize: '13px',
                color: 'var(--muted, rgba(10, 10, 10, 0.6))',
                lineHeight: 1.6,
              }}
            >
              Les Webhooks d&apos;entreprise LinguaBridge permettent à vos systèmes Core Banking (Amphora, Delta Bank, Sopra) et applications partenaires de réagir instantanément aux événements de traitement linguistique, de validation d&apos;intégrité financière et d&apos;audit sans polling répété.
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
                <Lock size={18} strokeWidth={2} />
              </div>
              <h5
                style={{
                  margin: '0 0 4px 0',
                  fontSize: '13.5px',
                  fontWeight: 700,
                  color: 'var(--ink, #0A0A0A)',
                }}
              >
                Authentification HMAC-SHA256
              </h5>
              <p
                style={{
                  margin: 0,
                  fontSize: '12px',
                  color: 'var(--muted, rgba(10, 10, 10, 0.6))',
                  lineHeight: 1.5,
                }}
              >
                Chaque payload est signé avec une clé secrète partagée. Validation temporelle stricte contre le rejeu.
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
                <RefreshCw size={18} strokeWidth={2} />
              </div>
              <h5
                style={{
                  margin: '0 0 4px 0',
                  fontSize: '13.5px',
                  fontWeight: 700,
                  color: 'var(--ink, #0A0A0A)',
                }}
              >
                Politique de Réessai Exponentielle
              </h5>
              <p
                style={{
                  margin: 0,
                  fontSize: '12px',
                  color: 'var(--muted, rgba(10, 10, 10, 0.6))',
                  lineHeight: 1.5,
                }}
              >
                En cas d&apos;échec de réception côté banque, 5 tentatives automatiques sont échelonnées avec backoff exponentiel.
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
                <FileText size={18} strokeWidth={2} />
              </div>
              <h5
                style={{
                  margin: '0 0 4px 0',
                  fontSize: '13.5px',
                  fontWeight: 700,
                  color: 'var(--ink, #0A0A0A)',
                }}
              >
                Piste d&apos;Audit Immuable
              </h5>
              <p
                style={{
                  margin: 0,
                  fontSize: '12px',
                  color: 'var(--muted, rgba(10, 10, 10, 0.6))',
                  lineHeight: 1.5,
                }}
              >
                Chaque dispatch consigne l&apos;identifiant d&apos;événement, les latences d&apos;accusé de réception et le statut HTTP dans la base Supabase.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Security */}
      {subTab === 'security' && (
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
                fontSize: '14px',
                fontFamily: 'var(--font-heading, "Manrope", sans-serif)',
                fontWeight: 700,
                color: 'var(--ink, #0A0A0A)',
              }}
            >
              En-têtes de Sécurité Envoyés avec Chaque Événement
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { header: 'x-linguabridge-signature', desc: 'Empreinte hexadécimale HMAC-SHA256 calculée sur le body brut.' },
                { header: 'x-linguabridge-timestamp', desc: 'Timestamp Unix en secondes pour rejeter les requêtes antérieures à 300s.' },
                { header: 'x-linguabridge-delivery', desc: "Identifiant unique d'événement pour garantir l'idempotence côté banque." },
                { header: 'x-linguabridge-event', desc: "Type d'événement (ex: translation.drift_violation, transaction.settled)." },
              ].map((h, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'center',
                    backgroundColor: 'var(--ws, #F6F6F4)',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-xs, 2px)',
                    border: '1px solid var(--line, rgba(10, 10, 10, 0.12))',
                    flexWrap: 'wrap',
                  }}
                >
                  <code
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      fontFamily: 'var(--font-mono, monospace)',
                      color: 'var(--green-deep, #08751A)',
                    }}
                  >
                    {h.header}
                  </code>
                  <span style={{ fontSize: '12px', color: 'var(--muted, rgba(10, 10, 10, 0.6))' }}>{h.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Events */}
      {subTab === 'events' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[
            { name: 'transaction.settled', desc: "Confirmation de règlement interbancaire validée par l'infrastructure." },
            { name: 'translation.completed', desc: 'Document ou lot bancaire traduit avec succès sans aucune dérive.' },
            { name: 'translation.drift_violation', desc: 'ALERTE CRITIQUE : Dérive de montant ou numéro détectée et bloquée !' },
            { name: 'language_pack.updated', desc: "Mise à jour d'un pack linguistique certifié ou validation de nouveaux termes." },
          ].map((evt, idx) => (
            <div
              key={idx}
              style={{
                border: '1px solid var(--line, rgba(10, 10, 10, 0.12))',
                borderRadius: 'var(--radius, 4px)',
                padding: '12px 16px',
                backgroundColor: 'var(--paper, #ffffff)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <code
                  style={{
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono, monospace)',
                    color: evt.name.includes('violation') ? '#B91C1C' : 'var(--green-deep, #08751A)',
                    fontSize: '13px',
                  }}
                >
                  {evt.name}
                </code>
              </div>
              <p
                style={{
                  margin: '4px 0 0 0',
                  fontSize: '12px',
                  color: 'var(--muted, rgba(10, 10, 10, 0.6))',
                }}
              >
                {evt.desc}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Simulator */}
      {subTab === 'simulator' && (
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
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
                  URL de Réception Webhook :
                </label>
                <input
                  type="text"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius, 4px)',
                    border: '1px solid var(--line-strong, rgba(10, 10, 10, 0.32))',
                    fontSize: '12px',
                    fontFamily: 'var(--font-mono, monospace)',
                    boxSizing: 'border-box',
                    backgroundColor: 'var(--paper, #ffffff)',
                    color: 'var(--ink, #0A0A0A)',
                  }}
                />
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
                  Clé Secrète de Signature :
                </label>
                <input
                  type="text"
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius, 4px)',
                    border: '1px solid var(--line-strong, rgba(10, 10, 10, 0.32))',
                    fontSize: '12px',
                    fontFamily: 'var(--font-mono, monospace)',
                    boxSizing: 'border-box',
                    backgroundColor: 'var(--paper, #ffffff)',
                    color: 'var(--ink, #0A0A0A)',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                style={{
                  padding: '7px 12px',
                  borderRadius: 'var(--radius, 4px)',
                  border: '1px solid var(--line-strong, rgba(10, 10, 10, 0.32))',
                  fontSize: '12px',
                  fontFamily: 'var(--font-body, sans-serif)',
                  backgroundColor: 'var(--paper, #ffffff)',
                  color: 'var(--ink, #0A0A0A)',
                }}
              >
                <option value="transaction.settled">transaction.settled</option>
                <option value="translation.drift_violation">translation.drift_violation</option>
                <option value="translation.completed">translation.completed</option>
              </select>

              <input
                type="text"
                placeholder="Montant (ex: 150 000 FCFA)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={{
                  padding: '7px 12px',
                  borderRadius: 'var(--radius, 4px)',
                  border: '1px solid var(--line-strong, rgba(10, 10, 10, 0.32))',
                  fontSize: '12px',
                  fontFamily: 'var(--font-mono, monospace)',
                  backgroundColor: 'var(--paper, #ffffff)',
                  color: 'var(--ink, #0A0A0A)',
                }}
              />

              <button
                onClick={handleSimulateWebhook}
                className="btn btn-primary"
                style={{
                  padding: '7px 16px',
                  fontSize: '12px',
                  gap: '6px',
                  cursor: 'pointer',
                }}
              >
                <Send size={12} strokeWidth={2} />
                Déclencher l&apos;Événement Signé
              </button>
            </div>
          </div>

          {deliveryResult && (
            <div
              style={{
                backgroundColor: 'var(--ink-2, #171717)',
                borderRadius: 'var(--radius, 4px)',
                padding: '16px',
                color: 'var(--bone, #F3F2ED)',
                border: '1px solid var(--line-invert, rgba(255, 255, 255, 0.14))',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '11.5px', fontFamily: 'var(--font-mono, monospace)', color: 'var(--muted-invert, rgba(255, 255, 255, 0.62))' }}>
                  Dispatch Status : <strong style={{ color: 'var(--green-glow, #4FE066)' }}>200 OK (Signé HMAC-SHA256)</strong>
                </span>
                <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono, monospace)', color: '#38bdf8' }}>
                  Idempotency Key: {deliveryResult.eventId}
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
                {JSON.stringify(deliveryResult, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Code */}
      {subTab === 'code' && (
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
{`import crypto from 'node:crypto';

export function verifyWebhookSignature(payloadRaw, signatureHeader, secretKey) {
  const hmac = crypto.createHmac('sha256', secretKey);
  const digest = 'sha256=' + hmac.update(payloadRaw).digest('hex');

  // Utilisation obligatoire de timingSafeEqual pour éviter les attaques temporelles
  return crypto.timingSafeEqual(
    Buffer.from(digest),
    Buffer.from(signatureHeader)
  );
}`}
          </pre>
        </div>
      )}
    </div>
  );
};
