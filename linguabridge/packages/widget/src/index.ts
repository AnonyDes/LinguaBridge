import { LinguaBridgeWidget } from './widget';

export {
  LinguaBridgeWidget,
  type WidgetOptions,
  type ChatMessage,
} from './widget';

export {
  ACTIVE_CAMEROON_LANGUAGES,
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

// Auto-initialize if running in a browser with data attribute
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  (window as any).LinguaBridgeWidget = LinguaBridgeWidget;

  // Auto-init if script tag has data-auto-init
  const script = document.currentScript;
  if (script && script.hasAttribute('data-auto-init')) {
    const apiUrl = script.getAttribute('data-api-url') || undefined;
    const apiKey = script.getAttribute('data-api-key') || undefined;
    LinguaBridgeWidget.init({ apiUrl, apiKey });
  }
}

export default LinguaBridgeWidget;
