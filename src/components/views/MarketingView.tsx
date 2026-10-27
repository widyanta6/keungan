import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { MarketingCampaign, MarketingChannel } from '../../types';
import {
  Megaphone,
  Plus,
  TrendingUp,
  Target,
  DollarSign,
  Info,
  Edit2,
  X,
  Share2,
} from 'lucide-react';

export const MarketingView: React.FC = () => {
  const {
    currentUser,
    brands,
    marketing,
    addMarketingCampaign,
    updateMarketingCampaign,
    selectedBrandId,
  } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<MarketingCampaign | null>(null);

  // Form states
  const [brandId, setBrandId] = useState('');
  const [name, setName] = useState('');
  const [channel, setChannel] = useState<MarketingChannel>('Instagram Ads');
  const [plannedBudgetStr, setPlannedBudgetStr] = useState('3000000');
  const [actualSpendStr, setActualSpendStr] = useState('1500000');
  const [leadsStr, setLeadsStr] = useState('150');
  const [conversionsStr, setConversionsStr] = useState('20');
  const [attributedRevStr, setAttributedRevStr] = useState('12000000');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState<'draft' | 'active' | 'completed'>('active');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!currentUser) return null;

  const isAdmin = currentUser.role === 'admin';
  const userBrands = isAdmin
    ? brands
    : brands.filter((b) => b.workspaceId === currentUser.workspaceId);
  const userMarketing = isAdmin
    ? marketing
    : marketing.filter((m) => m.workspaceId === currentUser.workspaceId);

  const brandMap = new Map<string, string>();
  brands.forEach((b) => brandMap.set(b.id, b.name));

  const filteredCampaigns = userMarketing.filter((m) => {
    if (selectedBrandId !== 'all' && m.brandId !== selectedBrandId) return false;
    return true;
  });

  const totalSpend = filteredCampaigns.reduce((sum, c) => sum + c.actualSpend, 0);
  const totalRev = filteredCampaigns.reduce((sum, c) => sum + c.attributedRevenue, 0);
  const totalLeads = filteredCampaigns.reduce((sum, c) => sum + c.leads, 0);
  const totalConversions = filteredCampaigns.reduce((sum, c) => sum + c.conversions, 0);

  const overallRoas = totalSpend > 0 ? (totalRev / totalSpend).toFixed(2) : '0';
  const overallRoi =
    totalSpend > 0 ? (((totalRev - totalSpend) / totalSpend) * 100).toFixed(1) : '0';

  const handleOpenAdd = () => {
    const now = new Date();
    setEditingCampaign(null);
    setBrandId(userBrands[0]?.id || '');
    setName('');
    setChannel('Instagram Ads');
    setPlannedBudgetStr('3000000');
    setActualSpendStr('1500000');
    setLeadsStr('100');
    setConversionsStr('15');
    setAttributedRevStr('10000000');
    setStartDate(now.toISOString().slice(0, 10));
    setEndDate(new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10));
    setStatus('active');
    setNotes('');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: MarketingCampaign) => {
    setEditingCampaign(c);
    setBrandId(c.brandId);
    setName(c.name);
    setChannel(c.channel);
    setPlannedBudgetStr(c.plannedBudget.toString());
    setActualSpendStr(c.actualSpend.toString());
    setLeadsStr(c.leads.toString());
    setConversionsStr(c.conversions.toString());
    setAttributedRevStr(c.attributedRevenue.toString());
    setStartDate(c.startDate);
    setEndDate(c.endDate);
    setStatus(c.status);
    setNotes(c.notes || '');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Nama kampanye wajib diisi.');
      return;
    }

    const planned = parseFloat(plannedBudgetStr) || 0;
    const spend = parseFloat(actualSpendStr) || 0;
    const leads = parseInt(leadsStr, 10) || 0;
    const conv = parseInt(conversionsStr, 10) || 0;
    const rev = parseFloat(attributedRevStr) || 0;

    if (editingCampaign) {
      const res = updateMarketingCampaign(editingCampaign.id, {
        brandId,
        name,
        channel,
        plannedBudget: planned,
        actualSpend: spend,
        leads,
        conversions: conv,
        attributedRevenue: rev,
        startDate,
        endDate,
        status,
        notes,
      });
      if (!res.success) {
        setErrorMsg(res.error || 'Gagal mengubah kampanye.');
        return;
      }
    } else {
      const res = addMarketingCampaign({
        workspaceId: currentUser.workspaceId,
        brandId,
        name,
        channel,
        plannedBudget: planned,
        actualSpend: spend,
        leads,
        conversions: conv,
        attributedRevenue: rev,
        startDate,
        endDate,
        status,
        notes,
      });
      if (!res.success) {
        setErrorMsg(res.error || 'Gagal membuat kampanye.');
        return;
      }
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner and Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl p-6 border border-purple-100 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-violet-700 uppercase tracking-wider mb-1">
            <Megaphone className="w-4 h-4" />
            <span>Marketing Tracking & Performa Kampanye</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">Pelacakan Iklan, Leads & ROAS</h1>
          <p className="text-xs text-slate-500 mt-1">
            Ukur efektivitas biaya per lead (CPL), tingkat konversi, ROAS, dan ROI di setiap kanal pemasaran.
          </p>
        </div>

        {!isAdmin && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-xl transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Kampanye Baru</span>
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-purple-100 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Total Biaya Iklan Terpakai</span>
          <div className="text-xl font-bold font-mono tabular-nums text-slate-900 mt-1">
            Rp {totalSpend.toLocaleString('id-ID')}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {filteredCampaigns.length} kampanye berjalan
          </p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-purple-100 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Pendapatan Teratribusi</span>
          <div className="text-xl font-bold font-mono tabular-nums text-emerald-600 mt-1">
            Rp {totalRev.toLocaleString('id-ID')}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Dari {totalConversions} transaksi deal</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-purple-100 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Rerata ROAS Agregat</span>
          <div className="text-xl font-bold font-mono tabular-nums text-violet-900 mt-1">
            {overallRoas}x
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Revenue / Biaya Iklan</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-purple-100 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">ROI Pemasaran Bersih</span>
          <div className="text-xl font-bold font-mono tabular-nums text-pink-600 mt-1">
            +{overallRoi}%
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">(Hasil Bersih - Biaya) / Biaya</p>
        </div>
      </div>

      {/* PRD Formula explanation box */}
      <div className="p-3.5 bg-violet-50/70 border border-violet-100 rounded-xl text-xs text-slate-600 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-violet-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-violet-900">
            Penjelasan Rumus & Integritas Metrik Marketing BizFlow:
          </p>
          <p>
            <strong>CPL (Cost Per Lead):</strong> Biaya Aktual / Leads ·{' '}
            <strong>Conversion Rate:</strong> (Konversi / Leads) × 100% ·{' '}
            <strong>ROAS:</strong> Pendapatan Teratribusi / Biaya Iklan ·{' '}
            <strong>ROI:</strong> ((Pendapatan - Biaya) / Biaya) × 100%.{' '}
            <em>ROAS mengukur pendapatan kotor per rupiah iklan, sedangkan ROI mengukur keuntungan bersih di atas modal promosi.</em>
          </p>
        </div>
      </div>

      {/* Campaign Cards List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {filteredCampaigns.map((camp) => {
          const brandName = brandMap.get(camp.brandId) || camp.brandId;
          const cpl = camp.leads > 0 ? Math.round(camp.actualSpend / camp.leads) : 0;
          const convRate =
            camp.leads > 0 ? ((camp.conversions / camp.leads) * 100).toFixed(1) : '0';
          const roas = camp.actualSpend > 0 ? (camp.attributedRevenue / camp.actualSpend).toFixed(2) : '0';
          const roi =
            camp.actualSpend > 0
              ? (((camp.attributedRevenue - camp.actualSpend) / camp.actualSpend) * 100).toFixed(1)
              : '0';

          const budgetPercent =
            camp.plannedBudget > 0 ? Math.round((camp.actualSpend / camp.plannedBudget) * 100) : 0;

          return (
            <div
              key={camp.id}
              className="bg-white rounded-2xl p-5 border border-purple-100 shadow-xs flex flex-col justify-between hover:border-violet-300 transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-semibold text-violet-700 bg-violet-50 px-2 py-0.5 rounded">
                        {camp.channel}
                      </span>
                      <span className="text-xs text-slate-400">·</span>
                      <span className="text-xs font-semibold text-slate-700">{brandName}</span>
                    </div>
                    <h3 className="font-bold text-base text-slate-900">{camp.name}</h3>
                  </div>

                  {!isAdmin && (
                    <button
                      onClick={() => handleOpenEdit(camp)}
                      className="p-1.5 text-slate-400 hover:text-violet-700 hover:bg-violet-50 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <p className="text-xs text-slate-500 mb-3">{camp.notes || 'Tidak ada catatan.'}</p>

                {/* Progress bar budget */}
                <div className="space-y-1 mb-4">
                  <div className="flex justify-between text-xs font-mono tabular-nums text-slate-600">
                    <span>
                      Realisasi: Rp {camp.actualSpend.toLocaleString('id-ID')}
                    </span>
                    <span>
                      Rencana: Rp {camp.plannedBudget.toLocaleString('id-ID')} ({budgetPercent}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        budgetPercent > 100
                          ? 'bg-red-500'
                          : budgetPercent > 80
                          ? 'bg-amber-500'
                          : 'bg-violet-600'
                      }`}
                      style={{ width: `${Math.min(100, budgetPercent)}%` }}
                    />
                  </div>
                </div>

                {/* Metric Grid */}
                <div className="grid grid-cols-4 gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100 text-center font-mono tabular-nums">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-sans">Leads</span>
                    <div className="font-bold text-slate-900 text-sm">{camp.leads}</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-sans">Konversi</span>
                    <div className="font-bold text-slate-900 text-sm">{camp.conversions}</div>
                    <div className="text-[10px] text-slate-400">{convRate}%</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-sans">CPL</span>
                    <div className="font-bold text-slate-900 text-sm">
                      Rp {cpl.toLocaleString('id-ID')}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-sans">ROAS</span>
                    <div className="font-bold text-emerald-600 text-sm">{roas}x</div>
                    <div className="text-[10px] text-pink-600">ROI +{roi}%</div>
                  </div>
                </div>
              </div>

              <div className="pt-3 mt-4 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
                <span>
                  Periode: {camp.startDate} s/d {camp.endDate}
                </span>
                <span className="font-semibold text-emerald-700 font-mono">
                  Revenue: Rp {camp.attributedRevenue.toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Campaign Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-purple-100 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-violet-700" />
                <h3 className="font-bold text-base text-slate-900">
                  {editingCampaign ? 'Ubah Kampanye Marketing' : 'Buat Kampanye Marketing Baru'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
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
                  <label className="block font-semibold text-slate-700 mb-1">Kanal Pemasaran</label>
                  <select
                    value={channel}
                    onChange={(e) => setChannel(e.target.value as MarketingChannel)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800 font-medium"
                  >
                    <option value="Instagram Ads">Instagram Ads</option>
                    <option value="TikTok Ads">TikTok Ads</option>
                    <option value="Google Search">Google Search</option>
                    <option value="Influencer / KOL">Influencer / KOL</option>
                    <option value="Event Offline">Event Offline</option>
                    <option value="Referral">Referral</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Kampanye <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Instagram Ads Promo Akhir Tahun"
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800 font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Anggaran Rencana (IDR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={plannedBudgetStr}
                    onChange={(e) => setPlannedBudgetStr(e.target.value)}
                    className="w-full font-mono tabular-nums bg-white border border-slate-200 rounded-lg p-2 text-slate-800 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Biaya Terpakai Aktual (IDR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={actualSpendStr}
                    onChange={(e) => setActualSpendStr(e.target.value)}
                    className="w-full font-mono tabular-nums bg-white border border-slate-200 rounded-lg p-2 text-slate-800 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Leads</label>
                  <input
                    type="number"
                    min="0"
                    value={leadsStr}
                    onChange={(e) => setLeadsStr(e.target.value)}
                    className="w-full font-mono tabular-nums bg-white border border-slate-200 rounded-lg p-2 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Konversi</label>
                  <input
                    type="number"
                    min="0"
                    value={conversionsStr}
                    onChange={(e) => setConversionsStr(e.target.value)}
                    className="w-full font-mono tabular-nums bg-white border border-slate-200 rounded-lg p-2 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Revenue Teratribusi
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={attributedRevStr}
                    onChange={(e) => setAttributedRevStr(e.target.value)}
                    className="w-full font-mono tabular-nums bg-white border border-slate-200 rounded-lg p-2 text-slate-800 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tanggal Mulai</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full font-mono bg-white border border-slate-200 rounded-lg p-2 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tanggal Selesai</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full font-mono bg-white border border-slate-200 rounded-lg p-2 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Catatan Kampanye</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Target audiens, format creative, atau link postingan..."
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors shadow-xs"
                >
                  Simpan Kampanye
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
