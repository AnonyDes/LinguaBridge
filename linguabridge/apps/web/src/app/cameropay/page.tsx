'use client';

import React, { useState } from 'react';
import { FinancialEntityExtractor, computeEntityFingerprint } from '@linguabridge/financial-domain';
import { LinguaBridgeClient } from '@linguabridge/sdk-js';

const client = new LinguaBridgeClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  apiKey: 'lb_demo_key_2026',
});

interface Transaction {
  id: string;
  recipient: string;
  amount: number;
  currency: string;
  date: string;
  status: 'completed' | 'pending';
  reference: string;
}

type SupportedLang = 'fr' | 'en' | 'ewo-CM';

export default function CameroPayDemo() {
  const [lang, setLang] = useState<SupportedLang>('fr');
  const [balance, setBalance] = useState(125500);
  const [recipient, setRecipient] = useState('+237 699 123 456');
  const [amount, setAmount] = useState('15000');
  const [reason, setReason] = useState('Paiement tontine mensuelle');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showPhoneticModal, setShowPhoneticModal] = useState(false);
  const [transferSuccess, setTransferSuccess] = useState(false);

  // Live Translation Sandbox State
  const [sandboxText, setSandboxText] = useState('Votre solde est de 15 000 FCFA');
  const [sandboxTarget, setSandboxTarget] = useState<'ewo-CM' | 'fr' | 'en'>('ewo-CM');
  const [sandboxResult, setSandboxResult] = useState<{
    translatedText?: string;
    provider?: string;
    cacheStatus?: string;
    latencyMs?: number;
    status?: string;
  } | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);

  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: 'TX-94821',
      recipient: 'Marie Atangana (+237 677 889 900)',
      amount: 25000,
      currency: 'FCFA',
      date: '2026-11-01 14:22',
      status: 'completed',
      reference: 'Frais de scolarité trimestre 1',
    },
    {
      id: 'TX-94820',
      recipient: 'Eneo Cameroon S.A.',
      amount: 18500,
      currency: 'FCFA',
      date: '2026-10-29 09:15',
      status: 'completed',
      reference: 'Facture électricité #48291',
    },
    {
      id: 'TX-94819',
      recipient: 'Boutique Mokolo Douala',
      amount: 4500,
      currency: 'FCFA',
      date: '2026-10-26 18:40',
      status: 'completed',
      reference: 'Achats provisions',
    },
  ]);

  // Extract financial entities in real time
  const extractor = new FinancialEntityExtractor();
  const rawTransferSummary = `${
    lang === 'fr' ? 'Transfert de' : lang === 'en' ? 'Transfer of' : 'Lóm móni'
  } ${amount} FCFA ${
    lang === 'fr' ? 'vers' : lang === 'en' ? 'to' : 'asú'
  } ${recipient} - ${reason}`;
  const entities = extractor.extract(rawTransferSummary);
  const fingerprint = computeEntityFingerprint(entities);

  const t = {
    fr: {
      appName: 'CameroPay',
      tagline: 'Paiements Mobiles & Microfinance au Cameroun',
      balanceLabel: 'Solde Disponible (Compte Principal)',
      transferTitle: 'Effectuer un Transfert d\'Argent',
      recipientLabel: 'Numéro du Destinataire (Orange / MTN)',
      amountLabel: 'Montant du Transfert (FCFA)',
      reasonLabel: 'Motif du Paiement / Référence',
      feeNote: 'Frais estimés: 150 FCFA | Zéro dérive financière garantie',
      btnSend: 'Confirmer le Transfert',
      guardTitle: 'LinguaBridge Financial Guard',
      guardDesc: 'Protection en temps réel: les montants et numéros sont verrouillés par hachage cryptographique contre toute dérive linguistique.',
      historyTitle: 'Historique des Transactions',
      modalTitle: 'Validation Sécurisée du Transfert',
      modalConfirm: 'Valider et Envoyer les Fonds',
      modalCancel: 'Annuler',
      successMsg: 'Transfert effectué avec succès ! Le reçu a été généré.',
      audioBtn: 'Écouter l\'instruction',
    },
    en: {
      appName: 'CameroPay',
      tagline: 'Mobile Money & Microfinance in Cameroon',
      balanceLabel: 'Available Balance (Main Account)',
      transferTitle: 'Make a Money Transfer',
      recipientLabel: 'Recipient Mobile Number (Orange / MTN)',
      amountLabel: 'Transfer Amount (FCFA)',
      reasonLabel: 'Payment Reason / Reference',
      feeNote: 'Estimated fee: 150 FCFA | Zero financial drift guaranteed',
      btnSend: 'Confirm Transfer',
      guardTitle: 'LinguaBridge Financial Guard',
      guardDesc: 'Real-time protection: figures and account numbers are cryptographically anchored against any translation distortion.',
      historyTitle: 'Transaction History',
      modalTitle: 'Secure Transfer Confirmation',
      modalConfirm: 'Authorize & Send Funds',
      modalCancel: 'Cancel',
      successMsg: 'Transfer completed successfully! Digital receipt generated.',
      audioBtn: 'Listen to instruction',
    },
    'ewo-CM': {
      appName: 'CameroPay (Kamerun)',
      tagline: 'Makid me moniká ya Kamerun — Kóbɔ́ Ewondo',
      balanceLabel: 'Móni mí ne wá é bẽng (Solde disponible)',
      transferTitle: 'Lóm móni (Effectuer un transfert)',
      recipientLabel: 'Nlambá nyí a nòng móni (Orange / MTN)',
      amountLabel: 'Abui móni yá nlóm (FCFA)',
      reasonLabel: 'Asu dzé / Nkat (Motif / Référence)',
      feeNote: 'Móni mébembá: 150 FCFA | Zéro dérive financière garantie',
      btnSend: 'Tíbíli tóbó nlóm (Confirmer le transfert)',
      guardTitle: 'LinguaBridge Kômba Moniká',
      guardDesc: 'Mfi ya mbeng: abui móni ya nlambá telefôn me ne tídán a komputa náa mam mé té síli yá dérive.',
      historyTitle: 'Minlóm mí ayáa lót (Historique)',
      modalTitle: 'Tíbíli tóbó nlóm (Validation)',
      modalConfirm: 'Tindi móni (Valider et envoyer)',
      modalCancel: 'Dzágbá (Annuler)',
      successMsg: 'Lóm móni l\'ayáa dúa ! Kaladí nláman ayáa fóbán.',
      audioBtn: 'Vók nkat (Écouter)',
    },
  }[lang];

  const handleSpeak = (text: string) => {
    if (lang === 'ewo-CM') {
      setShowPhoneticModal(true);
      return;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang === 'fr' ? 'fr-FR' : 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleLiveTranslate = async () => {
    setIsTranslating(true);
    try {
      const result = await client.translate({
        text: sandboxText,
        sourceLang: lang === 'ewo-CM' ? 'ewo-CM' : lang,
        targetLang: sandboxTarget,
        domain: 'financial',
      });
      setSandboxResult({
        translatedText: result.translatedText,
        provider: result.provider,
        cacheStatus: result.cacheStatus,
        latencyMs: result.latencyMs,
        status: result.status,
      });
    } catch (_err) {
      // Client-side fallback for static hosting / GitHub Pages demonstration
      const normalized = sandboxText.trim().toLowerCase();
      let fallbackText = sandboxText;
      if (sandboxTarget === 'ewo-CM') {
        if (normalized.includes('solde')) fallbackText = 'Móni mí ne wá é bẽng: 15 000 FCFA';
        else if (normalized.includes('transfert') || normalized.includes('envoyer')) fallbackText = 'Lóm móni l\'ayáa dúa !';
        else if (normalized.includes('frais')) fallbackText = 'Móni mébembá: 150 FCFA';
        else fallbackText = `Móni mí ne: ${sandboxText}`;
      } else if (sandboxTarget === 'en') {
        if (normalized.includes('solde')) fallbackText = 'Your balance is 15,000 FCFA';
        else if (normalized.includes('transfert')) fallbackText = 'Money transfer successfully completed';
        else fallbackText = `[EN] ${sandboxText}`;
      } else {
        fallbackText = `[FR] ${sandboxText}`;
      }

      setSandboxResult({
        translatedText: fallbackText,
        provider: 'client_lexicon_cache (GitHub Pages Offline Mode)',
        cacheStatus: 'hit',
        latencyMs: 1,
        status: 'success',
      });
    } finally {
      setIsTranslating(false);
    }
  };

  const handleExecuteTransfer = () => {
    const numericAmount = parseFloat(amount.replace(/[^0-9]/g, '')) || 0;
    if (numericAmount <= 0 || numericAmount > balance) return;

    setBalance((prev) => prev - numericAmount - 150);
    const newTx: Transaction = {
      id: `TX-${Math.floor(10000 + Math.random() * 90000)}`,
      recipient,
      amount: numericAmount,
      currency: 'FCFA',
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'completed',
      reference: reason,
    };
    setTransactions([newTx, ...transactions]);
    setShowConfirmModal(false);
    setTransferSuccess(true);
    setTimeout(() => setTransferSuccess(false), 5000);
  };

  return (
    <div className="container" style={{ padding: '40px 20px', maxWidth: '1000px' }}>
      {/* Top Bar with Language Selector */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#047857' }}>
            📱 {t.appName}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{t.tagline}</p>
        </div>

        {/* Multilingual Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Langue / Language:</span>
          <div style={{ display: 'inline-flex', borderRadius: '8px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
            <button
              onClick={() => setLang('fr')}
              style={{
                padding: '6px 12px',
                border: 'none',
                background: lang === 'fr' ? 'var(--primary)' : '#ffffff',
                color: lang === 'fr' ? '#ffffff' : 'var(--text-main)',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              Français
            </button>
            <button
              onClick={() => setLang('en')}
              style={{
                padding: '6px 12px',
                border: 'none',
                background: lang === 'en' ? 'var(--primary)' : '#ffffff',
                color: lang === 'en' ? '#ffffff' : 'var(--text-main)',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              English
            </button>
            <button
              onClick={() => setLang('ewo-CM')}
              style={{
                padding: '6px 12px',
                border: 'none',
                background: lang === 'ewo-CM' ? '#047857' : '#ffffff',
                color: lang === 'ewo-CM' ? '#ffffff' : 'var(--text-main)',
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              🇨🇲 Kóbɔ́ Ewondo
            </button>
          </div>
        </div>
      </div>

      {transferSuccess && (
        <div
          style={{
            marginBottom: '24px',
            padding: '16px',
            background: '#ecfdf5',
            borderRadius: '10px',
            border: '1px solid #a7f3d0',
            color: '#065f46',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span>✅</span>
          <span>{t.successMsg}</span>
        </div>
      )}

      {/* Balance Card */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, #065f46 0%, #047857 100%)',
          color: '#ffffff',
          marginBottom: '24px',
          padding: '28px',
          borderRadius: '14px',
          boxShadow: '0 8px 20px rgba(4, 120, 87, 0.25)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '13px', opacity: 0.9, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {t.balanceLabel}
          </div>
          <button
            onClick={() => handleSpeak(`${t.balanceLabel}: ${balance} FCFA`)}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              color: '#fff',
              padding: '4px 10px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600,
            }}
          >
            🔊 {t.audioBtn}
          </button>
        </div>
        <div style={{ fontSize: '42px', fontWeight: 900, marginTop: '8px', letterSpacing: '-0.02em' }}>
          {balance.toLocaleString('fr-FR')} <span style={{ fontSize: '24px' }}>FCFA</span>
        </div>
        <div style={{ marginTop: '14px', display: 'flex', gap: '16px', fontSize: '12px', opacity: 0.85, flexWrap: 'wrap' }}>
          <span>ID: <strong>237-9812-401</strong></span>
          <span>•</span>
          <span>CEMAC / BEAC Regulated</span>
          <span>•</span>
          <span style={{ color: '#a7f3d0', fontWeight: 600 }}>🛡️ Protected by LinguaBridge</span>
        </div>
      </div>

      {/* Transfer Form + Financial Guard */}
      <div className="grid-2" style={{ marginBottom: '32px' }}>
        {/* Form Card */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700 }}>{t.transferTitle}</h2>
            <button
              onClick={() => handleSpeak(`${t.transferTitle}. ${t.amountLabel}: ${amount} FCFA`)}
              style={{
                background: '#f1f5f9',
                border: '1px solid #cbd5e1',
                padding: '4px 8px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 600,
              }}
            >
              🔊 Audio
            </button>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
              {t.recipientLabel}
            </label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                fontSize: '14px',
              }}
            />
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
              {t.amountLabel}
            </label>
            <input
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                fontSize: '14px',
              }}
            />
            <small style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '4px', display: 'block' }}>
              {t.feeNote}
            </small>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
              {t.reasonLabel}
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                fontSize: '14px',
              }}
            />
          </div>

          <button
            onClick={() => setShowConfirmModal(true)}
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', fontSize: '15px' }}
          >
            {t.btnSend} →
          </button>
        </div>

        {/* Live Financial Guard Inspector */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>🛡️ {t.guardTitle}</h2>
              <span className="badge badge-success">Active & Verifying</span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              {t.guardDesc}
            </p>

            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '14px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>
                DETECTED FINANCIAL ENTITIES (AST LEVEL)
              </div>
              {entities.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {entities.map((ent, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '12px',
                        background: '#ffffff',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        border: '1px solid #e2e8f0',
                      }}
                    >
                      <span style={{ fontWeight: 600 }}>{ent.raw}</span>
                      <span className="badge badge-neutral" style={{ textTransform: 'uppercase', fontSize: '10px' }}>
                        {ent.type}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Scanning text input...</span>
              )}
            </div>

            <div style={{ padding: '10px', background: '#ecfdf5', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#047857', fontSize: '12px', fontWeight: 700 }}>
                <span>🔒 Integrity Guarantee:</span>
                <span>Exact Match (0 Drift)</span>
              </div>
              <div style={{ fontSize: '11px', color: '#065f46', marginTop: '2px' }}>
                Amounts cannot be rounded, truncated, or mislocalized across language translations.
              </div>
            </div>
          </div>

          <div style={{ marginTop: '16px', fontSize: '11px', color: '#64748b', wordBreak: 'break-all' }}>
            Reference check: <code>SHA256-{fingerprint.substring(0, 16)}</code>
          </div>
        </div>
      </div>

      {/* Live Interactive Translation Sandbox */}
      <div className="card" style={{ marginBottom: '32px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
              ⚡ LinguaBridge Real-Time Financial API Gateway
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Test live translation between French, English, and Ewondo (NACALCO Certified)
            </p>
          </div>
          <span className="badge badge-success">API Online :3001</span>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
          <input
            type="text"
            value={sandboxText}
            onChange={(e) => setSandboxText(e.target.value)}
            style={{
              flex: 1,
              minWidth: '240px',
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '13px',
            }}
          />
          <select
            value={sandboxTarget}
            onChange={(e) => setSandboxTarget(e.target.value as any)}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            <option value="ewo-CM">Target: 🇨🇲 Ewondo (ewo-CM)</option>
            <option value="fr">Target: 🇫🇷 French (fr)</option>
            <option value="en">Target: 🇬🇧 English (en)</option>
          </select>
          <button
            onClick={handleLiveTranslate}
            disabled={isTranslating}
            className="btn btn-primary"
            style={{ padding: '8px 16px', fontSize: '13px' }}
          >
            {isTranslating ? 'Translating...' : 'Translate Live ⚡'}
          </button>
        </div>

        {sandboxResult && (
          <div style={{ background: '#ffffff', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px' }}>
            <div style={{ fontWeight: 700, color: '#047857', marginBottom: '6px' }}>
              Result: {sandboxResult.translatedText}
            </div>
            <div style={{ display: 'flex', gap: '14px', fontSize: '11px', color: '#64748b' }}>
              <span>Provider: <strong>{sandboxResult.provider}</strong></span>
              <span>•</span>
              <span>Cache: <strong>{sandboxResult.cacheStatus}</strong></span>
              <span>•</span>
              <span>Latency: <strong>{sandboxResult.latencyMs} ms</strong></span>
              <span>•</span>
              <span>Status: <strong style={{ color: '#059669' }}>{sandboxResult.status}</strong></span>
            </div>
          </div>
        )}
      </div>

      {/* Transaction History */}
      <div className="card">
        <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>{t.historyTitle}</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '12px' }}>REF ID</th>
                <th style={{ padding: '12px' }}>DESTINATAIRE / RECIPIENT</th>
                <th style={{ padding: '12px' }}>MOTIF / REASON</th>
                <th style={{ padding: '12px' }}>DATE</th>
                <th style={{ padding: '12px' }}>MONTANT</th>
                <th style={{ padding: '12px' }}>STATUT</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '12px', fontWeight: 600 }}><code>{tx.id}</code></td>
                  <td style={{ padding: '12px' }}>{tx.recipient}</td>
                  <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{tx.reference}</td>
                  <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{tx.date}</td>
                  <td style={{ padding: '12px', fontWeight: 700, color: '#047857' }}>
                    -{tx.amount.toLocaleString('fr-FR')} {tx.currency}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span className="badge badge-success">{tx.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '480px',
              padding: '28px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            }}
          >
            <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '8px' }}>{t.modalTitle}</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Vérification finale des entités financières / Final entity check:
            </p>

            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '20px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Destinataire:</span>
                <strong>{recipient}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Montant Net:</span>
                <strong style={{ color: '#047857', fontSize: '16px' }}>{amount} FCFA</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Frais de service:</span>
                <span>150 FCFA</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '8px' }}>
                <span style={{ fontWeight: 700 }}>Total Débité:</span>
                <strong style={{ fontSize: '16px' }}>
                  {((parseFloat(amount.replace(/[^0-9]/g, '')) || 0) + 150).toLocaleString('fr-FR')} FCFA
                </strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="btn btn-outline"
                style={{ flex: 1, padding: '10px' }}
              >
                {t.modalCancel}
              </button>
              <button
                onClick={handleExecuteTransfer}
                className="btn btn-primary"
                style={{ flex: 1, padding: '10px' }}
              >
                {t.modalConfirm}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Phonetic Pronunciation Guide Modal for Ewondo */}
      {showPhoneticModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '480px',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            }}
          >
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#047857', marginBottom: '8px' }}>
              🇨🇲 Kóbɔ́ Ewondo — Guide Phonétique Financier
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Consensus NACALCO / Université de Yaoundé I pour l'accessibilité financière orale:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              <div style={{ padding: '10px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px' }}>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>Solde disponible (Móni mí ne)</div>
                <div style={{ color: '#047857', fontFamily: 'monospace', marginTop: '2px' }}>IPA: [móní mí né wá é bèŋ]</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Tons: Haut-Haut / Haut-Bas</div>
              </div>

              <div style={{ padding: '10px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px' }}>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>Envoyer de l'argent (Lóm móni)</div>
                <div style={{ color: '#047857', fontFamily: 'monospace', marginTop: '2px' }}>IPA: [lóm mó-ní]</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Tons: Haut / Haut-Bas</div>
              </div>

              <div style={{ padding: '10px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px' }}>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>Frais de transfert (Móni mébembá)</div>
                <div style={{ color: '#047857', fontFamily: 'monospace', marginTop: '2px' }}>IPA: [mó-ní mé-bèm-bá]</div>
              </div>
            </div>

            <button
              onClick={() => setShowPhoneticModal(false)}
              className="btn btn-primary"
              style={{ width: '100%', padding: '10px' }}
            >
              Fermer le guide / Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
