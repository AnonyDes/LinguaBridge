'use client';

import React, { useState } from 'react';

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
              Extension & Plugin Navigateur (Chrome MV3)
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
              Hover-to-Speak 220ms
            </span>
          </div>
          <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: '#64748b' }}>
            Assistant d'accessibilité bancaire universel injecté dans les portails Web Banking marchands : prononciation vocale instantanée au survol et traduction DOM intégrale.
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
          { id: 'hover', label: '🔊 Hover-to-Speak (Survol Vocal)' },
          { id: 'dom', label: '🌐 Traduction DOM & ShadowRoot' },
          { id: 'banking', label: '🏦 Intégration Banques & Guichets' },
          { id: 'install', label: '📦 Installation Mode Développeur' },
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
              Accessibilité Bancaire Sans Friction
            </h4>
            <p style={{ margin: 0, fontSize: '13px', color: '#475569', lineHeight: 1.6 }}>
              L'extension Chrome Manifest V3 de LinguaBridge comble le fossé linguistique pour les millions de citoyens camerounais utilisant les services bancaires en ligne. Elle s'injecte de façon isolée et sécurisée dans les pages web, analyse le DOM sans perturber le code bancaire, et offre un survol vocal immédiat pour que chaque opération financière soit comprise.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', backgroundColor: '#ffffff' }}>
              <span style={{ fontSize: '24px' }}>⚡</span>
              <h5 style={{ margin: '8px 0 4px 0', fontSize: '14px', color: '#0f172a' }}>Dwell 220ms & 0 Latence</h5>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748b', lineHeight: 1.5 }}>
                Détection instantanée du pointeur avec temporisation de 220ms évitant les déclenchements parasites lors des déplacements rapides.
              </p>
            </div>
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', backgroundColor: '#ffffff' }}>
              <span style={{ fontSize: '24px' }}>🛡️</span>
              <h5 style={{ margin: '8px 0 4px 0', fontSize: '14px', color: '#0f172a' }}>Isolation Totale Sandbox</h5>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748b', lineHeight: 1.5 }}>
                Aucune fuite de données : l'extension ne transmet aucune donnée sensible ou identifiant bancaire vers l'extérieur.
              </p>
            </div>
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', backgroundColor: '#ffffff' }}>
              <span style={{ fontSize: '24px' }}>🎯</span>
              <h5 style={{ margin: '8px 0 4px 0', fontSize: '14px', color: '#0f172a' }}>Couverture Exhaustive</h5>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748b', lineHeight: 1.5 }}>
                Traduit non seulement les paragraphes mais aussi les boutons d'action, tableaux d'amortissement, inputs placeholders et Shadow DOMs.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Hover */}
      {subTab === 'hover' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ border: '1px solid #e2e8f0', padding: '16px', borderRadius: '8px', backgroundColor: '#ffffff' }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#0f172a' }}>
              Simulateur Interactif de Survol Vocal (Hover-to-Speak)
            </h4>
            <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: '#64748b' }}>
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
                  ewo: 'Móni m\'esí: 350 FCFA é be 699123456',
                },
                {
                  id: 'el-3',
                  fr: 'Solde restant disponible : 124 500 FCFA',
                  ewo: 'Móni m\'ékabedá m\'asúk: 124 500 FCFA',
                },
              ].map((item) => (
                <div
                  key={item.id}
                  onMouseEnter={() => simulateHover(item.fr, item.ewo)}
                  onMouseLeave={simulateLeave}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: hoveredPreview === item.fr ? '2px solid #16a34a' : '1px solid #e2e8f0',
                    backgroundColor: hoveredPreview === item.fr ? '#f0fdf4' : '#f8fafc',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{item.fr}</div>
                  <div style={{ fontSize: '11px', color: '#16a34a', marginTop: '2px', fontWeight: 500 }}>
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
                  backgroundColor: '#0f172a',
                  color: '#f8fafc',
                  borderRadius: '6px',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span>🔊</span>
                <span>Synthèse Vocale Active : <strong>"{spokenText}"</strong></span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DOM */}
      {subTab === 'dom' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#0f172a' }}>
              Algorithme de Traversée Exhaustive du DOM
            </h4>
            <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: '#64748b', lineHeight: 1.6 }}>
              L'extension parcourt l'arbre DOM selon une stratégie récursive avec <code>TreeWalker</code> filtrant les scripts, styles et iframes tierces.
            </p>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12px', color: '#475569', lineHeight: 1.8 }}>
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
          <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#0f172a' }}>
              Marque Blanche & Intégration Bancaire
            </h4>
            <p style={{ margin: 0, fontSize: '12px', color: '#475569', lineHeight: 1.6 }}>
              Les institutions bancaires partenaires (ex: Afriland First Bank, Société Générale Cameroun, CCA Bank) peuvent intégrer l'extension LinguaBridge comme module certifié sur leurs portails e-banking ou distribuer le bundle préconfiguré à leurs clients entreprises et particuliers.
            </p>
          </div>
        </div>
      )}

      {/* Install */}
      {subTab === 'install' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#0f172a' }}>
              Charger l'Extension Non Emballée (Developer Mode)
            </h4>
            <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '12px', color: '#475569', lineHeight: 1.8 }}>
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
