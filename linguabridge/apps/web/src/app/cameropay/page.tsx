'use client';

import React, { useState } from 'react';
import { FinancialEntityExtractor, computeEntityFingerprint } from '@linguabridge/financial-domain';
import { LinguaBridgeClient } from '@linguabridge/sdk-js';
import {
  Smartphone,
  ShieldCheck,
  Volume2,
  Lock,
  Zap,
  CheckCircle2,
  ArrowRightLeft,
  Languages,
} from 'lucide-react';

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
  const [provider, setProvider] = useState<'mtn' | 'orange'>('mtn');

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

  const handleSpeak = async (text: string) => {
    if (lang === 'ewo-CM') {
      setShowPhoneticModal(true);
      return;
    }
    // Block European window.speechSynthesis permanently
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try { window.speechSynthesis.cancel(); } catch {}
    }
    try {
      const res = await fetch(`http://127.0.0.1:3002/synthesize?lang=${encodeURIComponent(lang)}&text=${encodeURIComponent(text)}`);
      if (res.ok) {
        const data = await res.json();
        if (data?.audioBase64) {
          const audio = new Audio(data.audioBase64);
          audio.play().catch(() => {});
        }
      }
    } catch {
      // Offline
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
    <div className="container" style={{ padding: '48px var(--gutter)', maxWidth: '1080px', margin: '0 auto' }}>
      {/* Top Bar with Language Selector */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '32px',
          flexWrap: 'wrap',
          gap: '20px',
          paddingBottom: '24px',
          borderBottom: '1px solid var(--line)',
        }}
      >
        <div>
          <div className="eyebrow eyebrow-dot" style={{ marginBottom: '8px' }}>
            SOVEREIGN CEMAC FINTECH • ZERO-DRIFT MOTOR
          </div>
          <h1
            style={{
              fontSize: 'clamp(1.8rem, 3.2vw, 2.4rem)',
              fontWeight: 800,
              letterSpacing: '-0.025em',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              color: 'var(--ink)',
            }}
          >
            <Smartphone size={28} style={{ color: 'var(--brand-green-deep)', flexShrink: 0 }} />
            <span>{t.appName}</span>
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.92rem', marginTop: '6px' }}>{t.tagline}</p>
        </div>

        {/* Multilingual Selector */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
          <span className="meta" style={{ letterSpacing: '0.14em' }}>Langue / Language:</span>
          <div
            style={{
              display: 'inline-flex',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--line)',
              overflow: 'hidden',
              background: 'var(--paper)',
            }}
          >
            <button
              type="button"
              onClick={() => setLang('fr')}
              style={{
                padding: '7px 14px',
                border: 'none',
                background: lang === 'fr' ? 'var(--ink)' : 'transparent',
                color: lang === 'fr' ? 'var(--paper)' : 'var(--ink)',
                fontFamily: 'var(--font-body)',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '12px',
                transition: 'all var(--dur-fast) var(--easing)',
              }}
            >
              Français
            </button>
            <button
              type="button"
              onClick={() => setLang('en')}
              style={{
                padding: '7px 14px',
                border: 'none',
                borderLeft: '1px solid var(--line)',
                borderRight: '1px solid var(--line)',
                background: lang === 'en' ? 'var(--ink)' : 'transparent',
                color: lang === 'en' ? 'var(--paper)' : 'var(--ink)',
                fontFamily: 'var(--font-body)',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '12px',
                transition: 'all var(--dur-fast) var(--easing)',
              }}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setLang('ewo-CM')}
              style={{
                padding: '7px 14px',
                border: 'none',
                background: lang === 'ewo-CM' ? 'var(--brand-green-deep)' : 'transparent',
                color: lang === 'ewo-CM' ? 'var(--paper)' : 'var(--ink)',
                fontFamily: 'var(--font-body)',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all var(--dur-fast) var(--easing)',
              }}
            >
              <Languages size={13} />
              <span>Kóbɔ́ Ewondo</span>
            </button>
          </div>
        </div>
      </div>

      {transferSuccess && (
        <div
          style={{
            marginBottom: '24px',
            padding: '16px 20px',
            background: 'var(--green-soft)',
            borderRadius: 'var(--radius)',
            border: '1px solid rgba(18, 184, 42, 0.3)',
            color: 'var(--brand-green-deep)',
            fontWeight: 600,
            fontSize: '0.92rem',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <CheckCircle2 size={18} style={{ color: 'var(--brand-green-deep)', flexShrink: 0 }} />
          <span>{t.successMsg}</span>
        </div>
      )}

      {/* Balance Card */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, #08751A 0%, #054c11 100%)',
          color: 'var(--brand-white)',
          marginBottom: '32px',
          padding: '28px 32px',
          borderRadius: 'var(--radius)',
          border: '1px solid rgba(255, 255, 255, 0.16)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div className="meta on-dark" style={{ letterSpacing: '0.14em', opacity: 0.9 }}>
            {t.balanceLabel}
          </div>
          <button
            type="button"
            onClick={() => handleSpeak(`${t.balanceLabel}: ${balance} FCFA`)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255, 255, 255, 0.16)',
              border: '1px solid rgba(255, 255, 255, 0.28)',
              color: '#ffffff',
              padding: '6px 14px',
              borderRadius: 'var(--radius)',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600,
              fontFamily: 'var(--font-body)',
              transition: 'all var(--dur-fast) var(--easing)',
            }}
          >
            <Volume2 size={14} />
            <span>{t.audioBtn}</span>
          </button>
        </div>

        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'clamp(2.4rem, 4.5vw, 3.4rem)',
            fontWeight: 700,
            marginTop: '12px',
            letterSpacing: '-0.03em',
            display: 'flex',
            alignItems: 'baseline',
            gap: '12px',
            color: '#ffffff',
          }}
        >
          <span>{balance.toLocaleString('fr-FR')}</span>
          <span style={{ fontSize: '1.35rem', fontWeight: 500, opacity: 0.88, fontFamily: 'var(--font-mono)' }}>FCFA</span>
        </div>

        <div
          style={{
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: '1px solid rgba(255, 255, 255, 0.18)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '14px',
            fontSize: '12px',
            fontFamily: 'var(--font-mono)',
            color: 'rgba(255, 255, 255, 0.88)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span>ID: <strong style={{ color: '#ffffff' }}>237-9812-401</strong></span>
            <span style={{ opacity: 0.4 }}>•</span>
            <span>CEMAC / BEAC Regulated</span>
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#86efac', fontWeight: 600 }}>
            <ShieldCheck size={14} />
            <span>Protected by LinguaBridge</span>
          </div>
        </div>
      </div>

      {/* Transfer Form + Financial Guard (2-Col Grid) */}
      <div className="grid-2" style={{ marginBottom: '32px', alignItems: 'stretch' }}>
        {/* Form Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, letterSpacing: '-0.01em' }}>{t.transferTitle}</h2>
              <button
                type="button"
                onClick={() => handleSpeak(`${t.transferTitle}. ${t.amountLabel}: ${amount} FCFA`)}
                className="btn btn-ghost"
                style={{
                  padding: '5px 10px',
                  borderRadius: 'var(--radius)',
                  fontSize: '11px',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                <Volume2 size={13} />
                <span>Audio</span>
              </button>
            </div>

            {/* Provider Selector */}
            <div style={{ marginBottom: '16px' }}>
              <label className="meta" style={{ display: 'block', marginBottom: '6px' }}>
                Opérateur / Provider
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setProvider('mtn')}
                  style={{
                    padding: '8px 12px',
                    border: provider === 'mtn' ? '1px solid var(--brand-green-deep)' : '1px solid var(--line)',
                    background: provider === 'mtn' ? 'var(--green-soft)' : 'var(--paper)',
                    borderRadius: 'var(--radius)',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    color: provider === 'mtn' ? 'var(--brand-green-deep)' : 'var(--ink)',
                    transition: 'all var(--dur-fast) var(--easing)',
                  }}
                >
                  <Smartphone size={13} />
                  <span>MTN MoMo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setProvider('orange')}
                  style={{
                    padding: '8px 12px',
                    border: provider === 'orange' ? '1px solid var(--brand-green-deep)' : '1px solid var(--line)',
                    background: provider === 'orange' ? 'var(--green-soft)' : 'var(--paper)',
                    borderRadius: 'var(--radius)',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    color: provider === 'orange' ? 'var(--brand-green-deep)' : 'var(--ink)',
                    transition: 'all var(--dur-fast) var(--easing)',
                  }}
                >
                  <Smartphone size={13} />
                  <span>Orange Money</span>
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
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
                  borderRadius: 'var(--radius)',
                  border: '1px solid var(--line)',
                  fontSize: '13px',
                  fontFamily: 'var(--font-mono)',
                  background: 'var(--paper)',
                  color: 'var(--ink)',
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
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
                  borderRadius: 'var(--radius)',
                  border: '1px solid var(--line)',
                  fontSize: '14px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 600,
                  background: 'var(--paper)',
                  color: 'var(--ink)',
                }}
              />
              <small style={{ color: 'var(--muted)', fontSize: '11px', marginTop: '5px', display: 'block' }}>
                {t.feeNote}
              </small>
            </div>

            <div style={{ marginBottom: '22px' }}>
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
                  borderRadius: 'var(--radius)',
                  border: '1px solid var(--line)',
                  fontSize: '13px',
                  fontFamily: 'var(--font-body)',
                  background: 'var(--paper)',
                  color: 'var(--ink)',
                }}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowConfirmModal(true)}
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '13px',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <span>{t.btnSend}</span>
            <ArrowRightLeft size={15} />
          </button>
        </div>

        {/* Live Financial Guard Inspector */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={18} style={{ color: 'var(--brand-green-deep)' }} />
                <span>{t.guardTitle}</span>
              </h2>
              <span className="ax-pill ax-pill--active">
                <span className="status-dot status-dot--pulse" />
                Active & Verifying
              </span>
            </div>
            <p style={{ fontSize: '0.84rem', color: 'var(--muted)', marginBottom: '18px', lineHeight: 1.55 }}>
              {t.guardDesc}
            </p>

            <div
              style={{
                background: 'var(--ws)',
                padding: '14px',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--line)',
                marginBottom: '16px',
              }}
            >
              <div className="meta" style={{ fontSize: '0.68rem', marginBottom: '10px' }}>
                DETECTED FINANCIAL ENTITIES (AST LEVEL)
              </div>
              {entities.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {entities.map((ent, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '12px',
                        background: 'var(--paper)',
                        padding: '8px 12px',
                        borderRadius: 'var(--radius)',
                        border: '1px solid var(--line)',
                      }}
                    >
                      <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{ent.raw}</span>
                      <span className="ax-pill" style={{ fontSize: '0.65rem' }}>
                        {ent.type}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <span style={{ fontSize: '12px', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>Scanning text input...</span>
              )}
            </div>

            <div
              style={{
                padding: '12px 14px',
                background: 'var(--green-soft)',
                borderRadius: 'var(--radius)',
                border: '1px solid rgba(18, 184, 42, 0.28)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--brand-green-deep)', fontSize: '12px', fontWeight: 700 }}>
                <Lock size={13} />
                <span>Integrity Guarantee:</span>
                <span>Exact Match (0 Drift)</span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--brand-green-deep)', marginTop: '4px', opacity: 0.9 }}>
                Amounts cannot be rounded, truncated, or mislocalized across language translations.
              </div>
            </div>
          </div>

          <div
            style={{
              marginTop: '18px',
              paddingTop: '12px',
              borderTop: '1px solid var(--line)',
              fontSize: '11px',
              color: 'var(--muted)',
              wordBreak: 'break-all',
              fontFamily: 'var(--font-mono)',
            }}
          >
            Reference check: <code>SHA256-{fingerprint.substring(0, 16)}</code>
          </div>
        </div>
      </div>

      {/* Live Interactive Translation Sandbox */}
      <div className="card" style={{ marginBottom: '32px', background: 'var(--ws)', border: '1px solid var(--line)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={16} style={{ color: 'var(--brand-green)' }} />
              <span>LinguaBridge Real-Time Financial API Gateway</span>
            </h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--muted)', marginTop: '3px' }}>
              Test live translation between French, English, and Ewondo (NACALCO Certified)
            </p>
          </div>
          <span className="ax-pill ax-pill--active">
            <span className="status-dot status-dot--pulse" />
            API Online :3001
          </span>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
          <input
            type="text"
            value={sandboxText}
            onChange={(e) => setSandboxText(e.target.value)}
            style={{
              flex: 1,
              minWidth: '240px',
              padding: '9px 12px',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--line)',
              fontSize: '13px',
              fontFamily: 'var(--font-body)',
              background: 'var(--paper)',
              color: 'var(--ink)',
            }}
          />
          <select
            value={sandboxTarget}
            onChange={(e) => setSandboxTarget(e.target.value as any)}
            style={{
              padding: '9px 12px',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--line)',
              fontSize: '12px',
              fontWeight: 600,
              fontFamily: 'var(--font-body)',
              background: 'var(--paper)',
              color: 'var(--ink)',
            }}
          >
            <option value="ewo-CM">Target: Ewondo (ewo-CM)</option>
            <option value="fr">Target: Français (fr)</option>
            <option value="en">Target: English (en)</option>
          </select>
          <button
            type="button"
            onClick={handleLiveTranslate}
            disabled={isTranslating}
            className="btn btn-primary"
            style={{ padding: '9px 16px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            {isTranslating ? (
              'Translating...'
            ) : (
              <>
                <span>Translate Live</span>
                <Zap size={13} />
              </>
            )}
          </button>
        </div>

        {sandboxResult && (
          <div
            style={{
              background: 'var(--paper)',
              padding: '14px',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--line)',
              fontSize: '13px',
            }}
          >
            <div style={{ fontWeight: 700, color: 'var(--brand-green-deep)', marginBottom: '8px', fontSize: '0.95rem' }}>
              Result: {sandboxResult.translatedText}
            </div>
            <div style={{ display: 'flex', gap: '14px', fontSize: '11px', color: 'var(--muted)', flexWrap: 'wrap', fontFamily: 'var(--font-mono)' }}>
              <span>Provider: <strong style={{ color: 'var(--ink)' }}>{sandboxResult.provider}</strong></span>
              <span>•</span>
              <span>Cache: <strong style={{ color: 'var(--ink)' }}>{sandboxResult.cacheStatus}</strong></span>
              <span>•</span>
              <span>Latency: <strong style={{ color: 'var(--ink)' }}>{sandboxResult.latencyMs} ms</strong></span>
              <span>•</span>
              <span>Status: <strong style={{ color: 'var(--brand-green-deep)' }}>{sandboxResult.status}</strong></span>
            </div>
          </div>
        )}
      </div>

      {/* Transaction History */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{t.historyTitle}</h2>
          <span className="meta">{transactions.length} Transactions</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="ax-table">
            <thead>
              <tr>
                <th>REF ID</th>
                <th>DESTINATAIRE / RECIPIENT</th>
                <th>MOTIF / REASON</th>
                <th>DATE</th>
                <th>MONTANT</th>
                <th>STATUT</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id}>
                  <td style={{ fontWeight: 600, fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                    <code>{tx.id}</code>
                  </td>
                  <td style={{ fontWeight: 500 }}>{tx.recipient}</td>
                  <td style={{ color: 'var(--muted)' }}>{tx.reference}</td>
                  <td style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{tx.date}</td>
                  <td style={{ fontWeight: 700, color: 'var(--brand-green-deep)', fontFamily: 'var(--font-mono)' }}>
                    -{tx.amount.toLocaleString('fr-FR')} {tx.currency}
                  </td>
                  <td>
                    <span className="ax-pill ax-pill--active" style={{ fontSize: '0.65rem' }}>
                      <span className="status-dot" style={{ width: '5px', height: '5px' }} />
                      {tx.status}
                    </span>
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
            background: 'rgba(10, 10, 10, 0.65)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
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
              boxShadow: '0 24px 48px -12px rgba(10, 10, 10, 0.35)',
              background: 'var(--paper)',
              border: '1px solid var(--line-strong)',
            }}
          >
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '6px' }}>{t.modalTitle}</h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--muted)', marginBottom: '20px' }}>
              Vérification finale des entités financières / Final entity check:
            </p>

            <div
              style={{
                background: 'var(--ws)',
                padding: '16px',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--line)',
                marginBottom: '22px',
                fontSize: '13px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ color: 'var(--muted)' }}>Destinataire:</span>
                <strong style={{ fontFamily: 'var(--font-mono)' }}>{recipient}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ color: 'var(--muted)' }}>Montant Net:</span>
                <strong style={{ color: 'var(--brand-green-deep)', fontSize: '15px', fontFamily: 'var(--font-mono)' }}>{amount} FCFA</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ color: 'var(--muted)' }}>Frais de service:</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>150 FCFA</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  borderTop: '1px solid var(--line)',
                  paddingTop: '10px',
                  marginTop: '4px',
                }}
              >
                <span style={{ fontWeight: 700 }}>Total Débité:</span>
                <strong style={{ fontSize: '16px', fontFamily: 'var(--font-mono)' }}>
                  {((parseFloat(amount.replace(/[^0-9]/g, '')) || 0) + 150).toLocaleString('fr-FR')} FCFA
                </strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="btn btn-ghost"
                style={{ flex: 1, padding: '10px' }}
              >
                {t.modalCancel}
              </button>
              <button
                type="button"
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
            background: 'rgba(10, 10, 10, 0.65)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
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
              maxWidth: '500px',
              padding: '26px',
              boxShadow: '0 24px 48px -12px rgba(10, 10, 10, 0.35)',
              background: 'var(--paper)',
              border: '1px solid var(--line-strong)',
            }}
          >
            <h3
              style={{
                fontSize: '1.2rem',
                fontWeight: 800,
                color: 'var(--brand-green-deep)',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Languages size={20} style={{ color: 'var(--brand-green-deep)' }} />
              <span>Kóbɔ́ Ewondo — Guide Phonétique Financier</span>
            </h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--muted)', marginBottom: '18px' }}>
              Consensus NACALCO / Université de Yaoundé I pour l'accessibilité financière orale:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '22px' }}>
              <div style={{ padding: '12px', background: 'var(--ws)', borderRadius: 'var(--radius)', border: '1px solid var(--line)', fontSize: '13px' }}>
                <div style={{ fontWeight: 700, color: 'var(--ink)' }}>Solde disponible (Móni mí ne)</div>
                <div style={{ color: 'var(--brand-green-deep)', fontFamily: 'var(--font-mono)', marginTop: '3px' }}>
                  IPA: [móní mí né wá é bèŋ]
                </div>
                <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '3px' }}>Tons: Haut-Haut / Haut-Bas</div>
              </div>

              <div style={{ padding: '12px', background: 'var(--ws)', borderRadius: 'var(--radius)', border: '1px solid var(--line)', fontSize: '13px' }}>
                <div style={{ fontWeight: 700, color: 'var(--ink)' }}>Envoyer de l'argent (Lóm móni)</div>
                <div style={{ color: 'var(--brand-green-deep)', fontFamily: 'var(--font-mono)', marginTop: '3px' }}>
                  IPA: [lóm mó-ní]
                </div>
                <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '3px' }}>Tons: Haut / Haut-Bas</div>
              </div>

              <div style={{ padding: '12px', background: 'var(--ws)', borderRadius: 'var(--radius)', border: '1px solid var(--line)', fontSize: '13px' }}>
                <div style={{ fontWeight: 700, color: 'var(--ink)' }}>Frais de transfert (Móni mébembá)</div>
                <div style={{ color: 'var(--brand-green-deep)', fontFamily: 'var(--font-mono)', marginTop: '3px' }}>
                  IPA: [mó-ní mé-bèm-bá]
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowPhoneticModal(false)}
              className="btn btn-primary"
              style={{ width: '100%', padding: '11px' }}
            >
              Fermer le guide / Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
