import React, { useState } from 'react';
import { useTranslate, type UseTranslateOptions } from '../hooks';

export interface TranslateProps extends UseTranslateOptions {
  text: string;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
  showOriginalOnHover?: boolean;
}

export const Translate: React.FC<TranslateProps> = ({
  text,
  as: Component = 'span',
  className = '',
  showOriginalOnHover = false,
  ...options
}) => {
  const { translatedText, originalText, loading, warnings } = useTranslate(text, options);
  const [hovered, setHovered] = useState(false);

  const displayText = showOriginalOnHover && hovered ? originalText : translatedText;

  return (
    <Component
      className={`linguabridge-text ${className} ${warnings.length > 0 ? 'linguabridge-warning' : ''}`}
      onMouseEnter={() => showOriginalOnHover && setHovered(true)}
      onMouseLeave={() => showOriginalOnHover && setHovered(false)}
      title={warnings.length > 0 ? warnings.join('\n') : undefined}
      data-original={originalText}
      data-loading={loading}
    >
      {displayText}
    </Component>
  );
};
