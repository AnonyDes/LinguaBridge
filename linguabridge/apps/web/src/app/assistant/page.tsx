'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowUp, Volume2, ShieldCheck, MessageCircle, Globe2 } from 'lucide-react';
import { ACTIVE_CAMEROON_LANGUAGES, generateBankingResponse, speakAfricanText } from '@linguabridge/widget';

type Message = { id: number; role: 'user' | 'assistant'; text: string; phonetic?: string; lang?: string };
const prompts = [
  { label: 'Envoyer de l’argent', query: 'Comment envoyer de l’argent ?' },
  { label: 'Consulter mon solde', query: 'Comment consulter mon solde ?' },
  { label: 'Frais de retrait', query: 'Comment fonctionnent les frais de retrait ?' },
  { label: 'Sécurité du compte', query: 'Comment sécuriser mon compte et mon PIN ?' },
];

export default function AssistantPage() {
  const [lang, setLang] = useState('ewo-CM');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const endRef = useRef<HTMLDivElement>(null);
  const send = (value: string) => {
    const text = value.trim();
    if (!text) return;
    const result = generateBankingResponse(text, lang);
    setMessages(old => [...old,
      { id: Date.now(), role: 'user', text },
      { id: Date.now() + 1, role: 'assistant', text: result.text, phonetic: result.phonetic, lang },
    ]);
    setInput('');
  };
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages.length]);
  return (
    <div className="lb-assistant-page">
      <div className="lb-assistant-shell">
        <div className="lb-assistant-top">
          <Link href="/" className="lb-assistant-back" aria-label="Back to home"><ArrowLeft size={19}/></Link>
          <div className="lb-assistant-heading"><MessageCircle size={19}/><div><strong>LinguaBridge Assistant</strong><span>Financial guidance · Prototype</span></div></div>
        </div>
        <div className="lb-assistant-language">
          <label htmlFor="assistant-lang"><Globe2 size={16}/> Language</label>
          <select id="assistant-lang" value={lang} onChange={e=>setLang(e.target.value)}>
            {ACTIVE_CAMEROON_LANGUAGES.map(l=><option key={l.code} value={l.code}>{l.name}</option>)}
          </select>
        </div>
        <div className="lb-assistant-messages" aria-live="polite">
          {messages.length === 0 && <div className="lb-assistant-welcome">
            <div className="lb-assistant-welcome-icon"><MessageCircle size={24}/></div>
            <h1>How can we help you?</h1>
            <p>Ask about transfers, balances, fees or account security. Responses use a limited local phrase library and may be incomplete.</p>
            <div className="lb-assistant-prompts">{prompts.map(p=><button key={p.label} type="button" onClick={()=>send(p.query)}>{p.label}</button>)}</div>
          </div>}
          {messages.map(m=><div key={m.id} className={`lb-assistant-message ${m.role}`}>
            <div>{m.text}</div>
            {m.role === 'assistant' && <button type="button" className="lb-assistant-speak" onClick={()=>speakAfricanText(m.text,m.phonetic||m.text,m.lang||lang,()=>{},()=>{})}><Volume2 size={15}/> Listen</button>}
          </div>)}
          <div ref={endRef}/>
        </div>
        <form className="lb-assistant-composer" onSubmit={e=>{e.preventDefault();send(input)}}>
          <input value={input} onChange={e=>setInput(e.target.value)} placeholder="Ask a financial question…" aria-label="Financial question" maxLength={500}/>
          <button type="submit" disabled={!input.trim()} aria-label="Send"><ArrowUp size={21}/></button>
        </form>
        <div className="lb-assistant-disclaimer"><ShieldCheck size={14}/> Prototype guidance only. Never share PINs or passwords. Verify financial details with the original provider.</div>
      </div>
    </div>
  );
}
