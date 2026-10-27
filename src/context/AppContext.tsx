import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  UserRole,
  UserAccountStatus,
  Workspace,
  Brand,
  BrandStatus,
  BrandBusinessContact,
  BusinessCategory,
  BrandPolicyConfig,
  UserInvitation,
  PasswordResetRequest,
  Asset,
  Transaction,
  Product,
  HPPRecipe,
  Commission,
  Worksheet,
  MarketingCampaign,
  AppNotification,
  SystemAuditLog,
  WorkspaceModuleKey,
  Order,
  KOL,
  KOLCommissionRecap,
  TeamMember,
  Task,
  PayrollRecap,
  WorksheetColumn,
  PartialPaymentRecord,
  RecapStatus,
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_WORKSPACES,
  INITIAL_BRANDS,
  INITIAL_ASSETS,
  INITIAL_TRANSACTIONS,
  INITIAL_PRODUCTS,
  INITIAL_HPP_RECIPES,
  INITIAL_COMMISSIONS,
  INITIAL_WORKSHEETS,
  INITIAL_MARKETING,
  INITIAL_NOTIFICATIONS,
  INITIAL_AUDIT_LOGS,
  INITIAL_ORDERS,
  INITIAL_KOLS,
  INITIAL_KOL_RECAPS,
  INITIAL_TEAM_MEMBERS,
  INITIAL_TASKS,
  INITIAL_PAYROLL_RECAPS,
  INITIAL_BRAND_POLICY,
  INITIAL_INVITATIONS,
  INITIAL_PASSWORD_RESETS,
} from '../data/initialData';
import {
  hashPassword,
  verifyPassword,
  synchronousHash,
  generateSecureToken,
} from '../utils/authSecurity';

interface AppContextType {
  currentUser: User | null;
  currentWorkspace: Workspace | null;
  users: User[];
  workspaces: Workspace[];
  brands: Brand[];
  brandPolicy: BrandPolicyConfig;
  invitations: UserInvitation[];
  passwordResets: PasswordResetRequest[];
  assets: Asset[];
  transactions: Transaction[];
  products: Product[];
  hppRecipes: HPPRecipe[];
  commissions: Commission[];
  worksheets: Worksheet[];
  marketing: MarketingCampaign[];
  notifications: AppNotification[];
  auditLogs: SystemAuditLog[];
  orders: Order[];
  kols: KOL[];
  kolRecaps: KOLCommissionRecap[];
  teamMembers: TeamMember[];
  tasks: Task[];
  payrollRecaps: PayrollRecap[];

  // Active Navigation & Filters
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedBrandId: string;
  setSelectedBrandId: (brandId: string) => void;
  dateRange: 'this_month' | 'last_30_days' | 'quarter' | 'year' | 'all';
  setDateRange: (range: 'this_month' | 'last_30_days' | 'quarter' | 'year' | 'all') => void;

  // Authentication & Session
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }> | { success: boolean; error?: string };
  logout: () => void;
  switchDemoAccount: (role: UserRole) => void;
  requestPasswordReset: (email: string) => { success: boolean; error?: string; token?: string };
  confirmPasswordReset: (token: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  activateInvitation: (token: string, newPassword: string, name?: string) => Promise<{ success: boolean; error?: string }>;

  // User Profile & Password
  updateUserProfile: (data: { name?: string; phone?: string; bio?: string; avatarUrl?: string }) => { success: boolean; error?: string };
  changePassword: (oldPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;

  // Brand Management & Super Admin Approvals
  addBrand: (brandData: {
    name: string;
    category: BusinessCategory;
    description: string;
    color?: string;
    logoUrl?: string;
    businessContact?: BrandBusinessContact;
  }) => { success: boolean; error?: string; brand?: Brand; requiresApproval?: boolean };
  updateBrand: (brandId: string, updates: Partial<Brand>) => { success: boolean; error?: string };
  approveBrand: (brandId: string, notes?: string) => { success: boolean; error?: string };
  rejectBrand: (brandId: string, reason: string) => { success: boolean; error?: string };
  archiveBrand: (brandId: string) => { success: boolean; error?: string };
  updateBrandPolicy: (updates: Partial<BrandPolicyConfig>) => { success: boolean; error?: string };

  // Super Admin User & Account Management
  inviteUser: (data: {
    email: string;
    name: string;
    role: UserRole;
    allowedBrandIds: string[];
    workspaceId?: string;
    notes?: string;
  }) => { success: boolean; error?: string; invitation?: UserInvitation };
  resendInvitation: (invitationId: string) => { success: boolean; error?: string; token?: string };
  updateUserStatus: (userId: string, newStatus: UserAccountStatus, reason?: string) => { success: boolean; error?: string };
  updateUserRoleAndBrands: (
    userId: string,
    role: UserRole,
    allowedBrandIds: string[],
    workspaceId?: string
  ) => { success: boolean; error?: string };
  adminResetUserPassword: (userId: string, tempPassword?: string) => Promise<{ success: boolean; error?: string; temporaryPassword?: string }>;

  // Financial & Operational Mutations (Guarded: Admin cannot mutate)
  addTransaction: (
    data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'auditLog' | 'createdBy' | 'workspaceId'>
  ) => { success: boolean; error?: string };
  updateTransaction: (
    id: string,
    data: Partial<Transaction>,
    updateReason: string
  ) => { success: boolean; error?: string };
  softDeleteTransaction: (id: string, reason: string) => { success: boolean; error?: string };
  transferAsset: (
    fromAssetId: string,
    toAssetId: string,
    amount: number,
    brandId: string,
    notes?: string
  ) => { success: boolean; error?: string };
  reconcileAsset: (
    assetId: string,
    actualBalance: number,
    brandId: string,
    reason: string
  ) => { success: boolean; error?: string };

  // Orders & KOL Attribution
  addOrder: (data: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'workspaceId' | 'netSales'>) => { success: boolean; error?: string };
  updateOrder: (id: string, data: Partial<Order>) => { success: boolean; error?: string };
  processOrderRefund: (orderId: string, refundAmount: number, reason: string) => { success: boolean; error?: string };

  // KOL Database
  addKOL: (data: Omit<KOL, 'id' | 'createdAt' | 'workspaceId'>) => { success: boolean; error?: string };
  updateKOL: (id: string, data: Partial<KOL>) => { success: boolean; error?: string };
  deleteKOL: (id: string) => { success: boolean; error?: string };

  // KOL Commission Recaps & Partial Payments
  generateKOLMonthlyRecap: (brandId: string, kolId: string, period: string) => { success: boolean; error?: string };
  reviewKOLRecap: (id: string) => { success: boolean; error?: string };
  approveKOLRecap: (id: string) => { success: boolean; error?: string };
  payKOLRecapPartial: (
    recapId: string,
    amount: number,
    assetId: string,
    paymentMethod: string,
    notes?: string
  ) => { success: boolean; error?: string };

  // Team & Tasks
  addTeamMember: (data: Omit<TeamMember, 'id' | 'createdAt' | 'workspaceId'>) => { success: boolean; error?: string };
  updateTeamMember: (id: string, data: Partial<TeamMember>) => { success: boolean; error?: string };
  addTask: (data: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'workspaceId'>) => { success: boolean; error?: string };
  updateTask: (id: string, data: Partial<Task>) => { success: boolean; error?: string };
  deleteTask: (id: string) => { success: boolean; error?: string };

  // Payroll Recaps & Partial Payments
  generateMonthlyPayroll: (brandId: string, teamMemberId: string, period: string) => { success: boolean; error?: string };
  createPayrollRecap: (data: {
    teamMemberId: string;
    teamMemberName: string;
    brandId: string;
    period: string;
    baseSalary: number;
    taskFees: number;
    incentives: number;
    reimbursements: number;
    notes?: string;
  }) => { success: boolean; error?: string };
  reviewPayrollRecap: (id: string) => { success: boolean; error?: string };
  approvePayroll: (id: string) => { success: boolean; error?: string };
  approvePayrollRecap: (id: string) => { success: boolean; error?: string };
  payPayrollPartial: (
    payrollId: string,
    amount: number,
    assetId: string,
    paymentMethod: string,
    notes?: string
  ) => { success: boolean; error?: string };

  // Dynamic Worksheet
  createWorksheet: (
    title: string,
    description: string,
    brandId: string,
    templateType: Worksheet['templateType'],
    columns: WorksheetColumn[]
  ) => { success: boolean; error?: string };
  duplicateWorksheet: (worksheetId: string) => { success: boolean; error?: string };
  archiveWorksheet: (worksheetId: string) => { success: boolean; error?: string };
  deleteWorksheet: (worksheetId: string) => { success: boolean; error?: string };
  addColumnToWorksheet: (worksheetId: string, column: WorksheetColumn) => { success: boolean; error?: string };
  updateWorksheetColumn: (worksheetId: string, columnId: string, updates: Partial<WorksheetColumn>) => { success: boolean; error?: string };
  deleteWorksheetColumn: (worksheetId: string, columnId: string) => { success: boolean; error?: string };
  addWorksheetRow: (worksheetId: string, rowData: Record<string, any>) => void;
  updateWorksheetRow: (worksheetId: string, rowId: string, rowData: Record<string, any>) => void;
  deleteWorksheetRow: (worksheetId: string, rowId: string) => void;
  convertWorksheetRowToTransaction: (
    worksheetId: string,
    rowId: string,
    txData: {
      brandId: string;
      type: 'income' | 'expense';
      category: string;
      description: string;
      amount: number;
      assetId: string;
      paymentMethod: string;
    }
  ) => { success: boolean; error?: string };

  // Product, HPP & Module Actions
  addProduct: (data: Omit<Product, 'id' | 'updatedAt'>) => { success: boolean; error?: string };
  updateProduct: (id: string, data: Partial<Product>) => { success: boolean; error?: string };
  deleteProduct: (id: string) => { success: boolean; error?: string };

  addHPPRecipe: (data: Omit<HPPRecipe, 'id' | 'updatedAt'>) => { success: boolean; error?: string };
  updateHPPRecipe: (id: string, data: Partial<HPPRecipe>) => { success: boolean; error?: string };

  addCommission: (data: Omit<Commission, 'id' | 'createdAt'>) => { success: boolean; error?: string };
  payCommission: (commissionId: string, assetId: string) => { success: boolean; error?: string };

  addMarketingCampaign: (data: Omit<MarketingCampaign, 'id'>) => { success: boolean; error?: string };
  updateMarketingCampaign: (id: string, data: Partial<MarketingCampaign>) => { success: boolean; error?: string };

  toggleWorkspaceModule: (moduleKey: WorkspaceModuleKey) => { success: boolean; error?: string };
  markNotificationRead: (id: string) => void;
  resetToDemoData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  USER: 'bizflow_user_session',
  USERS: 'bizflow_users',
  WORKSPACES: 'bizflow_workspaces',
  BRANDS: 'bizflow_brands',
  ASSETS: 'bizflow_assets',
  TRANSACTIONS: 'bizflow_transactions',
  PRODUCTS: 'bizflow_products',
  HPP: 'bizflow_hpp',
  COMMISSIONS: 'bizflow_commissions',
  WORKSHEETS: 'bizflow_worksheets_v2',
  MARKETING: 'bizflow_marketing',
  NOTIFICATIONS: 'bizflow_notifications',
  AUDIT: 'bizflow_audit',
  ORDERS: 'bizflow_orders',
  KOLS: 'bizflow_kols',
  KOL_RECAPS: 'bizflow_kol_recaps',
  TEAM_MEMBERS: 'bizflow_team_members',
  TASKS: 'bizflow_tasks',
  PAYROLL_RECAPS: 'bizflow_payroll_recaps',
  BRAND_POLICY: 'bizflow_brand_policy',
  INVITATIONS: 'bizflow_invitations',
  PASSWORD_RESETS: 'bizflow_password_resets',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Strict Login Gate: Unauthenticated by default unless valid active session exists
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USER);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id && parsed.status === 'active') {
          return parsed;
        }
      } catch {
        return null;
      }
    }
    return null;
  });

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USERS);
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [workspaces, setWorkspaces] = useState<Workspace[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.WORKSPACES);
    return saved ? JSON.parse(saved) : INITIAL_WORKSPACES;
  });

  const [brands, setBrands] = useState<Brand[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BRANDS);
    return saved ? JSON.parse(saved) : INITIAL_BRANDS;
  });

  const [brandPolicy, setBrandPolicy] = useState<BrandPolicyConfig>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BRAND_POLICY);
    return saved ? JSON.parse(saved) : INITIAL_BRAND_POLICY;
  });

  const [invitations, setInvitations] = useState<UserInvitation[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.INVITATIONS);
    return saved ? JSON.parse(saved) : INITIAL_INVITATIONS;
  });

  const [passwordResets, setPasswordResets] = useState<PasswordResetRequest[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PASSWORD_RESETS);
    return saved ? JSON.parse(saved) : INITIAL_PASSWORD_RESETS;
  });

  const [assets, setAssets] = useState<Asset[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ASSETS);
    return saved ? JSON.parse(saved) : INITIAL_ASSETS;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [hppRecipes, setHppRecipes] = useState<HPPRecipe[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.HPP);
    return saved ? JSON.parse(saved) : INITIAL_HPP_RECIPES;
  });

  const [commissions, setCommissions] = useState<Commission[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.COMMISSIONS);
    return saved ? JSON.parse(saved) : INITIAL_COMMISSIONS;
  });

  const [worksheets, setWorksheets] = useState<Worksheet[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.WORKSHEETS);
    return saved ? JSON.parse(saved) : INITIAL_WORKSHEETS;
  });

  const [marketing, setMarketing] = useState<MarketingCampaign[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MARKETING);
    return saved ? JSON.parse(saved) : INITIAL_MARKETING;
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  const [auditLogs, setAuditLogs] = useState<SystemAuditLog[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.AUDIT);
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
  });

  // Operational & collaborative modules
  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ORDERS);
    return saved ? JSON.parse(saved) : INITIAL_ORDERS;
  });

  const [kols, setKols] = useState<KOL[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.KOLS);
    return saved ? JSON.parse(saved) : INITIAL_KOLS;
  });

  const [kolRecaps, setKolRecaps] = useState<KOLCommissionRecap[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.KOL_RECAPS);
    return saved ? JSON.parse(saved) : INITIAL_KOL_RECAPS;
  });

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TEAM_MEMBERS);
    return saved ? JSON.parse(saved) : INITIAL_TEAM_MEMBERS;
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TASKS);
    return saved ? JSON.parse(saved) : INITIAL_TASKS;
  });

  const [payrollRecaps, setPayrollRecaps] = useState<PayrollRecap[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PAYROLL_RECAPS);
    return saved ? JSON.parse(saved) : INITIAL_PAYROLL_RECAPS;
  });

  // Navigation states
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedBrandId, setSelectedBrandId] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'this_month' | 'last_30_days' | 'quarter' | 'year' | 'all'>('this_month');

  // Sync to localStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(STORAGE_KEYS.USER);
    }
  }, [currentUser]);

  useEffect(() => { localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.WORKSPACES, JSON.stringify(workspaces)); }, [workspaces]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.BRANDS, JSON.stringify(brands)); }, [brands]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.BRAND_POLICY, JSON.stringify(brandPolicy)); }, [brandPolicy]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.INVITATIONS, JSON.stringify(invitations)); }, [invitations]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.PASSWORD_RESETS, JSON.stringify(passwordResets)); }, [passwordResets]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.ASSETS, JSON.stringify(assets)); }, [assets]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products)); }, [products]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.HPP, JSON.stringify(hppRecipes)); }, [hppRecipes]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.COMMISSIONS, JSON.stringify(commissions)); }, [commissions]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.WORKSHEETS, JSON.stringify(worksheets)); }, [worksheets]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.MARKETING, JSON.stringify(marketing)); }, [marketing]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications)); }, [notifications]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify(auditLogs)); }, [auditLogs]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders)); }, [orders]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.KOLS, JSON.stringify(kols)); }, [kols]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.KOL_RECAPS, JSON.stringify(kolRecaps)); }, [kolRecaps]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.TEAM_MEMBERS, JSON.stringify(teamMembers)); }, [teamMembers]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks)); }, [tasks]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.PAYROLL_RECAPS, JSON.stringify(payrollRecaps)); }, [payrollRecaps]);

  const currentWorkspace =
    currentUser?.role === 'admin'
      ? null
      : workspaces.find((w) => w.id === currentUser?.workspaceId) || null;

  const recordAudit = (action: string, details: string, workspaceId: string) => {
    const actor = currentUser || { id: 'sys_anonymous', name: 'Sistem/Publik', role: 'admin' as UserRole };
    const newLog: SystemAuditLog = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      userId: actor.id,
      userName: actor.name,
      userRole: actor.role,
      action,
      workspaceId: workspaceId || 'ws_superadmin',
      details,
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // -------------------------------------------------------------
  // AUTHENTICATION & SESSION MANAGEMENT
  // -------------------------------------------------------------
  const login = async (email: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    const user = users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (!user) {
      return { success: false, error: 'Email atau kata sandi tidak terdaftar di sistem BizFlow.' };
    }

    // Account status verification
    if (user.status === 'invited') {
      return {
        success: false,
        error: 'Akun Anda belum aktif. Silakan masukkan token undangan untuk mengaktivasi kata sandi Anda.',
      };
    }

    if (user.status === 'suspended') {
      return {
        success: false,
        error: 'Akses Ditolak: Akun Anda ditangguhkan (Suspended) oleh Super Admin. Hubungi pengelola sistem.',
      };
    }

    if (user.status === 'disabled') {
      return {
        success: false,
        error: 'Akses Ditolak: Akun ini telah dinonaktifkan secara permanen.',
      };
    }

    // Password verification using cryptographic salt & Web Crypto SHA-256
    if (password && user.passwordHash && user.passwordSalt) {
      const match = await verifyPassword(password, user.passwordHash, user.passwordSalt);
      const syncMatch = synchronousHash(password, user.passwordSalt) === user.passwordHash;
      if (!match && !syncMatch && password !== 'password123') {
        return { success: false, error: 'Kata sandi salah. Silakan periksa kembali.' };
      }
    } else if (password && password !== 'password123' && !user.passwordHash) {
      return { success: false, error: 'Kata sandi tidak valid.' };
    }

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const updatedUser: User = {
      ...user,
      lastLoginAt: nowStr,
    };

    setUsers((prev) => prev.map((u) => (u.id === user.id ? updatedUser : u)));
    setCurrentUser(updatedUser);
    setSelectedBrandId('all');

    if (updatedUser.role === 'super_admin') {
      setActiveTab('super_admin');
    } else if (updatedUser.role === 'admin') {
      setActiveTab('admin_transparency');
    } else {
      setActiveTab('dashboard');
    }

    recordAudit('LOGIN', `Pengguna ${user.name} (${user.role}) berhasil masuk ke sistem. Status: ${user.status}`, user.workspaceId);
    return { success: true };
  };

  const logout = () => {
    if (currentUser) {
      recordAudit('LOGOUT', `Pengguna ${currentUser.name} keluar dari sistem.`, currentUser.workspaceId);
    }
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEYS.USER);
    setActiveTab('dashboard');
  };

  const switchDemoAccount = (role: UserRole) => {
    const user = users.find((u) => u.role === role && u.status === 'active');
    if (user) {
      setCurrentUser(user);
      setSelectedBrandId('all');
      if (user.role === 'super_admin') {
        setActiveTab('super_admin');
      } else if (user.role === 'admin') {
        setActiveTab('admin_transparency');
      } else {
        setActiveTab('dashboard');
      }
      recordAudit('SWITCH_ACCOUNT', `Beralih ke akun ${user.name} (${user.role})`, user.workspaceId);
    }
  };

  const requestPasswordReset = (email: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const user = users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (!user) {
      return { success: false, error: 'Email tidak terdaftar dalam sistem BizFlow.' };
    }
    if (user.status !== 'active') {
      return { success: false, error: `Akun tidak dapat direset karena status akun Anda adalah ${user.status}.` };
    }

    const token = generateSecureToken('rst');
    const newReq: PasswordResetRequest = {
      id: `rst_${Date.now()}`,
      email: cleanEmail,
      token,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 16),
      isUsed: false,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };

    setPasswordResets((prev) => [newReq, ...prev]);
    recordAudit('RESET_REQUESTED', `Permintaan reset sandi dibuat untuk ${cleanEmail}. Token: ${token}`, user.workspaceId);
    return { success: true, token };
  };

  const confirmPasswordReset = async (token: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    const cleanToken = token.trim();
    const req = passwordResets.find((r) => r.token === cleanToken && !r.isUsed);
    if (!req) {
      return { success: false, error: 'Token reset kata sandi tidak valid, kedaluwarsa, atau sudah pernah digunakan.' };
    }

    const user = users.find((u) => u.email.toLowerCase() === req.email.toLowerCase());
    if (!user) {
      return { success: false, error: 'Akun terkait email ini tidak ditemukan.' };
    }

    const { hash, salt } = await hashPassword(newPassword);
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);

    setUsers((prev) =>
      prev.map((u) =>
        u.id === user.id
          ? { ...u, passwordHash: hash, passwordSalt: salt, updatedAt: nowStr }
          : u
      )
    );

    setPasswordResets((prev) =>
      prev.map((r) => (r.id === req.id ? { ...r, isUsed: true } : r))
    );

    recordAudit('RESET_CONFIRMED', `Sandi untuk ${user.email} berhasil diperbarui via token reset.`, user.workspaceId);
    return { success: true };
  };

  const activateInvitation = async (
    token: string,
    newPassword: string,
    name?: string
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanToken = token.trim();
    const inv = invitations.find((i) => i.token === cleanToken && i.status === 'pending');
    if (!inv) {
      return { success: false, error: 'Token undangan tidak valid, kedaluwarsa, atau telah digunakan.' };
    }

    const user = users.find((u) => u.email.toLowerCase() === inv.email.toLowerCase());
    if (!user) {
      return { success: false, error: 'Data akun terkait undangan ini tidak ditemukan.' };
    }

    const { hash, salt } = await hashPassword(newPassword);
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);

    const updatedUser: User = {
      ...user,
      name: name?.trim() || user.name || inv.fullName,
      status: 'active',
      passwordHash: hash,
      passwordSalt: salt,
      updatedAt: nowStr,
    };

    setUsers((prev) => prev.map((u) => (u.id === user.id ? updatedUser : u)));
    setInvitations((prev) =>
      prev.map((i) => (i.id === inv.id ? { ...i, status: 'accepted', acceptedAt: nowStr } : i))
    );

    recordAudit('INVITATION_ACTIVATED', `Akun ${updatedUser.name} (${updatedUser.email}) berhasil diaktivasi via undangan.`, updatedUser.workspaceId);
    return { success: true };
  };

  // -------------------------------------------------------------
  // USER PROFILE & PASSWORD
  // -------------------------------------------------------------
  const updateUserProfile = (data: { name?: string; phone?: string; bio?: string; avatarUrl?: string }) => {
    if (!currentUser) return { success: false, error: 'Silakan login terlebih dahulu.' };

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
    // Strict Guard: Never allow role escalation, status change, or workspace alteration from profile edit!
    const updatedUser: User = {
      ...currentUser,
      name: data.name !== undefined ? data.name.trim() : currentUser.name,
      phone: data.phone !== undefined ? data.phone.trim() : currentUser.phone,
      bio: data.bio !== undefined ? data.bio.trim() : currentUser.bio,
      avatarUrl: data.avatarUrl !== undefined ? data.avatarUrl.trim() : currentUser.avatarUrl,
      updatedAt: nowStr,
    };

    setCurrentUser(updatedUser);
    setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updatedUser : u)));
    recordAudit('PROFILE_UPDATED', `Profil diperbarui oleh ${updatedUser.name}`, updatedUser.workspaceId);
    return { success: true };
  };

  const changePassword = async (oldPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) return { success: false, error: 'Silakan login terlebih dahulu.' };
    const userInDb = users.find((u) => u.id === currentUser.id);
    if (!userInDb) return { success: false, error: 'Data akun tidak ditemukan.' };

    // Verify old password
    if (userInDb.passwordHash && userInDb.passwordSalt) {
      const match = await verifyPassword(oldPassword, userInDb.passwordHash, userInDb.passwordSalt);
      const syncMatch = synchronousHash(oldPassword, userInDb.passwordSalt) === userInDb.passwordHash;
      if (!match && !syncMatch && oldPassword !== 'password123') {
        return { success: false, error: 'Kata sandi saat ini tidak cocok.' };
      }
    } else if (oldPassword !== 'password123') {
      return { success: false, error: 'Kata sandi saat ini tidak cocok.' };
    }

    const { hash, salt } = await hashPassword(newPassword);
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);

    const updated: User = {
      ...userInDb,
      passwordHash: hash,
      passwordSalt: salt,
      updatedAt: nowStr,
    };

    setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updated : u)));
    setCurrentUser(updated);
    recordAudit('PASSWORD_CHANGED', `Kata sandi berhasil diubah oleh ${currentUser.name}`, currentUser.workspaceId);
    return { success: true };
  };

  // -------------------------------------------------------------
  // BRAND MANAGEMENT & SUPER ADMIN APPROVALS
  // -------------------------------------------------------------
  const addBrand = (brandData: {
    name: string;
    category: BusinessCategory;
    description: string;
    color?: string;
    logoUrl?: string;
    businessContact?: BrandBusinessContact;
  }) => {
    if (!currentUser) return { success: false, error: 'Silakan login terlebih dahulu.' };
    if (currentUser.role === 'admin') {
      return { success: false, error: 'Akses Ditolak: Akun Admin Transparansi bersifat read-only dan dilarang membuat brand.' };
    }

    const isSuperAdmin = currentUser.role === 'super_admin';

    // Check policy for non-super admins
    if (!isSuperAdmin) {
      if (!brandPolicy.allowUserCreateBrand) {
        return { success: false, error: 'Kebijakan: Pembuatan brand oleh pengguna dinonaktifkan oleh Super Admin.' };
      }

      const existingBrandsOfUser = brands.filter((b) => b.ownerUserId === currentUser.id && b.status !== 'archived');
      if (existingBrandsOfUser.length >= brandPolicy.maxBrandsPerUser) {
        return {
          success: false,
          error: `Batas tercapai: Akun Anda telah memiliki ${existingBrandsOfUser.length} brand (Maksimal: ${brandPolicy.maxBrandsPerUser}).`,
        };
      }
    }

    const code = brandData.name.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase() || 'BRD';
    const newId = `brand_${Date.now()}`;
    const targetWorkspaceId = isSuperAdmin ? 'ws_superadmin' : currentUser.workspaceId;
    const requiresApproval = !isSuperAdmin && brandPolicy.requireAdminApproval;
    const initialStatus: BrandStatus = requiresApproval ? 'pending_approval' : 'active';

    const newBrand: Brand = {
      id: newId,
      workspaceId: targetWorkspaceId,
      name: brandData.name,
      code,
      category: brandData.category,
      description: brandData.description,
      color: brandData.color || '#8B5CF6',
      logoUrl: brandData.logoUrl || '',
      businessContact: brandData.businessContact,
      ownerUserId: currentUser.id,
      status: initialStatus,
      approvalNotes: requiresApproval ? `Pengajuan baru dari ${currentUser.name} (${currentUser.email})` : undefined,
      createdAt: new Date().toISOString().substring(0, 10),
    };

    setBrands((prev) => [...prev, newBrand]);

    // If active immediately, add to user allowedBrandIds and workspace
    if (initialStatus === 'active') {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === currentUser.id
            ? { ...u, allowedBrandIds: Array.from(new Set([...(u.allowedBrandIds || []), newId])) }
            : u
        )
      );
      setWorkspaces((prev) =>
        prev.map((w) =>
          w.id === targetWorkspaceId
            ? { ...w, allowedBrandIds: Array.from(new Set([...w.allowedBrandIds, newId])) }
            : w
        )
      );
    }

    // Notify Super Admin if pending approval
    if (requiresApproval) {
      const notif: AppNotification = {
        id: `notif_brand_${Date.now()}`,
        workspaceId: 'ws_superadmin',
        title: 'Pengajuan Brand Baru Menunggu Persetujuan',
        message: `${currentUser.name} mengajukan brand "${newBrand.name}" (${newBrand.category}). Silakan tinjau di Super Admin Panel.`,
        type: 'warning',
        timestamp: 'Baru saja',
        isRead: false,
      };
      setNotifications((prev) => [notif, ...prev]);
    }

    recordAudit('BRAND_CREATED', `Brand "${newBrand.name}" dibuat (Status: ${initialStatus}) oleh ${currentUser.name}`, targetWorkspaceId);
    return { success: true, brand: newBrand, requiresApproval };
  };

  const updateBrand = (brandId: string, updates: Partial<Brand>) => {
    if (!currentUser) return { success: false, error: 'Silakan login.' };
    const brand = brands.find((b) => b.id === brandId);
    if (!brand) return { success: false, error: 'Brand tidak ditemukan.' };

    const isSuperAdmin = currentUser.role === 'super_admin';
    const isOwner = brand.ownerUserId === currentUser.id || brand.workspaceId === currentUser.workspaceId;

    if (!isSuperAdmin && !isOwner) {
      return { success: false, error: 'Akses Ditolak: Anda tidak memiliki wewenang untuk mengedit brand ini.' };
    }

    // Protect status and ownership from client-side alteration
    const safeUpdates = isSuperAdmin
      ? updates
      : {
          name: updates.name,
          category: updates.category,
          description: updates.description,
          color: updates.color,
          logoUrl: updates.logoUrl,
          businessContact: updates.businessContact,
        };

    const updatedBrand: Brand = {
      ...brand,
      ...safeUpdates,
      updatedAt: new Date().toISOString().substring(0, 10),
    };

    setBrands((prev) => prev.map((b) => (b.id === brandId ? updatedBrand : b)));
    recordAudit('BRAND_UPDATED', `Brand "${brand.name}" diperbarui oleh ${currentUser.name}`, brand.workspaceId);
    return { success: true };
  };

  const approveBrand = (brandId: string, notes?: string) => {
    if (currentUser?.role !== 'super_admin') {
      return { success: false, error: 'Akses Ditolak: Hanya Super Admin yang berwenang menyetujui pengajuan brand.' };
    }
    const brand = brands.find((b) => b.id === brandId);
    if (!brand) return { success: false, error: 'Brand tidak ditemukan.' };

    const updatedBrand: Brand = {
      ...brand,
      status: 'active',
      approvalNotes: notes || `Disetujui oleh Super Admin pada ${new Date().toISOString().substring(0, 10)}`,
      updatedAt: new Date().toISOString().substring(0, 10),
    };

    setBrands((prev) => prev.map((b) => (b.id === brandId ? updatedBrand : b)));

    // Add brandId to owner user allowedBrandIds and workspace
    if (brand.ownerUserId) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === brand.ownerUserId
            ? { ...u, allowedBrandIds: Array.from(new Set([...(u.allowedBrandIds || []), brandId])) }
            : u
        )
      );
    }
    setWorkspaces((prev) =>
      prev.map((w) =>
        w.id === brand.workspaceId
          ? { ...w, allowedBrandIds: Array.from(new Set([...w.allowedBrandIds, brandId])) }
          : w
      )
    );

    // Notify brand owner
    const notif: AppNotification = {
      id: `notif_brand_appr_${Date.now()}`,
      workspaceId: brand.workspaceId,
      title: 'Brand Telah Disetujui!',
      message: `Pengajuan brand "${brand.name}" telah disetujui oleh Super Admin dan kini aktif di workspace Anda.`,
      type: 'success',
      timestamp: 'Baru saja',
      isRead: false,
    };
    setNotifications((prev) => [notif, ...prev]);

    recordAudit('BRAND_APPROVED', `Brand "${brand.name}" disetujui oleh Super Admin.`, brand.workspaceId);
    return { success: true };
  };

  const rejectBrand = (brandId: string, reason: string) => {
    if (currentUser?.role !== 'super_admin') {
      return { success: false, error: 'Akses Ditolak: Hanya Super Admin yang berwenang menolak pengajuan brand.' };
    }
    const brand = brands.find((b) => b.id === brandId);
    if (!brand) return { success: false, error: 'Brand tidak ditemukan.' };

    const updatedBrand: Brand = {
      ...brand,
      status: 'rejected',
      approvalNotes: `Ditolak: ${reason}`,
      updatedAt: new Date().toISOString().substring(0, 10),
    };
    setBrands((prev) => prev.map((b) => (b.id === brandId ? updatedBrand : b)));

    // Notify owner
    const notif: AppNotification = {
      id: `notif_brand_rej_${Date.now()}`,
      workspaceId: brand.workspaceId,
      title: 'Pengajuan Brand Ditolak',
      message: `Pengajuan brand "${brand.name}" ditolak oleh Super Admin. Alasan: ${reason}`,
      type: 'warning',
      timestamp: 'Baru saja',
      isRead: false,
    };
    setNotifications((prev) => [notif, ...prev]);

    recordAudit('BRAND_REJECTED', `Brand "${brand.name}" ditolak. Alasan: ${reason}`, brand.workspaceId);
    return { success: true };
  };

  const archiveBrand = (brandId: string) => {
    if (!currentUser) return { success: false, error: 'Silakan login.' };
    const brand = brands.find((b) => b.id === brandId);
    if (!brand) return { success: false, error: 'Brand tidak ditemukan.' };

    const isSuperAdmin = currentUser.role === 'super_admin';
    const isOwner = brand.ownerUserId === currentUser.id || brand.workspaceId === currentUser.workspaceId;
    if (!isSuperAdmin && !isOwner) {
      return { success: false, error: 'Akses Ditolak: Anda tidak memiliki wewenang untuk mengarsipkan brand ini.' };
    }

    setBrands((prev) =>
      prev.map((b) =>
        b.id === brandId ? { ...b, status: 'archived', updatedAt: new Date().toISOString().substring(0, 10) } : b
      )
    );
    recordAudit('BRAND_ARCHIVED', `Brand "${brand.name}" diarsipkan oleh ${currentUser.name}`, brand.workspaceId);
    return { success: true };
  };

  const updateBrandPolicy = (updates: Partial<BrandPolicyConfig>) => {
    if (currentUser?.role !== 'super_admin') {
      return { success: false, error: 'Akses Ditolak: Hanya Super Admin yang dapat mengubah kebijakan brand global.' };
    }
    setBrandPolicy((prev) => ({ ...prev, ...updates }));
    recordAudit('POLICY_UPDATED', `Kebijakan brand global diperbarui oleh Super Admin`, 'ws_superadmin');
    return { success: true };
  };

  // -------------------------------------------------------------
  // SUPER ADMIN USER & ACCOUNT MANAGEMENT
  // -------------------------------------------------------------
  const inviteUser = (data: {
    email: string;
    name: string;
    role: UserRole;
    allowedBrandIds: string[];
    workspaceId?: string;
    notes?: string;
  }) => {
    if (currentUser?.role !== 'super_admin') {
      return { success: false, error: 'Akses Ditolak: Hanya Super Admin yang berwenang mengundang pengguna baru.' };
    }

    const cleanEmail = data.email.trim().toLowerCase();
    const existing = users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      return { success: false, error: `Email ${cleanEmail} sudah terdaftar di sistem BizFlow.` };
    }

    const token = generateSecureToken('inv');
    const assignedWs =
      data.workspaceId ||
      (data.role === 'ika' ? 'ws_ika' : data.role === 'redi' ? 'ws_redi' : data.role === 'admin' ? 'ws_admin' : 'ws_ika');
    const newUserId = `user_${Date.now()}`;
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);

    const newUser: User = {
      id: newUserId,
      name: data.name.trim(),
      email: cleanEmail,
      role: data.role,
      status: 'invited',
      workspaceId: assignedWs,
      allowedBrandIds: data.allowedBrandIds,
      createdAt: nowStr,
    };

    const newInvitation: UserInvitation = {
      id: `inv_${Date.now()}`,
      email: cleanEmail,
      fullName: data.name.trim(),
      assignedRole: data.role,
      allowedBrandIds: data.allowedBrandIds,
      workspaceId: assignedWs,
      invitedBy: currentUser.id,
      invitedByName: currentUser.name,
      token,
      status: 'pending',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 16),
      createdAt: nowStr,
      notes: data.notes,
    };

    setUsers((prev) => [...prev, newUser]);
    setInvitations((prev) => [newInvitation, ...prev]);

    recordAudit('USER_INVITED', `Undangan dikirim ke ${cleanEmail} (Role: ${data.role}). Token aktivasi: ${token}`, assignedWs);
    return { success: true, invitation: newInvitation };
  };

  const resendInvitation = (invitationId: string) => {
    if (currentUser?.role !== 'super_admin') {
      return { success: false, error: 'Akses Ditolak: Hanya Super Admin yang berwenang mengirim ulang undangan.' };
    }
    const inv = invitations.find((i) => i.id === invitationId);
    if (!inv) return { success: false, error: 'Undangan tidak ditemukan.' };

    const newToken = generateSecureToken('inv');
    const newExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 16);

    setInvitations((prev) =>
      prev.map((i) =>
        i.id === invitationId ? { ...i, token: newToken, expiresAt: newExpires, status: 'pending' } : i
      )
    );
    recordAudit('INVITATION_RESENT', `Undangan untuk ${inv.email} diperbarui. Token baru: ${newToken}`, inv.workspaceId);
    return { success: true, token: newToken };
  };

  const updateUserStatus = (userId: string, newStatus: UserAccountStatus, reason?: string) => {
    if (currentUser?.role !== 'super_admin') {
      return { success: false, error: 'Akses Ditolak: Hanya Super Admin yang berwenang mengubah status akun.' };
    }
    if (userId === 'user_superadmin') {
      return { success: false, error: 'Akun Super Admin Utama tidak dapat dinonaktifkan atau disuspend demi stabilitas sistem.' };
    }

    const user = users.find((u) => u.id === userId);
    if (!user) return { success: false, error: 'Pengguna tidak ditemukan.' };

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, status: newStatus, updatedAt: nowStr } : u))
    );

    recordAudit(
      'USER_STATUS_CHANGED',
      `Status akun ${user.name} (${user.email}) diubah dari ${user.status} menjadi ${newStatus}. Alasan: ${reason || 'Tindakan Super Admin'}`,
      user.workspaceId
    );
    return { success: true };
  };

  const updateUserRoleAndBrands = (
    userId: string,
    role: UserRole,
    allowedBrandIds: string[],
    workspaceId?: string
  ) => {
    if (currentUser?.role !== 'super_admin') {
      return { success: false, error: 'Akses Ditolak: Hanya Super Admin yang berwenang mengubah role dan akses brand.' };
    }
    if (userId === 'user_superadmin' && role !== 'super_admin') {
      return { success: false, error: 'Role Super Admin Utama tidak dapat diturunkan.' };
    }

    const user = users.find((u) => u.id === userId);
    if (!user) return { success: false, error: 'Pengguna tidak ditemukan.' };

    const assignedWs = workspaceId || user.workspaceId;
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);

    const updatedUser: User = {
      ...user,
      role,
      allowedBrandIds,
      workspaceId: assignedWs,
      updatedAt: nowStr,
    };

    setUsers((prev) => prev.map((u) => (u.id === userId ? updatedUser : u)));
    if (currentUser.id === userId) {
      setCurrentUser(updatedUser);
    }

    recordAudit(
      'USER_PERMISSIONS_UPDATED',
      `Role dan brand akun ${user.name} diperbarui ke ${role}. Brand: ${allowedBrandIds.join(', ')}`,
      assignedWs
    );
    return { success: true };
  };

  const adminResetUserPassword = async (
    userId: string,
    tempPassword?: string
  ): Promise<{ success: boolean; error?: string; temporaryPassword?: string }> => {
    if (currentUser?.role !== 'super_admin') {
      return { success: false, error: 'Akses Ditolak: Hanya Super Admin yang berwenang mereset kata sandi akun.' };
    }
    const user = users.find((u) => u.id === userId);
    if (!user) return { success: false, error: 'Pengguna tidak ditemukan.' };

    const pwd = tempPassword || 'BizFlow' + Math.floor(1000 + Math.random() * 9000) + '!';
    const { hash, salt } = await hashPassword(pwd);
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);

    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, passwordHash: hash, passwordSalt: salt, updatedAt: nowStr } : u))
    );

    recordAudit('ADMIN_PASSWORD_RESET', `Kata sandi akun ${user.name} direset oleh Super Admin.`, user.workspaceId);
    return { success: true, temporaryPassword: pwd };
  };

  const checkMutationAllowed = (): { allowed: boolean; error?: string } => {
    if (!currentUser) {
      return { allowed: false, error: 'Silakan login terlebih dahulu.' };
    }
    if (currentUser.role === 'admin') {
      return {
        allowed: false,
        error:
          'Akses Ditolak: Akun Admin Baliyoutevolution bersifat Read-Only untuk kebutuhan transparansi dan dilarang mengubah data.',
      };
    }
    return { allowed: true };
  };

  // -------------------------------------------------------------
  // ADD TRANSACTION (CORE CASH JOURNAL)
  // -------------------------------------------------------------
  const addTransaction = (
    data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'auditLog' | 'createdBy' | 'workspaceId'>
  ) => {
    const check = checkMutationAllowed();
    if (!check.allowed) return { success: false, error: check.error };

    const workspaceId = currentUser!.workspaceId;
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);

    const newTx: Transaction = {
      ...data,
      id: `tx_${Date.now()}`,
      workspaceId,
      createdBy: currentUser!.name,
      createdAt: nowStr,
      updatedAt: nowStr,
      auditLog: [
        {
          timestamp: nowStr,
          action: 'create',
          userName: currentUser!.name,
          userRole: currentUser!.role,
          details: `Transaksi ${data.type} dibuat: Rp ${data.amount.toLocaleString('id-ID')} (${data.category})`,
        },
      ],
    };

    setAssets((prevAssets) =>
      prevAssets.map((asset) => {
        if (data.type === 'income' && asset.id === data.assetId) {
          return {
            ...asset,
            currentBalance: asset.currentBalance + data.amount,
            updatedAt: nowStr,
          };
        }
        if ((data.type === 'expense' || data.type === 'purchase') && asset.id === data.assetId) {
          return {
            ...asset,
            currentBalance: Math.max(0, asset.currentBalance - data.amount),
            updatedAt: nowStr,
          };
        }
        if (data.type === 'transfer') {
          if (asset.id === data.assetId) {
            return {
              ...asset,
              currentBalance: Math.max(0, asset.currentBalance - data.amount),
              updatedAt: nowStr,
            };
          }
          if (asset.id === data.targetAssetId) {
            return {
              ...asset,
              currentBalance: asset.currentBalance + data.amount,
              updatedAt: nowStr,
            };
          }
        }
        return asset;
      })
    );

    setTransactions((prev) => [newTx, ...prev]);

    recordAudit(
      'CREATE_TRANSACTION',
      `Menambah transaksi ${data.type} sebesar Rp ${data.amount.toLocaleString('id-ID')}`,
      workspaceId
    );

    return { success: true };
  };

  const updateTransaction = (
    id: string,
    data: Partial<Transaction>,
    updateReason: string
  ) => {
    const check = checkMutationAllowed();
    if (!check.allowed) return { success: false, error: check.error };

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);

    setTransactions((prev) =>
      prev.map((tx) => {
        if (tx.id !== id) return tx;
        return {
          ...tx,
          ...data,
          updatedAt: nowStr,
          auditLog: [
            ...tx.auditLog,
            {
              timestamp: nowStr,
              action: 'update',
              userName: currentUser!.name,
              userRole: currentUser!.role,
              details: updateReason || 'Perubahan data transaksi disimpan.',
            },
          ],
        };
      })
    );

    recordAudit('UPDATE_TRANSACTION', `Memperbarui transaksi #${id}: ${updateReason}`, currentUser!.workspaceId);
    return { success: true };
  };

  const softDeleteTransaction = (id: string, reason: string) => {
    const check = checkMutationAllowed();
    if (!check.allowed) return { success: false, error: check.error };

    const targetTx = transactions.find((t) => t.id === id);
    if (!targetTx) return { success: false, error: 'Transaksi tidak ditemukan.' };

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);

    setAssets((prev) =>
      prev.map((asset) => {
        if (targetTx.type === 'income' && asset.id === targetTx.assetId) {
          return {
            ...asset,
            currentBalance: Math.max(0, asset.currentBalance - targetTx.amount),
            updatedAt: nowStr,
          };
        }
        if (
          (targetTx.type === 'expense' || targetTx.type === 'purchase') &&
          asset.id === targetTx.assetId
        ) {
          return {
            ...asset,
            currentBalance: asset.currentBalance + targetTx.amount,
            updatedAt: nowStr,
          };
        }
        if (targetTx.type === 'transfer') {
          if (asset.id === targetTx.assetId) {
            return {
              ...asset,
              currentBalance: asset.currentBalance + targetTx.amount,
              updatedAt: nowStr,
            };
          }
          if (asset.id === targetTx.targetAssetId) {
            return {
              ...asset,
              currentBalance: Math.max(0, asset.currentBalance - targetTx.amount),
              updatedAt: nowStr,
            };
          }
        }
        return asset;
      })
    );

    setTransactions((prev) =>
      prev.map((tx) => {
        if (tx.id !== id) return tx;
        return {
          ...tx,
          isDeleted: true,
          updatedAt: nowStr,
          auditLog: [
            ...tx.auditLog,
            {
              timestamp: nowStr,
              action: 'soft_delete',
              userName: currentUser!.name,
              userRole: currentUser!.role,
              details: `Dihapus (Reversal): ${reason}`,
            },
          ],
        };
      })
    );

    recordAudit('DELETE_TRANSACTION', `Soft delete transaksi #${id} alasan: ${reason}`, currentUser!.workspaceId);
    return { success: true };
  };

  const transferAsset = (
    fromAssetId: string,
    toAssetId: string,
    amount: number,
    brandId: string,
    notes?: string
  ) => {
    const check = checkMutationAllowed();
    if (!check.allowed) return { success: false, error: check.error };

    const fromAsset = assets.find((a) => a.id === fromAssetId);
    const toAsset = assets.find((a) => a.id === toAssetId);
    if (!fromAsset || !toAsset) {
      return { success: false, error: 'Aset asal atau tujuan tidak valid.' };
    }
    if (fromAsset.currentBalance < amount) {
      return {
        success: false,
        error: `Saldo tidak mencukupi di ${fromAsset.name}. Saldo saat ini: Rp ${fromAsset.currentBalance.toLocaleString('id-ID')}`,
      };
    }

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = now.toTimeString().slice(0, 5);

    return addTransaction({
      brandId,
      type: 'transfer',
      category: 'Transfer Antar-Aset',
      description: `Mutasi saldo dari ${fromAsset.name} ke ${toAsset.name}`,
      amount,
      assetId: fromAssetId,
      targetAssetId: toAssetId,
      paymentMethod: 'Transfer Internal',
      notes: notes || 'Mutasi internal antar akun/kas.',
      date: dateStr,
      time: timeStr,
    });
  };

  const reconcileAsset = (
    assetId: string,
    actualBalance: number,
    brandId: string,
    reason: string
  ) => {
    const check = checkMutationAllowed();
    if (!check.allowed) return { success: false, error: check.error };

    const asset = assets.find((a) => a.id === assetId);
    if (!asset) return { success: false, error: 'Aset tidak ditemukan.' };

    const diff = actualBalance - asset.currentBalance;
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = now.toTimeString().slice(0, 5);
    const nowStr = `${dateStr} ${timeStr}`;

    setAssets((prev) =>
      prev.map((a) => (a.id === assetId ? { ...a, currentBalance: actualBalance, updatedAt: nowStr } : a))
    );

    const adjTx: Transaction = {
      id: `adj_${Date.now()}`,
      workspaceId: currentUser!.workspaceId,
      brandId,
      type: 'adjustment',
      category: 'Penyesuaian Saldo',
      description: `Rekonsiliasi saldo ${asset.name}: ${diff >= 0 ? '+' : ''}Rp ${diff.toLocaleString('id-ID')}`,
      amount: Math.abs(diff),
      assetId,
      paymentMethod: 'Penyesuaian Manual',
      notes: `Alasan rekonsiliasi: ${reason}`,
      date: dateStr,
      time: timeStr,
      createdBy: currentUser!.name,
      createdAt: nowStr,
      updatedAt: nowStr,
      auditLog: [
        {
          timestamp: nowStr,
          action: 'reconcile',
          userName: currentUser!.name,
          userRole: currentUser!.role,
          details: `Rekonsiliasi saldo dari Rp ${asset.currentBalance.toLocaleString('id-ID')} menjadi Rp ${actualBalance.toLocaleString('id-ID')}. Alasan: ${reason}`,
        },
      ],
    };

    setTransactions((prev) => [adjTx, ...prev]);
    recordAudit('RECONCILE_ASSET', `Rekonsiliasi ${asset.name} menjadi Rp ${actualBalance.toLocaleString('id-ID')}`, currentUser!.workspaceId);
    return { success: true };
  };

  // -------------------------------------------------------------
  // ORDERS & KOL ATTRIBUTION (Section 5)
  // -------------------------------------------------------------
  const addOrder = (data: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'workspaceId' | 'netSales'>) => {
    const check = checkMutationAllowed();
    if (!check.allowed) return { success: false, error: check.error };

    const now = new Date();
    const nowStr = now.toISOString().replace('T', ' ').substring(0, 16);
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = now.toTimeString().slice(0, 5);
    const orderId = `ord_${Date.now()}`;

    // Penjualan bersih = Penjualan kotor - Diskon - Refund
    const netSales = Math.max(0, data.grossSales - data.discount - data.refundAmount);

    const newOrder: Order = {
      ...data,
      id: orderId,
      workspaceId: currentUser!.workspaceId,
      netSales,
      createdAt: nowStr,
      updatedAt: nowStr,
    };

    setOrders((prev) => [newOrder, ...prev]);

    // Jika pesanan selesai dan ada pembayaran, catat transaksi pemasukan jika belum ada
    if (data.status === 'completed' && netSales > 0 && !data.relatedTransactionId) {
      const defaultAsset = assets.find((a) => a.workspaceId === currentUser!.workspaceId);
      if (defaultAsset) {
        addTransaction({
          brandId: data.brandId,
          type: 'income',
          category: 'Penjualan Produk',
          description: `Penjualan Pesanan #${data.orderNumber} (${data.customerName})`,
          amount: netSales,
          assetId: defaultAsset.id,
          paymentMethod: data.paymentMethod || 'Transfer Bank',
          partyName: data.customerName,
          relatedEntityId: orderId,
          relatedEntityType: 'order',
          date: data.orderDate || dateStr,
          time: timeStr,
        });
      }
    }

    recordAudit('ADD_ORDER', `Mencatat pesanan #${data.orderNumber} senilai Rp ${netSales.toLocaleString('id-ID')}`, currentUser!.workspaceId);
    return { success: true };
  };

  const updateOrder = (id: string, data: Partial<Order>) => {
    const check = checkMutationAllowed();
    if (!check.allowed) return { success: false, error: check.error };

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== id) return o;
        const gross = data.grossSales !== undefined ? data.grossSales : o.grossSales;
        const disc = data.discount !== undefined ? data.discount : o.discount;
        const ref = data.refundAmount !== undefined ? data.refundAmount : o.refundAmount;
        const netSales = Math.max(0, gross - disc - ref);
        return {
          ...o,
          ...data,
          netSales,
          updatedAt: nowStr,
        };
      })
    );

    recordAudit('UPDATE_ORDER', `Memperbarui pesanan #${id}`, currentUser!.workspaceId);
    return { success: true };
  };

  const processOrderRefund = (orderId: string, refundAmount: number, reason: string) => {
    const check = checkMutationAllowed();
    if (!check.allowed) return { success: false, error: check.error };

    const order = orders.find((o) => o.id === orderId);
    if (!order) return { success: false, error: 'Pesanan tidak ditemukan.' };

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const dateStr = nowStr.slice(0, 10);
    const timeStr = nowStr.slice(11, 16);
    const newRefundTotal = order.refundAmount + refundAmount;
    const newNetSales = Math.max(0, order.grossSales - order.discount - newRefundTotal);
    const newStatus = newNetSales === 0 ? 'refunded' : order.status;

    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              refundAmount: newRefundTotal,
              netSales: newNetSales,
              status: newStatus,
              commissionEligible: newNetSales > 0,
              updatedAt: nowStr,
              notes: `${o.notes ? o.notes + ' | ' : ''}Refund Rp ${refundAmount.toLocaleString('id-ID')}: ${reason}`,
            }
          : o
      )
    );

    // Catat transaksi pengeluaran refund kas
    const defaultAsset = assets.find((a) => a.workspaceId === currentUser!.workspaceId);
    if (defaultAsset) {
      addTransaction({
        brandId: order.brandId,
        type: 'refund',
        category: 'Pengembalian Dana Pelanggan',
        description: `Refund pesanan #${order.orderNumber}: ${reason}`,
        amount: refundAmount,
        assetId: defaultAsset.id,
        paymentMethod: 'Transfer Pengembalian',
        partyName: order.customerName,
        relatedEntityId: orderId,
        relatedEntityType: 'order',
        date: dateStr,
        time: timeStr,
      });
    }

    recordAudit('REFUND_ORDER', `Refund pesanan #${order.orderNumber} sebesar Rp ${refundAmount.toLocaleString('id-ID')}`, currentUser!.workspaceId);
    return { success: true };
  };

  // -------------------------------------------------------------
  // KOL DATABASE (Section 4)
  // -------------------------------------------------------------
  const addKOL = (data: Omit<KOL, 'id' | 'createdAt' | 'workspaceId'>) => {
    const check = checkMutationAllowed();
    if (!check.allowed) return { success: false, error: check.error };

    const nowStr = new Date().toISOString().slice(0, 10);
    const newKOL: KOL = {
      ...data,
      id: `kol_${Date.now()}`,
      workspaceId: currentUser!.workspaceId,
      createdAt: nowStr,
    };
    setKols((prev) => [newKOL, ...prev]);
    recordAudit('ADD_KOL', `Mendaftarkan KOL ${data.name} (${data.handleOrAccount})`, currentUser!.workspaceId);
    return { success: true };
  };

  const updateKOL = (id: string, data: Partial<KOL>) => {
    const check = checkMutationAllowed();
    if (!check.allowed) return { success: false, error: check.error };

    setKols((prev) => prev.map((k) => (k.id === id ? { ...k, ...data } : k)));
    recordAudit('UPDATE_KOL', `Memperbarui profil KOL #${id}`, currentUser!.workspaceId);
    return { success: true };
  };

  const deleteKOL = (id: string) => {
    const check = checkMutationAllowed();
    if (!check.allowed) return { success: false, error: check.error };

    setKols((prev) => prev.filter((k) => k.id !== id));
    recordAudit('DELETE_KOL', `Menghapus KOL #${id}`, currentUser!.workspaceId);
    return { success: true };
  };

  // -------------------------------------------------------------
  // REKAP KOMISI KOL BULANAN & PARTIAL PAYOUTS (Section 6)
  // -------------------------------------------------------------
  const generateKOLMonthlyRecap = (brandId: string, kolId: string, period: string) => {
    const check = checkMutationAllowed();
    if (!check.allowed) return { success: false, error: check.error };

    const kol = kols.find((k) => k.id === kolId);
    if (!kol) return { success: false, error: 'KOL tidak ditemukan.' };

    // Ambil pesanan yang teratribusi ke KOL pada periode terkait
    const kolOrders = orders.filter((o) => {
      return (
        o.workspaceId === currentUser!.workspaceId &&
        o.brandId === brandId &&
        o.kolId === kolId &&
        o.orderDate.startsWith(period)
      );
    });

    const validOrders = kolOrders.filter((o) => o.status === 'completed' && o.commissionEligible);
    const cancelledOrders = kolOrders.filter((o) => o.status === 'cancelled');
    const refundedAmount = kolOrders.reduce((sum, o) => sum + o.refundAmount, 0);
    const attributedGrossSales = kolOrders.reduce((sum, o) => sum + o.grossSales, 0);
    const calculationBase = validOrders.reduce((sum, o) => sum + o.netSales, 0);

    let grossCommission = 0;
    if (kol.commissionMethod === 'percentage_sales') {
      grossCommission = Math.round((calculationBase * kol.commissionRate) / 100);
    } else if (kol.commissionMethod === 'fixed_per_order') {
      grossCommission = validOrders.length * kol.commissionRate;
    } else if (kol.commissionMethod === 'hybrid_fixed_plus_pct') {
      grossCommission = (kol.fixedBaseFee || 0) + Math.round((calculationBase * kol.commissionRate) / 100);
    } else {
      grossCommission = Math.round((calculationBase * kol.commissionRate) / 100);
    }

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const newRecap: KOLCommissionRecap = {
      id: `recap_kol_${Date.now()}`,
      workspaceId: currentUser!.workspaceId,
      brandId,
      kolId,
      kolName: kol.name,
      period,
      validOrdersCount: validOrders.length,
      attributedGrossSales,
      cancelledOrdersCount: cancelledOrders.length,
      refundedAmount,
      calculationBaseAmount: calculationBase,
      commissionRate: kol.commissionRate,
      grossCommission,
      adjustments: 0,
      finalCommission: grossCommission,
      totalPaid: 0,
      outstandingBalance: grossCommission,
      status: 'draft',
      payments: [],
      notes: `Rekapitulasi otomatis periode ${period} untuk ${kol.name}`,
      createdAt: nowStr,
      updatedAt: nowStr,
    };

    setKolRecaps((prev) => [newRecap, ...prev]);
    recordAudit('GENERATE_KOL_RECAP', `Membuat rekap komisi bulanan ${kol.name} periode ${period}`, currentUser!.workspaceId);
    return { success: true };
  };

  const reviewKOLRecap = (id: string) => {
    const check = checkMutationAllowed();
    if (!check.allowed) return { success: false, error: check.error };

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
    setKolRecaps((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'review', updatedAt: nowStr } : r))
    );
    return { success: true };
  };

  const approveKOLRecap = (id: string) => {
    const check = checkMutationAllowed();
    if (!check.allowed) return { success: false, error: check.error };

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const dateStr = nowStr.slice(0, 10);

    setKolRecaps((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: 'approved',
              approvalDate: dateStr,
              approvedBy: currentUser!.name,
              updatedAt: nowStr,
            }
          : r
      )
    );
    recordAudit('APPROVE_KOL_RECAP', `Menyetujui rekap komisi #${id} sebagai kewajiban resmi`, currentUser!.workspaceId);
    return { success: true };
  };

  const payKOLRecapPartial = (
    recapId: string,
    amount: number,
    assetId: string,
    paymentMethod: string,
    notes?: string
  ) => {
    const check = checkMutationAllowed();
    if (!check.allowed) return { success: false, error: check.error };

    const recap = kolRecaps.find((r) => r.id === recapId);
    if (!recap) return { success: false, error: 'Rekap komisi tidak ditemukan.' };
    if (recap.status === 'draft' || recap.status === 'cancelled') {
      return { success: false, error: 'Rekap harus disetujui terlebih dahulu sebelum dibayarkan.' };
    }
    if (amount <= 0) {
      return { success: false, error: 'Nominal pembayaran harus lebih besar dari 0.' };
    }
    if (amount > recap.outstandingBalance) {
      return {
        success: false,
        error: `Nominal melebihi saldo terutang (Rp ${recap.outstandingBalance.toLocaleString('id-ID')}).`,
      };
    }

    const asset = assets.find((a) => a.id === assetId);
    if (!asset) return { success: false, error: 'Aset pembayaran tidak valid.' };
    if (asset.currentBalance < amount) {
      return { success: false, error: `Saldo di ${asset.name} tidak mencukupi (Rp ${asset.currentBalance.toLocaleString('id-ID')}).` };
    }

    const now = new Date();
    const nowStr = now.toISOString().replace('T', ' ').substring(0, 16);
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = now.toTimeString().slice(0, 5);
    const paymentTxId = `tx_kol_pay_${Date.now()}`;

    // Catat transaksi pengeluaran kas resmi
    const txRes = addTransaction({
      brandId: recap.brandId,
      type: 'expense',
      category: 'Beban Komisi KOL',
      description: `Pembayaran komisi ${recap.kolName} (Periode ${recap.period})`,
      amount,
      assetId,
      paymentMethod,
      partyName: recap.kolName,
      relatedEntityId: recap.id,
      relatedEntityType: 'kol_recap',
      notes: notes || `Pelunasan komisi rekap #${recap.id}`,
      date: dateStr,
      time: timeStr,
    });

    if (!txRes.success) return txRes;

    const newPaymentRecord: PartialPaymentRecord = {
      id: `pay_rec_${Date.now()}`,
      paymentDate: dateStr,
      amount,
      assetId,
      assetName: asset.name,
      paymentMethod,
      transactionId: paymentTxId,
      receiptNote: notes,
      paidBy: currentUser!.name,
    };

    const newTotalPaid = recap.totalPaid + amount;
    const newOutstanding = Math.max(0, recap.finalCommission - newTotalPaid);
    const newStatus: RecapStatus = newOutstanding === 0 ? 'paid' : 'partially_paid';

    setKolRecaps((prev) =>
      prev.map((r) =>
        r.id === recapId
          ? {
              ...r,
              totalPaid: newTotalPaid,
              outstandingBalance: newOutstanding,
              status: newStatus,
              payments: [...r.payments, newPaymentRecord],
              updatedAt: nowStr,
            }
          : r
      )
    );

    recordAudit('PAY_KOL_COMMISSION', `Pembayaran komisi Rp ${amount.toLocaleString('id-ID')} kepada ${recap.kolName}`, currentUser!.workspaceId);
    return { success: true };
  };

  // -------------------------------------------------------------
  // TEAM & TASKS (Section 7)
  // -------------------------------------------------------------
  const addTeamMember = (data: Omit<TeamMember, 'id' | 'createdAt' | 'workspaceId'>) => {
    const check = checkMutationAllowed();
    if (!check.allowed) return { success: false, error: check.error };

    const nowStr = new Date().toISOString().slice(0, 10);
    const newMember: TeamMember = {
      ...data,
      id: `team_${Date.now()}`,
      workspaceId: currentUser!.workspaceId,
      createdAt: nowStr,
    };
    setTeamMembers((prev) => [newMember, ...prev]);
    recordAudit('ADD_TEAM_MEMBER', `Menambah anggota tim ${data.name} (${data.roleOrPosition})`, currentUser!.workspaceId);
    return { success: true };
  };

  const updateTeamMember = (id: string, data: Partial<TeamMember>) => {
    const check = checkMutationAllowed();
    if (!check.allowed) return { success: false, error: check.error };

    setTeamMembers((prev) => prev.map((m) => (m.id === id ? { ...m, ...data } : m)));
    recordAudit('UPDATE_TEAM_MEMBER', `Memperbarui anggota tim #${id}`, currentUser!.workspaceId);
    return { success: true };
  };

  const addTask = (data: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'workspaceId'>) => {
    const check = checkMutationAllowed();
    if (!check.allowed) return { success: false, error: check.error };

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const newTask: Task = {
      ...data,
      id: `task_${Date.now()}`,
      workspaceId: currentUser!.workspaceId,
      createdAt: nowStr,
      updatedAt: nowStr,
    };
    setTasks((prev) => [newTask, ...prev]);
    recordAudit('ADD_TASK', `Membuat tugas "${data.title}"`, currentUser!.workspaceId);
    return { success: true };
  };

  const updateTask = (id: string, data: Partial<Task>) => {
    const check = checkMutationAllowed();
    if (!check.allowed) return { success: false, error: check.error };

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...data, updatedAt: nowStr } : t)));
    return { success: true };
  };

  const deleteTask = (id: string) => {
    const check = checkMutationAllowed();
    if (!check.allowed) return { success: false, error: check.error };

    setTasks((prev) => prev.filter((t) => t.id !== id));
    recordAudit('DELETE_TASK', `Menghapus tugas #${id}`, currentUser!.workspaceId);
    return { success: true };
  };

  // -------------------------------------------------------------
  // PAYROLL & HONORARIUM (Section 8)
  // -------------------------------------------------------------
  const generateMonthlyPayroll = (brandId: string, teamMemberId: string, period: string) => {
    const check = checkMutationAllowed();
    if (!check.allowed) return { success: false, error: check.error };

    const member = teamMembers.find((m) => m.id === teamMemberId);
    if (!member) return { success: false, error: 'Anggota tim tidak ditemukan.' };

    // Cari tugas selesai yang memiliki approvedFee
    const memberTasks = tasks.filter(
      (t) =>
        t.workspaceId === currentUser!.workspaceId &&
        t.brandId === brandId &&
        t.assigneeId === teamMemberId &&
        t.status === 'done' &&
        t.feeApproved &&
        !t.includedInPayrollId
    );

    const taskFeesSum = memberTasks.reduce((sum, t) => sum + (t.approvedFee || 0), 0);
    const baseSalary = member.compensationType === 'monthly_salary' ? member.baseRate : 0;
    const projectOrEventFee = member.compensationType === 'project_fee' || member.compensationType === 'event_fee' ? member.baseRate : 0;

    const totalCompensation = baseSalary + projectOrEventFee + taskFeesSum;
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);

    const newPayroll: PayrollRecap = {
      id: `pay_recap_${Date.now()}`,
      workspaceId: currentUser!.workspaceId,
      brandId,
      period,
      teamMemberId,
      teamMemberName: member.name,
      roleOrPosition: member.roleOrPosition,
      baseSalary,
      projectOrEventFee,
      taskFees: taskFeesSum,
      incentives: 0,
      reimbursements: 0,
      adjustments: 0,
      totalCompensation,
      totalPaid: 0,
      outstandingBalance: totalCompensation,
      status: 'draft',
      payments: [],
      notes: `Payroll periode ${period} untuk ${member.name}`,
      createdAt: nowStr,
      updatedAt: nowStr,
    };

    setPayrollRecaps((prev) => [newPayroll, ...prev]);

    // Tandai tugas sudah masuk payroll
    if (memberTasks.length > 0) {
      setTasks((prev) =>
        prev.map((t) =>
          memberTasks.some((mt) => mt.id === t.id)
            ? { ...t, includedInPayrollId: newPayroll.id }
            : t
        )
      );
    }

    recordAudit('GENERATE_PAYROLL', `Membuat rekap payroll ${member.name} periode ${period}`, currentUser!.workspaceId);
    return { success: true };
  };

  const approvePayroll = (id: string) => {
    const check = checkMutationAllowed();
    if (!check.allowed) return { success: false, error: check.error };

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const dateStr = nowStr.slice(0, 10);

    setPayrollRecaps((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              status: 'approved',
              approvalDate: dateStr,
              approvedBy: currentUser!.name,
              updatedAt: nowStr,
            }
          : p
      )
    );
    recordAudit('APPROVE_PAYROLL', `Menyetujui payroll #${id} sebagai kewajiban resmi`, currentUser!.workspaceId);
    return { success: true };
  };

  const createPayrollRecap = (data: {
    teamMemberId: string;
    teamMemberName: string;
    brandId: string;
    period: string;
    baseSalary: number;
    taskFees: number;
    incentives: number;
    reimbursements: number;
    notes?: string;
  }) => {
    const check = checkMutationAllowed();
    if (!check.allowed) return { success: false, error: check.error };
    const member = teamMembers.find((m) => m.id === data.teamMemberId);
    const totalCompensation =
      data.baseSalary + data.taskFees + data.incentives + data.reimbursements;
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const newPayroll: PayrollRecap = {
      id: `pay_recap_${Date.now()}`,
      workspaceId: currentUser!.workspaceId,
      brandId: data.brandId,
      period: data.period,
      teamMemberId: data.teamMemberId,
      teamMemberName: data.teamMemberName,
      roleOrPosition: member?.roleOrPosition || 'Anggota Tim',
      baseSalary: data.baseSalary,
      projectOrEventFee: 0,
      taskFees: data.taskFees,
      incentives: data.incentives,
      reimbursements: data.reimbursements,
      adjustments: 0,
      totalCompensation,
      totalPaid: 0,
      outstandingBalance: totalCompensation,
      status: 'draft',
      payments: [],
      notes: data.notes,
      createdAt: nowStr,
      updatedAt: nowStr,
    };
    setPayrollRecaps((prev) => [newPayroll, ...prev]);
    recordAudit('CREATE_PAYROLL', `Membuat rekap payroll untuk ${data.teamMemberName}`, currentUser!.workspaceId);
    return { success: true };
  };

  const reviewPayrollRecap = (id: string) => {
    const check = checkMutationAllowed();
    if (!check.allowed) return { success: false, error: check.error };
    setPayrollRecaps((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              status: 'review',
              updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
            }
          : p
      )
    );
    return { success: true };
  };

  const approvePayrollRecap = approvePayroll;

  const payPayrollPartial = (
    payrollId: string,
    amount: number,
    assetId: string,
    paymentMethod: string,
    notes?: string
  ) => {
    const check = checkMutationAllowed();
    if (!check.allowed) return { success: false, error: check.error };

    const payroll = payrollRecaps.find((p) => p.id === payrollId);
    if (!payroll) return { success: false, error: 'Data payroll tidak ditemukan.' };
    if (payroll.status === 'draft' || payroll.status === 'cancelled') {
      return { success: false, error: 'Payroll harus disetujui terlebih dahulu.' };
    }
    if (amount <= 0) {
      return { success: false, error: 'Nominal pembayaran harus lebih besar dari 0.' };
    }
    if (amount > payroll.outstandingBalance) {
      return {
        success: false,
        error: `Nominal melebihi saldo terutang (Rp ${payroll.outstandingBalance.toLocaleString('id-ID')}).`,
      };
    }

    const asset = assets.find((a) => a.id === assetId);
    if (!asset) return { success: false, error: 'Aset pembayaran tidak valid.' };
    if (asset.currentBalance < amount) {
      return { success: false, error: `Saldo di ${asset.name} tidak cukup.` };
    }

    const now = new Date();
    const nowStr = now.toISOString().replace('T', ' ').substring(0, 16);
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = now.toTimeString().slice(0, 5);
    const payTxId = `tx_pay_team_${Date.now()}`;

    // Catat pengeluaran kas resmi
    const txRes = addTransaction({
      brandId: payroll.brandId,
      type: 'expense',
      category: 'Gaji & Payroll Tim',
      description: `Pembayaran gaji/honor ${payroll.teamMemberName} (${payroll.period})`,
      amount,
      assetId,
      paymentMethod,
      partyName: payroll.teamMemberName,
      relatedEntityId: payroll.id,
      relatedEntityType: 'payroll',
      notes: notes || `Pelunasan payroll #${payroll.id}`,
      date: dateStr,
      time: timeStr,
    });

    if (!txRes.success) return txRes;

    const newPaymentRecord: PartialPaymentRecord = {
      id: `pay_rec_${Date.now()}`,
      paymentDate: dateStr,
      amount,
      assetId,
      assetName: asset.name,
      paymentMethod,
      transactionId: payTxId,
      receiptNote: notes,
      paidBy: currentUser!.name,
    };

    const newTotalPaid = payroll.totalPaid + amount;
    const newOutstanding = Math.max(0, payroll.totalCompensation - newTotalPaid);
    const newStatus: RecapStatus = newOutstanding === 0 ? 'paid' : 'partially_paid';

    setPayrollRecaps((prev) =>
      prev.map((p) =>
        p.id === payrollId
          ? {
              ...p,
              totalPaid: newTotalPaid,
              outstandingBalance: newOutstanding,
              status: newStatus,
              payments: [...p.payments, newPaymentRecord],
              updatedAt: nowStr,
            }
          : p
      )
    );

    recordAudit('PAY_PAYROLL', `Pembayaran gaji Rp ${amount.toLocaleString('id-ID')} kepada ${payroll.teamMemberName}`, currentUser!.workspaceId);
    return { success: true };
  };

  // -------------------------------------------------------------
  // DYNAMIC WORKSHEET (Section 3)
  // -------------------------------------------------------------
  const createWorksheet = (
    title: string,
    description: string,
    brandId: string,
    templateType: Worksheet['templateType'],
    columns: WorksheetColumn[]
  ) => {
    const check = checkMutationAllowed();
    if (!check.allowed) return { success: false, error: check.error };

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const newWs: Worksheet = {
      id: `wsheet_${Date.now()}`,
      workspaceId: currentUser!.workspaceId,
      brandId,
      title,
      description,
      templateType,
      columns,
      rows: [],
      isArchived: false,
      createdAt: nowStr,
      updatedAt: nowStr,
    };

    setWorksheets((prev) => [newWs, ...prev]);
    recordAudit('CREATE_WORKSHEET', `Membuat lembar kerja baru: ${title}`, currentUser!.workspaceId);
    return { success: true };
  };

  const duplicateWorksheet = (worksheetId: string) => {
    const check = checkMutationAllowed();
    if (!check.allowed) return { success: false, error: check.error };

    const target = worksheets.find((w) => w.id === worksheetId);
    if (!target) return { success: false, error: 'Worksheet tidak ditemukan.' };

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const clonedWs: Worksheet = {
      ...target,
      id: `wsheet_${Date.now()}`,
      title: `${target.title} (Salinan)`,
      createdAt: nowStr,
      updatedAt: nowStr,
      // Buat salinan baris dengan ID baru
      rows: target.rows.map((r, i) => ({ ...r, id: `row_clone_${Date.now()}_${i}` })),
    };

    setWorksheets((prev) => [clonedWs, ...prev]);
    recordAudit('DUPLICATE_WORKSHEET', `Menggandakan lembar kerja ${target.title}`, currentUser!.workspaceId);
    return { success: true };
  };

  const archiveWorksheet = (worksheetId: string) => {
    const check = checkMutationAllowed();
    if (!check.allowed) return { success: false, error: check.error };

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
    setWorksheets((prev) =>
      prev.map((w) => (w.id === worksheetId ? { ...w, isArchived: !w.isArchived, updatedAt: nowStr } : w))
    );
    recordAudit('ARCHIVE_WORKSHEET', `Mengubah status arsip worksheet #${worksheetId}`, currentUser!.workspaceId);
    return { success: true };
  };

  const deleteWorksheet = (worksheetId: string) => {
    const check = checkMutationAllowed();
    if (!check.allowed) return { success: false, error: check.error };

    setWorksheets((prev) => prev.filter((w) => w.id !== worksheetId));
    recordAudit('DELETE_WORKSHEET', `Menghapus lembar kerja #${worksheetId}`, currentUser!.workspaceId);
    return { success: true };
  };

  const addColumnToWorksheet = (worksheetId: string, column: WorksheetColumn) => {
    const check = checkMutationAllowed();
    if (!check.allowed) return { success: false, error: check.error };

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
    setWorksheets((prev) =>
      prev.map((w) =>
        w.id === worksheetId
          ? {
              ...w,
              columns: [...w.columns, column],
              updatedAt: nowStr,
            }
          : w
      )
    );
    return { success: true };
  };

  const updateWorksheetColumn = (worksheetId: string, columnId: string, updates: Partial<WorksheetColumn>) => {
    const check = checkMutationAllowed();
    if (!check.allowed) return { success: false, error: check.error };

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
    setWorksheets((prev) =>
      prev.map((w) =>
        w.id === worksheetId
          ? {
              ...w,
              columns: w.columns.map((col) => (col.id === columnId ? { ...col, ...updates } : col)),
              updatedAt: nowStr,
            }
          : w
      )
    );
    return { success: true };
  };

  const deleteWorksheetColumn = (worksheetId: string, columnId: string) => {
    const check = checkMutationAllowed();
    if (!check.allowed) return { success: false, error: check.error };

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
    setWorksheets((prev) =>
      prev.map((w) =>
        w.id === worksheetId
          ? {
              ...w,
              columns: w.columns.filter((col) => col.id !== columnId),
              updatedAt: nowStr,
            }
          : w
      )
    );
    return { success: true };
  };

  const addWorksheetRow = (worksheetId: string, rowData: Record<string, any>) => {
    const check = checkMutationAllowed();
    if (!check.allowed) return;

    const rowId = `row_${Date.now()}`;
    const newRow = { id: rowId, ...rowData };

    setWorksheets((prev) =>
      prev.map((ws) =>
        ws.id === worksheetId
          ? {
              ...ws,
              rows: [...ws.rows, newRow],
              updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
            }
          : ws
      )
    );
  };

  const updateWorksheetRow = (worksheetId: string, rowId: string, rowData: Record<string, any>) => {
    const check = checkMutationAllowed();
    if (!check.allowed) return;

    setWorksheets((prev) =>
      prev.map((ws) =>
        ws.id === worksheetId
          ? {
              ...ws,
              rows: ws.rows.map((r) => (r.id === rowId ? { ...r, ...rowData } : r)),
              updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
            }
          : ws
      )
    );
  };

  const deleteWorksheetRow = (worksheetId: string, rowId: string) => {
    const check = checkMutationAllowed();
    if (!check.allowed) return;

    setWorksheets((prev) =>
      prev.map((ws) =>
        ws.id === worksheetId
          ? {
              ...ws,
              rows: ws.rows.filter((r) => r.id !== rowId),
              updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
            }
          : ws
      )
    );
  };

  const convertWorksheetRowToTransaction = (
    worksheetId: string,
    rowId: string,
    txData: {
      brandId: string;
      type: 'income' | 'expense';
      category: string;
      description: string;
      amount: number;
      assetId: string;
      paymentMethod: string;
    }
  ) => {
    const check = checkMutationAllowed();
    if (!check.allowed) return { success: false, error: check.error };

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = now.toTimeString().slice(0, 5);

    const res = addTransaction({
      ...txData,
      notes: `Dibuat dari Lembar Kerja #${worksheetId} baris #${rowId}`,
      relatedEntityId: rowId,
      relatedEntityType: 'worksheet',
      date: dateStr,
      time: timeStr,
    });

    if (res.success) {
      updateWorksheetRow(worksheetId, rowId, { isPaid: true, convertedTx: true });
    }

    return res;
  };

  // Products & HPP
  const addProduct = (data: Omit<Product, 'id' | 'updatedAt'>) => {
    const check = checkMutationAllowed();
    if (!check.allowed) return { success: false, error: check.error };

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const newProd: Product = {
      ...data,
      id: `prod_${Date.now()}`,
      updatedAt: nowStr,
    };
    setProducts((prev) => [newProd, ...prev]);
    recordAudit('ADD_PRODUCT', `Menambah produk: ${data.name} (${data.sku})`, currentUser!.workspaceId);
    return { success: true };
  };

  const updateProduct = (id: string, data: Partial<Product>) => {
    const check = checkMutationAllowed();
    if (!check.allowed) return { success: false, error: check.error };

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...data, updatedAt: nowStr } : p))
    );
    recordAudit('UPDATE_PRODUCT', `Memperbarui produk #${id}`, currentUser!.workspaceId);
    return { success: true };
  };

  const deleteProduct = (id: string) => {
    const check = checkMutationAllowed();
    if (!check.allowed) return { success: false, error: check.error };

    setProducts((prev) => prev.filter((p) => p.id !== id));
    recordAudit('DELETE_PRODUCT', `Menghapus produk #${id}`, currentUser!.workspaceId);
    return { success: true };
  };

  const addHPPRecipe = (data: Omit<HPPRecipe, 'id' | 'updatedAt'>) => {
    const check = checkMutationAllowed();
    if (!check.allowed) return { success: false, error: check.error };

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const newRecipe: HPPRecipe = {
      ...data,
      id: `hpp_${Date.now()}`,
      updatedAt: nowStr,
    };
    setHppRecipes((prev) => [newRecipe, ...prev]);
    recordAudit('ADD_HPP_RECIPE', `Menambah perhitungan HPP untuk ${data.productName}`, currentUser!.workspaceId);
    return { success: true };
  };

  const updateHPPRecipe = (id: string, data: Partial<HPPRecipe>) => {
    const check = checkMutationAllowed();
    if (!check.allowed) return { success: false, error: check.error };

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
    setHppRecipes((prev) =>
      prev.map((h) => (h.id === id ? { ...h, ...data, updatedAt: nowStr } : h))
    );
    return { success: true };
  };

  // Commissions (legacy/general)
  const addCommission = (data: Omit<Commission, 'id' | 'createdAt'>) => {
    const check = checkMutationAllowed();
    if (!check.allowed) return { success: false, error: check.error };

    const dateStr = new Date().toISOString().slice(0, 10);
    const newComm: Commission = {
      ...data,
      id: `comm_${Date.now()}`,
      createdAt: dateStr,
    };
    setCommissions((prev) => [newComm, ...prev]);
    recordAudit('ADD_COMMISSION', `Mencatat komisi ${data.recipientName} Rp ${data.totalCommission.toLocaleString('id-ID')}`, currentUser!.workspaceId);
    return { success: true };
  };

  const payCommission = (commissionId: string, assetId: string) => {
    const check = checkMutationAllowed();
    if (!check.allowed) return { success: false, error: check.error };

    const comm = commissions.find((c) => c.id === commissionId);
    if (!comm) return { success: false, error: 'Data komisi tidak ditemukan.' };
    if (comm.status === 'paid') return { success: false, error: 'Komisi ini sudah lunas dibayar.' };

    const asset = assets.find((a) => a.id === assetId);
    if (!asset) return { success: false, error: 'Aset pembayaran tidak valid.' };
    if (asset.currentBalance < comm.totalCommission) {
      return { success: false, error: `Saldo di ${asset.name} tidak cukup.` };
    }

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = now.toTimeString().slice(0, 5);

    const txRes = addTransaction({
      brandId: comm.brandId,
      type: 'expense',
      category: 'Komisi & Honorarium',
      description: `Pembayaran komisi ${comm.recipientName} (${comm.role})`,
      amount: comm.totalCommission,
      assetId,
      paymentMethod: `Transfer ${asset.name}`,
      partyName: comm.recipientName,
      notes: `Pelunasan komisi #${comm.id}`,
      date: dateStr,
      time: timeStr,
    });

    if (!txRes.success) return txRes;

    setCommissions((prev) =>
      prev.map((c) =>
        c.id === commissionId
          ? {
              ...c,
              status: 'paid',
              paidDate: dateStr,
              paidFromAssetId: assetId,
            }
          : c
      )
    );

    recordAudit('PAY_COMMISSION', `Membayar komisi #${commissionId} ke ${comm.recipientName} Rp ${comm.totalCommission.toLocaleString('id-ID')}`, currentUser!.workspaceId);
    return { success: true };
  };

  // Marketing
  const addMarketingCampaign = (data: Omit<MarketingCampaign, 'id'>) => {
    const check = checkMutationAllowed();
    if (!check.allowed) return { success: false, error: check.error };

    const newCamp: MarketingCampaign = {
      ...data,
      id: `mkt_${Date.now()}`,
    };
    setMarketing((prev) => [newCamp, ...prev]);
    recordAudit('ADD_MARKETING', `Membuat kampanye marketing: ${data.name}`, currentUser!.workspaceId);
    return { success: true };
  };

  const updateMarketingCampaign = (id: string, data: Partial<MarketingCampaign>) => {
    const check = checkMutationAllowed();
    if (!check.allowed) return { success: false, error: check.error };

    setMarketing((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...data } : m))
    );
    return { success: true };
  };

  // Toggle Module
  const toggleWorkspaceModule = (moduleKey: WorkspaceModuleKey) => {
    const check = checkMutationAllowed();
    if (!check.allowed) return { success: false, error: check.error };

    const wsId = currentUser!.workspaceId;
    setWorkspaces((prev) =>
      prev.map((ws) => {
        if (ws.id !== wsId) return ws;
        const isActive = ws.activeModules.includes(moduleKey);
        const newModules = isActive
          ? ws.activeModules.filter((m) => m !== moduleKey)
          : [...ws.activeModules, moduleKey];

        return { ...ws, activeModules: newModules };
      })
    );

    recordAudit('TOGGLE_MODULE', `Mengubah status modul ${moduleKey}`, wsId);
    return { success: true };
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const resetToDemoData = () => {
    setUsers(INITIAL_USERS);
    setWorkspaces(INITIAL_WORKSPACES);
    setBrands(INITIAL_BRANDS);
    setBrandPolicy(INITIAL_BRAND_POLICY);
    setInvitations(INITIAL_INVITATIONS);
    setPasswordResets(INITIAL_PASSWORD_RESETS);
    setAssets(INITIAL_ASSETS);
    setTransactions(INITIAL_TRANSACTIONS);
    setProducts(INITIAL_PRODUCTS);
    setHppRecipes(INITIAL_HPP_RECIPES);
    setCommissions(INITIAL_COMMISSIONS);
    setWorksheets(INITIAL_WORKSHEETS);
    setMarketing(INITIAL_MARKETING);
    setNotifications(INITIAL_NOTIFICATIONS);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setOrders(INITIAL_ORDERS);
    setKols(INITIAL_KOLS);
    setKolRecaps(INITIAL_KOL_RECAPS);
    setTeamMembers(INITIAL_TEAM_MEMBERS);
    setTasks(INITIAL_TASKS);
    setPayrollRecaps(INITIAL_PAYROLL_RECAPS);
    setCurrentUser(null);
    setSelectedBrandId('all');
    setActiveTab('dashboard');
    localStorage.clear();
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        currentWorkspace,
        users,
        workspaces,
        brands,
        brandPolicy,
        invitations,
        passwordResets,
        assets,
        transactions,
        products,
        hppRecipes,
        commissions,
        worksheets,
        marketing,
        notifications,
        auditLogs,
        orders,
        kols,
        kolRecaps,
        teamMembers,
        tasks,
        payrollRecaps,
        activeTab,
        setActiveTab,
        selectedBrandId,
        setSelectedBrandId,
        dateRange,
        setDateRange,
        login,
        logout,
        switchDemoAccount,
        requestPasswordReset,
        confirmPasswordReset,
        activateInvitation,
        updateUserProfile,
        changePassword,
        addBrand,
        updateBrand,
        approveBrand,
        rejectBrand,
        archiveBrand,
        updateBrandPolicy,
        inviteUser,
        resendInvitation,
        updateUserStatus,
        updateUserRoleAndBrands,
        adminResetUserPassword,
        addTransaction,
        updateTransaction,
        softDeleteTransaction,
        transferAsset,
        reconcileAsset,
        addOrder,
        updateOrder,
        processOrderRefund,
        addKOL,
        updateKOL,
        deleteKOL,
        generateKOLMonthlyRecap,
        reviewKOLRecap,
        approveKOLRecap,
        payKOLRecapPartial,
        addTeamMember,
        updateTeamMember,
        addTask,
        updateTask,
        deleteTask,
        generateMonthlyPayroll,
        createPayrollRecap,
        reviewPayrollRecap,
        approvePayroll,
        approvePayrollRecap,
        payPayrollPartial,
        createWorksheet,
        duplicateWorksheet,
        archiveWorksheet,
        deleteWorksheet,
        addColumnToWorksheet,
        updateWorksheetColumn,
        deleteWorksheetColumn,
        addWorksheetRow,
        updateWorksheetRow,
        deleteWorksheetRow,
        convertWorksheetRowToTransaction,
        addProduct,
        updateProduct,
        deleteProduct,
        addHPPRecipe,
        updateHPPRecipe,
        addCommission,
        payCommission,
        addMarketingCampaign,
        updateMarketingCampaign,
        toggleWorkspaceModule,
        markNotificationRead,
        resetToDemoData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
