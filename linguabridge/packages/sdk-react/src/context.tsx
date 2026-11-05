import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { LinguaBridgeClient } from '@linguabridge/sdk-js';
import type { Language } from '@linguabridge/shared-types';
import {
  CAMEROON_BANKING_LANGUAGES,
  filterVisibleLanguages,
} from './banking-engine';

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
  defaultTargetLang = 'ewo-CM',
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

  const getSovereignDefaultLanguages = (): Language[] => {
    const cameroonLangs: Language[] = CAMEROON_BANKING_LANGUAGES.map((l) => ({
      code: l.code,
      name: l.name,
      nativeName: l.nativeName,
      speechAvailable: l.speechAvailable,
      packStatus: 'production_approved',
      isAvailable: true,
    }));

    return [
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
      ...cameroonLangs,
    ];
  };

  const refreshLanguages = async () => {
    try {
      setLoadingLanguages(true);
      const fetched = await client.getLanguages();
      // Strict invariant: Filter out Duala from visible options
      const visible = filterVisibleLanguages(fetched);

      // Merge with sovereign Cameroonian languages
      const map = new Map<string, Language>();
      for (const lang of getSovereignDefaultLanguages()) {
        map.set(lang.code, lang);
      }
      for (const lang of visible) {
        if (!lang.code.toLowerCase().startsWith('dua')) {
          map.set(lang.code, lang);
        }
      }

      setLanguages(Array.from(map.values()));
    } catch {
      // Fallback default languages with sovereign Cameroonian languages
      setLanguages(getSovereignDefaultLanguages());
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
