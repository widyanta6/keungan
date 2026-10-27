import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShieldCheck,
  TrendingUp,
  Download,
  Info,
  Calendar,
  Lock,
  Wallet,
  Receipt,
  FileSpreadsheet,
} from 'lucide-react';
import { exportFullFinancialReport } from '../../utils/excelExport';

export const AdminTransparencyView: React.FC = () => {
  const {
    currentUser,
    workspaces,
    brands,
    assets,
    transactions,
    products,
    hppRecipes,
    commissions,
    marketing,
    dateRange,
    setDateRange,
  } = useApp();

  const [activeClientTab, setActiveClientTab] = useState<'all' | 'ika' | 'redi'>('all');

  if (!currentUser || currentUser.role !== 'admin') return null;

  // Separate calculations for Ika and Redi
  const ikaBrands = brands.filter((b) => b.workspaceId === 'ws_ika');
  const rediBrands = brands.filter((b) => b.workspaceId === 'ws_redi');

  const ikaAssets = assets.filter((a) => a.workspaceId === 'ws_ika');
  const rediAssets = assets.filter((a) => a.workspaceId === 'ws_redi');

  const ikaTxs = transactions.filter((t) => !t.isDeleted && t.workspaceId === 'ws_ika');
  const rediTxs = transactions.filter((t) => !t.isDeleted && t.workspaceId === 'ws_redi');

  const ikaBalance = ikaAssets.reduce((s, a) => s + a.currentBalance, 0);
  const rediBalance = rediAssets.reduce((s, a) => s + a.currentBalance, 0);

  const ikaIncome = ikaTxs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const ikaExpense = ikaTxs
    .filter((t) => t.type === 'expense' || t.type === 'purchase')
    .reduce((s, t) => s + t.amount, 0);

  const rediIncome = rediTxs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const rediExpense = rediTxs
    .filter((t) => t.type === 'expense' || t.type === 'purchase')
    .reduce((s, t) => s + t.amount, 0);

  const handleExportTransparency = () => {
    exportFullFinancialReport({
      title: 'Laporan Transparansi Baliyoutevolution (Ika & Redi)',
      workspaceName: 'Transparansi Baliyoutevolution',
      dateRangeLabel: 'Bulan Oktober 2026',
      brands,
      transactions: transactions.filter((t) => !t.isDeleted),
      assets,
      products,
      hppRecipes,
      commissions,
      marketing,
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Strict Read-Only Verification Badge */}
      <div className="bg-gradient-to-r from-amber-950 via-purple-950 to-slate-900 text-white rounded-2xl p-6 border border-amber-500/30 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-2 border border-amber-500/30">
              <Lock className="w-3 h-3 text-amber-400" />
              <span>Transparansi Khusus Admin Baliyoutevolution · Read-Only</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              Pengawasan & Alur Kas Multi-Client Terpisah
            </h1>
            <p className="text-xs text-amber-200/80 mt-1 max-w-2xl leading-relaxed">
              Sesuai prinsip integritas produk, alur kas Ika dan Redi dipisahkan secara independen dan tidak disatukan sebagai satu kas bersama.
            </p>
          </div>

          <button
            onClick={handleExportTransparency}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-amber-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all shadow-xs shrink-0"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Ekspor Laporan Transparansi (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Strict Client Isolation Side-by-Side Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Workspace Ika Card */}
        <div className="bg-white rounded-2xl p-5 border-2 border-pink-100 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-pink-100 text-pink-700 flex items-center justify-center font-bold text-sm">
                  I
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Workspace Ika</h3>
                  <p className="text-xs text-slate-400">
                    Brand Terdaftar: {ikaBrands.map((b) => b.name).join(' & ')}
                  </p>
                </div>
              </div>
              <span className="text-xs font-semibold text-pink-700 bg-pink-50 px-2.5 py-0.5 rounded-full">
                2 Brand
              </span>
            </div>

            <div className="my-4 p-4 rounded-xl bg-pink-50/40 border border-pink-100">
              <span className="text-xs text-slate-500 font-medium">Total Likuiditas Aset Ika</span>
              <div className="text-2xl font-bold font-mono tabular-nums text-pink-900 mt-0.5">
                Rp {ikaBalance.toLocaleString('id-ID')}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Tersebar di {ikaAssets.length} akun kas & rekening BCA/Mandiri
              </p>
            </div>

            <div className="space-y-2 text-xs font-mono tabular-nums">
              <div className="flex justify-between text-slate-600">
                <span className="font-sans">Total Pemasukan Kas:</span>
                <span className="font-semibold text-emerald-600">
                  Rp {ikaIncome.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span className="font-sans">Total Pengeluaran Kas:</span>
                <span className="font-semibold text-slate-800">
                  Rp {ikaExpense.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-dashed border-slate-200">
                <span className="font-sans font-bold text-slate-900">Net Arus Kas Ika:</span>
                <span className="font-bold text-violet-900">
                  {ikaIncome - ikaExpense >= 0 ? '+' : ''}Rp{' '}
                  {(ikaIncome - ikaExpense).toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-400">{ikaTxs.length} transaksi dibukukan</span>
            <span className="font-semibold text-pink-700">Tirama & CHEMI</span>
          </div>
        </div>

        {/* Workspace Redi Card */}
        <div className="bg-white rounded-2xl p-5 border-2 border-sky-100 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-sm">
                  R
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Workspace Redi</h3>
                  <p className="text-xs text-slate-400">
                    Brand Terdaftar: {rediBrands.map((b) => b.name).join(', ')}
                  </p>
                </div>
              </div>
              <span className="text-xs font-semibold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-full">
                3 Brand
              </span>
            </div>

            <div className="my-4 p-4 rounded-xl bg-sky-50/40 border border-sky-100">
              <span className="text-xs text-slate-500 font-medium">Total Likuiditas Aset Redi</span>
              <div className="text-2xl font-bold font-mono tabular-nums text-sky-900 mt-0.5">
                Rp {rediBalance.toLocaleString('id-ID')}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Tersebar di {rediAssets.length} akun kas & rekening BCA/BNI
              </p>
            </div>

            <div className="space-y-2 text-xs font-mono tabular-nums">
              <div className="flex justify-between text-slate-600">
                <span className="font-sans">Total Pemasukan Kas:</span>
                <span className="font-semibold text-emerald-600">
                  Rp {rediIncome.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span className="font-sans">Total Pengeluaran Kas:</span>
                <span className="font-semibold text-slate-800">
                  Rp {rediExpense.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-dashed border-slate-200">
                <span className="font-sans font-bold text-slate-900">Net Arus Kas Redi:</span>
                <span className="font-bold text-violet-900">
                  {rediIncome - rediExpense >= 0 ? '+' : ''}Rp{' '}
                  {(rediIncome - rediExpense).toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-400">{rediTxs.length} transaksi dibukukan</span>
            <span className="font-semibold text-sky-700">BYE, Metamorph, Presta</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs for Detail Inspection */}
      <div className="bg-white rounded-2xl border border-purple-100 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
            <button
              onClick={() => setActiveClientTab('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeClientTab === 'all'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua Transaksi ({transactions.filter((t) => !t.isDeleted).length})
            </button>
            <button
              onClick={() => setActiveClientTab('ika')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeClientTab === 'ika'
                  ? 'bg-white text-pink-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Hanya Ika ({ikaTxs.length})
            </button>
            <button
              onClick={() => setActiveClientTab('redi')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeClientTab === 'redi'
                  ? 'bg-white text-sky-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Hanya Redi ({rediTxs.length})
            </button>
          </div>

          <div className="text-xs text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200/80 font-medium flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-amber-600" />
            <span>Hak Akses: Membaca & Verifikasi Dokumen</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                <th className="py-2.5 px-4">Workspace / Pemilik</th>
                <th className="py-2.5 px-4">Tanggal & Jam</th>
                <th className="py-2.5 px-4">Brand</th>
                <th className="py-2.5 px-4">Deskripsi Transaksi</th>
                <th className="py-2.5 px-4">Kategori</th>
                <th className="py-2.5 px-4 text-right">Nominal (IDR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
              {transactions
                .filter((tx) => {
                  if (tx.isDeleted) return false;
                  if (activeClientTab === 'ika' && tx.workspaceId !== 'ws_ika') return false;
                  if (activeClientTab === 'redi' && tx.workspaceId !== 'ws_redi') return false;
                  return true;
                })
                .map((tx) => {
                  const brand = brands.find((b) => b.id === tx.brandId);
                  const isIka = tx.workspaceId === 'ws_ika';
                  const isIncome = tx.type === 'income';

                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/80 text-slate-700">
                      <td className="py-2.5 px-4 font-sans font-semibold">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] ${
                            isIka
                              ? 'bg-pink-50 text-pink-700 border border-pink-200'
                              : 'bg-sky-50 text-sky-700 border border-sky-200'
                          }`}
                        >
                          {isIka ? 'Ika' : 'Redi'}
                        </span>
                      </td>

                      <td className="py-2.5 px-4 text-slate-500 text-[11px]">
                        {tx.date} {tx.time}
                      </td>

                      <td className="py-2.5 px-4 font-sans font-semibold text-slate-900">
                        {brand?.name}
                      </td>

                      <td className="py-2.5 px-4 font-sans text-slate-800 max-w-sm truncate">
                        {tx.description}
                      </td>

                      <td className="py-2.5 px-4 font-sans text-slate-500">{tx.category}</td>

                      <td className="py-2.5 px-4 text-right font-bold text-xs">
                        <span className={isIncome ? 'text-emerald-600' : 'text-slate-900'}>
                          {isIncome ? '+' : '-'}Rp {tx.amount.toLocaleString('id-ID')}
                        </span>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
