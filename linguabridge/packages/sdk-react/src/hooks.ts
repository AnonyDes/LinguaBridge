import { useState, useEffect, useCallback, useRef } from 'react';
import { useLinguaBridge } from './context';
import type { TranslationResult, Language } from '@linguabridge/shared-types';
import {
  CAMEROON_BANKING_LANGUAGES,
  filterVisibleLanguages,
  generateBankingResponse,
  speakAfricanText,
  type ActiveLanguage,
  type BankingResponse,
  type ExtractedFinancialEntity,
} from './banking-engine';

export interface UseTranslateOptions {
  sourceLang?: string;
  targetLang?: string;
  domain?: string;
  context?: string;
  skip?: boolean;
}

export interface UseTranslateResult {
  translatedText: string;
  originalText: string;
  loading: boolean;
  error: Error | null;
  result: TranslationResult | null;
  speechAvailable: boolean;
  warnings: string[];
  refetch: () => Promise<void>;
}

export function useTranslate(text: string, options: UseTranslateOptions = {}): UseTranslateResult {
  const { client, sourceLang: defaultSource, targetLang: defaultTarget } = useLinguaBridge();
  const sourceLang = options.sourceLang || defaultSource;
  const targetLang = options.targetLang || defaultTarget;

  const [translatedText, setTranslatedText] = useState<string>(text);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [result, setResult] = useState<TranslationResult | null>(null);

  const fetchTranslation = useCallback(async () => {
    if (!text || options.skip || sourceLang === targetLang) {
      setTranslatedText(text);
      setLoading(false);
      setResult(null);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await client.translate({
        text,
        sourceLang,
        targetLang,
        domain: options.domain,
        context: options.context,
      });
      setTranslatedText(res.translatedText);
      setResult(res);
    } catch (err) {
      setError(err as Error);
      setTranslatedText(text); // Fallback to original text on failure
    } finally {
      setLoading(false);
    }
  }, [client, text, sourceLang, targetLang, options.domain, options.context, options.skip]);

  useEffect(() => {
    fetchTranslation();
  }, [fetchTranslation]);

  return {
    translatedText,
    originalText: text,
    loading,
    error,
    result,
    speechAvailable: result?.speechAvailable ?? false,
    warnings: result?.warnings ?? [],
    refetch: fetchTranslation,
  };
}

export function useLanguages(): {
  languages: Language[];
  loading: boolean;
  refresh: () => Promise<void>;
} {
  const { languages, loadingLanguages, refreshLanguages } = useLinguaBridge();
  return {
    languages: filterVisibleLanguages(languages),
    loading: loadingLanguages,
    refresh: refreshLanguages,
  };
}

export interface BankingMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  phonetic?: string;
  lang: string;
  timestamp: number;
  entities?: ExtractedFinancialEntity[];
  zeroDriftVerified?: boolean;
}

export interface BankingAssistantOptions {
  initialLang?: string;
  welcomeMessage?: boolean;
  onSpeech?: (text: string, lang: string) => void;
}

export interface UseBankingAssistantResult {
  messages: BankingMessage[];
  sendMessage: (text: string) => Promise<BankingMessage>;
  clearMessages: () => void;
  currentLang: string;
  setLang: (lang: string) => void;
  supportedLanguages: ActiveLanguage[];
  speak: (text: string, lang?: string) => void;
  isSpeaking: boolean;
  stopSpeaking: () => void;
  loading: boolean;
}

/**
 * Hook for integrating sovereign multilingual Banking AI assistant
 * with zero-drift AST protection and interactive speech synthesis.
 */
export function useBankingAssistant(options: BankingAssistantOptions = {}): UseBankingAssistantResult {
  const initialLang = options.initialLang || 'ewo-CM';
  const [currentLang, setCurrentLangState] = useState<string>(initialLang);
  const [loading, setLoading] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  const initialGreeting = generateBankingResponse('bonjour', initialLang);

  const [messages, setMessages] = useState<BankingMessage[]>(() => {
    if (options.welcomeMessage === false) return [];
    return [
      {
        id: 'welcome-msg',
        sender: 'assistant',
        text: initialGreeting.text,
        phonetic: initialGreeting.phonetic,
        lang: initialLang,
        timestamp: Date.now(),
        entities: initialGreeting.entities,
        zeroDriftVerified: initialGreeting.zeroDriftVerified,
      },
    ];
  });

  const setLang = useCallback((lang: string) => {
    if (lang.toLowerCase().startsWith('dua')) {
      // Duala strictly excluded
      return;
    }
    setCurrentLangState(lang);
    const greeting = generateBankingResponse('bonjour', lang);
    setMessages((prev) => [
      ...prev,
      {
        id: `lang-change-${Date.now()}`,
        sender: 'assistant',
        text: greeting.text,
        phonetic: greeting.phonetic,
        lang,
        timestamp: Date.now(),
        zeroDriftVerified: true,
      },
    ]);
  }, []);

  const sendMessage = useCallback(
    async (text: string): Promise<BankingMessage> => {
      const trimmed = text.trim();
      if (!trimmed) {
        throw new Error('Message cannot be empty');
      }

      setLoading(true);

      const userMsg: BankingMessage = {
        id: `user-${Date.now()}`,
        sender: 'user',
        text: trimmed,
        lang: 'fr',
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMsg]);

      // Generate sovereign banking response with AST Guard zero-drift verification
      const resp = generateBankingResponse(trimmed, currentLang);

      const assistantMsg: BankingMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: resp.text,
        phonetic: resp.phonetic,
        lang: currentLang,
        timestamp: Date.now(),
        entities: resp.entities,
        zeroDriftVerified: resp.zeroDriftVerified,
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setLoading(false);

      return assistantMsg;
    },
    [currentLang]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const speak = useCallback(
    (text: string, lang?: string) => {
      const target = lang || currentLang;
      const matchingMsg = messages.find((m) => m.text === text);
      const phoneticText = matchingMsg?.phonetic || text;

      setIsSpeaking(true);
      speakAfricanText(
        text,
        phoneticText,
        target,
        () => setIsSpeaking(true),
        () => setIsSpeaking(false)
      );

      if (options.onSpeech) {
        options.onSpeech(text, target);
      }
    },
    [currentLang, messages, options]
  );

  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  return {
    messages,
    sendMessage,
    clearMessages,
    currentLang,
    setLang,
    supportedLanguages: CAMEROON_BANKING_LANGUAGES,
    speak,
    isSpeaking,
    stopSpeaking,
    loading,
  };
}
