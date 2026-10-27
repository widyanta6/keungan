import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Commission } from '../../types';
import {
  BadgePercent,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  CreditCard,
  Building,
} from 'lucide-react';

export const CommissionsView: React.FC = () => {
  const {
    currentUser,
    brands,
    assets,
    commissions,
    addCommission,
    payCommission,
    selectedBrandId,
  } = useApp();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [payingCommission, setPayingCommission] = useState<Commission | null>(null);
  const [payAssetId, setPayAssetId] = useState('');
  const [payError, setPayError] = useState('');

  // Form states for adding commission
  const [brandId, setBrandId] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [role, setRole] = useState('Affiliate / Sales');
  const [calcType, setCalcType] = useState<'percentage' | 'fixed'>('percentage');
  const [rateStr, setRateStr] = useState('10');
  const [baseAmountStr, setBaseAmountStr] = useState('2000000');
  const [notes, setNotes] = useState('');
  const [addError, setAddError] = useState('');

  if (!currentUser) return null;

  const isAdmin = currentUser.role === 'admin';
  const userBrands = brands;
  const userAssets = assets;
  const userCommissions = commissions;

  const brandMap = new Map<string, string>();
  brands.forEach((b) => brandMap.set(b.id, b.name));

  const filteredCommissions = userCommissions.filter((c) => {
    if (c.brandId && !brands.some((b) => b.id === c.brandId)) return false;
    if (selectedBrandId !== 'all' && c.brandId !== selectedBrandId) return false;
    return true;
  });

  const unpaidTotal = filteredCommissions
    .filter((c) => c.status === 'unpaid')
    .reduce((sum, c) => sum + c.totalCommission, 0);

  const paidTotal = filteredCommissions
    .filter((c) => c.status === 'paid')
    .reduce((sum, c) => sum + c.totalCommission, 0);

  const calculatedTotal =
    calcType === 'percentage'
      ? Math.round(((parseFloat(rateStr) || 0) / 100) * (parseFloat(baseAmountStr) || 0))
      : parseFloat(rateStr) || 0;

  const handleOpenAdd = () => {
    setBrandId(userBrands[0]?.id || '');
    setRecipientName('');
    setRole('Affiliate / Sales');
    setCalcType('percentage');
    setRateStr('10');
    setBaseAmountStr('2000000');
    setNotes('');
    setAddError('');
    setIsAddModalOpen(true);
  };

  const handleSaveCommission = (e: React.FormEvent) => {
    e.preventDefault();
    setAddError('');

    if (!recipientName.trim()) {
      setAddError('Nama penerima komisi wajib diisi.');
      return;
    }

    const rate = parseFloat(rateStr) || 0;
    const base = parseFloat(baseAmountStr) || 0;
    if (rate <= 0) {
      setAddError('Nilai komisi harus lebih besar dari 0.');
      return;
    }

    const res = addCommission({
      workspaceId: currentUser.workspaceId,
      brandId,
      recipientName,
      role,
      calculationType: calcType,
      rate,
      baseAmount: base,
      totalCommission: calculatedTotal,
      status: 'unpaid',
      notes,
    });

    if (!res.success) {
      setAddError(res.error || 'Gagal menyimpan komisi.');
      return;
    }

    setIsAddModalOpen(false);
  };

  const handleExecutePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingCommission) return;
    setPayError('');

    const res = payCommission(payingCommission.id, payAssetId);
    if (!res.success) {
      setPayError(res.error || 'Gagal memproses pembayaran komisi.');
      return;
    }

    setPayingCommission(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner and Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl p-6 border border-purple-100 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-violet-700 uppercase tracking-wider mb-1">
            <BadgePercent className="w-4 h-4" />
            <span>Manajemen Komisi & Honorarium Tim</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">Pelacakan Komisi & Kewajiban</h1>
          <p className="text-xs text-slate-500 mt-1">
            Komisi belum dibayar tercatat sebagai kewajiban dan tidak langsung memotong kas hingga dilakukan pelunasan.
          </p>
        </div>

        {!isAdmin && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-xl transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Catat Komisi Baru</span>
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-purple-100 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">
            Kewajiban Komisi Belum Dibayar
          </span>
          <div className="text-xl font-bold font-mono tabular-nums text-amber-600 mt-1">
            Rp {unpaidTotal.toLocaleString('id-ID')}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {filteredCommissions.filter((c) => c.status === 'unpaid').length} catatan pending
          </p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-purple-100 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Total Komisi Telah Dilunasi</span>
          <div className="text-xl font-bold font-mono tabular-nums text-emerald-600 mt-1">
            Rp {paidTotal.toLocaleString('id-ID')}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Sudah dibukukan ke pengeluaran kas</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-purple-100 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Total Keseluruhan Komisi</span>
          <div className="text-xl font-bold font-mono tabular-nums text-violet-900 mt-1">
            Rp {(unpaidTotal + paidTotal).toLocaleString('id-ID')}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {filteredCommissions.length} transaksi komisi terdaftar
          </p>
        </div>
      </div>

      {/* Commissions Table */}
      <div className="bg-white rounded-2xl border border-purple-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Penerima & Peran</th>
                <th className="py-3 px-4">Brand</th>
                <th className="py-3 px-4">Dasar Perhitungan</th>
                <th className="py-3 px-4 text-right">Nilai Komisi (IDR)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Catatan</th>
                {!isAdmin && <th className="py-3 px-4 text-center">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCommissions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    Belum ada komisi tercatat.
                  </td>
                </tr>
              ) : (
                filteredCommissions.map((c) => {
                  const brandName = brandMap.get(c.brandId) || c.brandId;
                  const isPaid = c.status === 'paid';

                  return (
                    <tr key={c.id} className="hover:bg-violet-50/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{c.recipientName}</div>
                        <div className="text-[11px] text-slate-500">{c.role}</div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-semibold text-violet-900">{brandName}</span>
                      </td>

                      <td className="py-3 px-4 font-mono tabular-nums">
                        <div>
                          {c.calculationType === 'percentage'
                            ? `${c.rate}% dari omzet`
                            : `Nominal tetap`}
                        </div>
                        {c.baseAmount > 0 && (
                          <div className="text-[10px] text-slate-400">
                            Basis: Rp {c.baseAmount.toLocaleString('id-ID')}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold tabular-nums text-sm text-slate-900">
                        Rp {c.totalCommission.toLocaleString('id-ID')}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                            isPaid
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-amber-50 text-amber-800'
                          }`}
                        >
                          {isPaid ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Lunas ({c.paidDate})
                            </>
                          ) : (
                            <>
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              Belum Dibayar
                            </>
                          )}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                        {c.notes || '-'}
                      </td>

                      {!isAdmin && (
                        <td className="py-3 px-4 text-center">
                          {!isPaid ? (
                            <button
                              onClick={() => {
                                setPayingCommission(c);
                                setPayAssetId(userAssets[0]?.id || '');
                                setPayError('');
                              }}
                              className="px-2.5 py-1 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors shadow-xs"
                            >
                              Bayar Sekarang
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-mono">Tuntas</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Commission Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-purple-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <BadgePercent className="w-5 h-5 text-violet-700" />
                <h3 className="font-bold text-base text-slate-900">Catat Komisi Baru</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {addError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                {addError}
              </div>
            )}

            <form onSubmit={handleSaveCommission} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Brand</label>
                <select
                  value={brandId}
                  onChange={(e) => setBrandId(e.target.value)}
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
                  Nama Penerima Komisi <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="Contoh: Sarah Amanda"
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Peran / Jabatan</label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="Contoh: Affiliate Creator / Talent Scout"
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800 font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tipe Perhitungan
                  </label>
                  <select
                    value={calcType}
                    onChange={(e) => setCalcType(e.target.value as 'percentage' | 'fixed')}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800 font-medium"
                  >
                    <option value="percentage">Persentase (%)</option>
                    <option value="fixed">Nominal Tetap (Rp)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {calcType === 'percentage' ? 'Persen (%)' : 'Nominal (Rp)'}
                  </label>
                  <input
                    type="number"
                    min="0.1"
                    step="any"
                    value={rateStr}
                    onChange={(e) => setRateStr(e.target.value)}
                    className="w-full font-mono tabular-nums bg-white border border-slate-200 rounded-lg p-2 text-slate-800 font-bold"
                    required
                  />
                </div>
              </div>

              {calcType === 'percentage' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Dasar Omzet Transaksi (IDR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={baseAmountStr}
                    onChange={(e) => setBaseAmountStr(e.target.value)}
                    className="w-full font-mono tabular-nums bg-white border border-slate-200 rounded-lg p-2 text-slate-800 font-medium"
                  />
                </div>
              )}

              {/* Total preview */}
              <div className="p-3 bg-violet-50 rounded-xl flex justify-between items-center font-mono tabular-nums">
                <span className="text-slate-600 font-sans text-xs">Total Komisi Dihitung:</span>
                <span className="font-bold text-violet-900 text-sm">
                  Rp {calculatedTotal.toLocaleString('id-ID')}
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Catatan</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Keterangan transaksi atau no order..."
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors shadow-xs"
                >
                  Simpan Komisi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pay Commission Modal */}
      {payingCommission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-purple-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-base text-slate-900">
                  Pelunasan Pembayaran Komisi
                </h3>
              </div>
              <button
                onClick={() => setPayingCommission(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-xs">
              <p className="font-semibold text-slate-900">
                Penerima: {payingCommission.recipientName} ({payingCommission.role})
              </p>
              <p className="font-mono tabular-nums text-violet-800 font-bold text-sm">
                Nominal: Rp {payingCommission.totalCommission.toLocaleString('id-ID')}
              </p>
              <p className="text-[11px] text-slate-500">
                Pelunasan akan otomatis memotong saldo akun kas yang dipilih dan mencatat transaksi pengeluaran.
              </p>
            </div>

            {payError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                {payError}
              </div>
            )}

            <form onSubmit={handleExecutePayment} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Pilih Akun Kas / Rekening Sumber Dana <span className="text-red-500">*</span>
                </label>
                <select
                  value={payAssetId}
                  onChange={(e) => setPayAssetId(e.target.value)}
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

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPayingCommission(null)}
                  className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs"
                >
                  Konfirmasi & Potong Kas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
