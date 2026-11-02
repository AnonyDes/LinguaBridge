// @vitest-environment happy-dom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import CameroPayDemo from '../app/cameropay/page';
import DeveloperDashboard from '../app/dashboard/page';
import LandingPage from '../app/page';
import { WidgetMount } from '../components/WidgetMount';
import { LinguaBridgeWidget } from '@linguabridge/widget';

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => React.createElement('a', { href, ...props }, children),
}));

describe('Web Application & CameroPay UI', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);

    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes('/v1/packs')) {
        return {
          ok: true,
          json: async () => ({
            packs: [
              {
                packId: 'ewondo',
                code: 'ewo-CM',
                name: 'Ewondo (Ewondo Pack)',
                iso639_3: 'ewo',
                status: 'not_installed',
                qualityStatus: 'unverified',
              },
              {
                packId: 'fulfulde',
                code: 'fub-CM',
                name: 'Fulfulde (Cameroonian Fulfulde)',
                iso639_3: 'fub',
                status: 'not_installed',
                qualityStatus: 'unverified',
              },
            ],
          }),
        };
      }
      return { ok: true, json: async () => ({ status: 'healthy' }) };
    });
  });

  afterEach(() => {
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
    vi.restoreAllMocks();
  });

  it('renders CameroPay demo with mobile money balance and live financial entities', async () => {
    const root = createRoot(container);
    await act(async () => {
      root.render(<CameroPayDemo />);
    });

    // Check balance display
    expect(container.textContent).toContain('125\u202F500'); // French localized space
    expect(container.textContent).toContain('FCFA');
    expect(container.textContent).toContain('CameroPay');

    // Check detected financial entities (AST extraction)
    expect(container.textContent).toContain('15000 FCFA');
    expect(container.textContent).toContain('+237 699 123 456');
    expect(container.textContent).toContain('Exact Match (0 Drift)');

    // Check transaction history
    expect(container.textContent).toContain('TX-94821');
    expect(container.textContent).toContain('Marie Atangana');
  });

  it('switches CameroPay interface between French and English', async () => {
    const root = createRoot(container);
    await act(async () => {
      root.render(<CameroPayDemo />);
    });

    expect(container.textContent).toContain("Effectuer un Transfert d'Argent");

    // Click English button
    const buttons = Array.from(container.querySelectorAll('button'));
    const enButton = buttons.find((b) => b.textContent?.trim() === 'English');
    expect(enButton).toBeDefined();

    await act(async () => {
      enButton?.click();
    });

    expect(container.textContent).toContain('Make a Money Transfer');
    expect(container.textContent).toContain('Zero financial drift guaranteed');
  });

  it('switches CameroPay interface to Ewondo national language', async () => {
    const root = createRoot(container);
    await act(async () => {
      root.render(<CameroPayDemo />);
    });

    const buttons = Array.from(container.querySelectorAll('button'));
    const ewoButton = buttons.find((b) => b.textContent?.includes('Kóbɔ́ Ewondo'));
    expect(ewoButton).toBeDefined();

    await act(async () => {
      ewoButton?.click();
    });

    expect(container.textContent).toContain('Lóm móni');
    expect(container.textContent).toContain('Móni mí ne wá é bẽng');
    expect(container.textContent).toContain('Nlambá nyí a nòng móni');
  });

  it('renders Developer Dashboard with Cameroon pack isolation policy', async () => {
    const root = createRoot(container);
    await act(async () => {
      root.render(<DeveloperDashboard />);
    });

    // Check dashboard header and tabs
    expect(container.textContent).toContain('Developer & Infrastructure Dashboard');
    expect(container.textContent).toContain('TM Analytics & Performance');
    expect(container.textContent).toContain('Language Pack Governance');

    // Click Language Packs tab
    const buttons = Array.from(container.querySelectorAll('button'));
    const packsTab = buttons.find((b) => b.textContent?.includes('Language Pack Governance'));
    expect(packsTab).toBeDefined();

    await act(async () => {
      packsTab?.click();
    });

    // Check Cameroon isolation warning message
    expect(container.textContent).toContain('Cameroon Low-Resource Language Isolation Policy');
    expect(container.textContent).toContain('not_installed');
  });

  it('renders Landing Page with documentation portal and sandbox', async () => {
    const root = createRoot(container);
    await act(async () => {
      root.render(<LandingPage />);
    });

    expect(container.textContent).toContain('Bridging Languages, Securing Fintech');
    expect(container.textContent).toContain('Financial Guard');
    expect(container.textContent).toContain('Sub-ms Translation Memory');
    expect(container.textContent).toContain('Live Financial Translation Sandbox');
    expect(container.textContent).toContain('Quickstart Integration');
  });

  it('mounts and unmounts WidgetMount lifecycle correctly', async () => {
    const initSpy = vi.spyOn(LinguaBridgeWidget, 'init');
    const root = createRoot(container);

    await act(async () => {
      root.render(<WidgetMount />);
    });

    expect(initSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        position: 'bottom-right',
      })
    );

    // Unmount
    await act(async () => {
      root.unmount();
    });
  });
});
