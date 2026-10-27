import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Menu,
  Plus,
  ShieldAlert,
  Bell,
  Download,
  Calendar,
} from 'lucide-react';
import { exportFullFinancialReport } from '../../utils/excelExport';

interface TopHeaderProps {
  onToggleSidebar: () => void;
  onOpenNewTransaction: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  onToggleSidebar,
  onOpenNewTransaction,
}) => {
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
    activeTab,
    setActiveTab,
    selectedBrandId,
    dateRange,
    setDateRange,
    notifications,
  } = useApp();

  if (!currentUser) return null;

  const isAdmin = currentUser.role === 'admin';

  // Find active brand name
  const activeBrand = brands.find((b) => b.id === selectedBrandId);
  const brandLabel = activeBrand ? activeBrand.name : 'Semua Brand';

  const unreadNotifCount = notifications.filter(
    (n) => (n.workspaceId === currentUser.workspaceId || (isAdmin && n.workspaceId === 'ws_admin')) && !n.isRead
  ).length;

  // Handle Quick Export
  const handleQuickExport = () => {
    let exportTxs = transactions;
    let exportAssets = assets;
    let wsName = currentWorkspace?.name || 'Transparansi Baliyoutevolution';

    if (!isAdmin) {
      exportTxs = transactions.filter((t) => t.workspaceId === currentUser.workspaceId);
      exportAssets = assets.filter((a) => a.workspaceId === currentUser.workspaceId);
      if (selectedBrandId !== 'all') {
        exportTxs = exportTxs.filter((t) => t.brandId === selectedBrandId);
      }
    }

    const rangeLabels = {
      this_month: 'Bulan Ini (Oktober 2026)',
      last_30_days: '30 Hari Terakhir',
      quarter: 'Kuartal Ini (Q4 2026)',
      year: 'Tahun 2026',
      all: 'Semua Periode',
    };

    exportFullFinancialReport({
      title: 'Laporan Keuangan BizFlow',
      workspaceName: wsName,
      brandName: brandLabel,
      dateRangeLabel: rangeLabels[dateRange],
      brands,
      transactions: exportTxs,
      assets: exportAssets,
      products: !isAdmin ? products.filter((p) => p.workspaceId === currentUser.workspaceId) : products,
      hppRecipes: !isAdmin ? hppRecipes.filter((h) => h.workspaceId === currentUser.workspaceId) : hppRecipes,
      commissions: !isAdmin ? commissions.filter((c) => c.workspaceId === currentUser.workspaceId) : commissions,
      marketing: !isAdmin ? marketing.filter((m) => m.workspaceId === currentUser.workspaceId) : marketing,
    });
  };

  // Human readable title per active tab
  const tabTitles: Record<string, string> = {
    dashboard: 'Dashboard Keuangan',
    transactions: 'Transaksi & Jurnal Kas',
    assets: 'Aset & Rekening Bank',
    products: 'Katalog Produk & Stok',
    hpp: 'Kalkulasi HPP & Margin',
    commissions: 'Pelacakan Komisi',
    worksheets: 'Lembar Kerja (Worksheet)',
    marketing: 'Performa Marketing & Ads',
    reports: 'Laporan & Statistik',
    notifications: 'Pusat Notifikasi',
    settings: 'Pengaturan & Konfigurasi Modul',
    profile: 'Profil Saya & Manajemen Brand',
    super_admin: 'Super Admin Console & Otorisasi',
    admin_transparency: 'Dashboard Transparansi Admin',
    admin_ika: 'Alur Kas Workspace Ika',
    admin_redi: 'Alur Kas Workspace Redi',
    admin_audit: 'Audit Log & Riwayat Akses',
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-purple-100/80 px-4 lg:px-8 py-3.5 transition-all">
      <div className="flex items-center justify-between gap-4">
        {/* Zone 1: Mobile toggle & Breadcrumb Trail */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onToggleSidebar}
            className="p-2 -ml-1 text-slate-600 hover:text-slate-900 lg:hidden rounded-lg hover:bg-purple-50 transition-colors"
            aria-label="Buka Menu Navigasi"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 text-xs text-slate-500 truncate font-medium">
            <span className="text-violet-900 font-bold hidden sm:inline">BizFlow</span>
            <span className="text-slate-300 hidden sm:inline">/</span>
            <span className="font-semibold text-slate-800 text-sm truncate">
              {tabTitles[activeTab] || 'Manajemen Bisnis'}
            </span>
            {!isAdmin && (
              <>
                <span className="text-slate-300">·</span>
                <span className="text-violet-600 bg-violet-50 font-semibold px-2 py-0.5 rounded text-[11px] truncate">
                  {brandLabel}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Zone 2: Date Filter Controls */}
        <div className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1 rounded-lg border border-slate-200/60 text-xs">
          <Calendar className="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-0.5" />
          <button
            onClick={() => setDateRange('this_month')}
            className={`px-2.5 py-1 rounded font-medium transition-colors whitespace-nowrap ${
              dateRange === 'this_month'
                ? 'bg-white text-violet-700 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Bulan Ini
          </button>
          <button
            onClick={() => setDateRange('last_30_days')}
            className={`px-2.5 py-1 rounded font-medium transition-colors whitespace-nowrap ${
              dateRange === 'last_30_days'
                ? 'bg-white text-violet-700 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            30 Hari
          </button>
          <button
            onClick={() => setDateRange('quarter')}
            className={`px-2.5 py-1 rounded font-medium transition-colors whitespace-nowrap ${
              dateRange === 'quarter'
                ? 'bg-white text-violet-700 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Kuartal
          </button>
          <button
            onClick={() => setDateRange('all')}
            className={`px-2.5 py-1 rounded font-medium transition-colors whitespace-nowrap ${
              dateRange === 'all'
                ? 'bg-white text-violet-700 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Semua
          </button>
        </div>

        {/* Zone 3: Notification & Primary Action */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Notifications Quick Icon */}
          <button
            onClick={() => setActiveTab('notifications')}
            className="relative p-2 text-slate-500 hover:text-violet-700 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
            title="Lihat Notifikasi"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-pink-500 rounded-full" />
            )}
          </button>

          {/* Quick Profile Button */}
          <button
            onClick={() => setActiveTab('profile')}
            className="flex items-center gap-1.5 p-1 rounded-lg hover:bg-purple-50 text-xs text-slate-700 transition-colors cursor-pointer"
            title="Buka Profil Saya & Brand"
          >
            {currentUser.avatarUrl ? (
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.name}
                className="w-7 h-7 rounded-lg object-cover ring-1 ring-purple-200"
              />
            ) : (
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs text-white ${
                  currentUser.role === 'super_admin'
                    ? 'bg-purple-600'
                    : currentUser.role === 'admin'
                    ? 'bg-amber-600'
                    : currentUser.role === 'ika'
                    ? 'bg-pink-600'
                    : 'bg-blue-600'
                }`}
              >
                {currentUser.name.charAt(0)}
              </div>
            )}
            <span className="hidden xl:inline font-semibold text-slate-800 text-xs max-w-[100px] truncate">
              {currentUser.name}
            </span>
          </button>

          {/* Quick Excel Export */}
          <button
            onClick={handleQuickExport}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-violet-700 transition-colors shadow-xs cursor-pointer"
            title="Download Spreadsheet Excel (.xlsx)"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span className="whitespace-nowrap">Ekspor Excel</span>
          </button>

          {/* Primary Action Button */}
          {isAdmin ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200/80 text-xs font-semibold">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span className="whitespace-nowrap">Read-Only</span>
            </div>
          ) : (
            <button
              onClick={onOpenNewTransaction}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition-all shadow-xs hover:shadow-sm whitespace-nowrap active:scale-98 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Transaksi Baru</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
