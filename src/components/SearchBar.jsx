import { useState, useRef } from 'react';

export default function SearchBar({ onSearch, isSearching, t }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  const submit = (e) => {
    e.preventDefault();
    const q = query.trim();
    if (!q || isSearching) return;
    onSearch(q);
  };

  return (
    <form onSubmit={submit} className="flex gap-2">
      <div className="relative flex-1">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
          {isSearching ? (
            <svg className="w-4 h-4 text-terra-300 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
          ) : (
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35" strokeLinecap="round"/>
            </svg>
          )}
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('search_ph')}
          disabled={isSearching}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white
                     font-body text-sm text-gray-900 placeholder-gray-400
                     focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-400
                     disabled:opacity-60 transition-all duration-150"
        />
        {query && !isSearching && (
          <button
            type="button"
            onClick={() => { setQuery(''); inputRef.current?.focus(); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full
                       text-gray-400 hover:text-gray-600 hover:bg-cream-100 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        )}
      </div>

      <button
        type="submit"
        disabled={!query.trim() || isSearching}
        className="bg-gray-900 hover:bg-gray-800 text-white font-body font-semibold text-sm px-5 py-3 rounded-xl transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
      >
        {isSearching ? t('searching') : t('search_btn')}
      </button>
    </form>
  );
}
