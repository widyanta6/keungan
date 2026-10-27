import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AVAILABLE_MODULES } from '../../data/initialData';
import { WorkspaceModuleKey } from '../../types';
import {
  Settings,
  Layers,
  Shield,
  RotateCcw,
  CheckCircle2,
  Boxes,
  Calculator,
  Percent,
  Table,
  Megaphone,
  History,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const {
    currentUser,
    currentWorkspace,
    brands,
    toggleWorkspaceModule,
    auditLogs,
    resetToDemoData,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'modules' | 'brands' | 'audit'>('modules');
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  if (!currentUser) return null;

  const isAdmin = currentUser.role === 'admin';
  const userBrands = brands.filter((b) => b.workspaceId === currentUser.workspaceId);
  const activeModules = currentWorkspace?.activeModules || [];

  const getModuleIcon = (key: WorkspaceModuleKey) => {
    switch (key) {
      case 'stock':
        return <Boxes className="w-5 h-5 text-violet-600" />;
      case 'hpp':
        return <Calculator className="w-5 h-5 text-violet-600" />;
      case 'commission':
        return <Percent className="w-5 h-5 text-violet-600" />;
      case 'worksheet':
        return <Table className="w-5 h-5 text-violet-600" />;
      case 'marketing':
        return <Megaphone className="w-5 h-5 text-violet-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl p-6 border border-purple-100 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-violet-700 uppercase tracking-wider mb-1">
            <Settings className="w-4 h-4" />
            <span>Pengaturan & Modularitas Sistem</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">Konfigurasi Workspace & Modul</h1>
          <p className="text-xs text-slate-500 mt-1">
            Sesuaikan modul bisnis yang aktif di workspace Anda. Konfigurasi Ika dan Redi bekerja mandiri secara terisolasi.
          </p>
        </div>

        <button
          onClick={() => setResetConfirmOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors border border-red-200"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset Data Demo Baseline</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('modules')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
            activeTab === 'modules'
              ? 'bg-violet-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Katalog Modul Tambahan
        </button>
        <button
          onClick={() => setActiveTab('brands')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
            activeTab === 'brands'
              ? 'bg-violet-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Brand & Kategori Bisnis
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
            activeTab === 'audit'
              ? 'bg-violet-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Audit Log Sistem
        </button>
      </div>

      {/* Tab: Modules */}
      {activeTab === 'modules' && (
        <div className="space-y-4">
          <div className="p-3.5 bg-violet-50/70 border border-violet-100 rounded-xl text-xs text-slate-600 flex items-start gap-2.5">
            <Shield className="w-4 h-4 text-violet-700 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong className="text-violet-900">Modularitas Sesuai Kebutuhan Brand:</strong> Anda bebas
              mengaktifkan atau menonaktifkan modul bisnis. Contoh: Ika yang memproduksi perhiasan CHEMI
              dapat mengaktifkan HPP & Resep Bahan, sementara Redi yang mengelola event/media dapat
              menonaktifkannya agar sidebar tetap ringkas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {AVAILABLE_MODULES.map((mod) => {
              const isActive = activeModules.includes(mod.key);

              return (
                <div
                  key={mod.key}
                  className={`p-5 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                    isActive
                      ? 'bg-white border-violet-200 shadow-xs'
                      : 'bg-slate-50/60 border-slate-200/80 opacity-75'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
                      {getModuleIcon(mod.key)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-slate-900">{mod.name}</h3>
                        {isActive && (
                          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.2 rounded-full">
                            Aktif
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        {mod.description}
                      </p>
                    </div>
                  </div>

                  {!isAdmin && (
                    <button
                      onClick={() => toggleWorkspaceModule(mod.key)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all shrink-0 ${
                        isActive
                          ? 'bg-slate-100 text-slate-700 hover:bg-red-50 hover:text-red-700'
                          : 'bg-violet-600 text-white hover:bg-violet-700 shadow-xs'
                      }`}
                    >
                      {isActive ? 'Nonaktifkan' : 'Aktifkan'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab: Brands */}
      {activeTab === 'brands' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {userBrands.map((b) => (
            <div
              key={b.id}
              className="bg-white rounded-2xl p-5 border border-purple-100 shadow-xs space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3.5 h-3.5 rounded-full"
                    style={{ backgroundColor: b.color }}
                  />
                  <h3 className="font-bold text-base text-slate-900">{b.name}</h3>
                </div>
                <span className="text-xs font-semibold bg-violet-50 text-violet-700 px-2.5 py-0.5 rounded">
                  {b.code}
                </span>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 font-medium">Kategori Bisnis:</span>
                <p className="text-xs font-semibold text-slate-800 mt-0.5">{b.category}</p>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 font-medium">Deskripsi Operasional:</span>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{b.description}</p>
              </div>

              <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                Terdaftar sejak: {b.createdAt}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Audit Log */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-purple-100 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <History className="w-4 h-4 text-violet-700" />
              <span>Jejak Audit Aktivitas & Mutasi Sistem</span>
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                  <th className="py-2.5 px-3">Waktu</th>
                  <th className="py-2.5 px-3">Pengguna & Peran</th>
                  <th className="py-2.5 px-3">Tindakan (Action)</th>
                  <th className="py-2.5 px-3">Rincian Perubahan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 font-mono text-[11px]">
                    <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">{log.timestamp}</td>
                    <td className="py-2.5 px-3 font-sans font-semibold text-violet-900 whitespace-nowrap">
                      {log.userName} ({log.userRole})
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800 whitespace-nowrap">
                      {log.action}
                    </td>
                    <td className="py-2.5 px-3 font-sans text-slate-600">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reset Confirmation Dialog */}
      {resetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-red-100 space-y-4">
            <h3 className="font-bold text-base text-slate-900">
              Reset Data Demo ke Kondisi Awal?
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Tindakan ini akan mengembalikan data seluruh transaksi, produk, aset, dan komisi ke setelan demo awal PRD BizFlow.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setResetConfirmOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  resetToDemoData();
                  setResetConfirmOpen(false);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-xs"
              >
                Ya, Reset Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
