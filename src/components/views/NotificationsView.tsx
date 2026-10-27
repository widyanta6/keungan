import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Bell,
  AlertTriangle,
  Info,
  CheckCircle2,
  AlertCircle,
  Check,
} from 'lucide-react';

export const NotificationsView: React.FC = () => {
  const {
    currentUser,
    notifications,
    markNotificationRead,
    setActiveTab,
  } = useApp();

  const [filterType, setFilterType] = useState<'all' | 'unread'>('all');

  if (!currentUser) return null;

  const isAdmin = currentUser.role === 'admin';
  const userNotifications = notifications.filter(
    (n) => n.workspaceId === currentUser.workspaceId || (isAdmin && n.workspaceId === 'ws_admin')
  );

  const filteredNotifs = userNotifications.filter((n) => {
    if (filterType === 'unread' && n.isRead) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl p-6 border border-purple-100 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-violet-700 uppercase tracking-wider mb-1">
            <Bell className="w-4 h-4" />
            <span>Pusat Notifikasi & Peringatan Bisnis</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">Notifikasi & Peringatan Keuangan</h1>
          <p className="text-xs text-slate-500 mt-1">
            Pantau saldo minimum, transaksi bernilai besar, jatuh tempo komisi, dan anggaran promosi.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
              filterType === 'all'
                ? 'bg-violet-900 text-white font-semibold shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua ({userNotifications.length})
          </button>
          <button
            onClick={() => setFilterType('unread')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
              filterType === 'unread'
                ? 'bg-violet-900 text-white font-semibold shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Belum Dibaca ({userNotifications.filter((n) => !n.isRead).length})
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifs.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center text-slate-400 border border-purple-100">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
            <p className="font-semibold text-slate-700 text-sm">Tidak ada notifikasi aktif</p>
            <p className="text-xs mt-1">Seluruh status keuangan Anda berjalan normal.</p>
          </div>
        ) : (
          filteredNotifs.map((notif) => {
            const isWarning = notif.type === 'warning';
            const isDanger = notif.type === 'danger';
            const isSuccess = notif.type === 'success';

            return (
              <div
                key={notif.id}
                className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                  notif.isRead
                    ? 'bg-white border-slate-200/80'
                    : isWarning || isDanger
                    ? 'bg-amber-50/50 border-amber-200'
                    : 'bg-violet-50/40 border-violet-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      isWarning || isDanger
                        ? 'bg-amber-100 text-amber-700'
                        : isSuccess
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-violet-100 text-violet-700'
                    }`}
                  >
                    {isWarning || isDanger ? (
                      <AlertTriangle className="w-5 h-5" />
                    ) : isSuccess ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Info className="w-5 h-5" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-slate-900">{notif.title}</h3>
                      {!notif.isRead && (
                        <span className="w-2 h-2 rounded-full bg-pink-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{notif.message}</p>
                    <span className="text-[11px] font-mono text-slate-400 mt-2 block">
                      {notif.timestamp}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {notif.linkTab && (
                    <button
                      onClick={() => setActiveTab(notif.linkTab!)}
                      className="text-xs font-semibold text-violet-700 hover:text-violet-900 px-2.5 py-1 bg-white border border-violet-200 rounded-lg shadow-xs hover:bg-violet-50 transition-colors"
                    >
                      Buka Menu
                    </button>
                  )}

                  {!notif.isRead && (
                    <button
                      onClick={() => markNotificationRead(notif.id)}
                      title="Tandai sudah dibaca"
                      className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
