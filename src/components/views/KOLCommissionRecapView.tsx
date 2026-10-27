import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { KOLCommissionRecap, RecapStatus } from '../../types';
import {
  Percent,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  CreditCard,
  FileCheck,
  History,
  Info,
} from 'lucide-react';

export const KOLCommissionRecapView: React.FC = () => {
  const {
    currentUser,
    brands,
    assets,
    kols,
    kolRecaps,
    generateKOLMonthlyRecap,
    reviewKOLRecap,
    approveKOLRecap,
    payKOLRecapPartial,
    selectedBrandId,
    setSelectedBrandId,
  } = useApp();

  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [payingRecap, setPayingRecap] = useState<KOLCommissionRecap | null>(null);
  const [inspectingRecap, setInspectingRecap] = useState<KOLCommissionRecap | null>(null);

  // Form states for generation
  const [genBrandId, setGenBrandId] = useState('');
  const [genKolId, setGenKolId] = useState('');
  const [genPeriod, setGenPeriod] = useState('2026-10');
  const [genError, setGenError] = useState('');

  // Payment states
  const [payAmountStr, setPayAmountStr] = useState('');
  const [payAssetId, setPayAssetId] = useState('');
  const [payMethod, setPayMethod] = useState('Transfer Bank');
  const [payNotes, setPayNotes] = useState('');
  const [payError, setPayError] = useState('');

  if (!currentUser) return null;

  const isAdmin = currentUser.role === 'admin';
  const userBrands = brands;
  const userAssets = assets;
  const userKols = kols;
  const userRecaps = kolRecaps;

  const brandMap = new Map<string, string>();
  brands.forEach((b) => brandMap.set(b.id, b.name));

  const filteredRecaps = userRecaps.filter((r) => {
    if (r.brandId && !brands.some((b) => b.id === r.brandId)) return false;
    if (selectedBrandId !== 'all' && r.brandId !== selectedBrandId) return false;
    return true;
  });

  const totalOutstanding = filteredRecaps.reduce((sum, r) => sum + r.outstandingBalance, 0);
  const totalPaid = filteredRecaps.reduce((sum, r) => sum + r.totalPaid, 0);

  const handleOpenGenerate = () => {
    setGenBrandId(userBrands[0]?.id || '');
    const firstKol = userKols.find((k) => k.brandId === userBrands[0]?.id) || userKols[0];
    setGenKolId(firstKol?.id || '');
    setGenPeriod('2026-10');
    setGenError('');
    setIsGenerateModalOpen(true);
  };

  const handleExecuteGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    setGenError('');
    if (!genKolId) {
      setGenError('Pilih KOL untuk membuat rekap.');
      return;
    }

    const res = generateKOLMonthlyRecap(genBrandId, genKolId, genPeriod);
    if (!res.success) {
      setGenError(res.error || 'Gagal membuat rekap komisi.');
      return;
    }

    setIsGenerateModalOpen(false);
  };

  const handleOpenPayment = (recap: KOLCommissionRecap) => {
    setPayingRecap(recap);
    setPayAmountStr(recap.outstandingBalance.toString());
    setPayAssetId(userAssets[0]?.id || '');
    setPayMethod('Transfer Bank BCA');
    setPayNotes(`Pembayaran komisi periode ${recap.period}`);
    setPayError('');
  };

  const handleExecutePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingRecap) return;
    setPayError('');

    const amt = parseFloat(payAmountStr) || 0;
    if (amt <= 0) {
      setPayError('Nominal pembayaran harus lebih besar dari 0.');
      return;
    }

    const res = payKOLRecapPartial(payingRecap.id, amt, payAssetId, payMethod, payNotes);
    if (!res.success) {
      setPayError(res.error || 'Gagal memproses pembayaran komisi.');
      return;
    }

    setPayingRecap(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl p-6 border border-purple-100 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-violet-700 uppercase tracking-wider mb-1">
            <Percent className="w-4 h-4" />
            <span>Rekap Komisi Bulanan & Pelunasan Bertahap</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">Rekapitulasi Komisi KOL</h1>
          <p className="text-xs text-slate-500 mt-1">
            Alur persetujuan rekap komisi bulanan, pengakuan kewajiban, dan pembayaran parsial dengan bukti kas resmi.
          </p>
        </div>

        {!isAdmin && (
          <button
            onClick={handleOpenGenerate}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-xl transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Rekap Bulanan</span>
          </button>
        )}
      </div>

      {/* Partial payout rule banner */}
      <div className="p-3.5 bg-violet-50/70 border border-violet-100 rounded-xl text-xs text-slate-600 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-violet-700 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-violet-900">Ketentuan Pembayaran Bertahap (Seksi 6.4):</strong> Saldo
          terutang = komisi final yang disetujui − total pembayaran valid. Pembayaran sebagian otomatis mencatat
          satu transaksi pengeluaran kas dengan ID unik dan memperbarui saldo terutang tanpa menduplikasi beban laba-rugi.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-purple-100 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Saldo Komisi Terutang (Kewajiban)</span>
          <div className="text-xl font-bold font-mono tabular-nums text-amber-600 mt-1">
            Rp {totalOutstanding.toLocaleString('id-ID')}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Menunggu pembayaran kas dari rekening brand
          </p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-purple-100 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Total Komisi Telah Dilunasi</span>
          <div className="text-xl font-bold font-mono tabular-nums text-emerald-600 mt-1">
            Rp {totalPaid.toLocaleString('id-ID')}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Telah memotong kas riil di jurnal</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-purple-100 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Total Komisi Disetujui</span>
          <div className="text-xl font-bold font-mono tabular-nums text-violet-900 mt-1">
            Rp {(totalOutstanding + totalPaid).toLocaleString('id-ID')}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {filteredRecaps.length} rekapitulasi periode aktif
          </p>
        </div>
      </div>

      {/* Recap Table */}
      <div className="bg-white rounded-2xl border border-purple-100 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between text-xs">
          <span className="font-bold text-slate-800">Daftar Rekapitulasi Komisi Bulanan</span>
          <select
            value={selectedBrandId}
            onChange={(e) => setSelectedBrandId(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 font-semibold"
          >
            <option value="all">Semua Brand</option>
            {userBrands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">KOL & Periode</th>
                <th className="py-3 px-4">Brand</th>
                <th className="py-3 px-4 text-center">Pesanan Valid</th>
                <th className="py-3 px-4 text-right">Omzet Bersih Basis</th>
                <th className="py-3 px-4 text-right">Komisi Final</th>
                <th className="py-3 px-4 text-right">Sudah Dibayar</th>
                <th className="py-3 px-4 text-right">Saldo Terutang</th>
                <th className="py-3 px-4 text-center">Status</th>
                {!isAdmin && <th className="py-3 px-4 text-center">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecaps.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-400">
                    Belum ada rekap komisi untuk filter ini.
                  </td>
                </tr>
              ) : (
                filteredRecaps.map((r) => {
                  const isPaid = r.status === 'paid';
                  const isPartiallyPaid = r.status === 'partially_paid';
                  const isApproved = r.status === 'approved';
                  const isReview = r.status === 'review';
                  const isDraft = r.status === 'draft';

                  return (
                    <tr key={r.id} className="hover:bg-violet-50/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{r.kolName}</div>
                        <div className="font-mono text-[11px] text-slate-400">Periode: {r.period}</div>
                      </td>

                      <td className="py-3 px-4 font-semibold text-violet-900">
                        {brandMap.get(r.brandId)}
                      </td>

                      <td className="py-3 px-4 text-center font-mono tabular-nums">
                        {r.validOrdersCount} order
                        {r.cancelledOrdersCount > 0 && (
                          <div className="text-[10px] text-red-500 font-sans">
                            ({r.cancelledOrdersCount} batal/refund)
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                        Rp {r.calculationBaseAmount.toLocaleString('id-ID')}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold tabular-nums text-slate-900">
                        Rp {r.finalCommission.toLocaleString('id-ID')}
                      </td>

                      <td className="py-3 px-4 text-right font-mono tabular-nums text-emerald-600 font-semibold">
                        Rp {r.totalPaid.toLocaleString('id-ID')}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold tabular-nums">
                        <span className={r.outstandingBalance > 0 ? 'text-amber-600' : 'text-slate-400'}>
                          Rp {r.outstandingBalance.toLocaleString('id-ID')}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                            isPaid
                              ? 'bg-emerald-50 text-emerald-700'
                              : isPartiallyPaid
                              ? 'bg-blue-50 text-blue-700'
                              : isApproved
                              ? 'bg-amber-50 text-amber-800'
                              : isReview
                              ? 'bg-violet-50 text-violet-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {isPaid ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Lunas
                            </>
                          ) : isPartiallyPaid ? (
                            'Sebagian'
                          ) : isApproved ? (
                            'Disetujui'
                          ) : isReview ? (
                            'Review'
                          ) : (
                            'Draft'
                          )}
                        </span>
                      </td>

                      {!isAdmin && (
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Review button if draft */}
                            {isDraft && (
                              <button
                                onClick={() => reviewKOLRecap(r.id)}
                                className="px-2 py-1 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 rounded text-slate-700"
                              >
                                Review
                              </button>
                            )}

                            {/* Approve button if review */}
                            {isReview && (
                              <button
                                onClick={() => approveKOLRecap(r.id)}
                                className="px-2 py-1 text-[11px] font-semibold bg-violet-100 text-violet-800 hover:bg-violet-200 rounded flex items-center gap-1"
                              >
                                <FileCheck className="w-3 h-3" />
                                <span>Setujui</span>
                              </button>
                            )}

                            {/* Pay button if approved or partially paid */}
                            {(isApproved || isPartiallyPaid) && r.outstandingBalance > 0 && (
                              <button
                                onClick={() => handleOpenPayment(r)}
                                className="px-2.5 py-1 text-[11px] font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs flex items-center gap-1"
                              >
                                <CreditCard className="w-3 h-3" />
                                <span>Bayar</span>
                              </button>
                            )}

                            {/* Payment history inspection */}
                            {r.payments.length > 0 && (
                              <button
                                onClick={() => setInspectingRecap(r)}
                                title="Lihat riwayat pembayaran"
                                className="p-1 text-slate-400 hover:text-violet-700 rounded"
                              >
                                <History className="w-4 h-4" />
                              </button>
                            )}
                          </div>
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

      {/* Generate Monthly Recap Modal */}
      {isGenerateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-purple-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Percent className="w-5 h-5 text-violet-700" />
                <h3 className="font-bold text-base text-slate-900">Buat Rekapitulasi Komisi Bulanan</h3>
              </div>
              <button onClick={() => setIsGenerateModalOpen(false)} className="text-slate-400 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {genError && (
              <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded-lg">{genError}</div>
            )}

            <form onSubmit={handleExecuteGenerate} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Brand</label>
                <select
                  value={genBrandId}
                  onChange={(e) => setGenBrandId(e.target.value)}
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
                <label className="block font-semibold text-slate-700 mb-1">Pilih KOL</label>
                <select
                  value={genKolId}
                  onChange={(e) => setGenKolId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800 font-medium"
                  required
                >
                  {userKols
                    .filter((k) => k.brandId === genBrandId)
                    .map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.name} ({k.handleOrAccount})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Periode Bulan (YYYY-MM)</label>
                <input
                  type="month"
                  value={genPeriod}
                  onChange={(e) => setGenPeriod(e.target.value)}
                  className="w-full font-mono bg-white border border-slate-200 rounded-lg p-2 text-slate-800 font-medium"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsGenerateModalOpen(false)}
                  className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-lg shadow-xs"
                >
                  Kalkulasi & Buat Rekap
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Partial / Full Payment Modal */}
      {payingRecap && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-purple-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-emerald-700">
                <CreditCard className="w-5 h-5" />
                <h3 className="font-bold text-base text-slate-900">Pelunasan Komisi (Mendukung Parsial)</h3>
              </div>
              <button onClick={() => setPayingRecap(null)} className="text-slate-400 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-violet-50 rounded-xl text-xs space-y-1">
              <p className="font-semibold text-slate-900">Penerima: {payingRecap.kolName}</p>
              <p className="font-mono tabular-nums text-slate-700">
                Total Komisi: Rp {payingRecap.finalCommission.toLocaleString('id-ID')} · Sudah Dibayar: Rp {payingRecap.totalPaid.toLocaleString('id-ID')}
              </p>
              <p className="font-mono tabular-nums text-amber-700 font-bold">
                Sisa Saldo Terutang: Rp {payingRecap.outstandingBalance.toLocaleString('id-ID')}
              </p>
            </div>

            {payError && (
              <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded-lg">{payError}</div>
            )}

            <form onSubmit={handleExecutePayment} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nominal Dibayarkan (IDR) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max={payingRecap.outstandingBalance}
                  value={payAmountStr}
                  onChange={(e) => setPayAmountStr(e.target.value)}
                  className="w-full font-mono tabular-nums bg-white border border-slate-200 rounded-lg p-2 text-slate-800 font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Akun Rekening Kas / Sumber Dana <span className="text-red-500">*</span>
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

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Metode Bayar</label>
                <input
                  type="text"
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Catatan / Bukti Bayar</label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder="Contoh: Transfer termin 1 no ref: BCA12345"
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPayingRecap(null)}
                  className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs"
                >
                  Konfirmasi & Debet Kas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Inspection Modal */}
      {inspectingRecap && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-purple-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-violet-700">
                <History className="w-5 h-5" />
                <h3 className="font-bold text-base text-slate-900">Riwayat Pembayaran #{inspectingRecap.id}</h3>
              </div>
              <button onClick={() => setInspectingRecap(null)} className="text-slate-400 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {inspectingRecap.payments.map((p, idx) => (
                <div key={p.id || idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                  <div className="flex justify-between font-mono tabular-nums">
                    <span className="font-bold text-slate-900">Rp {p.amount.toLocaleString('id-ID')}</span>
                    <span className="text-slate-400 text-[11px]">{p.paymentDate}</span>
                  </div>
                  <div className="text-slate-600">
                    Sumber: {p.assetName} · {p.paymentMethod}
                  </div>
                  {p.receiptNote && <div className="text-[11px] text-slate-500 italic">{p.receiptNote}</div>}
                  <div className="text-[10px] text-slate-400 font-mono">Dijalankan oleh: {p.paidBy}</div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setInspectingRecap(null)}
                className="px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
