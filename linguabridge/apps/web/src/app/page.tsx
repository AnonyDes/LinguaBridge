'use client';

import React from 'react';
import Link from 'next/link';
import {
  Globe,
  ShieldCheck,
  Zap,
  Volume2,
  Lock,
  Layers,
  Compass,
  Laptop,
  ArrowRight,
  BookOpen,
  Github,
  ArrowUpRight,
  CheckCircle2,
  Award,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="wrap" style={{ paddingTop: 'clamp(44px, 5vw, 72px)', paddingBottom: 'clamp(64px, 8vw, 112px)' }}>
      {/* Top SAFINUM Pill Banner */}
      <div style={{ textAlign: 'center', marginBottom: 'var(--s-5)' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 16px',
            background: 'var(--green-soft)',
            border: '1px solid rgba(18, 184, 42, 0.22)',
            borderRadius: 'var(--radius-chip)',
            fontSize: '0.78rem',
            fontWeight: 700,
            color: 'var(--brand-green-deep)',
            letterSpacing: '0.04em',
          }}
        >
          <Award size={14} />
          SAFINUM INNOVATE CHALLENGE 2026 · CNEF / HUAWEI / AFRILAND FIRST BANK
        </div>
      </div>

      {/* Hero Section */}
      <section style={{ textAlign: 'center', marginBottom: 'clamp(64px, 8vw, 96px)' }}>
        <h1
          className="hero-type"
          style={{
            fontSize: 'var(--f-hero)',
            fontWeight: 800,
            letterSpacing: '-0.025em',
            lineHeight: 1.12,
            marginBottom: 'var(--s-4)',
            color: 'var(--ink)',
            maxWidth: '920px',
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          Your money. <span style={{ color: 'var(--brand-green)' }}>Your language.</span>
        </h1>

        <p
          className="lead"
          style={{
            fontSize: '1.18rem',
            color: 'var(--muted)',
            maxWidth: '740px',
            margin: '0 auto var(--s-7)',
            lineHeight: 1.6,
          }}
        >
          L&apos;inclusion financière commence par la compréhension. LinguaBridge apporte une couche
          d&apos;accessibilité multilingue souveraine aux services financiers au Cameroun (Afriland First Bank,
          MTN MoMo, Orange Money, Express Union), traduisant du français et de l&apos;anglais vers l&apos;Ewondo
          et les langues nationales avec synthèse vocale neuronale et garantie stricte des montants.
        </p>

        {/* Hero Actions: Extension CTA, Documentation link & GitHub */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: 14,
            marginBottom: 'var(--s-7)',
          }}
        >
          <Link
            href="/dashboard"
            className="btn btn-primary"
            style={{
              padding: '14px 26px',
              fontSize: '1rem',
              fontWeight: 700,
              gap: 8,
              boxShadow: '0 4px 14px rgba(18, 184, 42, 0.25)',
            }}
          >
            <span>Get the browser extension</span>
            <ArrowRight size={17} />
          </Link>

          <Link
            href="/documentation"
            className="btn btn-ghost"
            style={{
              padding: '14px 24px',
              fontSize: '0.98rem',
              fontWeight: 650,
              border: '1px solid var(--line-strong)',
              gap: 8,
            }}
          >
            <BookOpen size={18} />
            <span>Consulter la Documentation</span>
          </Link>

          <a
            href="https://github.com/AnonyDes/LinguaBridge"
            target="_blank"
            rel="noreferrer"
            className="btn btn-ghost"
            style={{
              padding: '14px 20px',
              fontSize: '0.95rem',
              fontWeight: 600,
              border: '1px solid var(--line)',
              gap: 8,
              color: 'var(--ink)',
            }}
            aria-label="LinguaBridge sur GitHub"
          >
            <Github size={18} />
            <span>GitHub</span>
            <ArrowUpRight size={16} style={{ color: 'var(--muted)' }} />
          </a>
        </div>

        {/* Sovereign Protocol Badges */}
        <div
          style={{
            marginTop: 'var(--s-6)',
            paddingTop: 'var(--s-5)',
            borderTop: '1px solid var(--line)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: 'clamp(16px, 3vw, 40px)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="status-dot status-dot--pulse"></span>
            <span className="meta" style={{ fontSize: '0.68rem', letterSpacing: '0.12em' }}>
              DESKTOP EXTENSION AVAILABLE FOR TESTING
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={15} style={{ color: 'var(--brand-green)' }} />
            <span className="meta" style={{ fontSize: '0.68rem', letterSpacing: '0.12em' }}>
              FINANCIAL DATA SAFEGUARDS
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Zap size={15} style={{ color: 'var(--brand-green)' }} />
            <span className="meta" style={{ fontSize: '0.68rem', letterSpacing: '0.12em' }}>
              FRENCH &amp; ENGLISH → CAMEROONIAN LANGUAGES
            </span>
          </div>
        </div>
      </section>

      {/* SECTION 1: TWO BALANCED ACCESS MODALITIES */}
      <section style={{ marginBottom: 'clamp(64px, 8vw, 104px)' }} aria-label="Modalités d'accès LinguaBridge">
        <div className="section-header">
          <div>
            <span className="meta-num">01 / MODALITÉS D&apos;ACCÈS</span>
            <h2>Deux modes complémentaires, une même souveraineté</h2>
          </div>
          <p className="lead">
            Pour répondre aux contraintes du terrain et des environnements bancaires, LinguaBridge offre deux
            modalités d&apos;accès synchronisées au même lexique financier certifié.
          </p>
        </div>

        <div className="grid-2" style={{ gap: 'var(--s-6)' }}>
          {/* Modality 1: Extension Web */}
          <article
            className="card"
            style={{
              padding: 'clamp(24px, 4vw, 36px)',
              border: '1px solid var(--line)',
              borderRadius: 8,
              background: '#FFFFFF',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: '0.74rem',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--brand-green-deep)',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  marginBottom: 12,
                }}
              >
                <Layers size={15} />
                MODALITÉ 1 · EXTENSION WEB
              </div>
              <h3 style={{ fontSize: '1.45rem', marginBottom: 14 }}>
                Extension Web Chromium (Manifest V3)
              </h3>
              <p style={{ color: 'var(--muted)', lineHeight: 1.65, fontSize: '0.96rem', marginBottom: 20 }}>
                Surcouche instantanée non-intrusive pour <strong>Google Chrome</strong> et <strong>Microsoft Edge</strong>.
                S&apos;intègre par-dessus n&apos;importe quelle interface financière sans jamais altérer le code
                source de la banque ou du fournisseur de paiement.
              </p>

              <ul
                style={{
                  listStyle: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  fontSize: '0.9rem',
                  marginBottom: 24,
                }}
              >
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <CheckCircle2 size={17} style={{ color: 'var(--brand-green)', marginTop: 2, flexShrink: 0 }} />
                  <span>
                    <strong>Accrochage latéral rétractable :</strong> Docking élégant sur le bord de l&apos;écran qui préserve
                    la visibilité des soldes et boutons de validation.
                  </span>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <CheckCircle2 size={17} style={{ color: 'var(--brand-green)', marginTop: 2, flexShrink: 0 }} />
                  <span>
                    <strong>Touch-to-Speak :</strong> Survol ou clic sur un libellé bancaire pour écouter instantanément
                    la prononciation Ewondo générée par Meta MMS.
                  </span>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <CheckCircle2 size={17} style={{ color: 'var(--brand-green)', marginTop: 2, flexShrink: 0 }} />
                  <span>
                    <strong>Respect strict de la vie privée :</strong> Traitement local dans le bac à sable du navigateur,
                    aucun mot de passe ou code secret n&apos;est lu.
                  </span>
                </li>
              </ul>
            </div>

            <div>
              <Link
                href="/dashboard"
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <span>Installer sur Chrome ou Edge</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </article>

          {/* Modality 2: LinguaBridge Browser */}
          <article
            className="card"
            style={{
              padding: 'clamp(24px, 4vw, 36px)',
              border: '1px solid rgba(18, 184, 42, 0.4)',
              borderRadius: 8,
              background: '#FAFCFA',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: '0.74rem',
                  fontFamily: 'var(--font-mono)',
                  color: '#946200',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  marginBottom: 12,
                }}
              >
                <Compass size={15} />
                MODALITÉ 2 · BÊTA SOUVERAINE
              </div>
              <h3 style={{ fontSize: '1.45rem', marginBottom: 14 }}>
                LinguaBridge Browser (Bêta)
              </h3>
              <p style={{ color: 'var(--muted)', lineHeight: 1.65, fontSize: '0.96rem', marginBottom: 20 }}>
                Navigateur web isolé conçu pour offrir une expérience fluide clé-en-main. Plus besoin
                de manipuler des extensions : le moteur de traduction et de synthèse vocale nationale
                est directement intégré au coeur du navigateur.
              </p>

              <ul
                style={{
                  listStyle: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  fontSize: '0.9rem',
                  marginBottom: 24,
                }}
              >
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <CheckCircle2 size={17} style={{ color: 'var(--brand-green)', marginTop: 2, flexShrink: 0 }} />
                  <span>
                    <strong>Moteur autonome étanche :</strong> Isolation sécurisée totale contre les extensions
                    ou scripts malveillants lors de transactions sensibles.
                  </span>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <CheckCircle2 size={17} style={{ color: 'var(--brand-green)', marginTop: 2, flexShrink: 0 }} />
                  <span>
                    <strong>Traduction automatique intelligente :</strong> Détection temps réel des pages bancaires
                    avec substitution sémantique immédiate en langue choisie.
                  </span>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <CheckCircle2 size={17} style={{ color: 'var(--brand-green)', marginTop: 2, flexShrink: 0 }} />
                  <span>
                    <strong>Mode hors-ligne résilient :</strong> Lexiques financiers mis en cache pour les zones
                    à faible couverture réseau.
                  </span>
                </li>
              </ul>
            </div>

            <div>
              <Link
                href="/documentation#guide"
                className="btn btn-ghost"
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  border: '1px solid var(--line-strong)',
                  background: '#FFFFFF',
                }}
              >
                <span>Consulter le guide de test du navigateur</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </article>
        </div>
      </section>

      {/* SECTION 2: FINANCIAL INTEGRITY & INVARIANT Δ = 0 FCFA */}
      <section style={{ marginBottom: 'clamp(64px, 8vw, 104px)' }} aria-label="Financial safety">
        <div className="section-header">
          <div>
            <span className="meta-num">02 / SAFETY FIRST</span>
            <h2>Understand the message. Preserve the numbers.</h2>
          </div>
          <p className="lead">
            Financial translation must protect what matters: amounts in FCFA, fees, account references,
            telephone numbers and beneficiary details.
          </p>
        </div>

        {/* Big Invariant Visual Banner */}
        <div
          style={{
            padding: 'clamp(28px, 4vw, 40px)',
            background: 'var(--ink)',
            color: 'var(--paper)',
            borderRadius: 8,
            marginBottom: 'var(--s-6)',
            borderLeft: '6px solid var(--brand-green)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
            <ShieldCheck size={28} style={{ color: 'var(--brand-green)' }} />
            <h3 style={{ color: 'var(--paper)', margin: 0, fontSize: 'clamp(1.25rem, 2.5vw, 1.6rem)' }}>
              L&apos;Invariant Mathématique Absolu : Δ(Montants) = 0.0000 FCFA
            </h3>
          </div>

          <p
            style={{
              color: 'var(--muted-invert)',
              fontSize: '1rem',
              lineHeight: 1.7,
              maxWidth: '860px',
              marginBottom: 20,
            }}
          >
            Chaque opération financière implique des chiffres critiques. Notre extracteur cryptographique
            isole les montants numériques (ex. <code>50 000 FCFA</code>), les frais de retrait (ex. <code>250 FCFA</code>)
            et les numéros destinataires. Si la traduction modifie ou omet ne serait-ce qu&apos;une décimale,
            l&apos;invariant est violé : la traduction est instantanément bloquée et la valeur source certifiée
            est maintenue.
          </p>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 20,
              fontSize: '0.86rem',
              fontFamily: 'var(--font-mono)',
              paddingTop: 14,
              borderTop: '1px solid var(--line-invert)',
              color: 'var(--brand-green)',
            }}
          >
            <span>✓ Empreinte SHA-256 pré- et post-traduction</span>
            <span>✓ Détection automatique des formats CEMAC (FCFA, XAF)</span>
            <span>✓ Préservation intégrale des RIB &amp; numéros MoMo</span>
          </div>
        </div>

        {/* Security Cards */}
        <div className="grid-2">
          <div className="card" style={{ padding: 'var(--s-6)', border: '1px solid var(--line)', background: '#FFFFFF' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <Lock size={19} style={{ color: 'var(--brand-green)' }} />
              <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Confidentialité Bancaire Côté Client</h3>
            </div>
            <p style={{ color: 'var(--muted)', lineHeight: 1.65 }}>
              LinguaBridge s&apos;exécute intégralement dans le bac à sable local du client. Aucune donnée
              bancaire sensible, aucun identifiant ni mot de passe n&apos;est jamais transmis vers des serveurs
              distants. Le système respecte les exigences de sécurité bancaire les plus strictes.
            </p>
          </div>

          <div className="card" style={{ padding: 'var(--s-6)', border: '1px solid var(--line)', background: '#FFFFFF' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <Zap size={19} style={{ color: 'var(--brand-green)' }} />
              <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Zéro Modification des Portails Bancaires</h3>
            </div>
            <p style={{ color: 'var(--muted)', lineHeight: 1.65 }}>
              Aucune intégration lourde ni modification de code source n&apos;est exigée d&apos;Afriland First Bank
              ou des opérateurs de télécommunications. LinguaBridge fonctionne comme une surcouche universelle,
              rendant tout service financier immédiatement accessible.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 3: LINGUISTIC SOVEREIGNTY & EWONDO */}
      <section style={{ marginBottom: 'clamp(64px, 8vw, 104px)' }}>
        <div className="section-header">
          <div>
            <span className="meta-num">03 / LANGUES NATIONALES</span>
            <h2>L&apos;Ewondo au coeur, les langues nationales en horizon</h2>
          </div>
          <p className="lead">
            Une traduction financière ne s&apos;improvise pas : elle s&apos;appuie sur des lexiques validés et une
            synthèse neuronale respectueuse des subtilités tonales bantoues et sahéliennes.
          </p>
        </div>

        <div className="grid-3" style={{ gap: 20 }}>
          <div style={{ padding: 24, border: '1px solid var(--line)', borderRadius: 8, background: '#FFFFFF' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <Globe size={18} style={{ color: 'var(--brand-green)' }} />
              <span className="meta" style={{ color: 'var(--brand-green-deep)', fontWeight: 700 }}>
                LANGUE ACTIVE · EWONDO
              </span>
            </div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: 10 }}>Ewondo (ewo-CM)</h3>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>
              Lexique de plus de 350 termes financiers de base (solde, virement, frais, compte, alerte).
              Prononciation avec gestion des tons hauts et bas via le moteur vocal Meta MMS.
            </p>
          </div>

          <div style={{ padding: 24, border: '1px solid var(--line)', borderRadius: 8, background: '#FFFFFF' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <Volume2 size={18} style={{ color: '#946200' }} />
              <span className="meta" style={{ color: '#946200', fontWeight: 700 }}>
                FEUILLE DE ROUTE VALIDÉE
              </span>
            </div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: 10 }}>Fulfulde, Haoussa &amp; Kanuri</h3>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>
              Packs terminologiques et acoustiques pour le Grand Nord Cameroun. Modèles de pitch accent
              et cadences sahéliennes en phase de validation par locuteurs natifs.
            </p>
          </div>

          <div style={{ padding: 24, border: '1px solid var(--line)', borderRadius: 8, background: '#FFFFFF' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <Volume2 size={18} style={{ color: '#946200' }} />
              <span className="meta" style={{ color: '#946200', fontWeight: 700 }}>
                EXPANSION CEMAC
              </span>
            </div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: 10 }}>Cameroon Pidgin &amp; Basaa</h3>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>
              Prosodie Kamtok pour les échanges informels et corpus académiques Basaa/Bulu en cours
              de numérisation pour élargir l&apos;accessibilité à tout le territoire national.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 4: CALL TO ACTION BANNER */}
      <section
        style={{
          background: 'linear-gradient(135deg, #071A46 0%, #0A0A0A 100%)',
          color: '#FFFFFF',
          borderRadius: 12,
          padding: 'clamp(36px, 6vw, 64px) clamp(24px, 5vw, 48px)',
          textAlign: 'center',
        }}
      >
        <span
          className="meta"
          style={{
            color: 'var(--brand-green)',
            letterSpacing: '0.14em',
            fontSize: '0.78rem',
            display: 'block',
            marginBottom: 16,
          }}
        >
          INFRASTRUCTURE SOUVERAINE D&apos;INCLUSION FINANCIÈRE
        </span>

        <h2
          style={{
            fontSize: 'clamp(1.8rem, 3.5vw, 2.7rem)',
            fontWeight: 800,
            letterSpacing: '-0.025em',
            color: '#FFFFFF',
            marginBottom: 16,
            maxWidth: '720px',
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          Prêt à tester LinguaBridge pour le SAFINUM Innovate Challenge ?
        </h2>

        <p
          style={{
            color: 'rgba(255, 255, 255, 0.75)',
            fontSize: '1.05rem',
            maxWidth: '620px',
            margin: '0 auto 32px',
            lineHeight: 1.65,
          }}
        >
          Téléchargez l&apos;extension de test décompressée pour Chrome ou Edge, essayez notre assistant financier
          ou consultez notre documentation technique d&apos;évaluation.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 14 }}>
          <Link
            href="/dashboard"
            className="btn btn-primary"
            style={{
              padding: '14px 26px',
              fontSize: '0.98rem',
              fontWeight: 700,
              gap: 8,
            }}
          >
            <span>Accéder au portail extension</span>
            <ArrowRight size={17} />
          </Link>

          <Link
            href="/assistant"
            className="btn btn-ghost"
            style={{
              padding: '14px 24px',
              fontSize: '0.98rem',
              fontWeight: 650,
              background: 'rgba(255, 255, 255, 0.1)',
              color: '#FFFFFF',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              gap: 8,
            }}
          >
            <span>Tester l&apos;Assistant Financier</span>
          </Link>

          <Link
            href="/documentation"
            className="btn btn-ghost"
            style={{
              padding: '14px 24px',
              fontSize: '0.98rem',
              fontWeight: 650,
              background: 'transparent',
              color: '#FFFFFF',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              gap: 8,
            }}
          >
            <BookOpen size={17} />
            <span>Spécifications &amp; Architecture</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
