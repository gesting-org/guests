import { useState, useEffect } from 'react';
import { Gestin6Logo } from '../App.jsx';
import { HOST_NAME, PROPERTY_NAME, formatDate, buildGuestUrl } from '../config.js';
import { getReservations, addReservation, deleteReservation, codeFor } from '../db.js';
import { daysUntilCheckin } from './CheckinBlocked.jsx';

// ─── Botón copiar ─────────────────────────────────────────────────────────────
function CopyBtn({ text, label = 'Copiar código' }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); }
    catch {
      const ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };
  return (
    <button
      onClick={copy}
      className={`flex items-center gap-1.5 text-xs font-body font-medium px-3 py-1.5 rounded-lg transition-all duration-150 active:scale-95 ${
        copied
          ? 'bg-sage-100 text-sage-600 border border-sage-200'
          : 'bg-cream-100 hover:bg-cream-200 text-gray-600 border border-cream-200'
      }`}
    >
      {copied ? (
        <><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>¡Copiado!</>
      ) : (
        <><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>{label}</>
      )}
    </button>
  );
}

// ─── Fila de reserva ──────────────────────────────────────────────────────────
function ReservationRow({ res, onDelete, isDemo }) {
  const [expanded, setExpanded] = useState(false);
  const code     = codeFor(res);
  const url      = buildGuestUrl(code);
  const days     = daysUntilCheckin(res.checkinDate);
  const isBlocked = days <= 1;

  let statusLabel, statusColor;
  if (days < 0)       { statusLabel = 'Finalizada';  statusColor = 'bg-gray-100 text-gray-400'; }
  else if (days === 0) { statusLabel = 'Hoy';         statusColor = 'bg-amber-100 text-amber-600'; }
  else if (days === 1) { statusLabel = 'Mañana';      statusColor = 'bg-amber-100 text-amber-600'; }
  else if (days <= 7)  { statusLabel = `En ${days}d`; statusColor = 'bg-sage-100 text-sage-600'; }
  else                { statusLabel = formatDate(res.checkinDate).split(',')[0]; statusColor = 'bg-cream-100 text-gray-500'; }

  return (
    <div className={`bg-white rounded-xl border transition-all duration-150 ${expanded ? 'border-terra-200 shadow-card' : 'border-cream-200 hover:border-cream-300'}`}>
      {/* Header row */}
      <button
        className="w-full flex items-center gap-3 p-4 text-left"
        onClick={() => setExpanded((v) => !v)}
      >
        {/* Avatar inicial */}
        <div className="w-9 h-9 rounded-full bg-terra-50 border border-terra-100 flex items-center justify-center flex-shrink-0 font-body font-bold text-sm text-terra-400">
          {res.guestName.charAt(0).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-body font-semibold text-sm text-gray-900 truncate">{res.guestName}</p>
          <p className="font-body text-xs text-gray-400 truncate">{res.propertyName}</p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {isDemo && (
            <span className="tag bg-amber-50 text-amber-500 border border-amber-100 text-[10px]">DEMO</span>
          )}
          <span className={`tag text-[10px] ${statusColor}`}>{statusLabel}</span>
          <svg className={`w-4 h-4 text-gray-400 transition-transform duration-150 ${expanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
          </svg>
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-cream-100 pt-3 space-y-3 animate-fade-in">
          {/* Info */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div><p className="text-gray-400 mb-0.5">Check-in</p><p className="font-semibold text-gray-800">{formatDate(res.checkinDate)}</p></div>
            <div><p className="text-gray-400 mb-0.5">Anfitrión</p><p className="font-semibold text-gray-800">{res.hostName}</p></div>
          </div>

          {/* Código */}
          <div>
            <p className="font-body text-[10px] text-gray-400 uppercase tracking-wider mb-1.5">Código de acceso</p>
            <div className="flex items-center gap-2 bg-cream-50 rounded-lg border border-cream-200 px-3 py-2">
              <code className="font-mono text-xs text-gray-700 flex-1 truncate select-all">{code}</code>
              <CopyBtn text={code} label="Código" />
            </div>
          </div>

          {/* URL */}
          <div>
            <p className="font-body text-[10px] text-gray-400 uppercase tracking-wider mb-1.5">Enlace directo</p>
            <div className="flex items-center gap-2 bg-cream-50 rounded-lg border border-cream-200 px-3 py-2">
              <code className="font-mono text-xs text-gray-500 flex-1 truncate">{url}</code>
              <CopyBtn text={url} label="URL" />
            </div>
          </div>

          {/* Estado + borrar */}
          <div className="flex items-center justify-between pt-1">
            {isBlocked ? (
              <span className="font-body text-xs text-amber-500 flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z"/></svg>
                App bloqueada para el huésped
              </span>
            ) : (
              <span className="font-body text-xs text-sage-500 flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                Activa · el huésped puede pedir
              </span>
            )}
            <button
              onClick={() => onDelete(res.id)}
              className="font-body text-xs text-red-400 hover:text-red-600 flex items-center gap-1 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              Eliminar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Host Panel ───────────────────────────────────────────────────────────────
export default function HostPanel({ onClose }) {
  const today = new Date().toISOString().split('T')[0];
  const [reservations, setReservations] = useState([]);
  const [form, setForm] = useState({
    guestName: '', checkinDate: today, propertyName: PROPERTY_NAME, hostName: HOST_NAME,
  });
  const [showForm, setShowForm] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);

  useEffect(() => {
    getReservations().then((list) => { setReservations(list); setLoading(false); });
  }, []);

  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.guestName.trim()) return;
    setSaving(true);
    try {
      await addReservation(form);
      const list = await getReservations();
      setReservations(list);
      setForm({ guestName: '', checkinDate: today, propertyName: form.propertyName, hostName: form.hostName });
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    await deleteReservation(id);
    const list = await getReservations();
    setReservations(list);
  };

  const demoIds = new Set(['demo-1','demo-2','demo-3','demo-4','demo-block']);

  // Separar activas (futuras) de pasadas
  const active   = reservations.filter((r) => daysUntilCheckin(r.checkinDate) >= 0);
  const past     = reservations.filter((r) => daysUntilCheckin(r.checkinDate) < 0);

  return (
    <div className="min-h-screen bg-cream-50">
      {/* Header */}
      <header className="bg-white border-b border-cream-200 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Gestin6Logo size="md" />
            <span className="font-body text-xs text-gray-400 border-l border-cream-300 pl-3">Panel del host</span>
          </div>
          <button onClick={onClose} className="font-body text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            Cerrar
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 pb-16">
        {/* Title + add button */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl text-gray-900">Reservas</h1>
            <p className="font-body text-xs text-gray-400 mt-0.5">
              {loading ? 'Cargando…' : `${reservations.length} reserva${reservations.length !== 1 ? 's' : ''} en total`}
            </p>
          </div>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="btn-primary text-xs px-4 py-2.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
            Nueva reserva
          </button>
        </div>

        {/* New reservation form */}
        {showForm && (
          <div className="bg-white rounded-2xl border border-terra-200 p-5 mb-6 animate-slide-up">
            <h3 className="font-body font-semibold text-sm text-gray-900 mb-4">Nueva reserva</h3>
            <form onSubmit={handleAdd} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="label">Nombre del huésped *</label>
                  <input className="input" placeholder="ej. María García" value={form.guestName} onChange={set('guestName')} required autoFocus />
                </div>
                <div>
                  <label className="label">Check-in *</label>
                  <input type="date" className="input" value={form.checkinDate} onChange={set('checkinDate')} required />
                </div>
                <div>
                  <label className="label">Anfitrión</label>
                  <input className="input" placeholder={HOST_NAME} value={form.hostName} onChange={set('hostName')} />
                </div>
                <div className="col-span-2">
                  <label className="label">Propiedad</label>
                  <input className="input" placeholder={PROPERTY_NAME} value={form.propertyName} onChange={set('propertyName')} />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={saving} className="btn-secondary text-sm flex-1 py-2.5 disabled:opacity-60">
                  {saving ? 'Guardando…' : 'Crear reserva'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-ghost text-sm px-4 py-2.5">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Active reservations */}
        {active.length > 0 && (
          <div className="space-y-2 mb-6">
            <p className="font-body text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Próximas y en curso ({active.length})
            </p>
            {active
              .sort((a, b) => new Date(a.checkinDate) - new Date(b.checkinDate))
              .map((r) => (
                <ReservationRow
                  key={r.id}
                  res={r}
                  onDelete={handleDelete}
                  isDemo={demoIds.has(r.id)}
                />
              ))}
          </div>
        )}

        {/* Past reservations */}
        {past.length > 0 && (
          <div className="space-y-2">
            <p className="font-body text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Finalizadas ({past.length})
            </p>
            {past
              .sort((a, b) => new Date(b.checkinDate) - new Date(a.checkinDate))
              .map((r) => (
                <ReservationRow
                  key={r.id}
                  res={r}
                  onDelete={handleDelete}
                  isDemo={demoIds.has(r.id)}
                />
              ))}
          </div>
        )}

        {/* Access URL */}
        <div className="mt-8 bg-white rounded-2xl border border-cream-200 p-5">
          <p className="label mb-2">Acceder a este panel</p>
          <code className="block bg-cream-50 border border-cream-200 rounded-xl px-4 py-3 font-mono text-xs text-gray-600">
            {window.location.origin + window.location.pathname}?host
          </code>
        </div>
      </main>
    </div>
  );
}
