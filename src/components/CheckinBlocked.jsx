import { Gestin6Logo } from '../App.jsx';
import { formatDate } from '../config.js';

// Returns days until check-in (negative = already passed)
export function daysUntilCheckin(checkinDate) {
  const today    = new Date();
  today.setHours(0, 0, 0, 0);
  const checkin  = new Date(checkinDate + 'T00:00:00');
  checkin.setHours(0, 0, 0, 0);
  return Math.round((checkin - today) / (1000 * 60 * 60 * 24));
}

export default function CheckinBlocked({ guestInfo, t }) {
  const days     = daysUntilCheckin(guestInfo.checkinDate);
  const isToday  = days === 0;
  const isPast   = days < 0;
  const checkinFmt = formatDate(guestInfo.checkinDate);

  let title, subtitle, icon;

  if (isPast) {
    icon     = '🏠';
    title    = t('blocked_past_title');
    subtitle = t('blocked_past_sub', guestInfo.propertyName);
  } else if (isToday) {
    icon     = '🗝️';
    title    = t('blocked_today_title');
    subtitle = t('blocked_today_sub', guestInfo.propertyName);
  } else {
    // days === 1
    icon     = '⏰';
    title    = t('blocked_tomorrow_title');
    subtitle = t('blocked_tomorrow_sub', guestInfo.propertyName);
  }

  return (
    <div className="min-h-screen bg-cream-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-cream-200">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center">
          <Gestin6Logo size="md" />
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center animate-slide-up">
          <div className="text-6xl mb-6">{icon}</div>

          <h1 className="font-display text-3xl text-gray-900 mb-3">
            {title}
          </h1>
          <p className="font-body text-gray-500 text-sm leading-relaxed mb-8 max-w-xs mx-auto">
            {subtitle}
          </p>

          {/* Reservation info */}
          <div className="bg-white rounded-2xl border border-cream-200 p-6 text-left space-y-4">
            <p className="font-body text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {t('blocked_res_title')}
            </p>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-cream-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm">👤</span>
                </div>
                <div>
                  <p className="font-body text-xs text-gray-400">{t('guest_label')}</p>
                  <p className="font-body text-sm font-semibold text-gray-900">{guestInfo.guestName}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-cream-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm">🏠</span>
                </div>
                <div>
                  <p className="font-body text-xs text-gray-400">{t('property_label')}</p>
                  <p className="font-body text-sm font-semibold text-gray-900">{guestInfo.propertyName}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-cream-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm">📅</span>
                </div>
                <div>
                  <p className="font-body text-xs text-gray-400">{t('checkin_label')}</p>
                  <p className="font-body text-sm font-semibold text-gray-900">{checkinFmt}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-cream-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm">👋</span>
                </div>
                <div>
                  <p className="font-body text-xs text-gray-400">{t('host_label')}</p>
                  <p className="font-body text-sm font-semibold text-gray-900">{guestInfo.hostName}</p>
                </div>
              </div>
            </div>
          </div>

          <p className="font-body text-xs text-gray-400 mt-6">
            {t('contact_host', guestInfo.hostName)}
          </p>
        </div>
      </div>
    </div>
  );
}
