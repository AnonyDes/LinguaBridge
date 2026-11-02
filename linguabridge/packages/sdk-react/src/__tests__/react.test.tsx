// @vitest-environment happy-dom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LinguaBridgeClient } from '@linguabridge/sdk-js';
import { LinguaBridgeProvider, useLinguaBridge } from '../context';
import { useTranslate, useLanguages } from '../hooks';
import { Translate } from '../components/Translate';

describe('SDK React Integration & Hooks', () => {
  let mockClient: LinguaBridgeClient;
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);

    mockClient = new LinguaBridgeClient({ baseUrl: 'http://localhost:3001' });
    vi.spyOn(mockClient, 'getLanguages').mockResolvedValue([
      { code: 'fr', name: 'French', speechAvailable: true, packStatus: 'production_approved', isAvailable: true },
      { code: 'en', name: 'English', speechAvailable: true, packStatus: 'production_approved', isAvailable: true },
    ]);
    vi.spyOn(mockClient, 'translate').mockImplementation(async (params) => {
      return {
        id: 'test-1',
        originalText: params.text,
        translatedText: `En-${params.text}`,
        sourceLang: params.sourceLang,
        targetLang: params.targetLang,
        provider: 'mock-engine',
        status: 'success',
        cacheStatus: 'miss',
        warnings: params.text.includes('15000') ? ['Amount 15000 FCFA verified'] : [],
        latencyMs: 5,
        speechAvailable: false,
      };
    });
  });

  afterEach(() => {
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
    vi.restoreAllMocks();
  });

  it('throws error when useLinguaBridge is used outside provider', () => {
    const TestConsumer = () => {
      useLinguaBridge();
      return null;
    };

    expect(() => {
      const root = createRoot(container);
      act(() => {
        root.render(<TestConsumer />);
      });
    }).toThrow('useLinguaBridge must be used within a LinguaBridgeProvider');
  });

  it('renders Translate component and fetches translation', async () => {
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <LinguaBridgeProvider client={mockClient} defaultSourceLang="fr" defaultTargetLang="en">
          <Translate text="Confirmer le transfert" />
        </LinguaBridgeProvider>
      );
    });

    const span = container.querySelector('.linguabridge-text');
    expect(span).not.toBeNull();
    expect(span?.textContent).toBe('En-Confirmer le transfert');
    expect(span?.getAttribute('data-original')).toBe('Confirmer le transfert');
  });

  it('renders warning class and title when translation has warnings', async () => {
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <LinguaBridgeProvider client={mockClient} defaultSourceLang="fr" defaultTargetLang="en">
          <Translate text="Montant: 15000 FCFA" />
        </LinguaBridgeProvider>
      );
    });

    const span = container.querySelector('.linguabridge-warning');
    expect(span).not.toBeNull();
    expect(span?.getAttribute('title')).toContain('Amount 15000 FCFA verified');
  });

  it('skips translation when sourceLang equals targetLang', async () => {
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <LinguaBridgeProvider client={mockClient} defaultSourceLang="fr" defaultTargetLang="fr">
          <Translate text="Solde disponible" />
        </LinguaBridgeProvider>
      );
    });

    const span = container.querySelector('.linguabridge-text');
    expect(span?.textContent).toBe('Solde disponible');
    expect(mockClient.translate).not.toHaveBeenCalled();
  });
});
