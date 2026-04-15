import { createContext, useContext, useState } from 'react';
import { makeT } from './i18n.js';

const LangContext = createContext({ lang: 'en', setLang: () => {}, t: makeT('en') });

export function LangProvider({ children }) {
  const [lang, setLang] = useState('en');
  const t = makeT(lang);
  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
