import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Voice samples — LinguaBridge',
  description: 'Listen to local LinguaBridge voice research samples and see the model and language variety behind each recording.',
};

const samples = [
  { name: 'Ewondo', code: 'ewo', file: '/voice-samples/ewondo-research.wav', model: 'OlameMend/mms-tts-ewo', modelUrl: 'https://huggingface.co/OlameMend/mms-tts-ewo', detail: 'Community research checkpoint. License, corpus and pronunciation have not been documented.' },
  { name: 'Fulfulde', code: 'ful', file: '/voice-samples/fulfulde-research.wav', model: 'facebook/mms-tts-ful', modelUrl: 'https://huggingface.co/facebook/mms-tts-ful', detail: 'Meta MMS research checkpoint. Cameroonian variety has not been assessed. CC BY NC 4.0.' },
  { name: 'Hausa', code: 'hau', file: '/voice-samples/hausa-research.wav', model: 'facebook/mms-tts-hau', modelUrl: 'https://huggingface.co/facebook/mms-tts-hau', detail: 'Meta MMS research checkpoint. Pronunciation has not been assessed. CC BY NC 4.0.' },
  { name: 'Kanuri, Manga', code: 'kby', file: '/voice-samples/kanuri-manga-research.wav', model: 'facebook/mms-tts-kby', modelUrl: 'https://huggingface.co/facebook/mms-tts-kby', detail: 'Manga Kanuri sample. The LinguaBridge translation target is Central Kanuri (knc), a different variety. CC BY NC 4.0.' },
  { name: 'Nigerian Pidgin', code: 'pcm', file: '/voice-samples/nigerian-pidgin-research.wav', model: 'facebook/mms-tts-pcm', modelUrl: 'https://huggingface.co/facebook/mms-tts-pcm', detail: 'Nigerian Pidgin sample. This is not a Cameroon Pidgin (wes) voice. CC BY NC 4.0.' },
];

export default function VoicesPage() {
  return (
    <div className="wrap" style={{ paddingTop: 'clamp(48px, 6vw, 80px)', paddingBottom: 'var(--s-9)' }}>
      <header style={{ maxWidth: 780, marginBottom: 'var(--s-7)' }}>
        <span className="meta-num">VOICE LAB / FIVE LOCAL SAMPLES</span>
        <h1 style={{ margin: 'var(--s-3) 0 var(--s-4)' }}>Hear the voice experiments</h1>
        <p className="lead">These are short recordings generated on our development machine. Press play to check your device audio. A recorded sample does not mean its model can read any web page on the live server.</p>
        <p style={{ color: 'var(--muted)', marginTop: 'var(--s-4)' }}>Live hover speech currently uses the hosted Hausa and Fulfulde voices. The other samples are research previews with their exact model varieties shown below.</p>
      </header>
      <div className="grid-2" style={{ gap: 'var(--s-5)' }}>
        {samples.map((sample, index) => (
          <article key={sample.code} className="card" style={{ padding: 'var(--s-6)', border: '1px solid var(--line)', minWidth: 0 }}>
            <span className="meta-num">{String(index + 1).padStart(2, '0')} / {sample.code.toUpperCase()}</span>
            <h2 style={{ fontSize: 'var(--f-h3)', margin: 'var(--s-3) 0' }}>{sample.name}</h2>
            <p style={{ color: 'var(--muted)', marginBottom: 'var(--s-4)' }}>{sample.detail}</p>
            <audio controls preload="none" src={sample.file} aria-label={`${sample.name} research voice sample`} style={{ width: '100%', maxWidth: 480 }}>
              Your browser cannot play this WAV file. <a href={sample.file}>Download the sample</a>.
            </audio>
            <p style={{ marginTop: 'var(--s-3)', fontSize: '0.78rem', color: 'var(--muted)' }}>
              Source: <a href={sample.modelUrl} target="_blank" rel="noreferrer" style={{ textDecoration: 'underline' }}>{sample.model}</a>
            </p>
          </article>
        ))}
      </div>
      <div style={{ marginTop: 'var(--s-7)' }}>
        <Link href="/dashboard" className="btn btn-primary">Set up live extension speech</Link>
      </div>
    </div>
  );
}
