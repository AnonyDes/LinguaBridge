import type { SpeechSynthesisResult } from '@linguabridge/shared-types';

export interface SpeechSynthesisOptions {
  voice?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  audioFormat?: 'mp3' | 'wav' | 'ogg' | 'pcm';
}

export interface SpeechProvider {
  id: string;
  name: string;
  supportedLanguages: string[];
  synthesize(text: string, lang: string, options?: SpeechSynthesisOptions): Promise<SpeechSynthesisResult>;
  isLanguageSupported(lang: string): boolean;
}
