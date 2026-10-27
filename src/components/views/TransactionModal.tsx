import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Transaction, TransactionType } from '../../types';
import { X, AlertCircle, ArrowRightLeft, UploadCloud, CheckCircle } from 'lucide-react';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTransaction?: Transaction | null;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  initialTransaction,
}) => {
  const {
    currentUser,
    brands,
    assets,
    addTransaction,
    updateTransaction,
  } = useApp();

  const userBrands = brands;
  const userAssets = assets;

  const [type, setType] = useState<TransactionType>('income');
  const [brandId, setBrandId] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [amountStr, setAmountStr] = useState<string>('');
  const [assetId, setAssetId] = useState<string>('');
  const [targetAssetId, setTargetAssetId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('Transfer Bank');
  const [partyName, setPartyName] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [time, setTime] = useState<string>('');
  const [receiptName, setReceiptName] = useState<string>('');
  const [updateReason, setUpdateReason] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (initialTransaction) {
      setType(initialTransaction.type);
      setBrandId(initialTransaction.brandId);
      setCategory(initialTransaction.category);
      setDescription(initialTransaction.description);
      setAmountStr(initialTransaction.amount.toString());
      setAssetId(initialTransaction.assetId);
      setTargetAssetId(initialTransaction.targetAssetId || '');
      setPaymentMethod(initialTransaction.paymentMethod);
      setPartyName(initialTransaction.partyName || '');
      setNotes(initialTransaction.notes || '');
      setDate(initialTransaction.date);
      setTime(initialTransaction.time);
      setReceiptName(initialTransaction.receiptUrl ? 'bukti_nota_terlampir.pdf' : '');
      setUpdateReason('');
      setErrorMsg('');
    } else {
      const now = new Date();
      setType('income');
      setBrandId(userBrands[0]?.id || '');
      setCategory('Penjualan Produk');
      setDescription('');
      setAmountStr('');
      setAssetId(userAssets[0]?.id || '');
      setTargetAssetId(userAssets[1]?.id || '');
      setPaymentMethod('Transfer Bank');
      setPartyName('');
      setNotes('');
      setDate(now.toISOString().slice(0, 10));
      setTime(now.toTimeString().slice(0, 5));
      setReceiptName('');
      setUpdateReason('');
      setErrorMsg('');
    }
  }, [initialTransaction, isOpen]);

  if (!isOpen) return null;

  const parsedAmount = parseFloat(amountStr) || 0;

  // Recommended categories per transaction type
  const categorySuggestions: Record<TransactionType, string[]> = {
    income: [
      'Penjualan Produk',
      'Penjualan Jasa / Layanan',
      'Sponsorship Event',
      'Tiket Acara',
      'Retainer Klien',
      'Pendapatan Lain-lain',
    ],
    expense: [
      'Biaya Operasional',
      'Biaya Marketing & Iklan',
      'Honorarium & Gaji',
      'Komisi & Fee Affiliate',
      'Sewa Tempat & Venue',
      'Logistik & Pengiriman',
      'Perlengkapan & Tools',
      'Konsumsi & Rapat',
    ],
    purchase: [
      'Bahan Baku & Material',
      'Kemasan & Packaging',
      'Aset Peralatan Kerja',
      'Inventaris Stok',
    ],
    transfer: ['Transfer Antar-Aset', 'Tarik Tunai Kas Kecil', 'Setor Tunai ke Bank'],
    refund: ['Pengembalian Dana Pelanggan', 'Retur Barang Rusak', 'Pembatalan Tiket'],
    adjustment: ['Penyesuaian Saldo Kas/Bank', 'Selisih Kurs/Admin Bank', 'Koreksi Pembukuan'],
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (parsedAmount <= 0 && type !== 'adjustment') {
      setErrorMsg('Nominal transaksi harus lebih besar dari Rp 0.');
      return;
    }

    if (!brandId) {
      setErrorMsg('Pilih brand terkait transaksi ini.');
      return;
    }

    if (!assetId) {
      setErrorMsg('Pilih sumber dana / akun aset.');
      return;
    }

    if (type === 'transfer') {
      if (!targetAssetId) {
        setErrorMsg('Pilih aset tujuan untuk transfer antar-rekening.');
        return;
      }
      if (assetId === targetAssetId) {
        setErrorMsg('Aset sumber dan aset tujuan tidak boleh sama.');
        return;
      }
      const sourceAsset = userAssets.find((a) => a.id === assetId);
      if (sourceAsset && sourceAsset.currentBalance < parsedAmount && !initialTransaction) {
        setErrorMsg(
          `Saldo di ${sourceAsset.name} tidak cukup (Saldo: Rp ${sourceAsset.currentBalance.toLocaleString('id-ID')}).`
        );
        return;
      }
    }

    if (initialTransaction) {
      if (!updateReason.trim()) {
        setErrorMsg('Mohon isi alasan perubahan data untuk keperluan jejak audit (audit log).');
        return;
      }
      const res = updateTransaction(
        initialTransaction.id,
        {
          brandId,
          type,
          category,
          description,
          amount: parsedAmount,
          assetId,
          targetAssetId: type === 'transfer' ? targetAssetId : undefined,
          paymentMethod,
          partyName,
          notes,
          date,
          time,
          receiptUrl: receiptName ? 'lampiran_terverifikasi' : undefined,
        },
        updateReason
      );

      if (!res.success) {
        setErrorMsg(res.error || 'Gagal memperbarui transaksi.');
        return;
      }
    } else {
      const res = addTransaction({
        brandId,
        type,
        category,
        description,
        amount: parsedAmount,
        assetId,
        targetAssetId: type === 'transfer' ? targetAssetId : undefined,
        paymentMethod,
        partyName,
        notes,
        date,
        time,
        receiptUrl: receiptName ? 'lampiran_terverifikasi' : undefined,
      });

      if (!res.success) {
        setErrorMsg(res.error || 'Gagal menyimpan transaksi.');
        return;
      }
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-xl border border-purple-100 overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-violet-900 to-indigo-900 text-white">
          <div>
            <h2 className="text-base font-bold">
              {initialTransaction ? 'Ubah Catatan Transaksi' : 'Catat Transaksi Keuangan Baru'}
            </h2>
            <p className="text-xs text-violet-200">
              {initialTransaction
                ? 'Seluruh riwayat revisi akan dicatat pada audit log transaksi.'
                : 'Pencatatan langsung memutasi saldo akun aset terkait.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-violet-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Transaction Type Segmented Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Jenis Transaksi Keuangan <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 bg-slate-100 p-1 rounded-xl text-xs">
              {(
                [
                  { id: 'income', label: 'Pemasukan' },
                  { id: 'expense', label: 'Pengeluaran' },
                  { id: 'purchase', label: 'Pembelian' },
                  { id: 'transfer', label: 'Transfer' },
                  { id: 'refund', label: 'Refund' },
                  { id: 'adjustment', label: 'Penyesuaian' },
                ] as const
              ).map((t) => (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => {
                    setType(t.id);
                    if (categorySuggestions[t.id]) {
                      setCategory(categorySuggestions[t.id][0]);
                    }
                  }}
                  className={`py-1.5 px-2 rounded-lg font-medium transition-all text-center whitespace-nowrap ${
                    type === t.id
                      ? t.id === 'income'
                        ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                        : t.id === 'expense' || t.id === 'purchase'
                        ? 'bg-violet-700 text-white shadow-xs font-semibold'
                        : 'bg-slate-800 text-white shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            {type === 'transfer' && (
              <p className="mt-1 text-[11px] text-slate-500 flex items-center gap-1">
                <ArrowRightLeft className="w-3 h-3 text-violet-600" />
                Transfer internal hanya memindahkan saldo antar-aset dan tidak memengaruhi laba/rugi bisnis.
              </p>
            )}
          </div>

          {/* Brand & Kategori */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Terkait Brand <span className="text-red-500">*</span>
              </label>
              <select
                value={brandId}
                onChange={(e) => setBrandId(e.target.value)}
                className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-violet-500 font-medium"
                required
              >
                {userBrands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.category})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kategori Transaksi <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  list="category-options"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Kategori transaksi..."
                  className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-violet-500 font-medium"
                  required
                />
                <datalist id="category-options">
                  {(categorySuggestions[type] || []).map((cat) => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              </div>
            </div>
          </div>

          {/* Deskripsi & Nominal */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Deskripsi / Keterangan Transaksi <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Contoh: Pesanan Custom Resin Ring 925 Silver (3 pcs)"
              className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-violet-500 font-medium"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nominal Transaksi (IDR) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                  Rp
                </span>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={amountStr}
                  onChange={(e) => setAmountStr(e.target.value)}
                  placeholder="0"
                  className="w-full text-xs font-mono tabular-nums bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-violet-500 font-semibold"
                  required
                />
              </div>
              {parsedAmount > 0 && (
                <p className="mt-1 text-[11px] font-mono tabular-nums text-violet-700 font-semibold">
                  = Rp {parsedAmount.toLocaleString('id-ID')}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Metode Pembayaran
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-violet-500 font-medium"
              >
                <option value="Transfer Bank BCA">Transfer Bank BCA</option>
                <option value="Transfer Bank Mandiri">Transfer Bank Mandiri</option>
                <option value="Transfer Bank BNI">Transfer Bank BNI</option>
                <option value="QRIS">QRIS Standar</option>
                <option value="Tunai / Cash">Tunai / Cash</option>
                <option value="ShopeePay / E-Wallet">ShopeePay / E-Wallet</option>
                <option value="Kartu Debit / Kredit">Kartu Debit / Kredit</option>
              </select>
            </div>
          </div>

          {/* Sumber Dana & Target Dana (if Transfer) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {type === 'transfer' ? 'Dari Aset / Rekening Asal' : 'Akun Kas / Rekening Sumber'}{' '}
                <span className="text-red-500">*</span>
              </label>
              <select
                value={assetId}
                onChange={(e) => setAssetId(e.target.value)}
                className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-violet-500 font-medium"
                required
              >
                {userAssets.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} (Saldo: Rp {a.currentBalance.toLocaleString('id-ID')})
                  </option>
                ))}
              </select>
            </div>

            {type === 'transfer' ? (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ke Aset / Rekening Tujuan <span className="text-red-500">*</span>
                </label>
                <select
                  value={targetAssetId}
                  onChange={(e) => setTargetAssetId(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-violet-500 font-medium"
                  required
                >
                  <option value="">Pilih Aset Tujuan...</option>
                  {userAssets
                    .filter((a) => a.id !== assetId)
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} (Saldo: Rp {a.currentBalance.toLocaleString('id-ID')})
                      </option>
                    ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pihak Terkait (Vendor / Klien / Pelanggan)
                </label>
                <input
                  type="text"
                  value={partyName}
                  onChange={(e) => setPartyName(e.target.value)}
                  placeholder="Nama klien, vendor, atau pembeli"
                  className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-violet-500 font-medium"
                />
              </div>
            )}
          </div>

          {/* Tanggal & Waktu */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tanggal Transaksi <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs font-mono bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-violet-500 font-medium"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Waktu Transaksi
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full text-xs font-mono bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-violet-500 font-medium"
              />
            </div>
          </div>

          {/* Lampiran & Catatan */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Catatan Internal
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Catatan tambahan spesifikasi order, nomor resi kurir, atau memo..."
              className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-violet-500 font-medium"
            />
          </div>

          {/* Bukti Transaksi Simulated Upload */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Lampiran Bukti Transaksi (Nota / Struk / Bukti Transfer)
            </label>
            <div className="flex items-center gap-3 p-2.5 border border-dashed border-slate-300 rounded-xl bg-slate-50">
              <UploadCloud className="w-5 h-5 text-slate-400 shrink-0" />
              <div className="flex-1 min-w-0 text-xs">
                {receiptName ? (
                  <div className="flex items-center gap-1.5 text-emerald-700 font-medium truncate">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">{receiptName}</span>
                    <button
                      type="button"
                      onClick={() => setReceiptName('')}
                      className="text-slate-400 hover:text-red-500 text-[11px] underline ml-2"
                    >
                      Hapus
                    </button>
                  </div>
                ) : (
                  <p className="text-slate-500 text-[11px]">
                    Format didukung: JPG, PNG, PDF (Maks. 5 MB)
                  </p>
                )}
              </div>
              {!receiptName && (
                <button
                  type="button"
                  onClick={() =>
                    setReceiptName(
                      `struk_transaksi_${date}_${Math.floor(1000 + Math.random() * 9000)}.pdf`
                    )
                  }
                  className="px-2.5 py-1 text-xs font-medium text-violet-700 bg-white border border-violet-200 rounded-lg hover:bg-violet-50 transition-colors shrink-0"
                >
                  Pilih Berkas
                </button>
              )}
            </div>
          </div>

          {/* Reason for update if editing */}
          {initialTransaction && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <label className="block text-xs font-bold text-amber-900 mb-1">
                Alasan Perubahan Data (Wajib Audit) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={updateReason}
                onChange={(e) => setUpdateReason(e.target.value)}
                placeholder="Contoh: Koreksi nominal salah input dari bukti transfer bank"
                className="w-full text-xs bg-white border border-amber-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium"
                required
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-lg transition-all shadow-xs"
            >
              {initialTransaction ? 'Simpan Perubahan' : 'Simpan Transaksi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
