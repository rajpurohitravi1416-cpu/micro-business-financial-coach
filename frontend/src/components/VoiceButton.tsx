import { Mic } from 'lucide-react';
import { getLanguage } from '../i18n';

export function VoiceButton({ onText }: { onText: (text: string) => void }) {
  const start = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      window.alert('Voice input is not supported in this browser. Try Chrome or Edge.');
      return;
    }
    const recognition = new SpeechRecognition();
    const voiceLocales: Record<string,string> = { en:'en-IN', hi:'hi-IN', kn:'kn-IN', mr:'mr-IN', gu:'gu-IN', ta:'ta-IN', te:'te-IN', bn:'bn-IN', ml:'ml-IN', pa:'pa-IN', or:'or-IN', as:'as-IN', ur:'ur-IN', hinglish:'en-IN' };
    recognition.lang = voiceLocales[getLanguage()] || 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event: any) => onText(event.results[0][0].transcript);
    recognition.start();
  };
  return <button className="icon-button voice-button" onClick={start} aria-label="Speak to Bizz Brains" title="Speak to Bizz Brains"><Mic size={21}/></button>;
}

export function SpeakButton({ text }: { text: string }) {
  const speak = () => {
    if (!('speechSynthesis' in window)) {
console.warn('Voice output is not supported in this browser.');
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = document.documentElement.lang || 'en-IN';
    window.speechSynthesis.speak(utterance);
  };
  return <button className="speak-button" onClick={speak} title="Read aloud" aria-label="Read aloud">🔊</button>;
}
