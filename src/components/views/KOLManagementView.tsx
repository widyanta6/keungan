import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { KOL, KOLCollaborationType, KOLCommissionMethod } from '../../types';
import {
  UserCheck,
  Plus,
  Search,
  ExternalLink,
  Edit2,
  Trash2,
  X,
  Share2,
  Tag,
  Percent,
  CheckCircle2,
  Clock,
} from 'lucide-react';

export const KOLManagementView: React.FC = () => {
  const {
    currentUser,
    brands,
    kols,
    orders,
    addKOL,
    updateKOL,
    deleteKOL,
    selectedBrandId,
    setSelectedBrandId,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingKOL, setEditingKOL] = useState<KOL | null>(null);

  // Form states
  const [brandId, setBrandId] = useState('');
  const [name, setName] = useState('');
  const [handleOrAccount, setHandleOrAccount] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [platform, setPlatform] = useState<KOL['platform']>('Instagram');
  const [collaborationType, setCollaborationType] = useState<KOLCollaborationType>('affiliate');
  const [affiliateCode, setAffiliateCode] = useState('');
  const [trackingLink, setTrackingLink] = useState('');
  const [commissionMethod, setCommissionMethod] = useState<KOLCommissionMethod>('percentage_sales');
  const [commissionRateStr, setCommissionRateStr] = useState('10');
  const [fixedBaseFeeStr, setFixedBaseFeeStr] = useState('0');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!currentUser) return null;

  const isAdmin = currentUser.role === 'admin';
  const userBrands = brands;
  const userKols = kols;
  const userOrders = orders;

  const brandMap = new Map<string, string>();
  brands.forEach((b) => brandMap.set(b.id, b.name));

  const filteredKols = userKols.filter((k) => {
    if (k.brandId && !brands.some((b) => b.id === k.brandId)) return false;
    if (selectedBrandId !== 'all' && k.brandId !== selectedBrandId) return false;
    if (platformFilter !== 'all' && k.platform !== platformFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = k.name.toLowerCase().includes(q);
      const matchHandle = k.handleOrAccount.toLowerCase().includes(q);
      const matchCode = (k.affiliateCode || '').toLowerCase().includes(q);
      if (!matchName && !matchHandle && !matchCode) return false;
    }
    return true;
  });

  const handleOpenAdd = () => {
    const now = new Date();
    setEditingKOL(null);
    setBrandId(userBrands[0]?.id || '');
    setName('');
    setHandleOrAccount('@');
    setContactInfo('');
    setPlatform('Instagram');
    setCollaborationType('affiliate');
    setAffiliateCode('');
    setTrackingLink('');
    setCommissionMethod('percentage_sales');
    setCommissionRateStr('10');
    setFixedBaseFeeStr('0');
    setStartDate(now.toISOString().slice(0, 10));
    setEndDate(new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10));
    setIsActive(true);
    setNotes('');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (kol: KOL) => {
    setEditingKOL(kol);
    setBrandId(kol.brandId);
    setName(kol.name);
    setHandleOrAccount(kol.handleOrAccount);
    setContactInfo(kol.contactInfo);
    setPlatform(kol.platform);
    setCollaborationType(kol.collaborationType);
    setAffiliateCode(kol.affiliateCode || '');
    setTrackingLink(kol.trackingLink || '');
    setCommissionMethod(kol.commissionMethod);
    setCommissionRateStr(kol.commissionRate.toString());
    setFixedBaseFeeStr((kol.fixedBaseFee || 0).toString());
    setStartDate(kol.startDate);
    setEndDate(kol.endDate);
    setIsActive(kol.isActive);
    setNotes(kol.notes || '');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Nama KOL wajib diisi.');
      return;
    }

    const rate = parseFloat(commissionRateStr) || 0;
    const baseFee = parseFloat(fixedBaseFeeStr) || 0;

    if (editingKOL) {
      const res = updateKOL(editingKOL.id, {
        brandId,
        name,
        handleOrAccount,
        contactInfo,
        platform,
        collaborationType,
        affiliateCode,
        trackingLink,
        commissionMethod,
        commissionRate: rate,
        fixedBaseFee: baseFee,
        startDate,
        endDate,
        isActive,
        notes,
      });
      if (!res.success) {
        setErrorMsg(res.error || 'Gagal mengubah KOL.');
        return;
      }
    } else {
      const res = addKOL({
        brandId,
        name,
        handleOrAccount,
        contactInfo,
        platform,
        collaborationType,
        affiliateCode: affiliateCode || `${name.replace(/\s+/g, '').toUpperCase()}${Date.now().toString().slice(-3)}`,
        trackingLink,
        commissionMethod,
        commissionRate: rate,
        fixedBaseFee: baseFee,
        startDate,
        endDate,
        isActive,
        notes,
      });
      if (!res.success) {
        setErrorMsg(res.error || 'Gagal menambah KOL.');
        return;
      }
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl p-6 border border-purple-100 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-violet-700 uppercase tracking-wider mb-1">
            <UserCheck className="w-4 h-4" />
            <span>Database KOL, Influencer & Affiliate Partner</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">Pengelolaan Kolaborasi & Mitra Promosi</h1>
          <p className="text-xs text-slate-500 mt-1">
            Pantau kontrak kolaborasi, tarif komisi, kode link tracking, dan kinerja penjualan teratribusi.
          </p>
        </div>

        {!isAdmin && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-xl transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah KOL Baru</span>
          </button>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-purple-100 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama KOL, akun IG/TikTok, atau kode referral..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 font-medium"
          >
            <option value="all">Semua Platform</option>
            <option value="Instagram">Instagram</option>
            <option value="TikTok">TikTok</option>
            <option value="YouTube">YouTube</option>
          </select>

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
      </div>

      {/* KOL Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredKols.map((kol) => {
          const brandName = brandMap.get(kol.brandId) || kol.brandId;
          const kolOrders = userOrders.filter((o) => o.kolId === kol.id && o.status === 'completed');
          const totalAttributedSales = kolOrders.reduce((sum, o) => sum + o.netSales, 0);

          return (
            <div
              key={kol.id}
              className="bg-white rounded-2xl p-5 border border-purple-100 shadow-xs flex flex-col justify-between hover:border-violet-300 transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <span className="text-[10px] font-semibold text-violet-700 uppercase tracking-wider">
                      {brandName}
                    </span>
                    <h3 className="font-bold text-base text-slate-900">{kol.name}</h3>
                    <p className="text-xs text-violet-600 font-medium">{kol.handleOrAccount}</p>
                  </div>

                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      kol.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {kol.isActive ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>

                <div className="space-y-2 my-3 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Platform:</span>
                    <span className="font-semibold text-slate-800">{kol.platform}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Jenis Kolaborasi:</span>
                    <span className="font-semibold text-slate-800 uppercase text-[10px]">
                      {kol.collaborationType.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Tarif Komisi:</span>
                    <span className="font-mono font-bold text-violet-900">
                      {kol.commissionMethod === 'percentage_sales'
                        ? `${kol.commissionRate}% Penjualan`
                        : `Rp ${kol.commissionRate.toLocaleString('id-ID')} / Order`}
                    </span>
                  </div>
                  {kol.affiliateCode && (
                    <div className="flex items-center justify-between text-slate-600 bg-slate-50 p-2 rounded-lg font-mono text-[11px]">
                      <span className="font-sans">Kode Referral:</span>
                      <span className="font-bold text-violet-700">{kol.affiliateCode}</span>
                    </div>
                  )}
                </div>

                {/* Performa Penjualan Singkat */}
                <div className="p-3 bg-violet-50/50 rounded-xl border border-violet-100 text-xs font-mono tabular-nums mb-3">
                  <div className="flex justify-between text-slate-500 text-[11px]">
                    <span className="font-sans">Pesanan Teratribusi:</span>
                    <span className="font-bold text-slate-900">{kolOrders.length} Pesanan</span>
                  </div>
                  <div className="flex justify-between text-slate-700 mt-1 font-bold">
                    <span className="font-sans">Omzet Teratribusi:</span>
                    <span className="text-emerald-600">Rp {totalAttributedSales.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                {kol.notes && (
                  <p className="text-xs text-slate-500 line-clamp-2 mb-2">{kol.notes}</p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[11px]">
                  Kontrak: {kol.startDate} s/d {kol.endDate}
                </span>

                {!isAdmin && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(kol)}
                      className="p-1 text-slate-400 hover:text-violet-700 rounded"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteKOL(kol.id)}
                      className="p-1 text-slate-400 hover:text-red-600 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit KOL Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-purple-100 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-violet-700" />
                <h3 className="font-bold text-base text-slate-900">
                  {editingKOL ? 'Ubah Profil KOL' : 'Tambah Profil KOL Baru'}
                </h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 p-1">
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
                  <label className="block font-semibold text-slate-700 mb-1">Platform Utama</label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value as any)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800 font-medium"
                  >
                    <option value="Instagram">Instagram</option>
                    <option value="TikTok">TikTok</option>
                    <option value="YouTube">YouTube</option>
                    <option value="Twitter/X">Twitter/X</option>
                    <option value="Blog">Blog</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Sarah Amanda"
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800 font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Handle / Akun Medsos</label>
                  <input
                    type="text"
                    value={handleOrAccount}
                    onChange={(e) => setHandleOrAccount(e.target.value)}
                    placeholder="@sarah.amanda"
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800 font-medium"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Kontak (WhatsApp / Email)</label>
                <input
                  type="text"
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                  placeholder="0812-xxxx-xxxx / email@domain.com"
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jenis Kolaborasi</label>
                  <select
                    value={collaborationType}
                    onChange={(e) => setCollaborationType(e.target.value as KOLCollaborationType)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800 font-medium"
                  >
                    <option value="affiliate">Affiliate Komisi</option>
                    <option value="paid_promotion">Paid Promotion</option>
                    <option value="barter">Barter Produk</option>
                    <option value="sales_commission">Komisi Penjualan</option>
                    <option value="hybrid">Hybrid (Biaya Tetap + %)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Metode Komisi</label>
                  <select
                    value={commissionMethod}
                    onChange={(e) => setCommissionMethod(e.target.value as KOLCommissionMethod)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800 font-medium"
                  >
                    <option value="percentage_sales">Persentase Penjualan (%)</option>
                    <option value="fixed_per_order">Nominal Tetap per Pesanan (Rp)</option>
                    <option value="hybrid_fixed_plus_pct">Biaya Dasar + Persentase (%)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {commissionMethod === 'fixed_per_order' ? 'Tarif per Order (IDR)' : 'Tarif Komisi (%)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={commissionRateStr}
                    onChange={(e) => setCommissionRateStr(e.target.value)}
                    className="w-full font-mono tabular-nums bg-white border border-slate-200 rounded-lg p-2 text-slate-800 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Biaya Dasar Tetap (Jika Ada)</label>
                  <input
                    type="number"
                    min="0"
                    value={fixedBaseFeeStr}
                    onChange={(e) => setFixedBaseFeeStr(e.target.value)}
                    className="w-full font-mono tabular-nums bg-white border border-slate-200 rounded-lg p-2 text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kode Referral</label>
                  <input
                    type="text"
                    value={affiliateCode}
                    onChange={(e) => setAffiliateCode(e.target.value)}
                    placeholder="Contoh: SARAHCHEMI"
                    className="w-full font-mono bg-white border border-slate-200 rounded-lg p-2 text-slate-800 uppercase"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Link Tracking</label>
                  <input
                    type="text"
                    value={trackingLink}
                    onChange={(e) => setTrackingLink(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mulai Kerja Sama</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full font-mono bg-white border border-slate-200 rounded-lg p-2 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Berakhir</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full font-mono bg-white border border-slate-200 rounded-lg p-2 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Catatan</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Audiens target, deliverables, jadwal upload..."
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-lg shadow-xs"
                >
                  Simpan Profil KOL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
