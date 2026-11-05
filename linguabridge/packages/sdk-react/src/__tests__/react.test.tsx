// @vitest-environment happy-dom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LinguaBridgeClient } from '@linguabridge/sdk-js';
import { LinguaBridgeProvider, useLinguaBridge } from '../context';
import { useTranslate, useLanguages, useBankingAssistant } from '../hooks';
import { Translate } from '../components/Translate';
import { BankingChatWidget } from '../components/BankingChatWidget';
import { CAMEROON_BANKING_LANGUAGES } from '../banking-engine';

describe('SDK React Integration & Sovereign Banking Assistant', () => {
  let mockClient: LinguaBridgeClient;
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);

    mockClient = new LinguaBridgeClient({ baseUrl: 'http://localhost:3001' });
    vi.spyOn(mockClient, 'getLanguages').mockResolvedValue([
      { code: 'fr', name: 'French', speechAvailable: true, packStatus: 'production_approved', isAvailable: true },
      { code: 'en', name: 'English', speechAvailable: true, packStatus: 'production_approved', isAvailable: true },
      { code: 'dua-CM', name: 'Duala', speechAvailable: false, packStatus: 'internal_testing', isAvailable: false },
      { code: 'ewo-CM', name: 'Ewondo', speechAvailable: true, packStatus: 'production_approved', isAvailable: true },
      { code: 'fuv-CM', name: 'Fulfulde', speechAvailable: true, packStatus: 'production_approved', isAvailable: true },
      { code: 'hau-CM', name: 'Haoussa', speechAvailable: true, packStatus: 'production_approved', isAvailable: true },
      { code: 'knc-CM', name: 'Kanuri', speechAvailable: true, packStatus: 'production_approved', isAvailable: true },
      { code: 'pcm-CM', name: 'Pidgin', speechAvailable: true, packStatus: 'production_approved', isAvailable: true },
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

  it('supports the 5 Cameroonian languages and strictly excludes Duala from useLanguages', async () => {
    let langsResult: any = null;
    const TestLangComponent = () => {
      const { languages, loading } = useLanguages();
      langsResult = { languages, loading };
      return null;
    };

    const root = createRoot(container);
    await act(async () => {
      root.render(
        <LinguaBridgeProvider client={mockClient}>
          <TestLangComponent />
        </LinguaBridgeProvider>
      );
    });

    expect(langsResult).not.toBeNull();
    const codes = langsResult.languages.map((l: any) => l.code);

    // 5 active Cameroonian languages must be available
    expect(codes).toContain('ewo-CM');
    expect(codes).toContain('fuv-CM');
    expect(codes).toContain('hau-CM');
    expect(codes).toContain('knc-CM');
    expect(codes).toContain('pcm-CM');

    // Strict invariant: Duala MUST NOT be in available languages
    const duala = codes.filter((c: string) => c.toLowerCase().startsWith('dua'));
    expect(duala.length).toBe(0);
  });

  it('useBankingAssistant sends questions and responds in local language with AST Guard', async () => {
    let assistant: any = null;
    const TestBankingComponent = () => {
      assistant = useBankingAssistant({ initialLang: 'ewo-CM' });
      return null;
    };

    const root = createRoot(container);
    await act(async () => {
      root.render(
        <LinguaBridgeProvider client={mockClient}>
          <TestBankingComponent />
        </LinguaBridgeProvider>
      );
    });

    expect(assistant).not.toBeNull();
    expect(assistant.currentLang).toBe('ewo-CM');
    expect(assistant.messages.length).toBe(1); // Welcome message

    // Send banking question with an exact financial amount and account number
    await act(async () => {
      await assistant.sendMessage('Comment envoyer 50 000 FCFA au compte 237699123456 ?');
    });

    expect(assistant.messages.length).toBe(3); // welcome + user + assistant
    const reply = assistant.messages[assistant.messages.length - 1];
    expect(reply.sender).toBe('assistant');
    expect(reply.lang).toBe('ewo-CM');

    // AST Guard: Financial amount and phone number must remain intact
    expect(reply.text).toContain('50 000 FCFA');
    expect(reply.text).toContain('237699123456');
    expect(reply.zeroDriftVerified).toBe(true);
  });

  it('useBankingAssistant switches languages across Fulfulde, Haoussa, Kanuri, and Pidgin', async () => {
    let assistant: any = null;
    const TestBankingComponent = () => {
      assistant = useBankingAssistant({ initialLang: 'ewo-CM' });
      return null;
    };

    const root = createRoot(container);
    await act(async () => {
      root.render(
        <LinguaBridgeProvider client={mockClient}>
          <TestBankingComponent />
        </LinguaBridgeProvider>
      );
    });

    // 1. Fulfulde (fuv-CM)
    await act(async () => {
      assistant.setLang('fuv-CM');
    });
    expect(assistant.currentLang).toBe('fuv-CM');

    await act(async () => {
      await assistant.sendMessage('Quel est mon solde ?');
    });
    let lastMsg = assistant.messages[assistant.messages.length - 1];
    expect(lastMsg.text).toContain('Ceede maada heddiiɗe');

    // 2. Haoussa (hau-CM)
    await act(async () => {
      assistant.setLang('hau-CM');
    });
    await act(async () => {
      await assistant.sendMessage('Frais de retrait');
    });
    lastMsg = assistant.messages[assistant.messages.length - 1];
    expect(lastMsg.text).toContain('Kudin cire kudi a ATM');

    // 3. Kanuri (knc-CM)
    await act(async () => {
      assistant.setLang('knc-CM');
    });
    await act(async () => {
      await assistant.sendMessage('Sécurité de mon compte');
    });
    lastMsg = assistant.messages[assistant.messages.length - 1];
    expect(lastMsg.text).toContain('Lafiya asusunəmye');

    // 4. Pidgin (pcm-CM)
    await act(async () => {
      assistant.setLang('pcm-CM');
    });
    await act(async () => {
      await assistant.sendMessage("Comment envoyer de l'argent ?");
    });
    lastMsg = assistant.messages[assistant.messages.length - 1];
    expect(lastMsg.text).toContain('To send money');
  });

  it('useBankingAssistant triggers speech synthesis with phonetic contours', async () => {
    let assistant: any = null;
    let spokenText = '';
    let spokenLang = '';

    window.addEventListener('linguabridge:speak', (e: any) => {
      spokenText = e.detail.text;
      spokenLang = e.detail.lang;
    });

    const TestBankingComponent = () => {
      assistant = useBankingAssistant({ initialLang: 'ewo-CM' });
      return null;
    };

    const root = createRoot(container);
    await act(async () => {
      root.render(
        <LinguaBridgeProvider client={mockClient}>
          <TestBankingComponent />
        </LinguaBridgeProvider>
      );
    });

    act(() => {
      assistant.speak('Mbólani! Me ne assistant bancaire');
    });

    expect(spokenText).toBe('Mbólani! Me ne assistant bancaire');
    expect(spokenLang).toBe('ewo-CM');
  });

  it('renders BankingChatWidget component with interactive inputs, speech buttons, and 5 languages', async () => {
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <LinguaBridgeProvider client={mockClient}>
          <BankingChatWidget />
        </LinguaBridgeProvider>
      );
    });

    const widgetEl = container.querySelector('[data-testid="banking-chat-widget"]');
    expect(widgetEl).not.toBeNull();

    // Check language selector
    const select = container.querySelector('#react-widget-lang-select') as HTMLSelectElement;
    expect(select).not.toBeNull();
    const options = Array.from(select.options).map((o) => o.value);
    expect(options).toEqual(['ewo-CM', 'fuv-CM', 'hau-CM', 'knc-CM', 'pcm-CM']);

    // Check speaker button exists
    const speakBtn = container.querySelector('[data-testid="speak-btn"]');
    expect(speakBtn).not.toBeNull();

    // Check input and send button exist
    const input = container.querySelector('input[type="text"]') as HTMLInputElement;
    const sendBtn = container.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(input).not.toBeNull();
    expect(sendBtn).not.toBeNull();

    // Check quick chips
    const chips = container.querySelectorAll('.quick-chip');
    expect(chips.length).toBe(4);
  });
});
