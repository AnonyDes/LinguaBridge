import { useState, useEffect, useCallback } from 'react';
import { useLinguaBridge } from './context';
import type { TranslationResult, Language } from '@linguabridge/shared-types';

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
    languages,
    loading: loadingLanguages,
    refresh: refreshLanguages,
  };
}
