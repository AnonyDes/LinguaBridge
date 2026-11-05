import React, { useState } from 'react';
import { useTranslate, type UseTranslateOptions } from '../hooks';
import { speakAfricanText } from '../banking-engine';

export interface TranslateProps extends UseTranslateOptions {
  text: string;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
  showOriginalOnHover?: boolean;
  enableAudio?: boolean;
}

export const Translate: React.FC<TranslateProps> = ({
  text,
  as: Component = 'span',
  className = '',
  showOriginalOnHover = false,
  enableAudio = false,
  ...options
}) => {
  const { translatedText, originalText, loading, warnings, targetLang } = useTranslate(text, options) as any;
  const [hovered, setHovered] = useState(false);

  const displayText = showOriginalOnHover && hovered ? originalText : translatedText;

  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    speakAfricanText(displayText, displayText, options.targetLang || 'ewo-CM');
  };

  return (
    <Component
      className={`linguabridge-text ${className} ${warnings && warnings.length > 0 ? 'linguabridge-warning' : ''}`}
      onMouseEnter={() => showOriginalOnHover && setHovered(true)}
      onMouseLeave={() => showOriginalOnHover && setHovered(false)}
      title={warnings && warnings.length > 0 ? warnings.join('\n') : undefined}
      data-original={originalText}
      data-loading={loading}
    >
      {displayText}
      {enableAudio && (
        <button
          type="button"
          onClick={handleSpeak}
          className="linguabridge-speak-icon"
          aria-label="Écouter la prononciation"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            marginLeft: '6px',
            fontSize: '12px',
            verticalAlign: 'middle',
          }}
        >
          🔊
        </button>
      )}
    </Component>
  );
};
