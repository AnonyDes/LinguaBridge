'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';

export default function DocsRedirectPage() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.location.replace('/documentation');
    }
  }, []);

  return (
    <div className="wrap" style={{ padding: '80px 20px', textAlign: 'center' }}>
      <p style={{ color: 'var(--muted)', fontSize: '1rem', marginBottom: 16 }}>
        Redirection vers la documentation officielle de LinguaBridge…
      </p>
      <Link
        href="/documentation"
        className="btn btn-primary"
        style={{ display: 'inline-flex' }}
      >
        Accéder directement à la documentation →
      </Link>
    </div>
  );
}
