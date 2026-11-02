import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { LinguaBridgeClient } from '@linguabridge/sdk-js';
import type { Language } from '@linguabridge/shared-types';

export interface LinguaBridgeContextValue {
  client: LinguaBridgeClient;
  sourceLang: string;
  targetLang: string;
  setSourceLang: (lang: string) => void;
  setTargetLang: (lang: string) => void;
  languages: Language[];
  loadingLanguages: boolean;
  refreshLanguages: () => Promise<void>;
}

const LinguaBridgeContext = createContext<LinguaBridgeContextValue | null>(null);

export interface LinguaBridgeProviderProps {
  client?: LinguaBridgeClient;
  baseUrl?: string;
  apiKey?: string;
  defaultSourceLang?: string;
  defaultTargetLang?: string;
  children: React.ReactNode;
}

export const LinguaBridgeProvider: React.FC<LinguaBridgeProviderProps> = ({
  client: providedClient,
  baseUrl,
  apiKey,
  defaultSourceLang = 'fr',
  defaultTargetLang = 'en',
  children,
}) => {
  const client = useMemo(() => {
    if (providedClient) return providedClient;
    return new LinguaBridgeClient({ baseUrl, apiKey });
  }, [providedClient, baseUrl, apiKey]);

  const [sourceLang, setSourceLang] = useState<string>(defaultSourceLang);
  const [targetLang, setTargetLang] = useState<string>(defaultTargetLang);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loadingLanguages, setLoadingLanguages] = useState<boolean>(true);

  const refreshLanguages = async () => {
    try {
      setLoadingLanguages(true);
      const fetched = await client.getLanguages();
      setLanguages(fetched);
    } catch {
      // Fallback default languages
      setLanguages([
        {
          code: 'fr',
          name: 'French',
          nativeName: 'Français',
          speechAvailable: true,
          packStatus: 'production_approved',
          isAvailable: true,
        },
        {
          code: 'en',
          name: 'English',
          nativeName: 'English',
          speechAvailable: true,
          packStatus: 'production_approved',
          isAvailable: true,
        },
      ]);
    } finally {
      setLoadingLanguages(false);
    }
  };

  useEffect(() => {
    refreshLanguages();
  }, [client]);

  return (
    <LinguaBridgeContext.Provider
      value={{
        client,
        sourceLang,
        targetLang,
        setSourceLang,
        setTargetLang,
        languages,
        loadingLanguages,
        refreshLanguages,
      }}
    >
      {children}
    </LinguaBridgeContext.Provider>
  );
};

export const useLinguaBridge = (): LinguaBridgeContextValue => {
  const ctx = useContext(LinguaBridgeContext);
  if (!ctx) {
    throw new Error('useLinguaBridge must be used within a LinguaBridgeProvider');
  }
  return ctx;
};
