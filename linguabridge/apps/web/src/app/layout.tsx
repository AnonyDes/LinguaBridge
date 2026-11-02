import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';
import { WidgetMount } from '@/components/WidgetMount';

export const metadata: Metadata = {
  title: 'LinguaBridge — Multilingual Financial Inclusion Infrastructure',
  description: 'Multilingual accessibility infrastructure platform for financial inclusion in Cameroon',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <header style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
          <div className="container nav">
            <Link href="/" className="nav-logo">
              <span>🌉</span> LinguaBridge
            </Link>
            <nav className="nav-links">
              <Link href="/">Platform & Docs</Link>
              <Link href="/cameropay">CameroPay Demo</Link>
              <Link href="/dashboard">Developer Dashboard</Link>
              <a
                href="https://github.com/linguabridge"
                target="_blank"
                rel="noreferrer"
                className="btn btn-outline"
                style={{ fontSize: '13px', padding: '6px 12px' }}
              >
                GitHub
              </a>
            </nav>
          </div>
        </header>

        <main>{children}</main>

        <footer style={{ marginTop: '60px', padding: '30px 0', borderTop: '1px solid #e2e8f0', background: '#ffffff', color: '#64748b', fontSize: '13px' }}>
          <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong>LinguaBridge Platform</strong> — Non-commercial open-source multilingual infrastructure for Central Africa.
            </div>
            <div>
              CEMAC Region / Cameroon Financial Inclusion Initiative
            </div>
          </div>
        </footer>

        <WidgetMount />
      </body>
    </html>
  );
}
