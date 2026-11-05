export {
  LinguaBridgeProvider,
  useLinguaBridge,
  type LinguaBridgeProviderProps,
  type LinguaBridgeContextValue,
} from './context';

export {
  useTranslate,
  useLanguages,
  useBankingAssistant,
  type UseTranslateOptions,
  type UseTranslateResult,
  type BankingAssistantOptions,
  type BankingMessage,
  type UseBankingAssistantResult,
} from './hooks';

export { Translate, type TranslateProps } from './components/Translate';
export { BankingChatWidget, type BankingChatWidgetProps } from './components/BankingChatWidget';

export {
  CAMEROON_BANKING_LANGUAGES,
  filterVisibleLanguages,
  generateBankingResponse,
  speakAfricanText,
  detectBankingIntent,
  extractFinancialEntities,
  type ActiveLanguage,
  type BankingIntent,
  type BankingResponse,
  type ExtractedFinancialEntity,
} from './banking-engine';

export { LinguaBridgeClient, LinguaBridgeError } from '@linguabridge/sdk-js';
