export type UserRole =
  | 'super_admin'
  | 'owner'
  | 'staff'
  | 'ika'
  | 'redi'
  | 'admin';

export type UserAccountStatus = 'active' | 'invited' | 'suspended' | 'disabled';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  phone?: string;
  bio?: string;
  workspaceId: string; // 'ws_superadmin' | 'ws_ika' | 'ws_redi' | 'ws_admin'
  status: UserAccountStatus;
  allowedBrandIds?: string[];
  passwordHash?: string;
  passwordSalt?: string;
  lastLoginAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserInvitation {
  id: string;
  email: string;
  fullName: string;
  assignedRole: UserRole;
  allowedBrandIds: string[];
  workspaceId: string;
  invitedBy: string;
  invitedByName: string;
  token: string;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  expiresAt: string;
  createdAt: string;
  acceptedAt?: string;
  notes?: string;
}

export interface PasswordResetRequest {
  id: string;
  email: string;
  token: string;
  expiresAt: string;
  isUsed: boolean;
  createdAt: string;
}

export interface BrandPolicyConfig {
  allowUserCreateBrand: boolean;
  requireAdminApproval: boolean;
  maxBrandsPerUser: number;
  allowSelfRegistration: boolean;
}

export interface Workspace {
  id: string;
  name: string;
  ownerName: string;
  ownerEmail: string;
  allowedBrandIds: string[];
  activeModules: WorkspaceModuleKey[];
}

export type WorkspaceModuleKey =
  | 'stock'
  | 'hpp'
  | 'commission'
  | 'worksheet'
  | 'marketing'
  | 'kol'
  | 'orders'
  | 'team'
  | 'payroll';

export interface ModuleConfig {
  key: WorkspaceModuleKey;
  name: string;
  description: string;
  icon: string;
  defaultForIka: boolean;
  defaultForRedi: boolean;
}

export type BusinessCategory =
  | 'Aksesori / Perhiasan Handmade'
  | 'Fashion & Pakaian'
  | 'Event / Program Pemuda'
  | 'Media / Promosi / Agency'
  | 'Jasa / Proyek Kreatif'
  | 'Retail / Reseller'
  | 'Workshop / Kursus'
  | 'Lainnya / Custom';

export type BrandStatus = 'active' | 'pending_approval' | 'rejected' | 'archived';

export interface BrandBusinessContact {
  email?: string;
  phone?: string;
  address?: string;
}

export interface Brand {
  id: string;
  workspaceId: string;
  name: string;
  code: string;
  category: BusinessCategory;
  description: string;
  color: string;
  logoUrl?: string;
  businessContact?: BrandBusinessContact;
  ownerUserId?: string;
  status?: BrandStatus;
  approvalNotes?: string;
  createdAt: string;
  updatedAt?: string;
}

export type AssetType = 'cash' | 'bank' | 'ewallet' | 'other';

export interface Asset {
  id: string;
  workspaceId: string;
  brandId?: string;
  name: string;
  type: AssetType;
  bankName?: string;
  accountNumber?: string;
  initialBalance: number;
  currentBalance: number;
  notes?: string;
  updatedAt: string;
}

export type TransactionType =
  | 'income' // Pemasukan bisnis
  | 'expense' // Pengeluaran operasional
  | 'purchase' // Pembelian bahan baku/aset
  | 'transfer' // Mutasi antar aset/kas (tidak memengaruhi laba)
  | 'refund' // Pengembalian dana
  | 'adjustment'; // Penyesuaian saldo manual

export interface AuditEntry {
  timestamp: string;
  action: 'create' | 'update' | 'soft_delete' | 'reconcile' | 'approve' | 'pay';
  userName: string;
  userRole: UserRole;
  details: string;
}

export interface Transaction {
  id: string;
  workspaceId: string;
  brandId: string;
  type: TransactionType;
  category: string;
  description: string;
  amount: number;
  assetId: string; // Sumber dana / aset asal
  targetAssetId?: string; // Aset tujuan jika transfer internal
  paymentMethod: string; // Transfer Bank, QRIS, Tunai, Kartu, dsb.
  partyName?: string; // Vendor, Pelanggan, Klien, KOL, Anggota Tim
  receiptUrl?: string; // Bukti transaksi / file lampiran
  relatedEntityId?: string; // ID Pesanan, ID Rekap Komisi, ID Payroll
  relatedEntityType?: 'order' | 'kol_recap' | 'payroll' | 'worksheet' | 'task';
  notes?: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  isDeleted?: boolean;
  auditLog: AuditEntry[];
}

export interface Product {
  id: string;
  workspaceId: string;
  brandId: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  estimatedHpp?: number;
  stock: number;
  minStockAlert: number;
  unit: string;
  notes?: string;
  updatedAt: string;
}

export interface HPPMaterialItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
}

export interface HPPRecipe {
  id: string;
  workspaceId: string;
  brandId: string;
  productId: string;
  productName: string;
  batchQuantity: number;
  materials: HPPMaterialItem[];
  directLaborCost: number;
  packagingCost: number;
  overheadCost: number;
  totalHppPerUnit: number;
  sellingPrice: number;
  grossProfitPerUnit: number;
  grossMarginPercent: number;
  updatedAt: string;
}

// -------------------------------------------------------------
// PESANAN & ATRIBUSI KOL
// -------------------------------------------------------------
export type OrderStatus = 'completed' | 'processing' | 'refunded' | 'cancelled';

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Order {
  id: string;
  workspaceId: string;
  brandId: string;
  orderNumber: string;
  orderDate: string;
  customerName: string;
  customerContact?: string;
  items: OrderItem[];
  grossSales: number; // Nilai kotor
  discount: number; // Diskon potongan
  refundAmount: number; // Pengembalian dana jika terjadi retur/refund
  netSales: number; // grossSales - discount - refundAmount
  status: OrderStatus;
  // Atribusi KOL
  kolId?: string; // KOL sumber
  campaignId?: string; // Kampanye terkait
  affiliateCode?: string; // Kode referral
  commissionEligible: boolean; // True jika pesanan valid untuk dihitung komisi
  paymentMethod: string;
  notes?: string;
  relatedTransactionId?: string; // Hubungan ke transaksi kas resmi
  createdAt: string;
  updatedAt: string;
}

// -------------------------------------------------------------
// DATABASE KOL & KAMPANYE
// -------------------------------------------------------------
export type KOLCollaborationType =
  | 'paid_promotion'
  | 'barter'
  | 'affiliate'
  | 'sales_commission'
  | 'hybrid';

export type KOLCommissionMethod =
  | 'percentage_sales' // % dari penjualan valid
  | 'fixed_per_order' // Nominal tetap per pesanan valid
  | 'product_specific' // Tarif khusus produk
  | 'campaign_specific' // Tarif khusus kampanye
  | 'hybrid_fixed_plus_pct'; // Biaya tetap + komisi %

export interface KOL {
  id: string;
  workspaceId: string;
  brandId: string;
  name: string;
  handleOrAccount: string;
  contactInfo: string;
  platform: 'Instagram' | 'TikTok' | 'YouTube' | 'Twitter/X' | 'Blog' | 'Lainnya';
  collaborationType: KOLCollaborationType;
  affiliateCode?: string;
  trackingLink?: string;
  campaignId?: string;
  startDate: string;
  endDate: string;
  commissionMethod: KOLCommissionMethod;
  commissionRate: number; // e.g. 10 (%) atau 50000 (Rp/order)
  fixedBaseFee?: number; // Biaya dasar jika kolaborasi hybrid/paid promo
  isActive: boolean;
  notes?: string;
  createdAt: string;
}

// Rekap Komisi Bulanan KOL
export type RecapStatus =
  | 'draft'
  | 'review'
  | 'approved'
  | 'partially_paid'
  | 'paid'
  | 'cancelled';

export interface PartialPaymentRecord {
  id: string;
  paymentDate: string;
  amount: number;
  assetId: string;
  assetName: string;
  paymentMethod: string;
  transactionId: string; // ID transaksi resmi di jurnal kas
  receiptNote?: string;
  paidBy: string;
}

export interface KOLCommissionRecap {
  id: string;
  workspaceId: string;
  brandId: string;
  kolId: string;
  kolName: string;
  period: string; // YYYY-MM
  validOrdersCount: number;
  attributedGrossSales: number;
  cancelledOrdersCount: number;
  refundedAmount: number;
  calculationBaseAmount: number; // Penjualan bersih yang memenuhi syarat komisi
  commissionRate: number;
  grossCommission: number;
  adjustments: number; // Penyesuaian (+ / -) dengan memo
  adjustmentReason?: string;
  finalCommission: number; // grossCommission + adjustments
  totalPaid: number; // Total yang sudah dibayarkan
  outstandingBalance: number; // finalCommission - totalPaid
  status: RecapStatus;
  approvalDate?: string;
  approvedBy?: string;
  payments: PartialPaymentRecord[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// -------------------------------------------------------------
// MANAJEMEN TIM, TUGAS & KOMPENSASI
// -------------------------------------------------------------
export type CompensationType =
  | 'monthly_salary' // Gaji bulanan
  | 'project_fee' // Honorarium proyek
  | 'event_fee' // Honorarium event
  | 'task_based' // Pembayaran berdasarkan tugas
  | 'target_incentive' // Insentif target
  | 'sales_commission' // Komisi penjualan
  | 'reimbursement'; // Reimbursement

export interface TeamMember {
  id: string;
  workspaceId: string;
  brandId: string;
  name: string;
  contactInfo: string;
  roleOrPosition: string;
  compensationType: CompensationType;
  baseRate: number; // Gaji pokok atau tarif default
  effectivePeriod?: string;
  isActive: boolean;
  notes?: string;
  createdAt: string;
}

export type TaskStatus =
  | 'todo'
  | 'in_progress'
  | 'review'
  | 'revision'
  | 'done'
  | 'cancelled';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: string;
  workspaceId: string;
  brandId: string;
  title: string;
  description: string;
  assigneeId?: string; // ID TeamMember
  assigneeName?: string;
  relatedProjectOrEvent?: string;
  priority: TaskPriority;
  startDate: string;
  deadline: string;
  status: TaskStatus;
  estimatedFee?: number; // Estimasi biaya/honor (tidak otomatis jadi beban kas)
  approvedFee?: number; // Honor yang disetujui untuk masuk ke payroll
  feeApproved?: boolean;
  includedInPayrollId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// -------------------------------------------------------------
// PAYROLL, HONORARIUM & PEMBAYARAN TIM
// -------------------------------------------------------------
export interface PayrollRecap {
  id: string;
  workspaceId: string;
  brandId: string;
  period: string; // YYYY-MM
  teamMemberId: string;
  teamMemberName: string;
  roleOrPosition: string;
  baseSalary: number;
  projectOrEventFee: number;
  taskFees: number;
  incentives: number;
  reimbursements: number;
  adjustments: number;
  adjustmentReason?: string;
  totalCompensation: number; // total hak pembayaran
  totalPaid: number;
  outstandingBalance: number; // totalCompensation - totalPaid
  status: RecapStatus;
  approvalDate?: string;
  approvedBy?: string;
  payments: PartialPaymentRecord[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// -------------------------------------------------------------
// DYNAMIC WORKSHEET (EXTENDED)
// -------------------------------------------------------------
export type WorksheetColumnType =
  | 'text'
  | 'number'
  | 'currency'
  | 'date'
  | 'select'
  | 'checkbox'
  | 'status'
  | 'team_member'
  | 'product'
  | 'kol'
  | 'campaign'
  | 'order'
  | 'transaction'
  | 'task'
  | 'project';

export interface WorksheetColumn {
  id: string;
  label: string;
  type: WorksheetColumnType;
  options?: string[]; // Untuk tipe select atau status
}

export interface Worksheet {
  id: string;
  workspaceId: string;
  brandId: string;
  title: string;
  description: string;
  templateType: 'production' | 'event' | 'client_pipeline' | 'custom' | 'marketing' | 'task_tracker';
  columns: WorksheetColumn[];
  rows: Record<string, any>[];
  isArchived?: boolean;
  updatedAt: string;
  createdAt: string;
}

// -------------------------------------------------------------
// KOMISI LAMA / AFFILIATE TRANSAKSI
// -------------------------------------------------------------
export interface Commission {
  id: string;
  workspaceId: string;
  brandId: string;
  recipientName: string;
  role: string;
  calculationType: 'percentage' | 'fixed';
  rate: number;
  baseAmount: number;
  totalCommission: number;
  status: 'unpaid' | 'paid';
  relatedTransactionId?: string;
  paidDate?: string;
  paidFromAssetId?: string;
  notes?: string;
  createdAt: string;
}

// -------------------------------------------------------------
// MARKETING & NOTIFIKASI
// -------------------------------------------------------------
export type MarketingChannel =
  | 'Instagram Ads'
  | 'TikTok Ads'
  | 'Google Search'
  | 'Influencer / KOL'
  | 'Event Offline'
  | 'Referral'
  | 'Lainnya';

export interface MarketingCampaign {
  id: string;
  workspaceId: string;
  brandId: string;
  name: string;
  channel: MarketingChannel;
  plannedBudget: number;
  actualSpend: number;
  leads: number;
  conversions: number;
  attributedRevenue: number;
  startDate: string;
  endDate: string;
  status: 'draft' | 'active' | 'completed';
  kolIds?: string[];
  notes?: string;
}

export interface AppNotification {
  id: string;
  workspaceId: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'danger';
  timestamp: string;
  isRead: boolean;
  linkTab?: string;
}

export interface SystemAuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  workspaceId: string;
  details: string;
}
