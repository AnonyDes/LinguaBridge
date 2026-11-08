'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { MessageCircle } from 'lucide-react';
import { LinguaBridgeWidget } from '@linguabridge/widget';

export function WidgetMount() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(max-width: 767px)');
    let widget: LinguaBridgeWidget | null = null;
    const sync = () => {
      if (mq.matches) {
        widget?.destroy();
        widget = null;
      } else if (!widget && window.location.pathname.indexOf('/assistant') === -1) {
        widget = LinguaBridgeWidget.init({
          apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
          voiceUrl: process.env.NEXT_PUBLIC_VOICE_URL || 'http://127.0.0.1:3002',
          position: 'bottom-right',
        });
      }
    };
    sync();
    mq.addEventListener('change', sync);
    return () => { mq.removeEventListener('change', sync); widget?.destroy(); };
  }, []);

  return (
    <Link href="/assistant" className="lb-mobile-assistant-trigger" aria-label="Open LinguaBridge assistant">
      <MessageCircle size={20} strokeWidth={2} />
      <span>Assistant</span>
    </Link>
  );
}
