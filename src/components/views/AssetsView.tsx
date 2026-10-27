import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Asset } from '../../types';
import {
  WalletCards,
  ArrowRightLeft,
  SlidersHorizontal,
  Landmark,
  Coins,
  Smartphone,
  History,
  AlertCircle,
  X,
} from 'lucide-react';

export const AssetsView: React.FC = () => {
  const {
    currentUser,
    brands,
    assets,
    transactions,
    transferAsset,
    reconcileAsset,
  } = useApp();

  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isReconcileModalOpen, setIsReconcileModalOpen] = useState(false);
  const [selectedAssetForReconcile, setSelectedAssetForReconcile] = useState<Asset | null>(null);

  // Form states for Transfer
  const [transferFromId, setTransferFromId] = useState('');
  const [transferToId, setTransferToId] = useState('');
  const [transferAmountStr, setTransferAmountStr] = useState('');
  const [transferBrandId, setTransferBrandId] = useState('');
  const [transferNotes, setTransferNotes] = useState('');
  const [transferError, setTransferError] = useState('');

  // Form states for Reconciliation
  const [actualBalanceStr, setActualBalanceStr] = useState('');
  const [reconcileReason, setReconcileReason] = useState('');
  const [reconcileBrandId, setReconcileBrandId] = useState('');
  const [reconcileError, setReconcileError] = useState('');

  if (!currentUser) return null;

  const isAdmin = currentUser.role === 'admin';
  const userAssets = assets;
  const userBrands = brands;

  const totalLiquidity = userAssets.reduce((sum, a) => sum + a.currentBalance, 0);

  const handleOpenTransfer = () => {
    setTransferFromId(userAssets[0]?.id || '');
    setTransferToId(userAssets[1]?.id || '');
    setTransferBrandId(userBrands[0]?.id || '');
    setTransferAmountStr('');
    setTransferNotes('');
    setTransferError('');
    setIsTransferModalOpen(true);
  };

  const handleExecuteTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    setTransferError('');
    const amt = parseFloat(transferAmountStr) || 0;
    if (amt <= 0) {
      setTransferError('Nominal transfer harus lebih besar dari Rp 0.');
      return;
    }
    if (transferFromId === transferToId) {
      setTransferError('Aset asal dan tujuan tidak boleh sama.');
      return;
    }

    const res = transferAsset(transferFromId, transferToId, amt, transferBrandId, transferNotes);
    if (!res.success) {
      setTransferError(res.error || 'Gagal transfer dana.');
      return;
    }
    setIsTransferModalOpen(false);
  };

  const handleOpenReconcile = (asset: Asset) => {
    setSelectedAssetForReconcile(asset);
    setActualBalanceStr(asset.currentBalance.toString());
    setReconcileBrandId(userBrands[0]?.id || '');
    setReconcileReason('');
    setReconcileError('');
    setIsReconcileModalOpen(true);
  };

  const handleExecuteReconcile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssetForReconcile) return;
    setReconcileError('');
    const actual = parseFloat(actualBalanceStr);
    if (isNaN(actual) || actual < 0) {
      setReconcileError('Masukkan saldo fisik aktual yang valid.');
      return;
    }
    if (!reconcileReason.trim()) {
      setReconcileError('Wajib mengisi catatan alasan penyesuaian / rekonsiliasi saldo.');
      return;
    }

    const res = reconcileAsset(
      selectedAssetForReconcile.id,
      actual,
      reconcileBrandId,
      reconcileReason
    );
    if (!res.success) {
      setReconcileError(res.error || 'Gagal melakukan rekonsiliasi saldo.');
      return;
    }
    setIsReconcileModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl p-6 border border-purple-100 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-violet-700 uppercase tracking-wider mb-1">
            <WalletCards className="w-4 h-4" />
            <span>Manajemen Aset & Rekening Kas</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">
            Total Saldo Likuiditas: Rp {totalLiquidity.toLocaleString('id-ID')}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Terdiri dari rekening bank resmi, kas tunai operasional, dan e-wallet.
          </p>
        </div>

        {!isAdmin && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenTransfer}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-xl transition-all shadow-xs"
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>Transfer Antar-Aset</span>
            </button>
          </div>
        )}
      </div>

      {/* Asset Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {userAssets.map((asset) => {
          // Calculate mutasi history count
          const relatedTxs = transactions.filter(
            (t) => !t.isDeleted && (t.assetId === asset.id || t.targetAssetId === asset.id)
          );

          return (
            <div
              key={asset.id}
              className="bg-white rounded-2xl p-5 border border-purple-100 shadow-xs flex flex-col justify-between hover:border-violet-300 transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-700 flex items-center justify-center shrink-0">
                      {asset.type === 'bank' ? (
                        <Landmark className="w-5 h-5" />
                      ) : asset.type === 'cash' ? (
                        <Coins className="w-5 h-5" />
                      ) : (
                        <Smartphone className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">{asset.name}</h3>
                      <p className="text-xs text-slate-400">
                        {asset.bankName ? `${asset.bankName} (${asset.accountNumber})` : 'Kas Operasional'}
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] font-semibold uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                    {asset.type}
                  </span>
                </div>

                <div className="my-4">
                  <span className="text-xs text-slate-400 font-medium">Saldo Berjalan</span>
                  <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-0.5">
                    Rp {asset.currentBalance.toLocaleString('id-ID')}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-1">
                    Saldo Awal: Rp {asset.initialBalance.toLocaleString('id-ID')}
                  </div>
                </div>

                {asset.notes && (
                  <p className="text-xs text-slate-500 bg-slate-50 p-2 rounded-lg mb-3">
                    {asset.notes}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1">
                  <History className="w-3.5 h-3.5" />
                  {relatedTxs.length} mutasi
                </span>

                {!isAdmin && (
                  <button
                    onClick={() => handleOpenReconcile(asset)}
                    className="flex items-center gap-1 font-semibold text-violet-700 hover:text-violet-900"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>Rekonsiliasi</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Transfer Antar-Aset Modal */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-purple-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-violet-700" />
                <h3 className="font-bold text-base text-slate-900">Transfer Antar-Aset / Kas</h3>
              </div>
              <button
                onClick={() => setIsTransferModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {transferError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{transferError}</span>
              </div>
            )}

            <form onSubmit={handleExecuteTransfer} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Brand Penanggung Jawab
                </label>
                <select
                  value={transferBrandId}
                  onChange={(e) => setTransferBrandId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800 font-medium"
                  required
                >
                  {userBrands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Dari Rekening / Kas Asal
                </label>
                <select
                  value={transferFromId}
                  onChange={(e) => setTransferFromId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800 font-medium"
                  required
                >
                  {userAssets.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} (Saldo: Rp {a.currentBalance.toLocaleString('id-ID')})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Ke Rekening / Kas Tujuan
                </label>
                <select
                  value={transferToId}
                  onChange={(e) => setTransferToId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800 font-medium"
                  required
                >
                  {userAssets
                    .filter((a) => a.id !== transferFromId)
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} (Saldo: Rp {a.currentBalance.toLocaleString('id-ID')})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nominal Transfer (IDR)
                </label>
                <input
                  type="number"
                  min="1"
                  value={transferAmountStr}
                  onChange={(e) => setTransferAmountStr(e.target.value)}
                  placeholder="0"
                  className="w-full font-mono tabular-nums bg-white border border-slate-200 rounded-lg p-2 text-slate-800 font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Catatan / Memo Mutasi
                </label>
                <input
                  type="text"
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  placeholder="Contoh: Pengisian kas kecil operasional workshop"
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors shadow-xs"
                >
                  Proses Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rekonsiliasi Saldo Modal */}
      {isReconcileModalOpen && selectedAssetForReconcile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-purple-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-violet-700" />
                <h3 className="font-bold text-base text-slate-900">
                  Rekonsiliasi Saldo {selectedAssetForReconcile.name}
                </h3>
              </div>
              <button
                onClick={() => setIsReconcileModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-violet-50 rounded-xl text-xs space-y-1">
              <p className="text-slate-600">
                Saldo di Sistem Saat Ini:{' '}
                <strong className="font-mono text-slate-900">
                  Rp {selectedAssetForReconcile.currentBalance.toLocaleString('id-ID')}
                </strong>
              </p>
              <p className="text-[11px] text-slate-500">
                Selisih antara saldo fisik dan sistem akan otomatis dibukukan sebagai transaksi penyesuaian.
              </p>
            </div>

            {reconcileError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{reconcileError}</span>
              </div>
            )}

            <form onSubmit={handleExecuteReconcile} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Brand Penyesuaian
                </label>
                <select
                  value={reconcileBrandId}
                  onChange={(e) => setReconcileBrandId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800 font-medium"
                  required
                >
                  {userBrands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Saldo Fisik / Mutasi Riil Aktual (IDR) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={actualBalanceStr}
                  onChange={(e) => setActualBalanceStr(e.target.value)}
                  className="w-full font-mono tabular-nums bg-white border border-slate-200 rounded-lg p-2 text-slate-800 font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Alasan Rekonsiliasi (Wajib Jejak Audit) <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={reconcileReason}
                  onChange={(e) => setReconcileReason(e.target.value)}
                  placeholder="Contoh: Selisih biaya admin bulanan bank yang belum tercatat atau hitung fisik brankas..."
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800 font-medium"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsReconcileModalOpen(false)}
                  className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors shadow-xs"
                >
                  Simpan Rekonsiliasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
