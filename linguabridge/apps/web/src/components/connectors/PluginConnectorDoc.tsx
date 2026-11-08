'use client';

import React, { useState } from 'react';
import {
  BookOpen,
  Volume2,
  Globe,
  Landmark,
  Package,
  Zap,
  ShieldCheck,
  CheckSquare,
} from 'lucide-react';

export const PluginConnectorDoc: React.FC = () => {
  const [subTab, setSubTab] = useState<'overview' | 'hover' | 'dom' | 'banking' | 'install'>('overview');
  const [hoveredPreview, setHoveredPreview] = useState<string | null>(null);
  const [spokenText, setSpokenText] = useState<string | null>(null);

  const simulateHover = (text: string, translation: string) => {
    setHoveredPreview(text);
    setTimeout(() => {
      setSpokenText(translation);
    }, 220); // 220ms debounce standard
  };

  const simulateLeave = () => {
    setHoveredPreview(null);
  };

  const subTabs = [
    { id: 'overview', label: "Vue d'ensemble", icon: <BookOpen size={14} /> },
    { id: 'hover', label: 'Hover-to-Speak (Survol Vocal)', icon: <Volume2 size={14} /> },
    { id: 'dom', label: 'Traduction DOM & ShadowRoot', icon: <Globe size={14} /> },
    { id: 'banking', label: 'Intégration Banques & Guichets', icon: <Landmark size={14} /> },
    { id: 'install', label: 'Installation Mode Développeur', icon: <Package size={14} /> },
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
              Extension & Plugin Navigateur (Chrome MV3)
            </h2>
            <span
              className="ax-pill ax-pill--active"
              style={{
                fontSize: '10px',
                padding: '3px 8px',
              }}
            >
              Hover-to-Speak 220ms
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
            Assistant d'accessibilité bancaire universel injecté dans les portails Web Banking marchands : prononciation vocale instantanée au survol et traduction DOM intégrale.
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
              Accessibilité Bancaire Sans Friction
            </h4>
            <p
              style={{
                margin: 0,
                fontSize: '13px',
                color: 'var(--muted, rgba(10, 10, 10, 0.6))',
                lineHeight: 1.6,
              }}
            >
              L'extension Chrome Manifest V3 de LinguaBridge comble le fossé linguistique pour les millions de citoyens camerounais utilisant les services bancaires en ligne. Elle s'injecte de façon isolée et sécurisée dans les pages web, analyse le DOM sans perturber le code bancaire, et offre un survol vocal immédiat pour que chaque opération financière soit comprise.
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
                <Zap size={18} strokeWidth={2} />
              </div>
              <h5
                style={{
                  margin: '0 0 4px 0',
                  fontSize: '13.5px',
                  fontWeight: 700,
                  color: 'var(--ink, #0A0A0A)',
                }}
              >
                Dwell 220ms & 0 Latence
              </h5>
              <p
                style={{
                  margin: 0,
                  fontSize: '12px',
                  color: 'var(--muted, rgba(10, 10, 10, 0.6))',
                  lineHeight: 1.5,
                }}
              >
                Détection instantanée du pointeur avec temporisation de 220ms évitant les déclenchements parasites lors des déplacements rapides.
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
                Isolation Totale Sandbox
              </h5>
              <p
                style={{
                  margin: 0,
                  fontSize: '12px',
                  color: 'var(--muted, rgba(10, 10, 10, 0.6))',
                  lineHeight: 1.5,
                }}
              >
                Aucune fuite de données : l'extension ne transmet aucune donnée sensible ou identifiant bancaire vers l'extérieur.
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
                <CheckSquare size={18} strokeWidth={2} />
              </div>
              <h5
                style={{
                  margin: '0 0 4px 0',
                  fontSize: '13.5px',
                  fontWeight: 700,
                  color: 'var(--ink, #0A0A0A)',
                }}
              >
                Couverture Exhaustive
              </h5>
              <p
                style={{
                  margin: 0,
                  fontSize: '12px',
                  color: 'var(--muted, rgba(10, 10, 10, 0.6))',
                  lineHeight: 1.5,
                }}
              >
                Traduit non seulement les paragraphes mais aussi les boutons d'action, tableaux d'amortissement, inputs placeholders et Shadow DOMs.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Hover */}
      {subTab === 'hover' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            style={{
              border: '1px solid var(--line, rgba(10, 10, 10, 0.12))',
              padding: '16px',
              borderRadius: 'var(--radius, 4px)',
              backgroundColor: 'var(--paper, #ffffff)',
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
              Simulateur Interactif de Survol Vocal (Hover-to-Speak)
            </h4>
            <p
              style={{
                margin: '0 0 16px 0',
                fontSize: '12px',
                color: 'var(--muted, rgba(10, 10, 10, 0.6))',
              }}
            >
              Survolez les éléments ci-dessous avec votre souris pour observer le comportement de lecture vocale instantanée :
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                {
                  id: 'el-1',
                  fr: 'Confirmer le virement de 50 000 FCFA',
                  ewo: 'Bámse élómán ya 50 000 FCFA',
                },
                {
                  id: 'el-2',
                  fr: 'Frais de transaction : 350 FCFA vers 699123456',
                  ewo: "Móni m'esí: 350 FCFA é be 699123456",
                },
                {
                  id: 'el-3',
                  fr: 'Solde restant disponible : 124 500 FCFA',
                  ewo: "Móni m'ékabedá m'asúk: 124 500 FCFA",
                },
              ].map((item) => (
                <div
                  key={item.id}
                  onMouseEnter={() => simulateHover(item.fr, item.ewo)}
                  onMouseLeave={simulateLeave}
                  style={{
                    padding: '12px 16px',
                    borderRadius: 'var(--radius, 4px)',
                    border: hoveredPreview === item.fr
                      ? '1px solid var(--green, #12B82A)'
                      : '1px solid var(--line, rgba(10, 10, 10, 0.12))',
                    backgroundColor: hoveredPreview === item.fr
                      ? 'var(--green-soft, #E9F9EC)'
                      : 'var(--ws, #F6F6F4)',
                    cursor: 'pointer',
                    transition: 'all 0.15s var(--easing, ease)',
                  }}
                >
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink, #0A0A0A)' }}>
                    {item.fr}
                  </div>
                  <div
                    style={{
                      fontSize: '11px',
                      color: 'var(--green-deep, #08751A)',
                      marginTop: '3px',
                      fontFamily: 'var(--font-mono, monospace)',
                      fontWeight: 500,
                    }}
                  >
                    Prononciation Ewondo : {item.ewo}
                  </div>
                </div>
              ))}
            </div>

            {spokenText && (
              <div
                style={{
                  marginTop: '16px',
                  padding: '10px 14px',
                  backgroundColor: 'var(--ink-2, #171717)',
                  color: 'var(--bone, #F3F2ED)',
                  borderRadius: 'var(--radius, 4px)',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  border: '1px solid var(--line-invert, rgba(255, 255, 255, 0.14))',
                }}
              >
                <Volume2 size={16} strokeWidth={2} style={{ color: 'var(--green-glow, #4FE066)', flexShrink: 0 }} />
                <span>
                  Synthèse Vocale Active : <strong style={{ color: 'var(--green-glow, #4FE066)' }}>"{spokenText}"</strong>
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DOM */}
      {subTab === 'dom' && (
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
                margin: '0 0 8px 0',
                fontSize: '14px',
                fontFamily: 'var(--font-heading, "Manrope", sans-serif)',
                fontWeight: 700,
                color: 'var(--ink, #0A0A0A)',
              }}
            >
              Algorithme de Traversée Exhaustive du DOM
            </h4>
            <p
              style={{
                margin: '0 0 12px 0',
                fontSize: '12px',
                color: 'var(--muted, rgba(10, 10, 10, 0.6))',
                lineHeight: 1.6,
              }}
            >
              L'extension parcourt l'arbre DOM selon une stratégie récursive avec <code>TreeWalker</code> filtrant les scripts, styles et iframes tierces.
            </p>
            <ul
              style={{
                margin: 0,
                paddingLeft: '20px',
                fontSize: '12px',
                color: 'var(--muted, rgba(10, 10, 10, 0.6))',
                lineHeight: 1.8,
              }}
            >
              <li><strong>Nœuds textuels</strong> (H1-H6, P, SPAN, TD, TH, LI, A, DIV).</li>
              <li><strong>Éléments interactifs</strong> (BUTTON, INPUT submit/button, labels de formulaire).</li>
              <li><strong>Attributs d'accessibilité</strong> (<code>placeholder</code>, <code>title</code>, <code>aria-label</code>, <code>alt</code>).</li>
              <li><strong>Composants Web & Shadow DOM</strong> (Traversée récursive transparente des nœuds <code>shadowRoot</code> en mode open).</li>
            </ul>
          </div>
        </div>
      )}

      {/* Banking */}
      {subTab === 'banking' && (
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
              Marque Blanche & Intégration Bancaire
            </h4>
            <p
              style={{
                margin: 0,
                fontSize: '12px',
                color: 'var(--muted, rgba(10, 10, 10, 0.6))',
                lineHeight: 1.6,
              }}
            >
              Les institutions bancaires partenaires (ex: Afriland First Bank, Société Générale Cameroun, CCA Bank) peuvent intégrer l'extension LinguaBridge comme module certifié sur leurs portails e-banking ou distribuer le bundle préconfiguré à leurs clients entreprises et particuliers.
            </p>
          </div>
        </div>
      )}

      {/* Install */}
      {subTab === 'install' && (
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
                margin: '0 0 12px 0',
                fontSize: '14px',
                fontFamily: 'var(--font-heading, "Manrope", sans-serif)',
                fontWeight: 700,
                color: 'var(--ink, #0A0A0A)',
              }}
            >
              Charger l'Extension Non Emballée (Developer Mode)
            </h4>
            <ol
              style={{
                margin: 0,
                paddingLeft: '20px',
                fontSize: '12px',
                color: 'var(--muted, rgba(10, 10, 10, 0.6))',
                lineHeight: 1.8,
              }}
            >
              <li>Ouvrez Google Chrome, Brave ou Microsoft Edge et accédez à <code>chrome://extensions</code>.</li>
              <li>Activez l'interrupteur <strong>Mode développeur</strong> en haut à droite.</li>
              <li>Cliquez sur le bouton <strong>Charger l'extension non emballée</strong> (Load unpacked).</li>
              <li>Sélectionnez le dossier de distribution : <code>c:\Users\LENOVO\Documents\antigravity\focused-maxwell\linguabridge\apps\extension\dist</code>.</li>
              <li>L'icône LinguaBridge apparaît instantanément dans votre barre d'extensions prête à l'emploi !</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
};
