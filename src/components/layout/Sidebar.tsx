import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  Receipt,
  WalletCards,
  Package,
  Calculator,
  BadgePercent,
  TableProperties,
  Megaphone,
  BarChart3,
  Bell,
  Settings,
  ShieldCheck,
  TrendingUp,
  History,
  LogOut,
  ChevronDown,
  Building2,
  Sparkles,
  ShoppingCart,
  Users,
  DollarSign,
  CheckSquare,
  Sliders,
  User,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const {
    currentUser,
    currentWorkspace,
    brands,
    activeTab,
    setActiveTab,
    selectedBrandId,
    setSelectedBrandId,
    notifications,
    logout,
    switchDemoAccount,
  } = useApp();

  if (!currentUser) return null;

  const isAdmin = currentUser.role === 'admin';
  const isSuperAdmin = currentUser.role === 'super_admin';

  // Allowed brands for current user with strict status check
  const userBrands = isSuperAdmin || isAdmin
    ? brands.filter((b) => b.status === 'active')
    : brands.filter((b) => {
        if (b.status !== 'active') return false;
        if (currentUser.allowedBrandIds?.includes(b.id)) return true;
        if (b.ownerUserId === currentUser.id) return true;
        if (b.workspaceId === currentUser.workspaceId) return true;
        return false;
      });

  const unreadNotifCount = notifications.filter(
    (n) => (n.workspaceId === currentUser.workspaceId || (isAdmin && n.workspaceId === 'ws_admin') || (isSuperAdmin && n.workspaceId === 'ws_superadmin')) && !n.isRead
  ).length;

  const activeModules = currentWorkspace?.activeModules || [];

  const handleNavClick = (tabKey: string) => {
    setActiveTab(tabKey);
    onClose();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#1B0E33] text-slate-100 flex flex-col border-r border-[#2D1B54] transition-transform duration-200 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Wordmark & Workspace Header */}
        <div className="p-5 border-b border-[#2D1B54]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center font-black text-white text-lg shadow-sm">
                B
              </div>
              <div>
                <h1 className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
                  BizFlow
                  <span className="text-[10px] uppercase tracking-wider font-semibold bg-violet-900/80 text-violet-300 px-1.5 py-0.5 rounded">
                    MVP
                  </span>
                </h1>
                <p className="text-xs text-violet-300/70 font-medium">Multi-Brand Finance</p>
              </div>
            </div>
          </div>

          {/* Active Workspace & Brand Picker */}
          {!isAdmin ? (
            <div className="mt-4 pt-3 border-t border-[#2D1B54]">
              <div className="flex items-center justify-between text-xs text-violet-300/80 mb-1.5 font-medium">
                <span>Filter Brand:</span>
                <span className="text-[11px] text-violet-400">{userBrands.length} Brand</span>
              </div>
              <div className="relative">
                <select
                  value={selectedBrandId}
                  onChange={(e) => setSelectedBrandId(e.target.value)}
                  className="w-full bg-[#27154A] border border-[#3E2472] text-xs text-white rounded-lg px-2.5 py-2 appearance-none focus:outline-none focus:ring-1 focus:ring-violet-400 font-medium cursor-pointer"
                >
                  <option value="all">Semua Brand Milik Saya</option>
                  {userBrands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.category})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-violet-300 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          ) : (
            <div className="mt-4 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
              <div className="flex items-center gap-1.5 font-semibold">
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Mode Transparansi</span>
              </div>
              <p className="mt-1 text-[11px] text-amber-200/80 leading-relaxed">
                Akses baca alur kas Ika & Redi. Mutasi data dinonaktifkan.
              </p>
            </div>
          )}
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 text-sm font-medium">
          {isAdmin ? (
            // Admin Navigation
            <div className="space-y-1">
              <div className="px-3 pb-2 text-[11px] uppercase tracking-wider font-semibold text-violet-400/80">
                Menu Transparansi
              </div>
              <button
                onClick={() => handleNavClick('admin_transparency')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                  activeTab === 'admin_transparency'
                    ? 'bg-violet-700/60 text-white font-semibold shadow-sm'
                    : 'text-violet-200/80 hover:bg-[#27154A] hover:text-white'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-violet-400 shrink-0" />
                <span className="truncate">Ringkasan Transparansi</span>
              </button>

              <button
                onClick={() => handleNavClick('admin_ika')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                  activeTab === 'admin_ika'
                    ? 'bg-violet-700/60 text-white font-semibold shadow-sm'
                    : 'text-violet-200/80 hover:bg-[#27154A] hover:text-white'
                }`}
              >
                <TrendingUp className="w-4 h-4 text-pink-400 shrink-0" />
                <span className="truncate">Alur Kas Ika (Tirama & CHEMI)</span>
              </button>

              <button
                onClick={() => handleNavClick('admin_redi')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                  activeTab === 'admin_redi'
                    ? 'bg-violet-700/60 text-white font-semibold shadow-sm'
                    : 'text-violet-200/80 hover:bg-[#27154A] hover:text-white'
                }`}
              >
                <TrendingUp className="w-4 h-4 text-sky-400 shrink-0" />
                <span className="truncate">Alur Kas Redi (BYE, MTM, PRM)</span>
              </button>

              <button
                onClick={() => handleNavClick('reports')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                  activeTab === 'reports'
                    ? 'bg-violet-700/60 text-white font-semibold shadow-sm'
                    : 'text-violet-200/80 hover:bg-[#27154A] hover:text-white'
                }`}
              >
                <BarChart3 className="w-4 h-4 text-violet-400 shrink-0" />
                <span className="truncate">Laporan & Ekspor Transparansi</span>
              </button>

              <button
                onClick={() => handleNavClick('admin_audit')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                  activeTab === 'admin_audit'
                    ? 'bg-violet-700/60 text-white font-semibold shadow-sm'
                    : 'text-violet-200/80 hover:bg-[#27154A] hover:text-white'
                }`}
              >
                <History className="w-4 h-4 text-violet-400 shrink-0" />
                <span className="truncate">Riwayat Akses & Audit</span>
              </button>

              <button
                onClick={() => handleNavClick('profile')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                  activeTab === 'profile'
                    ? 'bg-violet-700/60 text-white font-semibold shadow-sm'
                    : 'text-violet-200/80 hover:bg-[#27154A] hover:text-white'
                }`}
              >
                <User className="w-4 h-4 text-violet-400 shrink-0" />
                <span className="truncate">Profil Saya</span>
              </button>
            </div>
          ) : (
            // Client Navigation (Ika, Redi & Super Admin)
            <>
              {isSuperAdmin && (
                <div className="mb-3 pb-2 border-b border-[#2D1B54]">
                  <div className="px-3 pb-1.5 text-[11px] uppercase tracking-wider font-bold text-purple-300 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-purple-400" />
                    <span>Master Control</span>
                  </div>
                  <button
                    onClick={() => handleNavClick('super_admin')}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                      activeTab === 'super_admin'
                        ? 'bg-purple-700 text-white font-semibold shadow-sm'
                        : 'text-purple-200/90 hover:bg-[#27154A] hover:text-white'
                    }`}
                  >
                    <Sliders className="w-4 h-4 text-purple-400 shrink-0" />
                    <span className="truncate font-semibold">Super Admin Console</span>
                  </button>
                </div>
              )}

              <div className="px-3 pb-2 text-[11px] uppercase tracking-wider font-semibold text-violet-400/80">
                Keuangan Inti
              </div>
              <button
                onClick={() => handleNavClick('dashboard')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                  activeTab === 'dashboard'
                    ? 'bg-violet-700/60 text-white font-semibold shadow-sm'
                    : 'text-violet-200/80 hover:bg-[#27154A] hover:text-white'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-violet-400 shrink-0" />
                <span className="truncate">Dashboard</span>
              </button>

              <button
                onClick={() => handleNavClick('transactions')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                  activeTab === 'transactions'
                    ? 'bg-violet-700/60 text-white font-semibold shadow-sm'
                    : 'text-violet-200/80 hover:bg-[#27154A] hover:text-white'
                }`}
              >
                <Receipt className="w-4 h-4 text-violet-400 shrink-0" />
                <span className="truncate">Transaksi Keuangan</span>
              </button>

              <button
                onClick={() => handleNavClick('orders')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                  activeTab === 'orders'
                    ? 'bg-violet-700/60 text-white font-semibold shadow-sm'
                    : 'text-violet-200/80 hover:bg-[#27154A] hover:text-white'
                }`}
              >
                <ShoppingCart className="w-4 h-4 text-violet-400 shrink-0" />
                <span className="truncate">Pesanan & Atribusi</span>
              </button>

              <button
                onClick={() => handleNavClick('assets')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                  activeTab === 'assets'
                    ? 'bg-violet-700/60 text-white font-semibold shadow-sm'
                    : 'text-violet-200/80 hover:bg-[#27154A] hover:text-white'
                }`}
              >
                <WalletCards className="w-4 h-4 text-violet-400 shrink-0" />
                <span className="truncate">Aset & Sumber Dana</span>
              </button>

              <button
                onClick={() => handleNavClick('products')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                  activeTab === 'products'
                    ? 'bg-violet-700/60 text-white font-semibold shadow-sm'
                    : 'text-violet-200/80 hover:bg-[#27154A] hover:text-white'
                }`}
              >
                <Package className="w-4 h-4 text-violet-400 shrink-0" />
                <span className="truncate">Produk & Layanan</span>
              </button>

              {/* Dynamic Modules based on activeModules */}
              <div className="pt-4 px-3 pb-2 text-[11px] uppercase tracking-wider font-semibold text-violet-400/80">
                Modul Kolaborasi & Tim
              </div>

              <button
                onClick={() => handleNavClick('kol')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                  activeTab === 'kol'
                    ? 'bg-violet-700/60 text-white font-semibold shadow-sm'
                    : 'text-violet-200/80 hover:bg-[#27154A] hover:text-white'
                }`}
              >
                <Sparkles className="w-4 h-4 text-violet-400 shrink-0" />
                <span className="truncate">Database KOL & Partner</span>
              </button>

              <button
                onClick={() => handleNavClick('kol_recap')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                  activeTab === 'kol_recap'
                    ? 'bg-violet-700/60 text-white font-semibold shadow-sm'
                    : 'text-violet-200/80 hover:bg-[#27154A] hover:text-white'
                }`}
              >
                <BadgePercent className="w-4 h-4 text-violet-400 shrink-0" />
                <span className="truncate">Rekap Komisi KOL</span>
              </button>

              <button
                onClick={() => handleNavClick('team_tasks')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                  activeTab === 'team_tasks'
                    ? 'bg-violet-700/60 text-white font-semibold shadow-sm'
                    : 'text-violet-200/80 hover:bg-[#27154A] hover:text-white'
                }`}
              >
                <Users className="w-4 h-4 text-violet-400 shrink-0" />
                <span className="truncate">Tim & Pembagian Tugas</span>
              </button>

              <button
                onClick={() => handleNavClick('payroll')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                  activeTab === 'payroll'
                    ? 'bg-violet-700/60 text-white font-semibold shadow-sm'
                    : 'text-violet-200/80 hover:bg-[#27154A] hover:text-white'
                }`}
              >
                <DollarSign className="w-4 h-4 text-violet-400 shrink-0" />
                <span className="truncate">Payroll & Honorarium</span>
              </button>

              <div className="pt-4 px-3 pb-2 text-[11px] uppercase tracking-wider font-semibold text-violet-400/80">
                Tracking & Analisis
              </div>

              {activeModules.includes('worksheet') && (
                <button
                  onClick={() => handleNavClick('worksheets')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                    activeTab === 'worksheets'
                      ? 'bg-violet-700/60 text-white font-semibold shadow-sm'
                      : 'text-violet-200/80 hover:bg-[#27154A] hover:text-white'
                  }`}
                >
                  <TableProperties className="w-4 h-4 text-violet-400 shrink-0" />
                  <span className="truncate">Lembar Kerja (Worksheet)</span>
                </button>
              )}

              {activeModules.includes('hpp') && (
                <button
                  onClick={() => handleNavClick('hpp')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                    activeTab === 'hpp'
                      ? 'bg-violet-700/60 text-white font-semibold shadow-sm'
                      : 'text-violet-200/80 hover:bg-[#27154A] hover:text-white'
                  }`}
                >
                  <Calculator className="w-4 h-4 text-violet-400 shrink-0" />
                  <span className="truncate">HPP & Resep Biaya</span>
                </button>
              )}

              {activeModules.includes('commission') && (
                <button
                  onClick={() => handleNavClick('commissions')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                    activeTab === 'commissions'
                      ? 'bg-violet-700/60 text-white font-semibold shadow-sm'
                      : 'text-violet-200/80 hover:bg-[#27154A] hover:text-white'
                  }`}
                >
                  <BadgePercent className="w-4 h-4 text-violet-400 shrink-0" />
                  <span className="truncate">Pelacakan Komisi Lama</span>
                </button>
              )}

              {activeModules.includes('marketing') && (
                <button
                  onClick={() => handleNavClick('marketing')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                    activeTab === 'marketing'
                      ? 'bg-violet-700/60 text-white font-semibold shadow-sm'
                      : 'text-violet-200/80 hover:bg-[#27154A] hover:text-white'
                  }`}
                >
                  <Megaphone className="w-4 h-4 text-violet-400 shrink-0" />
                  <span className="truncate">Marketing & Kampanye</span>
                </button>
              )}

              <div className="pt-4 px-3 pb-2 text-[11px] uppercase tracking-wider font-semibold text-violet-400/80">
                Laporan & Sistem
              </div>

              <button
                onClick={() => handleNavClick('reports')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                  activeTab === 'reports'
                    ? 'bg-violet-700/60 text-white font-semibold shadow-sm'
                    : 'text-violet-200/80 hover:bg-[#27154A] hover:text-white'
                }`}
              >
                <BarChart3 className="w-4 h-4 text-violet-400 shrink-0" />
                <span className="truncate">Laporan & Ekspor Excel</span>
              </button>

              <button
                onClick={() => handleNavClick('notifications')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-colors ${
                  activeTab === 'notifications'
                    ? 'bg-violet-700/60 text-white font-semibold shadow-sm'
                    : 'text-violet-200/80 hover:bg-[#27154A] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <Bell className="w-4 h-4 text-violet-400 shrink-0" />
                  <span className="truncate">Notifikasi</span>
                </div>
                {unreadNotifCount > 0 && (
                  <span className="bg-pink-500 text-white text-[11px] font-bold px-1.5 py-0.2 rounded-full tabular-nums">
                    {unreadNotifCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => handleNavClick('settings')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                  activeTab === 'settings'
                    ? 'bg-violet-700/60 text-white font-semibold shadow-sm'
                    : 'text-violet-200/80 hover:bg-[#27154A] hover:text-white'
                }`}
              >
                <Settings className="w-4 h-4 text-violet-400 shrink-0" />
                <span className="truncate">Pengaturan & Modul</span>
              </button>

              <button
                onClick={() => handleNavClick('profile')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                  activeTab === 'profile'
                    ? 'bg-violet-700/60 text-white font-semibold shadow-sm'
                    : 'text-violet-200/80 hover:bg-[#27154A] hover:text-white'
                }`}
              >
                <User className="w-4 h-4 text-violet-400 shrink-0" />
                <span className="truncate">Profil Saya & Brand</span>
              </button>
            </>
          )}
        </nav>

        {/* User Profile & Demo Switcher in Footer */}
        <div className="p-3 border-t border-[#2D1B54] bg-[#140A28] space-y-2">
          {/* Quick Demo Switcher */}
          <div className="px-2 py-1 text-[11px] text-violet-300/70 flex items-center justify-between font-medium">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-violet-400" />
              Ganti Akun Demo:
            </span>
          </div>
          <div className="grid grid-cols-4 gap-1 px-1">
            <button
              onClick={() => switchDemoAccount('super_admin')}
              className={`px-1.5 py-1.5 text-xs rounded font-medium transition-colors text-center ${
                currentUser.role === 'super_admin'
                  ? 'bg-purple-600 text-white font-bold'
                  : 'bg-[#27154A] text-purple-300 hover:text-white hover:bg-[#341C61]'
              }`}
              title="Super Admin BizFlow"
            >
              Super
            </button>
            <button
              onClick={() => switchDemoAccount('ika')}
              className={`px-1.5 py-1.5 text-xs rounded font-medium transition-colors text-center ${
                currentUser.role === 'ika'
                  ? 'bg-violet-600 text-white font-bold'
                  : 'bg-[#27154A] text-violet-300 hover:text-white hover:bg-[#341C61]'
              }`}
              title="Ika (Tirama & CHEMI)"
            >
              Ika
            </button>
            <button
              onClick={() => switchDemoAccount('redi')}
              className={`px-1.5 py-1.5 text-xs rounded font-medium transition-colors text-center ${
                currentUser.role === 'redi'
                  ? 'bg-violet-600 text-white font-bold'
                  : 'bg-[#27154A] text-violet-300 hover:text-white hover:bg-[#341C61]'
              }`}
              title="Redi (BYE, Metamorph, Presta Media)"
            >
              Redi
            </button>
            <button
              onClick={() => switchDemoAccount('admin')}
              className={`px-1.5 py-1.5 text-xs rounded font-medium transition-colors text-center ${
                currentUser.role === 'admin'
                  ? 'bg-amber-600 text-white font-bold'
                  : 'bg-[#27154A] text-violet-300 hover:text-white hover:bg-[#341C61]'
              }`}
              title="Admin Baliyoutevolution (Read-Only Transparansi)"
            >
              Admin
            </button>
          </div>

          {/* Current User Card */}
          <div className="flex items-center justify-between p-2 rounded-lg bg-[#221242] mt-2">
            <button
              onClick={() => handleNavClick('profile')}
              className="flex items-center gap-2.5 min-w-0 text-left hover:opacity-90 transition-opacity cursor-pointer flex-1"
              title="Buka Halaman Profil Saya"
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs text-white shrink-0 ${
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
              <div className="truncate">
                <p className="text-xs font-semibold text-white truncate">{currentUser.name}</p>
                <p className="text-[10px] text-violet-300/70 truncate">{currentUser.email}</p>
              </div>
            </button>
            <button
              onClick={logout}
              title="Keluar / Logout"
              className="p-1.5 text-violet-300 hover:text-white hover:bg-violet-800/40 rounded transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
