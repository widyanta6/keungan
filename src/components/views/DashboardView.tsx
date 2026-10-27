import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowRightLeft,
  AlertTriangle,
  Receipt,
  Plus,
  ArrowUpRight,
  Info,
  Calendar,
  Layers,
  Sparkles,
  Users,
  CheckCircle2,
  Clock,
  DollarSign,
  ChevronRight,
  ShoppingCart,
} from 'lucide-react';

interface DashboardViewProps {
  onOpenNewTransaction: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenNewTransaction,
}) => {
  const {
    currentUser,
    brands,
    assets,
    transactions,
    orders,
    kols,
    kolRecaps,
    teamMembers,
    tasks,
    payrollRecaps,
    selectedBrandId,
    dateRange,
    setActiveTab,
    notifications,
  } = useApp();

  if (!currentUser) return null;

  // Filter brands and assets by user workspace
  const userBrands = brands.filter((b) => b.workspaceId === currentUser.workspaceId);
  const userAssets = assets.filter((a) => a.workspaceId === currentUser.workspaceId);

  // Filter transactions by workspace & brand
  const filteredTxs = transactions.filter((tx) => {
    if (tx.isDeleted) return false;
    if (tx.workspaceId !== currentUser.workspaceId) return false;
    if (selectedBrandId !== 'all' && tx.brandId !== selectedBrandId) return false;

    // Filter dateRange if needed
    if (dateRange === 'this_month') {
      return tx.date.startsWith('2026-10');
    }
    return true;
  });

  // Calculate totals
  let totalIncome = 0;
  let totalExpense = 0;
  let totalPurchase = 0;
  let totalTransferInternal = 0;

  filteredTxs.forEach((tx) => {
    if (tx.type === 'income') totalIncome += tx.amount;
    else if (tx.type === 'expense') totalExpense += tx.amount;
    else if (tx.type === 'purchase') totalPurchase += tx.amount;
    else if (tx.type === 'transfer') totalTransferInternal += tx.amount;
  });

  const netCashFlow = totalIncome - totalExpense - totalPurchase;
  const totalBalance = userAssets.reduce((sum, a) => sum + a.currentBalance, 0);

  // Filtered orders & KOL data
  const userOrders = orders.filter((o) => {
    if (o.workspaceId !== currentUser.workspaceId) return false;
    if (selectedBrandId !== 'all' && o.brandId !== selectedBrandId) return false;
    return true;
  });
  const userKols = kols.filter((k) => k.workspaceId === currentUser.workspaceId);
  const userKolRecaps = kolRecaps.filter((r) => {
    if (r.workspaceId !== currentUser.workspaceId) return false;
    if (selectedBrandId !== 'all' && r.brandId !== selectedBrandId) return false;
    return true;
  });

  const activeKolsCount = userKols.filter((k) => k.isActive).length;
  const totalAttributedOrders = userOrders.filter((o) => o.kolId && o.status !== 'cancelled').length;
  const totalAttributedSales = userOrders
    .filter((o) => o.kolId && o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.netSales, 0);
  const totalKolOutstanding = userKolRecaps.reduce((sum, r) => sum + r.outstandingBalance, 0);

  // Filtered Team & Tasks
  const userTeam = teamMembers.filter((m) => m.workspaceId === currentUser.workspaceId);
  const userTasks = tasks.filter((t) => {
    if (t.workspaceId !== currentUser.workspaceId) return false;
    if (selectedBrandId !== 'all' && t.brandId !== selectedBrandId) return false;
    return true;
  });
  const inProgressTasks = userTasks.filter((t) => t.status === 'in_progress').length;
  const reviewTasks = userTasks.filter((t) => t.status === 'review').length;
  const doneTasks = userTasks.filter((t) => t.status === 'done').length;

  // Filtered Payroll
  const userPayrolls = payrollRecaps.filter((p) => {
    if (p.workspaceId !== currentUser.workspaceId) return false;
    if (selectedBrandId !== 'all' && p.brandId !== selectedBrandId) return false;
    return true;
  });
  const totalPayrollComp = userPayrolls.reduce((sum, p) => sum + p.totalCompensation, 0);
  const totalPayrollPaid = userPayrolls.reduce((sum, p) => sum + p.totalPaid, 0);
  const totalPayrollOutstanding = userPayrolls.reduce((sum, p) => sum + p.outstandingBalance, 0);

  // Saldo breakdown per brand
  const brandCashFlow = userBrands.map((b) => {
    const brandTxs = filteredTxs.filter((t) => t.brandId === b.id);
    const inc = brandTxs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const exp = brandTxs
      .filter((t) => t.type === 'expense' || t.type === 'purchase')
      .reduce((s, t) => s + t.amount, 0);
    return {
      ...b,
      income: inc,
      expense: exp,
      net: inc - exp,
    };
  });

  // Expenses category breakdown
  const expenseByCategory: Record<string, number> = {};
  filteredTxs
    .filter((t) => t.type === 'expense' || t.type === 'purchase')
    .forEach((t) => {
      expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount;
    });

  const sortedCategories = Object.entries(expenseByCategory).sort((a, b) => b[1] - a[1]);
  const totalCatExpenses = sortedCategories.reduce((s, [, amt]) => s + amt, 0);

  // Recent transactions
  const recentTxs = [...filteredTxs].slice(0, 5);

  // Unread user warnings
  const unreadAlerts = notifications.filter(
    (n) => n.workspaceId === currentUser.workspaceId && (n.type === 'warning' || n.type === 'danger')
  );

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-violet-900 via-indigo-900 to-purple-900 text-white rounded-2xl p-6 shadow-md border border-violet-800">
        <div>
          <div className="flex items-center gap-2 text-violet-200 text-xs font-semibold uppercase tracking-wider mb-1">
            <span>Ringkasan Keuangan Workspace</span>
            <span>·</span>
            <span>{currentUser.name}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight font-mono">
            Rp {totalBalance.toLocaleString('id-ID')}
          </h1>
          <p className="text-xs text-violet-200/80 mt-1 flex items-center gap-1.5">
            <Wallet className="w-3.5 h-3.5 text-violet-300" />
            Total Likuiditas Terkonsolidasi ({userAssets.length} Akun Kas & Bank)
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setActiveTab('assets')}
            className="px-3.5 py-2 text-xs font-medium bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition-all whitespace-nowrap cursor-pointer"
          >
            Kelola Rekening
          </button>
          <button
            onClick={onOpenNewTransaction}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-white text-violet-950 hover:bg-violet-50 rounded-xl shadow-xs transition-all whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-4 h-4 text-violet-700" />
            <span>Tambah Transaksi</span>
          </button>
        </div>
      </div>

      {/* Unread Alerts Bar (if any) */}
      {unreadAlerts.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <p className="font-bold">{unreadAlerts[0].title}</p>
            <p className="text-amber-800 mt-0.5">{unreadAlerts[0].message}</p>
          </div>
          <button
            onClick={() => setActiveTab('notifications')}
            className="text-xs font-semibold text-amber-900 underline hover:text-amber-700 shrink-0 cursor-pointer"
          >
            Lihat Semua
          </button>
        </div>
      )}

      {/* Core Cash Flow KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pemasukan */}
        <div className="bg-white rounded-2xl p-5 border border-purple-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Total Pemasukan Kas</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl font-bold font-mono tabular-nums text-slate-900">
              Rp {totalIncome.toLocaleString('id-ID')}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Penjualan, sponsorship & jasa</p>
          </div>
        </div>

        {/* Pengeluaran Operasional */}
        <div className="bg-white rounded-2xl p-5 border border-purple-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Biaya Operasional Kas</span>
            <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl font-bold font-mono tabular-nums text-slate-900">
              Rp {totalExpense.toLocaleString('id-ID')}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Sewa, marketing, honor & logistik</p>
          </div>
        </div>

        {/* Pembelian Bahan */}
        <div className="bg-white rounded-2xl p-5 border border-purple-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Pembelian Bahan / Aset</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl font-bold font-mono tabular-nums text-slate-900">
              Rp {totalPurchase.toLocaleString('id-ID')}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Persediaan & material produksi</p>
          </div>
        </div>

        {/* Arus Kas Bersih */}
        <div className="bg-white rounded-2xl p-5 border border-purple-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Arus Kas Bersih</span>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                netCashFlow >= 0 ? 'bg-violet-50 text-violet-700' : 'bg-red-50 text-red-600'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div
              className={`text-xl font-bold font-mono tabular-nums ${
                netCashFlow >= 0 ? 'text-violet-900' : 'text-red-600'
              }`}
            >
              {netCashFlow >= 0 ? '+' : ''}Rp {netCashFlow.toLocaleString('id-ID')}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Surplus / defisit arus kas periode</p>
          </div>
        </div>
      </div>

      {/* SECTION 11: INTEGRATED BUSINESS MODULE WIDGETS (KOL, PAYROLL, TASKS) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Widget 11.1: Ringkasan KOL & Kampanye */}
        <div className="bg-white rounded-2xl p-5 border border-purple-100 shadow-xs flex flex-col justify-between hover:border-violet-300 transition-all">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">KOL & Kampanye</h3>
                  <span className="text-[11px] text-slate-400">{activeKolsCount} KOL Aktif</span>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('kol_recap')}
                className="text-xs font-semibold text-violet-600 hover:text-violet-800 flex items-center gap-0.5"
              >
                Rekap <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100 text-xs font-mono tabular-nums">
              <div className="flex justify-between text-slate-600">
                <span className="font-sans">Pesanan Teratribusi:</span>
                <span className="font-bold text-slate-800">{totalAttributedOrders} Pesanan</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span className="font-sans">Penjualan Teratribusi:</span>
                <span className="font-bold text-emerald-600">
                  Rp {totalAttributedSales.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between text-slate-600 pt-1 border-t border-dashed border-slate-200">
                <span className="font-sans text-amber-700 font-semibold">Komisi Terutang:</span>
                <span className="font-bold text-amber-700">
                  Rp {totalKolOutstanding.toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          </div>
          <div className="mt-3 pt-2 text-[11px] text-slate-400 font-sans flex items-center justify-between">
            <span>Atribusi Penjualan Bisnis</span>
            <button
              onClick={() => setActiveTab('kol')}
              className="text-violet-600 hover:underline font-medium"
            >
              Lihat Profil KOL
            </button>
          </div>
        </div>

        {/* Widget 11.2: Ringkasan Payroll & Honorarium */}
        <div className="bg-white rounded-2xl p-5 border border-purple-100 shadow-xs flex flex-col justify-between hover:border-violet-300 transition-all">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Payroll & Honor Tim</h3>
                  <span className="text-[11px] text-slate-400">{userPayrolls.length} Penerima</span>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('payroll')}
                className="text-xs font-semibold text-violet-600 hover:text-violet-800 flex items-center gap-0.5"
              >
                Kelola <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100 text-xs font-mono tabular-nums">
              <div className="flex justify-between text-slate-600">
                <span className="font-sans">Total Hak Kompensasi:</span>
                <span className="font-bold text-slate-800">
                  Rp {totalPayrollComp.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span className="font-sans">Sudah Dibayar Kas:</span>
                <span className="font-bold text-emerald-600">
                  Rp {totalPayrollPaid.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between text-slate-600 pt-1 border-t border-dashed border-slate-200">
                <span className="font-sans text-amber-700 font-semibold">Saldo Terutang Tim:</span>
                <span className="font-bold text-amber-700">
                  Rp {totalPayrollOutstanding.toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          </div>
          <div className="mt-3 pt-2 text-[11px] text-slate-400 font-sans flex items-center justify-between">
            <span>Kewajiban Penggajian</span>
            <button
              onClick={() => setActiveTab('payroll')}
              className="text-violet-600 hover:underline font-medium"
            >
              Bayar Kas
            </button>
          </div>
        </div>

        {/* Widget 11.3: Ringkasan Tugas & Pekerjaan Tim */}
        <div className="bg-white rounded-2xl p-5 border border-purple-100 shadow-xs flex flex-col justify-between hover:border-violet-300 transition-all">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Tugas & Tim</h3>
                  <span className="text-[11px] text-slate-400">{userTasks.length} Total Tugas</span>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('team_tasks')}
                className="text-xs font-semibold text-violet-600 hover:text-violet-800 flex items-center gap-0.5"
              >
                Board <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Sedang Dikerjakan:</span>
                <span className="font-mono font-bold text-blue-600">{inProgressTasks} Tugas</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Menunggu Review:</span>
                <span className="font-mono font-bold text-amber-600">{reviewTasks} Tugas</span>
              </div>
              <div className="flex justify-between text-slate-600 pt-1 border-t border-dashed border-slate-200">
                <span className="text-emerald-700 font-semibold">Tugas Selesai:</span>
                <span className="font-mono font-bold text-emerald-600">{doneTasks} Tugas</span>
              </div>
            </div>
          </div>
          <div className="mt-3 pt-2 text-[11px] text-slate-400 font-sans flex items-center justify-between">
            <span>Dual View: List & Kanban</span>
            <button
              onClick={() => setActiveTab('team_tasks')}
              className="text-violet-600 hover:underline font-medium"
            >
              Buka Manajemen Tim
            </button>
          </div>
        </div>
      </div>

      {/* Brand Breakdown Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Layers className="w-4 h-4 text-violet-600" />
            <span>Performa Arus Kas per Brand</span>
          </h2>
          <span className="text-xs text-slate-400 font-medium">
            {userBrands.length} Brand Aktif
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {brandCashFlow.map((brand) => (
            <div
              key={brand.id}
              className="bg-white rounded-2xl p-4 border border-purple-100 shadow-xs hover:border-violet-300 transition-all cursor-pointer"
              onClick={() => setActiveTab('transactions')}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: brand.color }}
                  />
                  <h3 className="font-bold text-sm text-slate-900">{brand.name}</h3>
                </div>
                <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  {brand.code}
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-3 line-clamp-1">{brand.category}</p>

              <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs font-mono tabular-nums">
                <div className="flex justify-between text-slate-600">
                  <span>Pemasukan:</span>
                  <span className="font-semibold text-emerald-600">
                    Rp {brand.income.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Pengeluaran:</span>
                  <span className="font-semibold text-slate-800">
                    Rp {brand.expense.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-dashed border-slate-200 font-bold">
                  <span>Net Kas:</span>
                  <span className={brand.net >= 0 ? 'text-violet-700' : 'text-red-600'}>
                    {brand.net >= 0 ? '+' : ''}Rp {brand.net.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2-Column: Recent Transactions & Expense Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions List (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-purple-100 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Transaksi Keuangan Terkini</h2>
              <p className="text-xs text-slate-400">Mutasi kas dan pembukuan terbaru</p>
            </div>
            <button
              onClick={() => setActiveTab('transactions')}
              className="text-xs font-semibold text-violet-700 hover:text-violet-900 cursor-pointer"
            >
              Lihat Semua &rarr;
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {recentTxs.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                Belum ada transaksi tercatat untuk filter ini.
              </div>
            ) : (
              recentTxs.map((tx) => {
                const brand = brands.find((b) => b.id === tx.brandId);
                const isIncome = tx.type === 'income';
                const isTransfer = tx.type === 'transfer';

                return (
                  <div key={tx.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          isIncome
                            ? 'bg-emerald-50 text-emerald-600'
                            : isTransfer
                            ? 'bg-blue-50 text-blue-600'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {isIncome ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : isTransfer ? (
                          <ArrowRightLeft className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                      </div>
                      <div className="truncate">
                        <p className="font-semibold text-slate-800 truncate">{tx.description}</p>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono mt-0.5">
                          <span className="font-sans font-semibold text-violet-700">
                            {brand?.name}
                          </span>
                          <span>·</span>
                          <span>{tx.category}</span>
                          <span>·</span>
                          <span>{tx.date}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
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
                      <span className="text-[10px] text-slate-400">{tx.paymentMethod}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Expense Category Breakdown (1 Col) */}
        <div className="bg-white rounded-2xl p-5 border border-purple-100 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-slate-800">Alokasi Pengeluaran</h2>
              <span className="text-xs font-mono text-slate-400">Kategori Utama</span>
            </div>

            <div className="space-y-3 mt-4">
              {sortedCategories.slice(0, 5).map(([category, amount]) => {
                const percentage =
                  totalCatExpenses > 0 ? Math.round((amount / totalCatExpenses) * 100) : 0;

                return (
                  <div key={category} className="space-y-1 text-xs">
                    <div className="flex justify-between items-center text-slate-700">
                      <span className="font-medium truncate pr-2">{category}</span>
                      <span className="font-mono tabular-nums font-semibold shrink-0">
                        {percentage}%
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-violet-600 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="text-right text-[11px] font-mono tabular-nums text-slate-400">
                      Rp {amount.toLocaleString('id-ID')}
                    </div>
                  </div>
                );
              })}

              {sortedCategories.length === 0 && (
                <p className="text-xs text-slate-400 py-6 text-center">
                  Belum ada data pengeluaran.
                </p>
              )}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Total Beban Biaya:</span>
            <span className="font-mono font-bold text-slate-900">
              Rp {totalCatExpenses.toLocaleString('id-ID')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
