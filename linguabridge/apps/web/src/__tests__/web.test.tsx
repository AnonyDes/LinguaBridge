// @vitest-environment happy-dom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import DeveloperDashboard from '../app/dashboard/page';
import LandingPage from '../app/page';
import DocumentationPage from '../app/documentation/page';
import DocsRedirectPage from '../app/docs/page';
import { WidgetMount } from '../components/WidgetMount';
import { LinguaBridgeWidget } from '@linguabridge/widget';

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => React.createElement('a', { href, ...props }, children),
}));

describe('Web Application UI', () => {
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

  it('renders Developer Dashboard / Access Portal with browser extension options', async () => {
    const root = createRoot(container);
    await act(async () => {
      root.render(<DeveloperDashboard />);
    });

    // Check header and navigation options
    expect(container.textContent).toContain('Access LinguaBridge');
    expect(container.textContent).toContain('Google Chrome');
    expect(container.textContent).toContain('Microsoft Edge');
    expect(container.textContent).toContain('Get started in 3 steps');

    // Click Web browser tab
    const buttons = Array.from(container.querySelectorAll('button'));
    const webTab = buttons.find((b) => b.textContent?.includes('Web browser'));
    expect(webTab).toBeDefined();

    await act(async () => {
      webTab?.click();
    });

    // Check web browser beta section
    expect(container.textContent).toContain('Web access is coming');
  });

  it('renders Landing Page with access CTA and financial safeguards', async () => {
    const root = createRoot(container);
    await act(async () => {
      root.render(<LandingPage />);
    });

    expect(container.textContent).toContain('Your money.');
    expect(container.textContent).toContain('Your language.');
    expect(container.textContent).toContain('Get the browser extension');
    expect(container.textContent).toContain('FINANCIAL DATA SAFEGUARDS');
    expect(container.textContent).toContain('SAFETY FIRST');
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

  it('renders Documentation Page with architecture, security invariant, and testing guides', async () => {
    const root = createRoot(container);
    await act(async () => {
      root.render(<DocumentationPage />);
    });

    expect(container.textContent).toContain('Spécifications Techniques');
    expect(container.textContent).toContain('SAFINUM INNOVATE CHALLENGE');
    expect(container.textContent).toContain('Extension Web Chromium (Manifest V3)');
    expect(container.textContent).toContain('LinguaBridge Browser (Bêta)');
    expect(container.textContent).toContain('0.0000 FCFA');
    expect(container.textContent).toContain('Ewondo (ewo-CM)');
    expect(container.textContent).toContain('Meta MMS');
  });

  it('renders Docs Redirect Page linking to documentation', async () => {
    const root = createRoot(container);
    await act(async () => {
      root.render(<DocsRedirectPage />);
    });

    expect(container.textContent).toContain('Redirection vers la documentation');
    expect(container.textContent).toContain('Accéder directement à la documentation');
  });
});
