'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronRight, Download, ExternalLink, Globe2, Laptop, LockKeyhole, Puzzle, ShieldCheck, Smartphone, Wrench } from 'lucide-react';

type View = 'chrome' | 'edge' | 'android' | 'web' | 'other';
const repo = 'https://github.com/AnonyDes/LinguaBridge';
const extensionDownload = '/downloads/LinguaBridge-Extension-0.3.0.zip';
const androidDownload = '/downloads/LinguaBridge-Browser-Android-0.4.0-debug.apk';

export default function DeveloperDashboard() {
  const [view, setView] = useState<View>('chrome');
  const [extensionsOpen, setExtensionsOpen] = useState(true);
  const [otherOpen, setOtherOpen] = useState(false);
  const navigation = (id: View, label: string, beta = false) => (
    <button type="button" onClick={() => setView(id)} aria-current={view === id ? 'page' : undefined}
      style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
        textAlign: 'left', padding: '11px 14px', borderRadius: 8, cursor: 'pointer',
        border: 'none', font: 'inherit', fontSize: 14, fontWeight: view === id ? 700 : 500,
        background: view === id ? '#EAF8ED' : 'transparent', color: view === id ? '#08751A' : '#344054' }}>
      <span>{label}</span>{beta && <span style={{ fontSize: 10, fontWeight: 700, color: '#8A5B00', background: '#FFF3D6', padding: '3px 7px', borderRadius: 20 }}>BÊTA</span>}
    </button>
  );
  return (
    <div style={{ background: '#fff', minHeight: 'calc(100vh - 100px)' }}>
      <div className="wrap" style={{ paddingTop: 48, paddingBottom: 96 }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ color: '#08751A', fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', marginBottom: 10 }}>LINGUABRIDGE / ACCESS</div>
          <h1 style={{ fontSize: 'clamp(1.9rem, 3.5vw, 2.8rem)', letterSpacing: '-0.035em', fontWeight: 800, color: '#101828', marginBottom: 12 }}>Access LinguaBridge</h1>
          <p style={{ color: '#667085', maxWidth: 680, lineHeight: 1.65 }}>Translate financial interfaces into Cameroonian languages using the desktop extension or Android browser.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(205px, 240px) minmax(0, 1fr)', gap: 'clamp(20px, 4vw, 56px)', alignItems: 'start' }} className="lb-access-grid">
          <aside aria-label="Access methods" style={{ border: '1px solid #EAECF0', borderRadius: 12, padding: 12, background: '#fff' }}>
            <button type="button" onClick={() => setExtensionsOpen(!extensionsOpen)} aria-expanded={extensionsOpen}
              style={{ display: 'flex', width: '100%', alignItems: 'center', gap: 9, padding: '12px 10px', background: 'none', border: 0, fontWeight: 750, color: '#101828', cursor: 'pointer', textAlign: 'left' }}>
              <Puzzle size={17} /> Extensions <span style={{ marginLeft: 'auto' }}>{extensionsOpen ? <ChevronDown size={16}/> : <ChevronRight size={16}/>}</span>
            </button>
            {extensionsOpen && <div style={{ paddingLeft: 12, display: 'grid', gap: 3 }}>
              {navigation('chrome', 'Google Chrome')}
              {navigation('edge', 'Microsoft Edge')}
              {navigation('web', 'Web browser', true)}
            </div>}
            {navigation('android', 'Android browser')}
            <div style={{ borderTop: '1px solid #EAECF0', margin: '12px 0 6px' }}/>
            <button type="button" onClick={() => setOtherOpen(!otherOpen)} aria-expanded={otherOpen}
              style={{ display: 'flex', width: '100%', alignItems: 'center', gap: 9, padding: '12px 10px', background: 'none', border: 0, fontWeight: 650, color: '#475467', cursor: 'pointer', textAlign: 'left' }}>
              <Wrench size={16} /> Other connection methods <span style={{ marginLeft: 'auto' }}>{otherOpen ? <ChevronDown size={16}/> : <ChevronRight size={16}/>}</span>
            </button>
            {otherOpen && <div style={{ paddingLeft: 12 }}>{navigation('other', 'API, SDK & integrations')}</div>}
          </aside>
          <main style={{ minWidth: 0 }}>
            {(view === 'chrome' || view === 'edge') && <>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#EAF8ED', color: '#08751A', borderRadius: 99, padding: '6px 12px', fontSize: 12, fontWeight: 700, marginBottom: 20 }}><ShieldCheck size={15}/> Desktop extension · Prototype</div>
              <h2 style={{ fontSize: 'clamp(1.5rem, 2.6vw, 2.1rem)', color: '#101828', letterSpacing: '-0.025em', marginBottom: 12 }}>LinguaBridge for {view === 'chrome' ? 'Google Chrome' : 'Microsoft Edge'}</h2>
              <p style={{ color: '#667085', lineHeight: 1.75, maxWidth: 720, marginBottom: 26 }}>Read balances, payment instructions, fees and security messages in a familiar language. The extension works alongside existing websites. Ewondo and other Cameroonian language packs are being tested and reviewed.</p>
              <a href={extensionDownload} download className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 9, marginBottom: 24 }}><Download size={17}/> Download LinguaBridge 0.3.0 for {view === 'chrome' ? 'Chrome' : 'Edge'}</a>
              <p style={{ fontSize: 13, color: '#475467', marginBottom: 22 }}>The same Chromium extension ZIP works in Chrome and Edge. It is a test build; extract it before loading the unpacked extension.</p>
              <div style={{ border: '1px solid #EAECF0', borderRadius: 12, padding: '24px', marginTop: 8 }}>
                <h3 style={{ fontSize: 17, fontWeight: 750, color: '#101828', marginBottom: 18 }}>Get started in 3 steps</h3>
                <ol style={{ display: 'grid', gap: 16, paddingLeft: 22, color: '#475467', lineHeight: 1.65 }}>
                  <li>Download the LinguaBridge 0.3.0 ZIP above, then extract it.</li>
                  <li>Open <code>{view === 'chrome' ? 'chrome://extensions' : 'edge://extensions'}</code>, enable Developer mode, then choose <strong>Load unpacked</strong> and select the extracted folder containing <code>manifest.json</code>. Remove any previous LinguaBridge version to avoid duplicates.</li>
                  <li>Open a financial website, click the LinguaBridge icon in the browser toolbar, select your target language and use the <strong>Traduction</strong> or <strong>Assistant</strong> tab. The source language is detected automatically. Check financial details against the original text before acting.</li>
                </ol>
                <p style={{ fontSize: 13, color: '#475467', marginTop: 18 }}>Already using an unpacked extension? Replace its files with version 0.3.0, click <strong>Reload</strong> at <code>{view === 'chrome' ? 'chrome://extensions' : 'edge://extensions'}</code>, then refresh the website tab. GitHub pushes do not update a locally loaded extension.</p>
              </div>
              <p style={{ fontSize: 13, color: '#667085', lineHeight: 1.7, marginTop: 18 }}><LockKeyhole size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }}/>Prototype for testing. Not a Chrome Web Store or Edge Add-ons release. Do not enter sensitive credentials into demo fields.</p>
              <p style={{ marginTop: 12 }}><a href={repo + '/blob/main/linguabridge/apps/extension/EDGE_DESKTOP.md'} target="_blank" rel="noreferrer" style={{ color: '#08751A', fontWeight: 650 }}>Installation guide (Chrome and Edge) ↗</a></p>
            </>}
            {view === 'android' && <>
              <h2 style={{ fontSize: 'clamp(1.5rem, 2.6vw, 2.1rem)', marginBottom: 12 }}>LinguaBridge Browser for Android</h2>
              <p style={{ color: '#475467', lineHeight: 1.75, maxWidth: 690, marginBottom: 24 }}>
                The 0.4.0 pilot translates French and English text into five configured targets as you browse. The bundled lexicon works offline; a scoped API key enables broader cloud translation and long-press speech. Ewondo, Kanuri and Cameroon Pidgin speech are experimental.
              </p>
              <a href={androidDownload} download className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 9, marginBottom: 16 }}>
                <Download size={17} aria-hidden="true" /> Download Android APK 0.4.0
              </a>
              <br />
              <a href={repo + '/blob/main/linguabridge/apps/browser-android/README.md'} className="btn btn-primary"
                target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 9 }}>
                <Smartphone size={17} aria-hidden="true" /> Android build and install guide <ExternalLink size={14} aria-hidden="true" />
              </a>
            </>}
            {view === 'web' && <>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#FFF3D6', color: '#8A5B00', borderRadius: 99, padding: '6px 12px', fontSize: 12, fontWeight: 700, marginBottom: 20 }}>BÊTA · In development</div>
              <h2 style={{ fontSize: 'clamp(1.5rem, 2.6vw, 2.1rem)', marginBottom: 12, color: '#101828' }}>Web access is coming</h2>
              <p style={{ color: '#667085', lineHeight: 1.75, maxWidth: 690 }}>We&apos;re working toward access directly from a web page without installing an extension or app.</p>
              <div style={{ marginTop: 28, padding: 24, border: '1px solid #EAECF0', borderRadius: 12, display: 'flex', gap: 14, alignItems: 'center' }}><Smartphone size={26} color="#08751A"/><div><strong style={{ color: '#101828' }}>Mobile and desktop</strong><p style={{ color: '#667085', fontSize: 14, marginTop: 4 }}>Planned access. No release date announced.</p></div></div>
            </>}
            {view === 'other' && <>
              <div style={{ display: 'inline-flex', background: '#F2F4F7', borderRadius: 99, padding: '6px 12px', fontSize: 12, fontWeight: 700, color: '#475467', marginBottom: 20 }}>OPTIONAL · FOR DEVELOPERS</div>
              <h2 style={{ fontSize: 'clamp(1.5rem, 2.6vw, 2.1rem)', marginBottom: 12, color: '#101828' }}>Other ways to connect</h2>
              <p style={{ color: '#667085', lineHeight: 1.75, maxWidth: 690 }}>Teams building their own products can explore the LinguaBridge API, SDK and integration packages.</p>
              <div style={{ border: '1px solid #EAECF0', borderRadius: 12, padding: 24, marginTop: 26 }}>
                <h3 style={{ marginBottom: 12, color: '#101828' }}>Developer resources</h3>
                <p style={{ color: '#667085', lineHeight: 1.7 }}>Source code and integration documentation are available in the repository. Availability and deployment requirements vary by connector.</p>
                <a href={repo} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#08751A', fontWeight: 700, marginTop: 16 }}>Explore on GitHub <ExternalLink size={15}/></a>
              </div>
            </>}
          </main>
        </div>
        <style>{`@media(max-width:700px){.lb-access-grid{grid-template-columns:1fr!important}}`}</style>
      </div>
    </div>
  );
}
