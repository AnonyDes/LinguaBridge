'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Cpu,
  Layers,
  Terminal,
  Volume2,
  Lock,
  Globe2,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  Laptop,
  Compass,
  FileText,
  AlertTriangle,
  Zap,
  Sparkles,
  Award,
  ChevronRight,
  BookOpen,
  Code2,
} from 'lucide-react';

export default function DocumentationPage() {
  const [activeTab, setActiveTab] = useState<'extension' | 'browser'>('extension');

  return (
    <div style={{ background: '#FFFFFF', minHeight: '100vh', color: 'var(--ink)' }}>
      {/* Top Breadcrumb & Hero */}
      <section
        style={{
          borderBottom: '1px solid var(--line)',
          background: 'linear-gradient(180deg, #F9FAF8 0%, #FFFFFF 100%)',
          paddingTop: 'clamp(40px, 5vw, 64px)',
          paddingBottom: 'clamp(40px, 5vw, 60px)',
        }}
      >
        <div className="wrap">
          {/* Breadcrumb & SAFINUM Tag */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12,
              marginBottom: 20,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem' }}>
              <Link href="/" style={{ color: 'var(--muted)', fontWeight: 500 }}>
                Accueil
              </Link>
              <span style={{ color: 'var(--line-strong)' }}>/</span>
              <span style={{ color: 'var(--brand-green-deep)', fontWeight: 700 }}>Documentation</span>
            </div>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: 'var(--green-soft)',
                border: '1px solid rgba(18, 184, 42, 0.25)',
                padding: '6px 14px',
                borderRadius: 'var(--radius-chip)',
                fontSize: '0.78rem',
                fontWeight: 700,
                color: 'var(--brand-green-deep)',
                letterSpacing: '0.04em',
              }}
            >
              <Award size={15} />
              SAFINUM INNOVATE CHALLENGE 2026 (CNEF / HUAWEI / AFRILAND FIRST BANK)
            </div>
          </div>

          {/* Heading */}
          <h1
            style={{
              fontSize: 'clamp(2.2rem, 4vw, 3.4rem)',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              lineHeight: 1.15,
              marginBottom: 18,
              maxWidth: '900px',
            }}
          >
            Spécifications Techniques &amp; Architecture de LinguaBridge
          </h1>

          <p
            className="lead"
            style={{
              maxWidth: '820px',
              fontSize: '1.18rem',
              lineHeight: 1.6,
              color: 'var(--muted)',
              marginBottom: 28,
            }}
          >
            Infrastructure souveraine d&apos;accessibilité multilingue pour les services financiers
            numériques au Cameroun et dans la zone CEMAC. Déploiement sans intrusion, garantie stricte
            d&apos;invariance des montants et synthèse vocale neuronale adaptée aux langues nationales.
          </p>

          {/* Quick Jump Anchor Pills */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 10,
              paddingTop: 8,
            }}
          >
            {[
              { label: '1. Architecture & Composants', href: '#architecture' },
              { label: '2. Sécurité & Invariant Δ = 0 FCFA', href: '#securite' },
              { label: '3. Qualité Linguistique & Ewondo', href: '#linguistique' },
              { label: '4. Guide de Démarrage & Tests', href: '#guide' },
            ].map((link) => (
              <a
                key={link.href}
                href={link.href}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 16px',
                  background: '#FFFFFF',
                  border: '1px solid var(--line)',
                  borderRadius: 'var(--radius)',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  color: 'var(--ink)',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>{link.label}</span>
                <ChevronRight size={14} style={{ color: 'var(--muted)' }} />
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Main Documentation Body */}
      <div className="wrap" style={{ paddingTop: 48, paddingBottom: 96 }}>
        {/* =========================================================================
            SECTION 1: ARCHITECTURE & COMPOSANTS
            ========================================================================= */}
        <section id="architecture" style={{ marginBottom: 80, scrollMarginTop: 90 }}>
          <div className="section-header" style={{ marginBottom: 32 }}>
            <div>
              <span className="meta-num">01 / SYSTÈME</span>
              <h2>Architecture &amp; Composants Majeurs</h2>
            </div>
            <p className="lead">
              LinguaBridge opère comme une couche d&apos;interopérabilité logicielle non-intrusive.
              Elle s&apos;articule autour de deux modalités d&apos;accès complémentaires et d&apos;un moteur
              sémantique financier souverain.
            </p>
          </div>

          {/* Two Modalities Grid */}
          <div className="grid-2" style={{ gap: 24, marginBottom: 32 }}>
            {/* Modality 1: Extension Web */}
            <div
              className="card"
              style={{
                padding: 32,
                border: '1px solid var(--line)',
                borderRadius: 8,
                background: '#FFFFFF',
                position: 'relative',
              }}
            >
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: '0.75rem',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--brand-green-deep)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  marginBottom: 12,
                }}
              >
                <Layers size={15} /> MODALITÉ 1 · PRODUCTION DISPONIBLE
              </div>
              <h3 style={{ fontSize: '1.35rem', marginBottom: 12 }}>
                Extension Web Chromium (Manifest V3)
              </h3>
              <p style={{ color: 'var(--muted)', lineHeight: 1.65, fontSize: '0.94rem', marginBottom: 16 }}>
                Conçue pour Google Chrome, Microsoft Edge et tout navigateur basé sur Chromium.
                Elle injecte une surcouche isolée (Shadow DOM) par-dessus les portails de banque en ligne
                et d&apos;opérateurs Mobile Money.
              </p>
              <ul
                style={{
                  listStyle: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  fontSize: '0.88rem',
                  color: 'var(--ink)',
                  marginBottom: 20,
                }}
              >
                <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle2 size={16} style={{ color: 'var(--brand-green)', flexShrink: 0 }} />
                  <span>
                    <strong>Accrochage latéral (Edge Docking) :</strong> Interface rétractable ne masquant
                    jamais les boutons de validation bancaire.
                  </span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle2 size={16} style={{ color: 'var(--brand-green)', flexShrink: 0 }} />
                  <span>
                    <strong>Touch-to-Speak :</strong> Lecture audio instantanée par survol ou appui d&apos;un élément.
                  </span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle2 size={16} style={{ color: 'var(--brand-green)', flexShrink: 0 }} />
                  <span>
                    <strong>Zéro modification du serveur bancaire :</strong> Déploiement immédiat côté client.
                  </span>
                </li>
              </ul>
              <Link
                href="/dashboard"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  color: 'var(--brand-green-deep)',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                }}
              >
                Guide d&apos;installation extension →
              </Link>
            </div>

            {/* Modality 2: LinguaBridge Browser (Bêta) */}
            <div
              className="card"
              style={{
                padding: 32,
                border: '1px solid rgba(18, 184, 42, 0.35)',
                borderRadius: 8,
                background: '#FAFCFA',
                position: 'relative',
              }}
            >
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: '0.75rem',
                  fontFamily: 'var(--font-mono)',
                  color: '#946200',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  marginBottom: 12,
                }}
              >
                <Compass size={15} /> MODALITÉ 2 · BÊTA AUTONOME
              </div>
              <h3 style={{ fontSize: '1.35rem', marginBottom: 12 }}>
                LinguaBridge Browser (Bêta)
              </h3>
              <p style={{ color: 'var(--muted)', lineHeight: 1.65, fontSize: '0.94rem', marginBottom: 16 }}>
                Navigateur web souverain autonome intégrant nativement le moteur d&apos;accessibilité.
                Conçu pour éliminer le besoin d&apos;installer une extension tierce, offrant une isolation
                maximale des transactions et une traduction automatisée transparente.
              </p>
              <ul
                style={{
                  listStyle: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  fontSize: '0.88rem',
                  color: 'var(--ink)',
                  marginBottom: 20,
                }}
              >
                <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle2 size={16} style={{ color: 'var(--brand-green)', flexShrink: 0 }} />
                  <span>
                    <strong>Moteur web isolé :</strong> Sandbox réseau étanche protégeant les flux bancaires.
                  </span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle2 size={16} style={{ color: 'var(--brand-green)', flexShrink: 0 }} />
                  <span>
                    <strong>Traduction automatique contextuelle :</strong> Détection automatique des formulaires financiers.
                  </span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle2 size={16} style={{ color: 'var(--brand-green)', flexShrink: 0 }} />
                  <span>
                    <strong>Cache local des lexiques :</strong> Fonctionnement optimal même sur connexions dégradées (2G/3G).
                  </span>
                </li>
              </ul>
              <span
                style={{
                  fontSize: '0.82rem',
                  color: 'var(--muted)',
                  fontStyle: 'italic',
                }}
              >
                Inclus dans la suite de démonstration SAFINUM 2026.
              </span>
            </div>
          </div>

          {/* Engine Components: Lexique & Meta MMS */}
          <div className="grid-2" style={{ gap: 24 }}>
            <div
              style={{
                padding: 24,
                border: '1px solid var(--line)',
                borderRadius: 8,
                background: '#FFFFFF',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <Cpu size={20} style={{ color: 'var(--brand-green)' }} />
                <h4 style={{ fontSize: '1.1rem', margin: 0 }}>Lexique Financier Souverain</h4>
              </div>
              <p style={{ color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                Base terminologique spécialisée contenant plus de 350 termes financiers critiques
                (solde, virement, frais de retrait, agios, commission, PIN, OTP, bénéficiaire, échéance).
                Les termes proviennent de dictionnaires certifiés (Apertium, CERDOTOLA, SIL) avec
                validation de cohérence contextuelle.
              </p>
            </div>

            <div
              style={{
                padding: 24,
                border: '1px solid var(--line)',
                borderRadius: 8,
                background: '#FFFFFF',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <Volume2 size={20} style={{ color: 'var(--brand-green)' }} />
                <h4 style={{ fontSize: '1.1rem', margin: 0 }}>Synthèse Vocale Neuronale (Meta MMS)</h4>
              </div>
              <p style={{ color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                Moteur vocal basé sur l&apos;architecture <strong>Meta MMS (Massively Multilingual Speech)</strong> et VITS.
                Restitution fidèle des caractéristiques prosodiques des langues camerounaises (tons hauts/bas en Ewondo,
                accent mélodique en Fulfulde). Latence de synthèse inférieure à 80ms pour une assistance fluide.
              </p>
            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION 2: SECURITE & INVARIANT FINANCIER
            ========================================================================= */}
        <section id="securite" style={{ marginBottom: 80, scrollMarginTop: 90 }}>
          <div className="section-header" style={{ marginBottom: 32 }}>
            <div>
              <span className="meta-num">02 / SÉCURITÉ</span>
              <h2>Intégrité &amp; Invariant Strict : Δ(Montants) = 0 FCFA</h2>
            </div>
            <p className="lead">
              En finance numérique, une mauvaise traduction peut altérer un montant ou un compte destinataire.
              LinguaBridge applique un invariant mathématique absolu vérifié cryptographiquement.
            </p>
          </div>

          {/* Invariant Banner */}
          <div
            style={{
              padding: '28px 32px',
              background: '#0A0A0A',
              color: '#FFFFFF',
              borderRadius: 8,
              marginBottom: 32,
              borderLeft: '6px solid var(--brand-green)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <ShieldCheck size={26} style={{ color: 'var(--brand-green)' }} />
              <h3 style={{ color: '#FFFFFF', margin: 0, fontSize: '1.4rem' }}>
                L&apos;Invariant Financier : Δ(Montants, Frais, Devises) = 0.0000 FCFA
              </h3>
            </div>
            <p style={{ color: 'rgba(255, 255, 255, 0.85)', lineHeight: 1.7, fontSize: '0.98rem', maxWidth: '880px' }}>
              Avant toute traduction, l&apos;extracteur d&apos;entités financières isole les données sensibles :
              montants numériques (ex. <code>25 000 FCFA</code>), frais de transaction (ex. <code>150 FCFA</code>),
              numéros de téléphone Mobile Money (format <code>2376XXXXXXXX</code>) et identifiants de compte.
              Une empreinte <strong>SHA-256</strong> est calculée. Après traduction, si une seule valeur diffère
              ou disparaît, la traduction est rejetée et le texte source original reste affiché.
            </p>
          </div>

          {/* Security Features Grid */}
          <div className="grid-3" style={{ gap: 20 }}>
            <div
              style={{
                padding: 24,
                border: '1px solid var(--line)',
                borderRadius: 8,
                background: '#FFFFFF',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Lock size={18} style={{ color: 'var(--brand-green)' }} />
                <h4 style={{ margin: 0, fontSize: '1.05rem' }}>Exécution 100% Côté Client</h4>
              </div>
              <p style={{ color: 'var(--muted)', fontSize: '0.88rem', lineHeight: 1.6 }}>
                Aucune donnée bancaire (PIN, mot de passe, solde, historique d&apos;opération) n&apos;est transmise
                à des serveurs tiers ou à des API distantes non souveraines. Tout le traitement s&apos;exécute
                en mémoire locale dans le bac à sable du navigateur.
              </p>
            </div>

            <div
              style={{
                padding: 24,
                border: '1px solid var(--line)',
                borderRadius: 8,
                background: '#FFFFFF',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <AlertTriangle size={18} style={{ color: '#946200' }} />
                <h4 style={{ margin: 0, fontSize: '1.05rem' }}>Zéro Exfiltration de Données</h4>
              </div>
              <p style={{ color: 'var(--muted)', fontSize: '0.88rem', lineHeight: 1.6 }}>
                L&apos;extension bloque formellement la lecture des champs <code>type=&quot;password&quot;</code>
                ou identifiés comme codes de sécurité (OTP). Les formulaires d&apos;authentification restent
                strictement préservés et intouchés.
              </p>
            </div>

            <div
              style={{
                padding: 24,
                border: '1px solid var(--line)',
                borderRadius: 8,
                background: '#FFFFFF',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Zap size={18} style={{ color: 'var(--brand-green)' }} />
                <h4 style={{ margin: 0, fontSize: '1.05rem' }}>Zéro Modification Portails</h4>
              </div>
              <p style={{ color: 'var(--muted)', fontSize: '0.88rem', lineHeight: 1.6 }}>
                Les institutions financières (Afriland First Bank, BICEC, Express Union, MTN, Orange)
                n&apos;ont pas besoin de réécrire leur code informatique ni d&apos;altérer leurs API de production.
                LinguaBridge agit comme un adaptateur universel d&apos;accessibilité.
              </p>
            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION 3: QUALITE LINGUISTIQUE & EWONDO
            ========================================================================= */}
        <section id="linguistique" style={{ marginBottom: 80, scrollMarginTop: 90 }}>
          <div className="section-header" style={{ marginBottom: 32 }}>
            <div>
              <span className="meta-num">03 / LINGUISTIQUE</span>
              <h2>Qualité Linguistique &amp; Langues Camerounaises</h2>
            </div>
            <p className="lead">
              L&apos;inclusion financière exige une précision terminologique irréprochable. LinguaBridge
              combine lexiques souverains certifiés et modèles phonétiques adaptés.
            </p>
          </div>

          {/* Languages Status Table */}
          <div
            style={{
              border: '1px solid var(--line)',
              borderRadius: 8,
              overflow: 'hidden',
              marginBottom: 32,
            }}
          >
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                textAlign: 'left',
                fontSize: '0.9rem',
              }}
            >
              <thead>
                <tr style={{ background: '#F8F9F8', borderBottom: '1px solid var(--line)' }}>
                  <th style={{ padding: '14px 18px', fontWeight: 700 }}>Langue &amp; Code ISO</th>
                  <th style={{ padding: '14px 18px', fontWeight: 700 }}>Famille Linguistique</th>
                  <th style={{ padding: '14px 18px', fontWeight: 700 }}>Statut Système</th>
                  <th style={{ padding: '14px 18px', fontWeight: 700 }}>Moteur Vocal (TTS)</th>
                  <th style={{ padding: '14px 18px', fontWeight: 700 }}>Couverture Terminologique</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid var(--line)', background: '#F5FCF6' }}>
                  <td style={{ padding: '14px 18px', fontWeight: 700 }}>
                    🇨🇲 Ewondo (<code>ewo-CM</code>)
                  </td>
                  <td style={{ padding: '14px 18px', color: 'var(--muted)' }}>Bantou (Groupe Fang-Beti)</td>
                  <td style={{ padding: '14px 18px' }}>
                    <span
                      style={{
                        background: '#E9F9EC',
                        color: 'var(--brand-green-deep)',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: 4,
                        fontSize: '0.78rem',
                      }}
                    >
                      ACTIF &amp; VALIDÉ
                    </span>
                  </td>
                  <td style={{ padding: '14px 18px' }}>Meta MMS (Tonalité Bantoue)</td>
                  <td style={{ padding: '14px 18px', color: 'var(--muted)' }}>
                    Lexique financier complet + phrases courantes
                  </td>
                </tr>

                <tr style={{ borderBottom: '1px solid var(--line)' }}>
                  <td style={{ padding: '14px 18px', fontWeight: 600 }}>
                    🇨🇲 Fulfulde (<code>fuv-CM</code>)
                  </td>
                  <td style={{ padding: '14px 18px', color: 'var(--muted)' }}>Sénégambien (Nord-Cameroun)</td>
                  <td style={{ padding: '14px 18px' }}>
                    <span
                      style={{
                        background: '#FFF3D6',
                        color: '#8A5B00',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: 4,
                        fontSize: '0.78rem',
                      }}
                    >
                      BÊTA TEST
                    </span>
                  </td>
                  <td style={{ padding: '14px 18px' }}>Meta MMS (Pitch accent)</td>
                  <td style={{ padding: '14px 18px', color: 'var(--muted)' }}>Vocabulaire bancaire de base</td>
                </tr>

                <tr style={{ borderBottom: '1px solid var(--line)' }}>
                  <td style={{ padding: '14px 18px', fontWeight: 600 }}>
                    🇨🇲 Haoussa (<code>hau-CM</code>)
                  </td>
                  <td style={{ padding: '14px 18px', color: 'var(--muted)' }}>Tchadique</td>
                  <td style={{ padding: '14px 18px' }}>
                    <span
                      style={{
                        background: '#FFF3D6',
                        color: '#8A5B00',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: 4,
                        fontSize: '0.78rem',
                      }}
                    >
                      BÊTA TEST
                    </span>
                  </td>
                  <td style={{ padding: '14px 18px' }}>Meta MMS (Registre bitonal)</td>
                  <td style={{ padding: '14px 18px', color: 'var(--muted)' }}>Termes financiers de transfert</td>
                </tr>

                <tr style={{ borderBottom: '1px solid var(--line)' }}>
                  <td style={{ padding: '14px 18px', fontWeight: 600 }}>
                    🇨🇲 Kanuri (<code>knc-CM</code>)
                  </td>
                  <td style={{ padding: '14px 18px', color: 'var(--muted)' }}>Saharien (Extrême-Nord)</td>
                  <td style={{ padding: '14px 18px' }}>
                    <span
                      style={{
                        background: '#FFF3D6',
                        color: '#8A5B00',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: 4,
                        fontSize: '0.78rem',
                      }}
                    >
                      BÊTA TEST
                    </span>
                  </td>
                  <td style={{ padding: '14px 18px' }}>Meta MMS (Cadence sahélienne)</td>
                  <td style={{ padding: '14px 18px', color: 'var(--muted)' }}>Glossaire transactions de base</td>
                </tr>

                <tr style={{ borderBottom: '1px solid var(--line)' }}>
                  <td style={{ padding: '14px 18px', fontWeight: 600 }}>
                    🇨🇲 Pidgin English (<code>pcm-CM</code>)
                  </td>
                  <td style={{ padding: '14px 18px', color: 'var(--muted)' }}>Créole à base anglaise</td>
                  <td style={{ padding: '14px 18px' }}>
                    <span
                      style={{
                        background: '#FFF3D6',
                        color: '#8A5B00',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: 4,
                        fontSize: '0.78rem',
                      }}
                    >
                      BÊTA TEST
                    </span>
                  </td>
                  <td style={{ padding: '14px 18px' }}>Meta MMS (Prosodie Kamtok)</td>
                  <td style={{ padding: '14px 18px', color: 'var(--muted)' }}>Terminologie Mobile Money</td>
                </tr>

                <tr>
                  <td style={{ padding: '14px 18px', fontWeight: 600 }}>
                    🇨🇲 Basaa &amp; Bulu (<code>bas-CM</code>, <code>bum-CM</code>)
                  </td>
                  <td style={{ padding: '14px 18px', color: 'var(--muted)' }}>Bantou</td>
                  <td style={{ padding: '14px 18px' }}>
                    <span
                      style={{
                        background: '#F0F2F5',
                        color: '#667085',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: 4,
                        fontSize: '0.78rem',
                      }}
                    >
                      FEUILLE DE ROUTE
                    </span>
                  </td>
                  <td style={{ padding: '14px 18px' }}>Modèles en calibration</td>
                  <td style={{ padding: '14px 18px', color: 'var(--muted)' }}>Corpus académique en cours d&apos;analyse</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Lexical Details */}
          <div
            style={{
              padding: 24,
              border: '1px solid var(--line)',
              borderRadius: 8,
              background: '#FFFFFF',
            }}
          >
            <h4 style={{ fontSize: '1.1rem', marginBottom: 12 }}>
              Exemples de Traduction Sémantique et Phonétique en Ewondo
            </h4>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: 16,
              }}
            >
              <div style={{ padding: 14, background: '#F8F9F8', borderRadius: 6 }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'block' }}>
                  Français Source
                </span>
                <strong style={{ display: 'block', margin: '4px 0 8px' }}>Consulter mon solde</strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--brand-green-deep)', display: 'block' }}>
                  Ewondo (Traduction &amp; Phonétique)
                </span>
                <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>Fágbá kòbò mǒnē wǎm</span>
              </div>

              <div style={{ padding: 14, background: '#F8F9F8', borderRadius: 6 }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'block' }}>
                  Français Source
                </span>
                <strong style={{ display: 'block', margin: '4px 0 8px' }}>Envoyer de l&apos;argent</strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--brand-green-deep)', display: 'block' }}>
                  Ewondo (Traduction &amp; Phonétique)
                </span>
                <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>Lóm mǒnē</span>
              </div>

              <div style={{ padding: 14, background: '#F8F9F8', borderRadius: 6 }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'block' }}>
                  Français Source
                </span>
                <strong style={{ display: 'block', margin: '4px 0 8px' }}>Frais de retrait : 150 FCFA</strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--brand-green-deep)', display: 'block' }}>
                  Ewondo avec Invariant Préserve
                </span>
                <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>
                  Mênkɔ́m m&apos;ǒkòlí : 150 FCFA
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION 4: GUIDE DE DEMARRAGE & PROCEDURE DE TEST
            ========================================================================= */}
        <section id="guide" style={{ marginBottom: 40, scrollMarginTop: 90 }}>
          <div className="section-header" style={{ marginBottom: 32 }}>
            <div>
              <span className="meta-num">04 / GUIDE PRATIQUE</span>
              <h2>Guide de Démarrage &amp; Procédure de Test SAFINUM</h2>
            </div>
            <p className="lead">
              Instructions détaillées étape par étape pour évaluer LinguaBridge lors des sessions de test
              du jury ou des démonstrations techniques.
            </p>
          </div>

          {/* Tab Selector */}
          <div
            style={{
              display: 'flex',
              gap: 8,
              borderBottom: '1px solid var(--line)',
              marginBottom: 28,
            }}
          >
            <button
              type="button"
              onClick={() => setActiveTab('extension')}
              style={{
                padding: '12px 20px',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'extension' ? '3px solid var(--brand-green)' : '3px solid transparent',
                fontWeight: activeTab === 'extension' ? 700 : 500,
                color: activeTab === 'extension' ? 'var(--brand-green-deep)' : 'var(--muted)',
                cursor: 'pointer',
                font: 'inherit',
                fontSize: '0.96rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Laptop size={17} />
              <span>Test Extension Web (Chrome / Edge)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('browser')}
              style={{
                padding: '12px 20px',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'browser' ? '3px solid var(--brand-green)' : '3px solid transparent',
                fontWeight: activeTab === 'browser' ? 700 : 500,
                color: activeTab === 'browser' ? 'var(--brand-green-deep)' : 'var(--muted)',
                cursor: 'pointer',
                font: 'inherit',
                fontSize: '0.96rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Compass size={17} />
              <span>Test LinguaBridge Browser (Bêta)</span>
            </button>
          </div>

          {/* Tab 1: Extension Guide */}
          {activeTab === 'extension' && (
            <div style={{ display: 'grid', gap: 24 }}>
              <div
                style={{
                  padding: 28,
                  border: '1px solid var(--line)',
                  borderRadius: 8,
                  background: '#FFFFFF',
                }}
              >
                <h3 style={{ fontSize: '1.25rem', marginBottom: 16 }}>
                  Installation &amp; Exécution de l&apos;Extension Chromium
                </h3>

                <ol style={{ paddingLeft: 20, display: 'grid', gap: 14, color: 'var(--ink)' }}>
                  <li>
                    <strong>Compilation locale des artefacts :</strong>
                    <div
                      style={{
                        background: '#0A0A0A',
                        color: '#67DB83',
                        fontFamily: 'var(--font-mono)',
                        padding: '10px 14px',
                        borderRadius: 6,
                        marginTop: 8,
                        fontSize: '0.84rem',
                      }}
                    >
                      pnpm --filter @linguabridge/translation-engine build<br />
                      pnpm --filter @linguabridge/extension build
                    </div>
                  </li>

                  <li>
                    <strong>Ouverture du gestionnaire d&apos;extensions :</strong>
                    <p style={{ margin: '6px 0 0', color: 'var(--muted)', fontSize: '0.9rem' }}>
                      Dans Google Chrome, saisissez <code>chrome://extensions</code>. Dans Microsoft Edge, saisissez <code>edge://extensions</code>.
                    </p>
                  </li>

                  <li>
                    <strong>Activation du Mode Développeur :</strong>
                    <p style={{ margin: '6px 0 0', color: 'var(--muted)', fontSize: '0.9rem' }}>
                      Activez le commutateur &quot;Mode développeur&quot; situé en haut à droite.
                    </p>
                  </li>

                  <li>
                    <strong>Chargement de l&apos;extension :</strong>
                    <p style={{ margin: '6px 0 0', color: 'var(--muted)', fontSize: '0.9rem' }}>
                      Cliquez sur <strong>&quot;Charger l&apos;extension non empaquetée&quot;</strong> et sélectionnez le dossier{' '}
                      <code>linguabridge/apps/extension/dist/</code>.
                    </p>
                  </li>

                  <li>
                    <strong>Évaluation sur un portail bancaire simulé :</strong>
                    <p style={{ margin: '6px 0 0', color: 'var(--muted)', fontSize: '0.9rem' }}>
                      Ouvrez l&apos;interface de test ou la page de démonstration. L&apos;icône LinguaBridge apparaît sur le bord latéral.
                      Sélectionnez la langue <strong>Ewondo</strong> et déclenchez la traduction et la lecture vocale.
                    </p>
                  </li>
                </ol>
              </div>
            </div>
          )}

          {/* Tab 2: Browser Guide */}
          {activeTab === 'browser' && (
            <div style={{ display: 'grid', gap: 24 }}>
              <div
                style={{
                  padding: 28,
                  border: '1px solid var(--line)',
                  borderRadius: 8,
                  background: '#FFFFFF',
                }}
              >
                <h3 style={{ fontSize: '1.25rem', marginBottom: 16 }}>
                  Exécution avec LinguaBridge Browser (Bêta)
                </h3>

                <ol style={{ paddingLeft: 20, display: 'grid', gap: 14, color: 'var(--ink)' }}>
                  <li>
                    <strong>Principe de fonctionnement :</strong>
                    <p style={{ margin: '6px 0 0', color: 'var(--muted)', fontSize: '0.9rem' }}>
                      Le LinguaBridge Browser isole complètement l&apos;environnement d&apos;exécution. Il intègre le moteur
                      de traduction de manière transparente sans aucune configuration manuelle d&apos;extension.
                    </p>
                  </li>

                  <li>
                    <strong>Navigation vers une URL financière :</strong>
                    <p style={{ margin: '6px 0 0', color: 'var(--muted)', fontSize: '0.9rem' }}>
                      Ouvrez n&apos;importe quelle page de service financier (ex. portail Afriland First Bank, page MTN MoMo).
                      La barre supérieure affiche immédiatement le sélecteur de langue nationale.
                    </p>
                  </li>

                  <li>
                    <strong>Traduction automatique avec contrôle d&apos;invariant :</strong>
                    <p style={{ margin: '6px 0 0', color: 'var(--muted)', fontSize: '0.9rem' }}>
                      Le moteur inspecte le flux DOM, applique l&apos;invariant Δ(Montants) = 0.0000 FCFA et présente l&apos;interface traduite
                      en Ewondo avec boutons d&apos;écoute neuronale (Touch-to-Speak).
                    </p>
                  </li>
                </ol>
              </div>
            </div>
          )}

          {/* Evaluation Scenarios Card */}
          <div
            style={{
              marginTop: 32,
              padding: 28,
              border: '1px solid var(--line)',
              borderRadius: 8,
              background: '#F9FAF9',
            }}
          >
            <h4 style={{ fontSize: '1.15rem', marginBottom: 14 }}>
              Scénarios d&apos;Évaluation Recommandés pour le Jury SAFINUM
            </h4>
            <div className="grid-3" style={{ gap: 16 }}>
              <div style={{ padding: 16, background: '#FFFFFF', borderRadius: 6, border: '1px solid var(--line)' }}>
                <strong style={{ display: 'block', marginBottom: 6, color: 'var(--brand-green-deep)' }}>
                  Scénario A : Solde &amp; Relevé
                </strong>
                <p style={{ fontSize: '0.84rem', color: 'var(--muted)', margin: 0, lineHeight: 1.5 }}>
                  Vérifier que les libellés sont traduits fidèlement en Ewondo tandis que les montants de solde
                  en FCFA et dates restent rigoureusement identiques au franc près.
                </p>
              </div>

              <div style={{ padding: 16, background: '#FFFFFF', borderRadius: 6, border: '1px solid var(--line)' }}>
                <strong style={{ display: 'block', marginBottom: 6, color: 'var(--brand-green-deep)' }}>
                  Scénario B : Envoi Mobile Money
                </strong>
                <p style={{ fontSize: '0.84rem', color: 'var(--muted)', margin: 0, lineHeight: 1.5 }}>
                  Saisir un montant et vérifier que les frais de retrait estimés et le numéro de téléphone récepteur
                  conservent leur format exact sans aucune distorsion textuelle.
                </p>
              </div>

              <div style={{ padding: 16, background: '#FFFFFF', borderRadius: 6, border: '1px solid var(--line)' }}>
                <strong style={{ display: 'block', marginBottom: 6, color: 'var(--brand-green-deep)' }}>
                  Scénario C : Écoute Vocale
                </strong>
                <p style={{ fontSize: '0.84rem', color: 'var(--muted)', margin: 0, lineHeight: 1.5 }}>
                  Utiliser la fonction Touch-to-Speak sur une consigne de sécurité ou un récapitulatif pour écouter
                  la prononciation neuronale Meta MMS en Ewondo.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Bottom CTA to test & inspect code */}
        <div
          style={{
            borderTop: '1px solid var(--line)',
            paddingTop: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div>
            <h4 style={{ margin: '0 0 6px', fontSize: '1.15rem' }}>Prêt à explorer le code source ?</h4>
            <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.92rem' }}>
              Le projet LinguaBridge est intégralement sous licence libre pour le SAFINUM Innovate Challenge.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link href="/dashboard" className="btn btn-primary">
              Portail d&apos;accès extension
            </Link>
            <a
              href="https://github.com/AnonyDes/LinguaBridge"
              target="_blank"
              rel="noreferrer"
              className="btn btn-ghost"
              style={{ border: '1px solid var(--line)' }}
            >
              Dépôt GitHub <ExternalLink size={15} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
