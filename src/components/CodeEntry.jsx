import { useState } from 'react';
import { Gestin6Logo } from '../App.jsx';
import { fetchBooking, bookingToGuestInfo } from '../booking.js';
import { formatDate } from '../config.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function StatusIcon({ status }) {
  if (status === 'CANCELLED') {
    return (
      <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  }
  return (
    <svg className="w-5 h-5 text-sage-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function Row({ emoji, label, value }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="text-base leading-tight mt-0.5">{emoji}</span>
      <div className="min-w-0">
        <p className="font-body text-[11px] uppercase tracking-wider text-gray-400 leading-none mb-0.5">{label}</p>
        <p className="font-body text-sm font-semibold text-gray-900 leading-snug">{value}</p>
      </div>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function CodeEntry({ onValidCode, t }) {
  const [input,   setInput]   = useState('');
  const [status,  setStatus]  = useState('idle'); // idle | loading | found | error
  const [result,  setResult]  = useState(null);   // BookingData from PMS
  const [errKey,  setErrKey]  = useState('');

  // Normalise to uppercase as the user types
  const handleChange = (e) => {
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);
    setInput(val);
    if (status !== 'idle') {
      setStatus('idle');
      setResult(null);
      setErrKey('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const code = input.trim();
    if (!code) {
      setErrKey('booking_empty');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setResult(null);
    setErrKey('');

    const res = await fetchBooking(code);

    if (!res.ok) {
      setStatus('error');
      setErrKey(res.error === 'not_found'        ? 'booking_not_found'
               : res.error === 'not_configured'  ? 'booking_not_configured'
               : res.error === 'network_error'   ? 'booking_network_error'
               :                                   'booking_server_error');
      return;
    }

    setResult(res.data);
    setStatus('found');
  };

  const handleEnter = () => {
    if (!result) return;
    onValidCode(bookingToGuestInfo(result));
  };

  const isCancelled = result?.status === 'CANCELLED';

  return (
    <div className="min-h-screen bg-cream-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-cream-200">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center">
          <Gestin6Logo size="md" />
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Intro */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-terra-50 border border-terra-100 flex items-center justify-center mx-auto mb-5">
              <svg className="w-8 h-8 text-terra-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
              </svg>
            </div>
            <h1 className="font-display text-3xl text-gray-900 mb-2">
              {t('code_title')}
            </h1>
            <p className="font-body text-gray-500 text-sm leading-relaxed">
              {t('code_sub')}
            </p>
          </div>

          {/* Form */}
          <div className="bg-white rounded-2xl border border-cream-200 p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label" htmlFor="code-input">
                  {t('code_label')}
                </label>
                <input
                  id="code-input"
                  className="input font-mono text-sm tracking-widest uppercase"
                  placeholder={t('code_ph')}
                  value={input}
                  onChange={handleChange}
                  autoFocus
                  autoComplete="off"
                  spellCheck={false}
                  disabled={status === 'loading'}
                />

                {/* Error message */}
                {status === 'error' && (
                  <p className="font-body text-xs text-red-500 mt-1.5 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
                    </svg>
                    {t(errKey)}
                  </p>
                )}
              </div>

              {/* Search button */}
              <button
                type="submit"
                disabled={!input.trim() || status === 'loading'}
                className="btn-secondary w-full py-3.5 text-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {status === 'loading' ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                    </svg>
                    {t('booking_searching')}
                  </>
                ) : t('booking_search_btn')}
              </button>

              {/* Result card */}
              {status === 'found' && result && (
                <div className={`rounded-xl border p-4 animate-fade-in space-y-3 ${
                  isCancelled
                    ? 'bg-red-50 border-red-200'
                    : 'bg-sage-50 border-sage-200'
                }`}>
                  {/* Status header */}
                  <div className="flex items-center gap-2">
                    <StatusIcon status={result.status} />
                    <p className={`font-body text-xs font-semibold uppercase tracking-wider ${
                      isCancelled ? 'text-red-500' : 'text-sage-600'
                    }`}>
                      {isCancelled ? t('booking_cancelled_label') : t('code_ok')}
                    </p>
                  </div>

                  {/* Cancelled warning */}
                  {isCancelled && (
                    <div className="bg-red-100 border border-red-200 rounded-lg px-3 py-2">
                      <p className="font-body text-sm text-red-700 font-semibold">
                        {t('booking_cancelled_msg')}
                      </p>
                      <p className="font-body text-xs text-red-500 mt-0.5">
                        {t('booking_cancelled_sub')}
                      </p>
                    </div>
                  )}

                  {/* Reservation details */}
                  <div className="space-y-2.5">
                    <Row emoji="👤" label={t('code_guest')}    value={result.guestFirstName} />
                    <Row emoji="🏠" label={t('code_property')} value={`${result.property.name}${result.property.city ? ` · ${result.property.city}` : ''}`} />
                    <Row emoji="📅" label={t('booking_checkin_label')}  value={`${formatDate(result.checkIn)}${result.checkInTime ? ` · ${result.checkInTime}` : ''}`} />
                    {result.checkOut && (
                      <Row emoji="🚪" label={t('booking_checkout_label')} value={`${formatDate(result.checkOut)}${result.checkOutTime ? ` · ${result.checkOutTime}` : ''}`} />
                    )}
                    {result.nights > 0 && (
                      <Row emoji="🌙" label={t('booking_nights_label')} value={t('booking_nights_value', result.nights)} />
                    )}
                  </div>
                </div>
              )}

              {/* Enter button — only shown when reservation found and not cancelled */}
              {status === 'found' && result && !isCancelled && (
                <button
                  type="button"
                  onClick={handleEnter}
                  className="btn-secondary w-full py-3.5 text-sm"
                >
                  {t('code_btn')}
                </button>
              )}
            </form>
          </div>

          <p className="text-center font-body text-xs text-gray-400 mt-5">
            {t('code_no_code')}
          </p>
        </div>
      </div>
    </div>
  );
}
