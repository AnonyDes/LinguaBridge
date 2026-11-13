'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { MessageCircle } from 'lucide-react';
import { LinguaBridgeWidget } from '@linguabridge/widget';

export function WidgetMount() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(max-width: 767px)');
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ||
      (process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : '');
    const apiKey = process.env.NEXT_PUBLIC_API_KEY;
    let widget: LinguaBridgeWidget | null = null;
    const extensionPresent = () => document.documentElement.getAttribute('data-linguabridge-extension') === 'active' || !!document.getElementById('linguabridge-extension-root');
    const sync = () => {
      if (extensionPresent() || mq.matches) {
        widget?.destroy();
        widget = null;
      } else if (apiUrl && (process.env.NODE_ENV === 'development' || apiKey) &&
        !widget && window.location.pathname.indexOf('/assistant') === -1) {
        widget = LinguaBridgeWidget.init({
          apiUrl,
          apiKey,
          voiceUrl: process.env.NEXT_PUBLIC_VOICE_URL || 'http://127.0.0.1:3002',
          position: 'bottom-right',
        });
      }
    };
    sync();
    mq.addEventListener('change', sync);
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-linguabridge-extension'] });
    // Extension can be injected after the site has mounted its own widget.
    const timer = window.setInterval(() => {
      if (extensionPresent()) sync();
    }, 1500);
    return () => { mq.removeEventListener('change', sync); observer.disconnect(); window.clearInterval(timer); widget?.destroy(); };
  }, []);

  return (
    <>
    <style>{`html[data-linguabridge-extension="active"] .lb-mobile-assistant-trigger { display: none !important; }`}</style>
    <Link href="/assistant" className="lb-mobile-assistant-trigger" aria-label="Open LinguaBridge assistant">
      <MessageCircle size={20} strokeWidth={2} />
      <span>Assistant</span>
    </Link>
    </>
  );
}
