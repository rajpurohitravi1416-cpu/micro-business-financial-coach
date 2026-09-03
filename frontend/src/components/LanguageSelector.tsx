import { useEffect, useState } from 'react';
import { getLanguage, languageOptions, setLanguage, type LanguageCode } from '../i18n';

export function LanguageSelector() {
  const [language, setCurrent] = useState<LanguageCode>(getLanguage());
  useEffect(() => {
    const onChange = () => { const next = getLanguage(); setCurrent(next); document.documentElement.lang = next === 'hinglish' ? 'en-IN' : `${next}-IN`; };
    document.documentElement.lang = getLanguage() === 'hinglish' ? 'en-IN' : `${getLanguage()}-IN`;
    window.addEventListener('languagechange', onChange);
    return () => window.removeEventListener('languagechange', onChange);
  }, []);
  return (
    <label className="language-selector" title="Choose language">
      <span>🌐</span>
      <select value={language} onChange={e => { const next = e.target.value as LanguageCode; setLanguage(next); setCurrent(next); document.documentElement.lang = next === 'hinglish' ? 'en-IN' : `${next}-IN`; }}>
        {languageOptions.map(option => <option key={option.code} value={option.code}>{option.nativeName}</option>)}
      </select>
    </label>
  );
}
