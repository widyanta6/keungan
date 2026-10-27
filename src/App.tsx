import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { TopHeader } from './components/layout/TopHeader';
import { LoginView } from './components/views/LoginView';
import { DashboardView } from './components/views/DashboardView';
import { TransactionsView } from './components/views/TransactionsView';
import { TransactionModal } from './components/views/TransactionModal';
import { OrdersView } from './components/views/OrdersView';
import { AssetsView } from './components/views/AssetsView';
import { ProductsView } from './components/views/ProductsView';
import { HppView } from './components/views/HppView';
import { CommissionsView } from './components/views/CommissionsView';
import { KOLManagementView } from './components/views/KOLManagementView';
import { KOLCommissionRecapView } from './components/views/KOLCommissionRecapView';
import { TeamTasksView } from './components/views/TeamTasksView';
import { PayrollView } from './components/views/PayrollView';
import { WorksheetView } from './components/views/WorksheetView';
import { MarketingView } from './components/views/MarketingView';
import { ReportsView } from './components/views/ReportsView';
import { NotificationsView } from './components/views/NotificationsView';
import { SettingsView } from './components/views/SettingsView';
import { AdminTransparencyView } from './components/views/AdminTransparencyView';
import { ProfileView } from './components/views/ProfileView';
import { SuperAdminView } from './components/views/SuperAdminView';
import { Transaction } from './types';

const MainAppContent: React.FC = () => {
  const { currentUser, activeTab } = useApp();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  if (!currentUser) {
    return <LoginView />;
  }

  const handleOpenNewTransaction = () => {
    setEditingTransaction(null);
    setIsTransactionModalOpen(true);
  };

  const handleEditTransaction = (tx: Transaction) => {
    setEditingTransaction(tx);
    setIsTransactionModalOpen(true);
  };

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView onOpenNewTransaction={handleOpenNewTransaction} />;
      case 'transactions':
        return (
          <TransactionsView
            onOpenNewTransaction={handleOpenNewTransaction}
            onEditTransaction={handleEditTransaction}
          />
        );
      case 'orders':
        return <OrdersView />;
      case 'assets':
        return <AssetsView />;
      case 'products':
        return <ProductsView />;
      case 'hpp':
        return <HppView />;
      case 'commissions':
        return <CommissionsView />;
      case 'kol':
        return <KOLManagementView />;
      case 'kol_recap':
        return <KOLCommissionRecapView />;
      case 'team_tasks':
        return <TeamTasksView />;
      case 'payroll':
        return <PayrollView />;
      case 'worksheets':
        return <WorksheetView />;
      case 'marketing':
        return <MarketingView />;
      case 'reports':
        return <ReportsView />;
      case 'notifications':
        return <NotificationsView />;
      case 'profile':
        return <ProfileView />;
      case 'super_admin':
        return <SuperAdminView />;
      case 'admin_transparency':
      case 'admin_ika':
      case 'admin_redi':
        return <AdminTransparencyView />;
      case 'admin_audit':
        return <SettingsView />;
      default:
        return <DashboardView onOpenNewTransaction={handleOpenNewTransaction} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F7FC] text-slate-800 flex">
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72 transition-all">
        {/* Top Header */}
        <TopHeader
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onOpenNewTransaction={handleOpenNewTransaction}
        />

        {/* View Viewport */}
        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">
          {renderActiveView()}
        </main>

        {/* Clean Footer */}
        <footer className="py-4 px-6 border-t border-purple-100 bg-white/50 text-center text-xs text-slate-400">
          <p>© 2026 BizFlow · Multi-Brand Business & Finance Management Platform</p>
        </footer>
      </div>

      {/* Shared Transaction Modal */}
      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        initialTransaction={editingTransaction}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
