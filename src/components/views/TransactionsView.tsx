import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Transaction, TransactionType } from '../../types';
import {
  Search,
  Plus,
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  Trash2,
  Edit2,
  History,
  FileText,
  X,
  AlertTriangle,
  Receipt,
  Download,
} from 'lucide-react';
import { exportFullFinancialReport } from '../../utils/excelExport';

interface TransactionsViewProps {
  onOpenNewTransaction: () => void;
  onEditTransaction: (tx: Transaction) => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  onOpenNewTransaction,
  onEditTransaction,
}) => {
  const {
    currentUser,
    currentWorkspace,
    brands,
    assets,
    transactions,
    softDeleteTransaction,
    selectedBrandId,
    setSelectedBrandId,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedTxForAudit, setSelectedTxForAudit] = useState<Transaction | null>(null);
  const [deleteTargetTx, setDeleteTargetTx] = useState<Transaction | null>(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleteError, setDeleteError] = useState('');

  if (!currentUser) return null;

  const isAdmin = currentUser.role === 'admin';

  // Allowed brands & assets (strictly isolated by AppContext)
  const userBrands = brands;
  const userAssets = assets;

  // Map helpers
  const brandMap = new Map<string, string>();
  brands.forEach((b) => brandMap.set(b.id, b.name));

  const assetMap = new Map<string, string>();
  assets.forEach((a) => assetMap.set(a.id, a.name));

  // Filter transactions
  const filteredTransactions = transactions.filter((tx) => {
    // Only show active transactions (unless audited)
    if (tx.isDeleted) return false;

    // Strict Brand boundary check
    if (tx.brandId && !brands.some((b) => b.id === tx.brandId)) return false;

    // Brand filter
    if (selectedBrandId !== 'all' && tx.brandId !== selectedBrandId) return false;

    // Type filter
    if (typeFilter !== 'all' && tx.type !== typeFilter) return false;

    // Text search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const descMatch = tx.description.toLowerCase().includes(q);
      const catMatch = tx.category.toLowerCase().includes(q);
      const partyMatch = tx.partyName?.toLowerCase().includes(q);
      const brandMatch = (brandMap.get(tx.brandId) || '').toLowerCase().includes(q);
      if (!descMatch && !catMatch && !partyMatch && !brandMatch) return false;
    }

    return true;
  });

  const handleDeleteConfirm = () => {
    if (!deleteTargetTx) return;
    if (!deleteReason.trim()) {
      setDeleteError('Wajib mengisi alasan pembatalan / penghapusan transaksi.');
      return;
    }

    const res = softDeleteTransaction(deleteTargetTx.id, deleteReason);
    if (!res.success) {
      setDeleteError(res.error || 'Gagal menghapus transaksi.');
      return;
    }

    setDeleteTargetTx(null);
    setDeleteReason('');
    setDeleteError('');
  };

  const handleExport = () => {
    exportFullFinancialReport({
      title: 'Daftar Transaksi Keuangan',
      workspaceName: currentWorkspace?.name || 'Workspace Transaksi',
      brandName: selectedBrandId !== 'all' ? brandMap.get(selectedBrandId) : 'Semua Brand',
      dateRangeLabel: 'Semua Periode Aktif',
      brands: userBrands,
      transactions: filteredTransactions,
      assets: userAssets,
    });
  };

  return (
    <div className="space-y-5">
      {/* Top Filter and Actions Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-purple-100 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari transaksi, deskripsi, klien, atau kategori..."
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-violet-500 font-medium"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Ekspor XLSX</span>
            </button>

            {!isAdmin && (
              <button
                onClick={onOpenNewTransaction}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-xl transition-all shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Transaksi Baru</span>
              </button>
            )}
          </div>
        </div>

        {/* Secondary filters row */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <span className="text-slate-400 font-medium mr-1">Filter Jenis:</span>
          {[
            { id: 'all', label: 'Semua Jenis' },
            { id: 'income', label: 'Pemasukan' },
            { id: 'expense', label: 'Pengeluaran' },
            { id: 'purchase', label: 'Pembelian' },
            { id: 'transfer', label: 'Transfer Antar-Aset' },
            { id: 'adjustment', label: 'Penyesuaian' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setTypeFilter(item.id)}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                typeFilter === item.id
                  ? 'bg-violet-100 text-violet-800 font-semibold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {item.label}
            </button>
          ))}

          <div className="ml-auto flex items-center gap-2">
            <span className="text-slate-400 font-medium">Brand:</span>
            <select
              value={selectedBrandId}
              onChange={(e) => setSelectedBrandId(e.target.value)}
              className="text-xs font-semibold bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 focus:outline-none"
            >
              <option value="all">Semua Brand</option>
              {userBrands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Data Table */}
      <div className="bg-white rounded-2xl border border-purple-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Tanggal & Waktu</th>
                <th className="py-3 px-4">Brand & Kategori</th>
                <th className="py-3 px-4">Deskripsi & Pihak Terkait</th>
                <th className="py-3 px-4">Sumber Aset</th>
                <th className="py-3 px-4 text-right">Nominal (IDR)</th>
                <th className="py-3 px-4 text-center">Audit & Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <p className="font-semibold text-slate-600">Tidak ada transaksi ditemukan</p>
                    <p className="text-[11px] mt-0.5">
                      Coba sesuaikan filter pencarian atau tambahkan transaksi baru.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const brandName = brandMap.get(tx.brandId) || tx.brandId;
                  const assetName = assetMap.get(tx.assetId) || tx.assetId;
                  const targetAssetName = tx.targetAssetId ? assetMap.get(tx.targetAssetId) : null;
                  const isIncome = tx.type === 'income';
                  const isTransfer = tx.type === 'transfer';

                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-violet-50/40 transition-colors group text-slate-700"
                    >
                      {/* Tanggal & Waktu */}
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-slate-500">
                        <div className="font-semibold text-slate-700">{tx.date}</div>
                        <div>{tx.time}</div>
                      </td>

                      {/* Brand & Kategori */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-semibold text-violet-900">{brandName}</div>
                        <div className="text-[11px] text-slate-500">{tx.category}</div>
                      </td>

                      {/* Deskripsi */}
                      <td className="py-3 px-4 max-w-xs sm:max-w-md">
                        <p className="font-medium text-slate-900 truncate">{tx.description}</p>
                        {tx.partyName && (
                          <p className="text-[11px] text-slate-400 truncate">
                            Pihak: {tx.partyName}
                          </p>
                        )}
                        {tx.receiptUrl && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-semibold mt-0.5">
                            <FileText className="w-3 h-3" /> Bukti Terlampir
                          </span>
                        )}
                      </td>

                      {/* Akun Kas/Aset */}
                      <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                        <div className="font-medium text-xs text-slate-800">{assetName}</div>
                        {isTransfer && targetAssetName && (
                          <div className="text-[11px] text-violet-700 font-medium flex items-center gap-1">
                            &rarr; {targetAssetName}
                          </div>
                        )}
                        <div className="text-[10px] text-slate-400">{tx.paymentMethod}</div>
                      </td>

                      {/* Nominal */}
                      <td className="py-3 px-4 whitespace-nowrap text-right">
                        <div
                          className={`font-mono font-bold tabular-nums text-sm ${
                            isIncome
                              ? 'text-emerald-600'
                              : isTransfer
                              ? 'text-blue-600'
                              : 'text-slate-900'
                          }`}
                        >
                          {isIncome ? '+' : isTransfer ? '' : '-'}Rp{' '}
                          {tx.amount.toLocaleString('id-ID')}
                        </div>
                        <div className="text-[10px] uppercase font-semibold text-slate-400">
                          {tx.type === 'income'
                            ? 'Pemasukan'
                            : tx.type === 'transfer'
                            ? 'Transfer Kas'
                            : tx.type === 'purchase'
                            ? 'Pembelian'
                            : 'Beban Operasional'}
                        </div>
                      </td>

                      {/* Audit & Actions */}
                      <td className="py-3 px-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Audit Trail Button */}
                          <button
                            onClick={() => setSelectedTxForAudit(tx)}
                            title="Lihat Riwayat & Audit Log Transaksi"
                            className="p-1.5 text-slate-400 hover:text-violet-700 hover:bg-violet-50 rounded-lg transition-colors"
                          >
                            <History className="w-4 h-4" />
                          </button>

                          {/* Edit (Clients only) */}
                          {!isAdmin && (
                            <button
                              onClick={() => onEditTransaction(tx)}
                              title="Ubah Transaksi"
                              className="p-1.5 text-slate-400 hover:text-violet-700 hover:bg-violet-50 rounded-lg transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Soft Delete (Clients only) */}
                          {!isAdmin && (
                            <button
                              onClick={() => {
                                setDeleteTargetTx(tx);
                                setDeleteError('');
                                setDeleteReason('');
                              }}
                              title="Batalkan / Hapus Transaksi (Reversal)"
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Menampilkan {filteredTransactions.length} transaksi</span>
          <span className="font-mono text-[11px]">Database BizFlow Synchronized</span>
        </div>
      </div>

      {/* Audit Log Modal */}
      {selectedTxForAudit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-purple-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-violet-700" />
                <h3 className="font-bold text-sm text-slate-900">
                  Riwayat & Jejak Audit Transaksi #{selectedTxForAudit.id}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTxForAudit(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
              <p>
                <strong className="text-slate-700">Deskripsi:</strong> {selectedTxForAudit.description}
              </p>
              <p>
                <strong className="text-slate-700">Nominal:</strong> Rp{' '}
                {selectedTxForAudit.amount.toLocaleString('id-ID')}
              </p>
              <p>
                <strong className="text-slate-700">Pembuat Pertama:</strong> {selectedTxForAudit.createdBy} (
                {selectedTxForAudit.createdAt})
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Log Perubahan Data:
              </h4>
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {selectedTxForAudit.auditLog.map((log, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg border border-slate-200 bg-white text-xs space-y-0.5"
                  >
                    <div className="flex justify-between font-mono text-[11px] text-slate-400">
                      <span className="font-semibold text-violet-900">{log.userName}</span>
                      <span>{log.timestamp}</span>
                    </div>
                    <p className="text-slate-700">{log.details}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedTxForAudit(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Soft Delete Modal */}
      {deleteTargetTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-red-100 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <div>
                <h3 className="font-bold text-base text-slate-900">Batalkan Transaksi (Reversal)</h3>
                <p className="text-xs text-slate-500">Saldo akun kas akan dikembalikan ke keadaan semula.</p>
              </div>
            </div>

            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs space-y-1">
              <p className="font-semibold text-red-900">{deleteTargetTx.description}</p>
              <p className="font-mono tabular-nums text-red-700">
                Nominal: Rp {deleteTargetTx.amount.toLocaleString('id-ID')} ({deleteTargetTx.type})
              </p>
            </div>

            {deleteError && (
              <p className="text-xs text-red-600 font-medium">{deleteError}</p>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Alasan Penghapusan / Pembatalan <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={2}
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="Contoh: Transaksi salah input ganda atau pembayaran dibatalkan oleh pembeli..."
                className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-red-500 font-medium"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteTargetTx(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-xs"
              >
                Konfirmasi Reversal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
