'use client';

import React, { useState } from 'react';

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
              Webhooks Bancaires & Bus d'Événements d'Entreprise
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
              HMAC-SHA256 Signé
            </span>
          </div>
          <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: '#64748b' }}>
            Flux d'événements transactionnels bancaires en temps réel : notifications sécurisées, audits d'invariance et intégration Core Banking asynchrone.
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
          { id: 'security', label: '🛡️ Sécurité & Signature HMAC' },
          { id: 'events', label: '⚡ Événements Supportés' },
          { id: 'simulator', label: '🧪 Simulateur d\'Envoi Live' },
          { id: 'code', label: '💻 Vérification Signature (Node.js)' },
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
              Architecture Événementielle pour Systèmes Bancaires
            </h4>
            <p style={{ margin: 0, fontSize: '13px', color: '#475569', lineHeight: 1.6 }}>
              Les Webhooks d'entreprise LinguaBridge permettent à vos systèmes Core Banking (Amphora, Delta Bank, Sopra) et applications partenaires de réagir instantanément aux événements de traitement linguistique, de validation d'intégrité financière et d'audit sans polling répété.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', backgroundColor: '#ffffff' }}>
              <span style={{ fontSize: '24px' }}>🔐</span>
              <h5 style={{ margin: '8px 0 4px 0', fontSize: '14px', color: '#0f172a' }}>Authentification HMAC-SHA256</h5>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748b', lineHeight: 1.5 }}>
                Chaque payload est signé avec une clé secrète partagée. Validation temporelle stricte contre le rejeu.
              </p>
            </div>
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', backgroundColor: '#ffffff' }}>
              <span style={{ fontSize: '24px' }}>🔄</span>
              <h5 style={{ margin: '8px 0 4px 0', fontSize: '14px', color: '#0f172a' }}>Politique de Réessai Exponentielle</h5>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748b', lineHeight: 1.5 }}>
                En cas d'échec de réception côté banque, 5 tentatives automatiques sont échelonnées avec backoff exponentiel.
              </p>
            </div>
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', backgroundColor: '#ffffff' }}>
              <span style={{ fontSize: '24px' }}>📋</span>
              <h5 style={{ margin: '8px 0 4px 0', fontSize: '14px', color: '#0f172a' }}>Piste d'Audit Immuable</h5>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748b', lineHeight: 1.5 }}>
                Chaque dispatch consigne l'identifiant d'événement, les latences d'accusé de réception et le statut HTTP dans la base Supabase.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Security */}
      {subTab === 'security' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#0f172a' }}>
              En-têtes de Sécurité Envoyés avec Chaque Événement
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { header: 'x-linguabridge-signature', desc: 'Empreinte hexadécimale HMAC-SHA256 calculée sur le body brut.' },
                { header: 'x-linguabridge-timestamp', desc: 'Timestamp Unix en secondes pour rejeter les requêtes antérieures à 300s.' },
                { header: 'x-linguabridge-delivery', desc: 'Identifiant unique d\'événement pour garantir l\'idempotence côté banque.' },
                { header: 'x-linguabridge-event', desc: 'Type d\'événement (ex: translation.drift_violation, transaction.settled).' },
              ].map((h, i) => (
                <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'center', backgroundColor: '#f8fafc', padding: '8px 12px', borderRadius: '6px' }}>
                  <code style={{ fontSize: '12px', fontWeight: 700, color: '#15803d' }}>{h.header}</code>
                  <span style={{ fontSize: '12px', color: '#475569' }}>{h.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Events */}
      {subTab === 'events' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[
            { name: 'transaction.settled', desc: 'Confirmation de règlement interbancaire validée par l\'infrastructure.' },
            { name: 'translation.completed', desc: 'Document ou lot bancaire traduit avec succès sans aucune dérive.' },
            { name: 'translation.drift_violation', desc: 'ALERTE CRITIQUE : Dérive de montant ou numéro détectée et bloquée !' },
            { name: 'language_pack.updated', desc: 'Mise à jour d\'un pack linguistique certifié ou validation de nouveaux termes.' },
          ].map((evt, idx) => (
            <div key={idx} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px 16px', backgroundColor: '#ffffff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <code style={{ fontWeight: 700, color: evt.name.includes('violation') ? '#dc2626' : '#15803d', fontSize: '13px' }}>
                  {evt.name}
                </code>
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>{evt.desc}</p>
            </div>
          ))}
        </div>
      )}

      {/* Simulator */}
      {subTab === 'simulator' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', backgroundColor: '#ffffff', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                  URL de Réception Webhook :
                </label>
                <input
                  type="text"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                  Clé Secrète de Signature :
                </label>
                <input
                  type="text"
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
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
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
              />

              <button
                onClick={handleSimulateWebhook}
                className="btn"
                style={{
                  padding: '8px 18px',
                  backgroundColor: '#16a34a',
                  color: '#ffffff',
                  borderRadius: '6px',
                  fontWeight: 700,
                  fontSize: '12px',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                ⚡ Déclencher l'Événement Signé
              </button>
            </div>
          </div>

          {deliveryResult && (
            <div style={{ backgroundColor: '#0f172a', borderRadius: '8px', padding: '16px', color: '#f8fafc' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                  Dispatch Status : <strong style={{ color: '#4ade80' }}>200 OK (Signé HMAC-SHA256)</strong>
                </span>
                <span style={{ fontSize: '11px', color: '#38bdf8' }}>
                  Idempotency Key: {deliveryResult.eventId}
                </span>
              </div>
              <pre style={{ margin: 0, fontSize: '12px', fontFamily: 'monospace', overflowX: 'auto' }}>
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
              backgroundColor: '#0f172a',
              color: '#f8fafc',
              padding: '14px',
              borderRadius: '8px',
              fontSize: '12px',
              overflowX: 'auto',
              margin: 0,
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
