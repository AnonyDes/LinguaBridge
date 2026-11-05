import React, { useState, useRef, useEffect } from 'react';
import { useBankingAssistant, type BankingAssistantOptions } from '../hooks';
import { CAMEROON_BANKING_LANGUAGES } from '../banking-engine';

export interface BankingChatWidgetProps extends BankingAssistantOptions {
  className?: string;
  title?: string;
  placeholder?: string;
  primaryColor?: string;
}

export const BankingChatWidget: React.FC<BankingChatWidgetProps> = ({
  className = '',
  title = 'LinguaBridge IA Bancaire 🇨🇲',
  placeholder = 'Posez votre question bancaire en langue...',
  primaryColor = '#16a34a',
  initialLang = 'ewo-CM',
  welcomeMessage = true,
  onSpeech,
}) => {
  const {
    messages,
    sendMessage,
    currentLang,
    setLang,
    supportedLanguages,
    speak,
    isSpeaking,
    loading,
  } = useBankingAssistant({
    initialLang,
    welcomeMessage,
    onSpeech,
  });

  const [inputVal, setInputVal] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputVal.trim() || loading) return;
    const text = inputVal;
    setInputVal('');
    await sendMessage(text);
  };

  const handleChipClick = async (prompt: string) => {
    await sendMessage(prompt);
  };

  return (
    <div
      className={`linguabridge-banking-widget ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        maxWidth: '420px',
        height: '540px',
        border: '1px solid #e2e8f0',
        borderRadius: '14px',
        backgroundColor: '#ffffff',
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
        overflow: 'hidden',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
      data-testid="banking-chat-widget"
    >
      {/* Header */}
      <div
        style={{
          padding: '12px 16px',
          backgroundColor: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <div style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>{title}</div>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: '#047857',
              backgroundColor: '#ecfdf5',
              border: '1px solid #a7f3d0',
              borderRadius: '9999px',
              padding: '1px 8px',
              marginTop: '4px',
              display: 'inline-block',
            }}
          >
            🛡️ AST Guard : Zéro Dérive Financière
          </div>
        </div>
      </div>

      {/* Language Selector */}
      <div
        style={{
          padding: '10px 16px',
          borderBottom: '1px solid #f1f5f9',
          backgroundColor: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}
      >
        <label
          htmlFor="react-widget-lang-select"
          style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}
        >
          Langue maternelle africaine
        </label>
        <select
          id="react-widget-lang-select"
          value={currentLang}
          onChange={(e) => setLang(e.target.value)}
          aria-label="Langue maternelle africaine"
          style={{
            padding: '7px 10px',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            fontSize: '13px',
            fontWeight: 500,
            outline: 'none',
            backgroundColor: '#ffffff',
            cursor: 'pointer',
          }}
        >
          {supportedLanguages.map((l) => (
            <option key={l.code} value={l.code}>
              {l.name} ({l.nativeName})
            </option>
          ))}
        </select>
      </div>

      {/* Messages Scroll Area */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          backgroundColor: '#f8fafc',
        }}
        data-testid="chat-messages-container"
      >
        {messages.map((m) => {
          const isAssistant = m.sender === 'assistant';
          return (
            <div
              key={m.id}
              style={{
                alignSelf: isAssistant ? 'flex-start' : 'flex-end',
                maxWidth: '85%',
                padding: '9px 12px',
                borderRadius: '12px',
                borderBottomLeftRadius: isAssistant ? '2px' : '12px',
                borderBottomRightRadius: isAssistant ? '12px' : '2px',
                backgroundColor: isAssistant ? '#ffffff' : primaryColor,
                color: isAssistant ? '#1e293b' : '#ffffff',
                border: isAssistant ? '1px solid #e2e8f0' : 'none',
                boxShadow: isAssistant ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
                fontSize: '12.5px',
                lineHeight: 1.45,
              }}
              data-sender={m.sender}
            >
              <div>{m.text}</div>
              {isAssistant && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: '6px',
                    gap: '6px',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => speak(m.text, m.lang)}
                    aria-label="Écouter la réponse"
                    className="speak-btn"
                    data-testid="speak-btn"
                    style={{
                      backgroundColor: '#ecfdf5',
                      color: '#047857',
                      border: '1px solid #a7f3d0',
                      borderRadius: '6px',
                      padding: '3px 8px',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    🔊 {isSpeaking ? 'En lecture...' : 'Écouter'}
                  </button>
                  {m.zeroDriftVerified && (
                    <span style={{ fontSize: '10px', color: '#047857', fontWeight: 600 }}>
                      ✓ Zéro Dérive
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion Chips */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '6px',
          padding: '8px 16px',
          backgroundColor: '#ffffff',
          borderTop: '1px solid #f1f5f9',
        }}
      >
        <button
          type="button"
          onClick={() => handleChipClick("Comment envoyer de l'argent ?")}
          className="quick-chip"
          style={{
            backgroundColor: '#f1f5f9',
            border: '1px solid #e2e8f0',
            borderRadius: '9999px',
            padding: '4px 10px',
            fontSize: '11px',
            cursor: 'pointer',
          }}
        >
          💸 Comment envoyer ?
        </button>
        <button
          type="button"
          onClick={() => handleChipClick('Quel est mon solde ?')}
          className="quick-chip"
          style={{
            backgroundColor: '#f1f5f9',
            border: '1px solid #e2e8f0',
            borderRadius: '9999px',
            padding: '4px 10px',
            fontSize: '11px',
            cursor: 'pointer',
          }}
        >
          💳 Quel est mon solde ?
        </button>
        <button
          type="button"
          onClick={() => handleChipClick('Frais de retrait')}
          className="quick-chip"
          style={{
            backgroundColor: '#f1f5f9',
            border: '1px solid #e2e8f0',
            borderRadius: '9999px',
            padding: '4px 10px',
            fontSize: '11px',
            cursor: 'pointer',
          }}
        >
          📊 Frais
        </button>
        <button
          type="button"
          onClick={() => handleChipClick('Sécurité de mon compte')}
          className="quick-chip"
          style={{
            backgroundColor: '#f1f5f9',
            border: '1px solid #e2e8f0',
            borderRadius: '9999px',
            padding: '4px 10px',
            fontSize: '11px',
            cursor: 'pointer',
          }}
        >
          🔒 Sécurité
        </button>
      </div>

      {/* Input bar */}
      <form
        onSubmit={handleSend}
        style={{
          display: 'flex',
          gap: '8px',
          padding: '12px 16px',
          borderTop: '1px solid #e2e8f0',
          backgroundColor: '#ffffff',
        }}
      >
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          disabled={loading}
          style={{
            flex: 1,
            padding: '9px 12px',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            fontSize: '13px',
            outline: 'none',
          }}
        />
        <button
          type="submit"
          disabled={loading || !inputVal.trim()}
          style={{
            backgroundColor: primaryColor,
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            padding: '0 16px',
            fontWeight: 600,
            fontSize: '13px',
            cursor: loading || !inputVal.trim() ? 'not-allowed' : 'pointer',
            opacity: loading || !inputVal.trim() ? 0.6 : 1,
          }}
        >
          Envoyer
        </button>
      </form>
    </div>
  );
};
