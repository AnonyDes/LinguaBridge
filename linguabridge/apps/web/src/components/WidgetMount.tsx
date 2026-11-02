'use client';

import { useEffect } from 'react';
import { LinguaBridgeWidget } from '@linguabridge/widget';

export function WidgetMount() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const widget = LinguaBridgeWidget.init({
        apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
        position: 'bottom-right',
      });
      return () => {
        widget?.destroy();
      };
    }
  }, []);

  return null;
}
