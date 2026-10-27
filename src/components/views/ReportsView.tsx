import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  BarChart3,
  Calendar,
  Layers,
  TrendingUp,
  TrendingDown,
  Info,
  DollarSign,
  FileSpreadsheet,
  ChevronDown,
  ChevronRight,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { exportFullFinancialReport } from '../../utils/excelExport';

export const ReportsView: React.FC = () => {
  const {
    currentUser,
    currentWorkspace,
    brands,
    assets,
    transactions,
    products,
    hppRecipes,
    commissions,
    marketing,
    orders,
    kols,
    kolRecaps,
    teamMembers,
    tasks,
    payrollRecaps,
    worksheets,
    selectedBrandId,
    setSelectedBrandId,
    dateRange,
    setDateRange,
  } = useApp();

  const [activeReportTab, setActiveReportTab] = useState<
    'pl_operational' | 'cashflow' | 'brand_perf' | 'categories'
  >('pl_operational');

  const [expandedSection, setExpandedSection] = useState<string | null>('sales');

  if (!currentUser) return null;

  const isAdmin = currentUser.role === 'admin';
  const userBrands = isAdmin
    ? brands
    : brands.filter((b) => b.workspaceId === currentUser.workspaceId);
  const userAssets = isAdmin
    ? assets
    : assets.filter((a) => a.workspaceId === currentUser.workspaceId);

  const brandMap = new Map<string, string>();
  brands.forEach((b) => brandMap.set(b.id, b.name));

  // Filter helper by brand and dateRange
  const filterByContext = (item: { brandId?: string; workspaceId?: string; date?: string; orderDate?: string; period?: string }) => {
    if (!isAdmin && item.workspaceId && item.workspaceId !== currentUser.workspaceId) return false;
    if (selectedBrandId !== 'all' && item.brandId && item.brandId !== selectedBrandId) return false;
    
    const targetDate = item.date || item.orderDate;
    if (dateRange === 'this_month') {
      if (item.period) return item.period === '2026-10';
      if (targetDate) return targetDate.startsWith('2026-10');
    }
    return true;
  };

  // Filtered Datasets
  const filteredTxs = transactions.filter((tx) => !tx.isDeleted && filterByContext(tx));
  const filteredOrders = orders.filter(filterByContext);
  const filteredKolRecaps = kolRecaps.filter(filterByContext);
  const filteredPayroll = payrollRecaps.filter(filterByContext);

  // -------------------------------------------------------------
  // 1. CASH FLOW METRICS (Aktual Kas Riil)
  // -------------------------------------------------------------
  let actualCashInflow = 0;
  let actualCashOutflow = 0;
  let actualPurchaseCash = 0;

  filteredTxs.forEach((tx) => {
    if (tx.type === 'income') actualCashInflow += tx.amount;
    else if (tx.type === 'expense') actualCashOutflow += tx.amount;
    else if (tx.type === 'purchase') actualPurchaseCash += tx.amount;
  });

  const netCashFlow = actualCashInflow - actualCashOutflow - actualPurchaseCash;
  const totalAssetsBalance = userAssets.reduce((sum, a) => sum + a.currentBalance, 0);

  // -------------------------------------------------------------
  // 2. OPERATIONAL P&L METRICS (Seksi 9.1 PRD)
  // -------------------------------------------------------------
  // Step 1: Penjualan Kotor (Gross Sales)
  const grossSales = filteredOrders.reduce((acc, o) => acc + o.grossSales, 0);

  // Step 2: Diskon & Refund Pesanan
  const totalDiscounts = filteredOrders.reduce((acc, o) => acc + o.discount, 0);
  const totalRefunds = filteredOrders.reduce((acc, o) => acc + o.refundAmount, 0);

  // Step 3: Penjualan Bersih (Net Sales) = Gross - Diskon - Refund
  const netSales = Math.max(0, grossSales - totalDiscounts - totalRefunds);

  // Step 4: HPP Barang Terjual (COGS)
  // Hitung HPP aktual berdasarkan resep produk yang terjual pada pesanan
  let totalCOGS = 0;
  filteredOrders.forEach((o) => {
    if (o.status !== 'cancelled') {
      o.items.forEach((item) => {
        // Cari resep atau estimasi HPP produk
        const recipe = hppRecipes.find((r) => r.productId === item.productId);
        const prod = products.find((p) => p.id === item.productId);
        const unitHpp = recipe ? recipe.totalHppPerUnit : prod ? prod.estimatedHpp || 0 : item.unitPrice * 0.45;
        totalCOGS += unitHpp * item.quantity;
      });
    }
  });

  // Step 5: Laba Kotor (Gross Profit) = Net Sales - COGS
  const grossProfit = netSales - totalCOGS;
  const grossMargin = netSales > 0 ? (grossProfit / netSales) * 100 : 0;

  // Step 6: Beban Komisi KOL (Recognized from approved/paid recaps)
  const kolCommissions = filteredKolRecaps
    .filter((k) => k.status !== 'cancelled')
    .reduce((acc, k) => acc + k.finalCommission, 0);

  // Step 7: Gaji Pokok & Payroll Tim (Recognized from approved/paid recaps)
  const teamBaseSalaries = filteredPayroll
    .filter((p) => p.status !== 'cancelled')
    .reduce((acc, p) => acc + p.baseSalary, 0);

  // Step 8: Honorarium Tugas/Proyek & Insentif
  const taskAndProjectFees = filteredPayroll
    .filter((p) => p.status !== 'cancelled')
    .reduce((acc, p) => acc + p.taskFees + p.incentives + p.reimbursements, 0);

  // Step 9: Biaya Pemasaran / Ads (dari transaksi beban kategori pemasaran)
  const marketingCosts = filteredTxs
    .filter((t) => t.type === 'expense' && (t.category.toLowerCase().includes('marketing') || t.category.toLowerCase().includes('iklan')))
    .reduce((acc, t) => acc + t.amount, 0);

  // Step 10: Biaya Operasional Lainnya (sewa, listrik, admin, logistik yang bukan komisi/payroll/marketing)
  const otherOpex = filteredTxs
    .filter((t) => {
      if (t.type !== 'expense') return false;
      const cat = t.category.toLowerCase();
      if (cat.includes('marketing') || cat.includes('iklan')) return false;
      if (cat.includes('gaji') || cat.includes('payroll') || cat.includes('honor')) return false;
      if (cat.includes('komisi')) return false;
      return true;
    })
    .reduce((acc, t) => acc + t.amount, 0);

  // Total Operating Expenses
  const totalOperatingExpenses =
    kolCommissions + teamBaseSalaries + taskAndProjectFees + marketingCosts + otherOpex;

  // Step 11: Laba Operasional (Operating Profit) = Gross Profit - Operating Expenses
  const operatingProfit = grossProfit - totalOperatingExpenses;
  const operatingMargin = netSales > 0 ? (operatingProfit / netSales) * 100 : 0;

  // Breakdown per category for Cash Flow
  const expenseCategories: Record<string, number> = {};
  filteredTxs.forEach((tx) => {
    if (tx.type === 'expense' || tx.type === 'purchase') {
      expenseCategories[tx.category] = (expenseCategories[tx.category] || 0) + tx.amount;
    }
  });

  // Export handler
  const handleExportExcel = () => {
    const rangeLabels: Record<string, string> = {
      this_month: 'Bulan Ini (Oktober 2026)',
      last_30_days: '30 Hari Terakhir',
      quarter: 'Kuartal Ini (Q4 2026)',
      year: 'Tahun 2026',
      all: 'Semua Periode',
    };

    const bName = selectedBrandId !== 'all' ? brandMap.get(selectedBrandId) : 'Semua Brand';

    exportFullFinancialReport({
      title: 'Laporan Keuangan Komprehensif BizFlow',
      workspaceName: currentWorkspace?.name || 'Workspace Transparansi Admin',
      brandName: bName,
      dateRangeLabel: rangeLabels[dateRange] || 'Semua Periode',
      brands: userBrands,
      transactions: filteredTxs,
      assets: userAssets,
      products: !isAdmin ? products.filter((p) => p.workspaceId === currentUser.workspaceId) : products,
      hppRecipes: !isAdmin ? hppRecipes.filter((h) => h.workspaceId === currentUser.workspaceId) : hppRecipes,
      commissions: !isAdmin ? commissions.filter((c) => c.workspaceId === currentUser.workspaceId) : commissions,
      marketing: !isAdmin ? marketing.filter((m) => m.workspaceId === currentUser.workspaceId) : marketing,
      orders: filteredOrders,
      kols,
      kolRecaps: filteredKolRecaps,
      teamMembers,
      tasks,
      payrollRecaps: filteredPayroll,
      worksheets,
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl p-6 border border-purple-100 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-violet-700 uppercase tracking-wider mb-1">
            <BarChart3 className="w-4 h-4" />
            <span>Pusat Laporan & Analisis Finansial</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">
            Laporan Keuangan & Integritas Operasional
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Pemisahan tegas Laba Rugi Operasional (Seksi 9.1 PRD) dan Arus Kas Riil, tanpa duplikasi pencatatan komisi, payroll, atau penjualan KOL.
          </p>
        </div>

        <button
          onClick={handleExportExcel}
          className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-xs cursor-pointer"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Unduh Buku Kerja Excel (.xlsx)</span>
        </button>
      </div>

      {/* Financial Accounting Rules Notice (Seksi 9.3 PRD) */}
      <div className="bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-100 rounded-xl p-4 text-xs text-violet-950 flex items-start gap-3">
        <ShieldAlert className="w-4 h-4 text-violet-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-violet-900">
            Dua Dimensi Laporan Keuangan BizFlow (Seksi 9.3 PRD):
          </p>
          <p className="text-violet-800/90 leading-relaxed">
            <strong>1. Laporan Laba Rugi:</strong> Mengakui pendapatan bersih dari pesanan valid, dikurangi HPP aktual dan seluruh kewajiban beban operasional (komisi KOL, payroll tim, dan operasional).
            <br />
            <strong>2. Laporan Arus Kas:</strong> Hanya menghitung uang kas masuk dan keluar riil. Komisi atau gaji yang belum dibayarkan adalah <em>kewajiban terutang</em> dan <strong>tidak memotong kas</strong> sampai transaksi pembayaran kas dilakukan.
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-purple-100 shadow-xs text-xs">
        {/* Report tab selector */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveReportTab('pl_operational')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeReportTab === 'pl_operational'
                ? 'bg-white text-violet-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Laba Rugi Operasional (P&L)
          </button>
          <button
            onClick={() => setActiveReportTab('cashflow')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeReportTab === 'cashflow'
                ? 'bg-white text-violet-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Laporan Arus Kas (Cash Flow)
          </button>
          <button
            onClick={() => setActiveReportTab('brand_perf')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeReportTab === 'brand_perf'
                ? 'bg-white text-violet-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Performa Per Brand
          </button>
          <button
            onClick={() => setActiveReportTab('categories')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeReportTab === 'categories'
                ? 'bg-white text-violet-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Struktur Biaya
          </button>
        </div>

        {/* Brand & Date Range Filters */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium">Periode:</span>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="text-xs font-semibold bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700"
            >
              <option value="this_month">Oktober 2026 (Bulan Ini)</option>
              <option value="last_30_days">30 Hari Terakhir</option>
              <option value="quarter">Kuartal 4 (Q4)</option>
              <option value="all">Semua Periode</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium">Brand:</span>
            <select
              value={selectedBrandId}
              onChange={(e) => setSelectedBrandId(e.target.value)}
              className="text-xs font-semibold bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700"
            >
              <option value="all">Semua Brand Milik Saya</option>
              {userBrands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* TAB 1: LABA RUGI OPERASIONAL (Seksi 9.1 PRD) */}
      {activeReportTab === 'pl_operational' && (
        <div className="space-y-6">
          {/* Top 3 Strategic Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-purple-100 shadow-xs">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Penjualan Bersih (Net Sales)
              </span>
              <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
                Rp {netSales.toLocaleString('id-ID')}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Gross Rp {grossSales.toLocaleString('id-ID')} - Diskon & Refund
              </p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-purple-100 shadow-xs">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Laba Kotor (Gross Profit)
              </span>
              <div className="text-2xl font-bold font-mono tabular-nums text-emerald-600 mt-1">
                Rp {grossProfit.toLocaleString('id-ID')}
              </div>
              <p className="text-[11px] text-emerald-700 font-semibold mt-1">
                Margin Kotor: {grossMargin.toFixed(1)}% (setelah HPP Rp {totalCOGS.toLocaleString('id-ID')})
              </p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-purple-100 shadow-xs">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Laba Operasional (Operating Profit)
              </span>
              <div
                className={`text-2xl font-bold font-mono tabular-nums mt-1 ${
                  operatingProfit >= 0 ? 'text-violet-900' : 'text-rose-600'
                }`}
              >
                {operatingProfit >= 0 ? '+' : ''}Rp {operatingProfit.toLocaleString('id-ID')}
              </div>
              <p className="text-[11px] text-violet-700 font-semibold mt-1">
                Margin Operasional: {operatingMargin.toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Detailed Statement Waterfall Table (Step 1 through 11) */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-800">
                  Laporan Laba Rugi Operasional Bertingkat (Waterfall Statement)
                </h2>
                <p className="text-xs text-slate-500">
                  Mengikuti struktur baku Seksi 9.1 PRD: Penjualan Bersih → HPP → Laba Kotor → Beban Operasional → Laba Operasional.
                </p>
              </div>
              <span className="text-xs font-mono font-semibold text-violet-700 bg-violet-50 px-2.5 py-1 rounded-lg border border-violet-100">
                Buku: Standard Accrual
              </span>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {/* 1. Penjualan Kotor */}
              <div className="p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-600 font-bold flex items-center justify-center text-[11px]">
                    1
                  </span>
                  <div>
                    <span className="font-semibold text-slate-900 text-sm">Penjualan Kotor (Gross Sales)</span>
                    <p className="text-[11px] text-slate-500">
                      Total nilai pesanan masuk dari semua kanal (termasuk atribusi pesanan KOL)
                    </p>
                  </div>
                </div>
                <div className="text-right font-mono font-bold text-slate-900 text-sm tabular-nums">
                  Rp {grossSales.toLocaleString('id-ID')}
                </div>
              </div>

              {/* 2. Diskon & Refund */}
              <div className="p-4 pl-10 flex items-center justify-between bg-slate-50/30 text-rose-700 hover:bg-slate-50/60 transition-colors">
                <div>
                  <span className="font-medium">(-) Potongan Diskon Promosi</span>
                  <p className="text-[11px] text-rose-500/80">Diskon voucher dan potongan harga khusus</p>
                </div>
                <div className="text-right font-mono font-semibold tabular-nums">
                  - Rp {totalDiscounts.toLocaleString('id-ID')}
                </div>
              </div>

              <div className="p-4 pl-10 flex items-center justify-between bg-slate-50/30 text-rose-700 hover:bg-slate-50/60 transition-colors">
                <div>
                  <span className="font-medium">(-) Refund Pesanan yang Diakui</span>
                  <p className="text-[11px] text-rose-500/80">Pengembalian dana pelanggan (menggugurkan komisi)</p>
                </div>
                <div className="text-right font-mono font-semibold tabular-nums">
                  - Rp {totalRefunds.toLocaleString('id-ID')}
                </div>
              </div>

              {/* 3. Penjualan Bersih */}
              <div className="p-4 bg-violet-50/40 flex items-center justify-between border-y border-violet-100 font-semibold">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-violet-200 text-violet-800 font-bold flex items-center justify-center text-[11px]">
                    2
                  </span>
                  <div>
                    <span className="text-violet-950 font-bold text-sm">Penjualan Bersih (Net Sales)</span>
                    <span className="text-[11px] text-violet-700 ml-2 font-normal">
                      [Penjualan Kotor − Diskon − Refund]
                    </span>
                  </div>
                </div>
                <div className="text-right font-mono font-bold text-violet-900 text-sm tabular-nums">
                  Rp {netSales.toLocaleString('id-ID')}
                </div>
              </div>

              {/* 4. HPP Barang Terjual */}
              <div className="p-4 flex items-center justify-between text-rose-800 hover:bg-slate-50/60 transition-colors">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-rose-100 text-rose-700 font-bold flex items-center justify-center text-[11px]">
                    3
                  </span>
                  <div>
                    <span className="font-semibold text-slate-900 text-sm">(-) HPP Barang Terjual (COGS)</span>
                    <p className="text-[11px] text-slate-500">
                      Biaya bahan baku langsung, upah pengrajin/produksi, dan kemasan barang yang laku
                    </p>
                  </div>
                </div>
                <div className="text-right font-mono font-bold text-rose-700 text-sm tabular-nums">
                  - Rp {totalCOGS.toLocaleString('id-ID')}
                </div>
              </div>

              {/* 5. Laba Kotor */}
              <div className="p-4 bg-emerald-50/50 flex items-center justify-between border-y border-emerald-100 font-semibold">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-emerald-200 text-emerald-800 font-bold flex items-center justify-center text-[11px]">
                    4
                  </span>
                  <div>
                    <span className="text-emerald-950 font-bold text-sm">Laba Kotor (Gross Profit)</span>
                    <span className="text-[11px] text-emerald-700 ml-2 font-semibold">
                      [Margin: {grossMargin.toFixed(1)}%]
                    </span>
                  </div>
                </div>
                <div className="text-right font-mono font-bold text-emerald-800 text-sm tabular-nums">
                  Rp {grossProfit.toLocaleString('id-ID')}
                </div>
              </div>

              {/* Beban Operasional Sub-Header */}
              <div className="p-3 bg-slate-100/70 font-semibold text-slate-700 uppercase tracking-wider text-[11px]">
                Beban Operasional & Kompensasi (Operating Expenses)
              </div>

              {/* 6. Komisi KOL */}
              <div className="p-4 pl-10 flex items-center justify-between hover:bg-slate-50/60 transition-colors">
                <div>
                  <span className="font-medium text-slate-900">Komisi KOL / Influencer / Affiliate</span>
                  <p className="text-[11px] text-slate-500">
                    Kewajiban komisi teratribusi yang telah disetujui (tidak dihitung ganda saat kas dibayar)
                  </p>
                </div>
                <div className="text-right font-mono font-semibold text-rose-700 tabular-nums">
                  - Rp {kolCommissions.toLocaleString('id-ID')}
                </div>
              </div>

              {/* 7. Gaji Pokok Tim */}
              <div className="p-4 pl-10 flex items-center justify-between hover:bg-slate-50/60 transition-colors">
                <div>
                  <span className="font-medium text-slate-900">Gaji Pokok Karyawan & Payroll</span>
                  <p className="text-[11px] text-slate-500">Kompensasi tetap anggota tim bulanan</p>
                </div>
                <div className="text-right font-mono font-semibold text-rose-700 tabular-nums">
                  - Rp {teamBaseSalaries.toLocaleString('id-ID')}
                </div>
              </div>

              {/* 8. Honorarium Tugas / Proyek */}
              <div className="p-4 pl-10 flex items-center justify-between hover:bg-slate-50/60 transition-colors">
                <div>
                  <span className="font-medium text-slate-900">Honorarium Tugas, Event & Insentif Tim</span>
                  <p className="text-[11px] text-slate-500">
                    Fee berbasis tugas/event yang disetujui serta bonus target
                  </p>
                </div>
                <div className="text-right font-mono font-semibold text-rose-700 tabular-nums">
                  - Rp {taskAndProjectFees.toLocaleString('id-ID')}
                </div>
              </div>

              {/* 9. Biaya Marketing & Iklan */}
              <div className="p-4 pl-10 flex items-center justify-between hover:bg-slate-50/60 transition-colors">
                <div>
                  <span className="font-medium text-slate-900">Biaya Pemasaran, Ads & Kampanye</span>
                  <p className="text-[11px] text-slate-500">Meta Ads, TikTok Ads, materi promosi</p>
                </div>
                <div className="text-right font-mono font-semibold text-rose-700 tabular-nums">
                  - Rp {marketingCosts.toLocaleString('id-ID')}
                </div>
              </div>

              {/* 10. Biaya Operasional Lainnya */}
              <div className="p-4 pl-10 flex items-center justify-between hover:bg-slate-50/60 transition-colors">
                <div>
                  <span className="font-medium text-slate-900">Beban Operasional Lainnya</span>
                  <p className="text-[11px] text-slate-500">
                    Sewa tempat, utilitas, logistik kemasan umum, dan administrasi
                  </p>
                </div>
                <div className="text-right font-mono font-semibold text-rose-700 tabular-nums">
                  - Rp {otherOpex.toLocaleString('id-ID')}
                </div>
              </div>

              {/* Total Beban Operasional */}
              <div className="p-3.5 bg-slate-50 flex items-center justify-between font-semibold text-slate-700">
                <span className="text-xs">Total Seluruh Beban Operasional</span>
                <span className="font-mono text-rose-700 font-bold tabular-nums">
                  - Rp {totalOperatingExpenses.toLocaleString('id-ID')}
                </span>
              </div>

              {/* 11. LABA OPERASIONAL FINAL */}
              <div className="p-5 bg-gradient-to-r from-violet-100/60 to-indigo-100/60 flex items-center justify-between border-t-2 border-violet-400">
                <div>
                  <span className="text-base font-bold text-violet-950 block">
                    Laba Operasional Bersih (Net Operating Profit)
                  </span>
                  <p className="text-xs text-violet-700 mt-0.5 font-medium">
                    Laba Kotor dikurangi Total Beban Operasional · Margin: {operatingMargin.toFixed(1)}%
                  </p>
                </div>
                <div
                  className={`text-xl font-bold font-mono tabular-nums ${
                    operatingProfit >= 0 ? 'text-violet-900' : 'text-rose-600'
                  }`}
                >
                  {operatingProfit >= 0 ? '+' : ''}Rp {operatingProfit.toLocaleString('id-ID')}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LAPORAN ARUS KAS (CASH FLOW) */}
      {activeReportTab === 'cashflow' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-purple-100 shadow-xs">
              <span className="text-xs font-semibold text-slate-500">Pemasukan Kas Masuk</span>
              <div className="text-2xl font-bold font-mono tabular-nums text-emerald-600 mt-1">
                Rp {actualCashInflow.toLocaleString('id-ID')}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Uang riil masuk ke rekening kas</p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-purple-100 shadow-xs">
              <span className="text-xs font-semibold text-slate-500">Kas Keluar Operasional</span>
              <div className="text-2xl font-bold font-mono tabular-nums text-slate-800 mt-1">
                Rp {actualCashOutflow.toLocaleString('id-ID')}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Beban yang sudah dibayar kas</p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-purple-100 shadow-xs">
              <span className="text-xs font-semibold text-slate-500">Belanja Pembelian Aset/Stok</span>
              <div className="text-2xl font-bold font-mono tabular-nums text-slate-800 mt-1">
                Rp {actualPurchaseCash.toLocaleString('id-ID')}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Pengadaan bahan & alat</p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-purple-100 shadow-xs">
              <span className="text-xs font-semibold text-slate-500">Arus Kas Bersih (Net Cash)</span>
              <div
                className={`text-2xl font-bold font-mono tabular-nums mt-1 ${
                  netCashFlow >= 0 ? 'text-violet-900' : 'text-rose-600'
                }`}
              >
                {netCashFlow >= 0 ? '+' : ''}Rp {netCashFlow.toLocaleString('id-ID')}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Surplus / defisit kas aktual</p>
            </div>
          </div>

          {/* Mutasi Kas per Aset */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
            <h2 className="text-sm font-bold text-slate-800 mb-3">
              Saldo Likuiditas Aset Berjalan Saat Ini
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {userAssets.map((asset) => (
                <div
                  key={asset.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800 text-xs">{asset.name}</span>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-white text-slate-500 border border-slate-200">
                      {asset.type}
                    </span>
                  </div>
                  <div className="mt-3">
                    <div className="text-lg font-bold font-mono text-slate-900 tabular-nums">
                      Rp {asset.currentBalance.toLocaleString('id-ID')}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 flex justify-between">
                      <span>Saldo Awal: Rp {asset.initialBalance.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Rincian Transaksi Kas */}
          <div className="bg-white rounded-2xl border border-purple-100 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 font-bold text-sm text-slate-800">
              Riwayat Arus Kas Transaksi ({filteredTxs.length} Transaksi)
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                    <th className="py-2.5 px-3">Tanggal</th>
                    <th className="py-2.5 px-3">Brand</th>
                    <th className="py-2.5 px-3">Kategori</th>
                    <th className="py-2.5 px-3">Deskripsi</th>
                    <th className="py-2.5 px-3">Akun Kas</th>
                    <th className="py-2.5 px-3 text-right">Nominal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTxs.slice(0, 15).map((tx) => (
                    <tr key={tx.id} className="hover:bg-violet-50/40">
                      <td className="py-2.5 px-3 font-mono text-slate-500">{tx.date}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-900">
                        {brandMap.get(tx.brandId) || tx.brandId}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">{tx.category}</td>
                      <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate">{tx.description}</td>
                      <td className="py-2.5 px-3 text-slate-500">
                        {userAssets.find((a) => a.id === tx.assetId)?.name || tx.assetId}
                      </td>
                      <td
                        className={`py-2.5 px-3 text-right font-mono font-bold tabular-nums ${
                          tx.type === 'income' ? 'text-emerald-600' : 'text-slate-900'
                        }`}
                      >
                        {tx.type === 'income' ? '+' : '-'}Rp {tx.amount.toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PERFORMA PER BRAND */}
      {activeReportTab === 'brand_perf' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {userBrands.map((brand) => {
            const bOrders = orders.filter((o) => o.brandId === brand.id && o.status !== 'cancelled');
            const bGross = bOrders.reduce((acc, o) => acc + o.grossSales, 0);
            const bNet = bOrders.reduce((acc, o) => acc + o.netSales, 0);
            const bTxs = transactions.filter((t) => !t.isDeleted && t.brandId === brand.id);
            const bExpenses = bTxs
              .filter((t) => t.type === 'expense' || t.type === 'purchase')
              .reduce((acc, t) => acc + t.amount, 0);

            return (
              <div
                key={brand.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-bold text-base text-slate-900">{brand.name}</h3>
                    <p className="text-xs text-slate-400">Kategori: {brand.category}</p>
                  </div>
                  <span className="text-xs font-semibold text-violet-700 bg-violet-50 px-2.5 py-1 rounded-full border border-violet-100">
                    {bOrders.length} Pesanan
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-400 block mb-0.5">Penjualan Bersih</span>
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      Rp {bNet.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-400 block mb-0.5">Kas Keluar</span>
                    <span className="font-mono font-bold text-rose-700 text-sm">
                      Rp {bExpenses.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-violet-50/50 rounded-xl border border-violet-100 flex items-center justify-between text-xs font-semibold">
                  <span className="text-violet-900">Selisih Operasional</span>
                  <span
                    className={`font-mono font-bold ${
                      bNet - bExpenses >= 0 ? 'text-violet-900' : 'text-rose-600'
                    }`}
                  >
                    {bNet - bExpenses >= 0 ? '+' : ''}Rp {(bNet - bExpenses).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 4: STRUKTUR KATEGORI BIAYA */}
      {activeReportTab === 'categories' && (
        <div className="bg-white rounded-2xl border border-purple-100 p-6 shadow-xs space-y-5">
          <h2 className="text-sm font-bold text-slate-800">
            Distribusi Pengeluaran Berdasarkan Kategori
          </h2>

          <div className="space-y-3">
            {Object.entries(expenseCategories).map(([cat, amount]) => {
              const totalExp = Object.values(expenseCategories).reduce((s, v) => s + v, 0);
              const pct = totalExp > 0 ? ((amount / totalExp) * 100).toFixed(1) : '0';

              return (
                <div key={cat} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-700">{cat}</span>
                    <span className="font-mono font-bold text-slate-900">
                      Rp {amount.toLocaleString('id-ID')} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-violet-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
