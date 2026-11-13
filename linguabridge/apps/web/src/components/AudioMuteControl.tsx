'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Volume2, VolumeX, Square } from 'lucide-react';
import { stopAfricanSpeech } from '@linguabridge/widget';

export function AudioMuteControl() {
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingText, setSpeakingText] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check stored mute preference
    const stored = localStorage.getItem('linguabridge_audio_muted') === 'true';
    setIsMuted(stored);
    (window as any).__linguabridgeAudioMuted = stored;
    if (stored) {
      document.documentElement.setAttribute('data-linguabridge-muted', 'true');
    }

    // Speech events listeners
    const handleSpeak = (e: any) => {
      if (stored || (window as any).__linguabridgeAudioMuted) {
        setIsSpeaking(false);
        return;
      }
      setIsSpeaking(true);
      const text = e.detail?.phoneticText || e.detail?.text || '';
      setSpeakingText(text.slice(0, 60));
    };

    const handleStop = () => {
      setIsSpeaking(false);
      setSpeakingText('');
    };

    window.addEventListener('linguabridge:speak', handleSpeak);
    window.addEventListener('linguabridge:speech-stopped', handleStop);

    // Keyboard shortcut: Escape immediately stops speech
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        stopAllSpeech();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('linguabridge:speak', handleSpeak);
      window.removeEventListener('linguabridge:speech-stopped', handleStop);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const stopAllSpeech = useCallback(() => {
    stopAfricanSpeech();
    setIsSpeaking(false);
    setSpeakingText('');
    if (typeof window !== 'undefined') {
      window.postMessage({ type: 'LINGUABRIDGE_STOP_VOICE' }, '*');
      window.dispatchEvent(new CustomEvent('linguabridge:stop-speech'));
      if ('speechSynthesis' in window) {
        try { window.speechSynthesis.cancel(); } catch {}
      }
    }
  }, []);

  const toggleMute = useCallback(() => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    (window as any).__linguabridgeAudioMuted = nextMuted;

    try {
      localStorage.setItem('linguabridge_audio_muted', nextMuted ? 'true' : 'false');
    } catch {}

    if (nextMuted) {
      document.documentElement.setAttribute('data-linguabridge-muted', 'true');
      stopAllSpeech();
    } else {
      document.documentElement.removeAttribute('data-linguabridge-muted');
    }

    if (typeof window !== 'undefined') {
      window.postMessage({ type: 'LINGUABRIDGE_MUTE_VOICE', muted: nextMuted }, '*');
      window.dispatchEvent(new CustomEvent('linguabridge:mute-toggled', { detail: { muted: nextMuted } }));
    }
  }, [isMuted, stopAllSpeech]);

  return (
    <>
      {/* Header Sound Toggle Button */}
      <button
        type="button"
        onClick={toggleMute}
        className={`lb-header-sound-toggle ${isMuted ? 'is-muted' : 'is-active'} ${isSpeaking ? 'is-speaking' : ''}`}
        aria-label={isMuted ? 'Activer la voix africaine' : 'Bloquer la voix (Mode silencieux)'}
        title={isMuted ? 'Voix coupée (cliquer pour activer)' : 'Bloquer la voix / Couper le son (Échap)'}
      >
        {isMuted ? (
          <VolumeX size={18} strokeWidth={2.3} style={{ color: '#ef4444' }} />
        ) : (
          <Volume2 size={18} strokeWidth={2.2} style={{ color: isSpeaking ? '#22c55e' : 'var(--muted)' }} />
        )}
      </button>

      {/* Floating Instant Audio Controller when speaking */}
      {isSpeaking && !isMuted && (
        <div className="lb-audio-active-bar" role="status" aria-live="polite">
          <div className="lb-audio-active-info">
            <span className="lb-audio-active-pulse" />
            <span className="lb-audio-active-label">Voix active :</span>
            <span className="lb-audio-active-text">{speakingText || 'Lecture neuronale Meta MMS'}</span>
          </div>
          <button
            type="button"
            onClick={stopAllSpeech}
            className="lb-audio-active-stop"
            aria-label="Arrêter la voix"
            title="Arrêter la voix immédiatement (Échap)"
          >
            <Square size={13} fill="currentColor" />
            <span>Arrêter</span>
          </button>
        </div>
      )}
    </>
  );
}
