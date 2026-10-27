import * as XLSX from 'xlsx';
import {
  Transaction,
  Asset,
  Product,
  HPPRecipe,
  Commission,
  MarketingCampaign,
  Brand,
  Order,
  KOL,
  KOLCommissionRecap,
  TeamMember,
  Task,
  PayrollRecap,
  Worksheet,
} from '../types';

export function formatRupiahNumber(val: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(val);
}

export interface ExportDataPayload {
  title: string;
  workspaceName: string;
  brandName?: string;
  dateRangeLabel: string;
  brands: Brand[];
  transactions: Transaction[];
  assets: Asset[];
  products?: Product[];
  hppRecipes?: HPPRecipe[];
  commissions?: Commission[];
  marketing?: MarketingCampaign[];
  orders?: Order[];
  kols?: KOL[];
  kolRecaps?: KOLCommissionRecap[];
  teamMembers?: TeamMember[];
  tasks?: Task[];
  payrollRecaps?: PayrollRecap[];
  worksheets?: Worksheet[];
}

export function exportFullFinancialReport(payload: ExportDataPayload): void {
  const wb = XLSX.utils.book_new();

  const brandMap = new Map<string, string>();
  payload.brands.forEach((b) => brandMap.set(b.id, b.name));

  const assetMap = new Map<string, string>();
  payload.assets.forEach((a) => assetMap.set(a.id, a.name));

  // 1. Sheet: Ringkasan Arus Kas & Laba Rugi Operasional (Seksi 9.1 PRD)
  let totalIncome = 0;
  let totalExpense = 0;
  let totalPurchase = 0;

  payload.transactions.forEach((tx) => {
    if (tx.isDeleted) return;
    if (tx.type === 'income') totalIncome += tx.amount;
    else if (tx.type === 'expense') totalExpense += tx.amount;
    else if (tx.type === 'purchase') totalPurchase += tx.amount;
  });

  const netCashFlow = totalIncome - totalExpense - totalPurchase;
  const totalAssetsBalance = payload.assets.reduce((sum, a) => sum + a.currentBalance, 0);

  // Orders metrics
  const activeOrders = payload.orders || [];
  const grossSalesOrders = activeOrders.reduce((sum, o) => sum + o.grossSales, 0);
  const discountsOrders = activeOrders.reduce((sum, o) => sum + o.discount, 0);
  const refundsOrders = activeOrders.reduce((sum, o) => sum + o.refundAmount, 0);
  const netSalesOrders = activeOrders.reduce((sum, o) => sum + (o.status !== 'cancelled' ? o.netSales : 0), 0);

  // KOL recap metrics
  const activeKolRecaps = payload.kolRecaps || [];
  const kolCommissionsApproved = activeKolRecaps
    .filter((k) => k.status === 'approved' || k.status === 'partially_paid' || k.status === 'paid')
    .reduce((sum, k) => sum + k.finalCommission, 0);

  // Payroll metrics
  const activePayroll = payload.payrollRecaps || [];
  const payrollApproved = activePayroll
    .filter((p) => p.status === 'approved' || p.status === 'partially_paid' || p.status === 'paid')
    .reduce((sum, p) => sum + p.totalCompensation, 0);

  const summaryData = [
    ['BIZFLOW - LAPORAN KEUANGAN & BISNIS MULTI-BRAND'],
    ['Ruang Kerja:', payload.workspaceName],
    ['Brand Terpilih:', payload.brandName || 'Semua Brand'],
    ['Periode:', payload.dateRangeLabel],
    ['Tanggal Ekspor:', new Date().toLocaleString('id-ID')],
    [''],
    ['1. RINGKASAN ARUS KAS (AKTUAL REALISASI KAS)'],
    ['Indikator', 'Nominal (IDR)', 'Keterangan'],
    ['Total Saldo Seluruh Aset', totalAssetsBalance, 'Likuiditas riil kas, rekening bank & e-wallet'],
    ['Total Arus Kas Masuk (Pemasukan)', totalIncome, 'Total uang masuk aktual yang tercatat di kas'],
    ['Total Pengeluaran Kas Operasional', totalExpense, 'Beban operasional yang sudah dibayar kas'],
    ['Total Pembelian Bahan Baku / Aset', totalPurchase, 'Belanja persediaan & perlengkapan'],
    ['Arus Kas Bersih (Net Cash Flow)', netCashFlow, 'Surplus / Defisit arus kas aktual'],
    [''],
    ['2. LABA RUGI OPERASIONAL (SEKSI 9.1 PRD - ACCRUAL / RECOGNIZED)'],
    ['Penjualan Kotor (Gross Sales Pesanan)', grossSalesOrders, 'Total penjualan kotor dari pesanan'],
    ['Diskon Penjualan', discountsOrders, 'Potongan harga'],
    ['Refund Pesanan', refundsOrders, 'Pengembalian dana (mengurangi penjualan & kelayakan komisi)'],
    ['Penjualan Bersih (Net Sales)', netSalesOrders, 'Gross Sales - Diskon - Refund'],
    ['Kewajiban Komisi KOL Disetujui', kolCommissionsApproved, 'Komisi influencer/affiliate teratribusi'],
    ['Kewajiban Payroll Tim Disetujui', payrollApproved, 'Gaji & honor tim periode berjalan'],
    [''],
    ['Catatan Integritas Keuangan:'],
    ['* Transfer internal antar rekening TIDAK dihitung sebagai pemasukan atau pengeluaran bisnis.'],
    ['* Penjualan KOL merupakan atribut pesanan, BUKAN pendapatan tambahan di luar total penjualan.'],
    ['* Angka di atas bersumber dari database BizFlow yang telah terverifikasi.'],
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan');

  // 2. Sheet: Transaksi
  const txRows = payload.transactions
    .filter((tx) => !tx.isDeleted)
    .map((tx) => ({
      'ID Transaksi': tx.id,
      Tanggal: tx.date,
      Waktu: tx.time,
      Brand: brandMap.get(tx.brandId) || tx.brandId,
      'Jenis Transaksi':
        tx.type === 'income'
          ? 'Pemasukan'
          : tx.type === 'expense'
          ? 'Pengeluaran'
          : tx.type === 'purchase'
          ? 'Pembelian'
          : tx.type === 'transfer'
          ? 'Transfer Antar-Aset'
          : tx.type === 'refund'
          ? 'Refund'
          : 'Penyesuaian',
      Kategori: tx.category,
      Deskripsi: tx.description,
      'Nominal (IDR)': tx.amount,
      'Sumber Dana / Aset': assetMap.get(tx.assetId) || tx.assetId,
      'Aset Tujuan (Transfer)': tx.targetAssetId ? assetMap.get(tx.targetAssetId) || tx.targetAssetId : '-',
      'Metode Bayar': tx.paymentMethod,
      'Pihak Terkait (Vendor/Klien)': tx.partyName || '-',
      Catatan: tx.notes || '-',
      Pembuat: tx.createdBy,
    }));

  const wsTransactions = XLSX.utils.json_to_sheet(txRows);
  XLSX.utils.book_append_sheet(wb, wsTransactions, 'Daftar Transaksi');

  // 3. Sheet: Aset & Rekening
  const assetRows = payload.assets.map((a) => ({
    'Nama Akun / Kas': a.name,
    Tipe: a.type === 'bank' ? 'Rekening Bank' : a.type === 'cash' ? 'Kas Tunai' : 'E-Wallet',
    'Bank / Lembaga': a.bankName || '-',
    'Nomor Rekening': a.accountNumber || '-',
    'Saldo Awal (IDR)': a.initialBalance,
    'Saldo Berjalan (IDR)': a.currentBalance,
    Catatan: a.notes || '-',
    'Terakhir Diperbarui': a.updatedAt,
  }));
  const wsAssets = XLSX.utils.json_to_sheet(assetRows);
  XLSX.utils.book_append_sheet(wb, wsAssets, 'Aset & Sumber Dana');

  // 4. Sheet: Pesanan & Penjualan (Orders)
  if (payload.orders && payload.orders.length > 0) {
    const kolMap = new Map<string, string>();
    payload.kols?.forEach((k) => kolMap.set(k.id, k.name));
    const mktMap = new Map<string, string>();
    payload.marketing?.forEach((m) => mktMap.set(m.id, m.name));

    const orderRows = payload.orders.map((o) => ({
      'ID Pesanan': o.id,
      Tanggal: o.orderDate,
      Brand: brandMap.get(o.brandId) || o.brandId,
      Pelanggan: o.customerName,
      'KOL Sumber': o.kolId ? kolMap.get(o.kolId) || o.kolId : 'Organik / Non-KOL',
      'Kode Affiliate': o.affiliateCode || '-',
      'Kampanye Terkait': o.campaignId ? mktMap.get(o.campaignId) || o.campaignId : '-',
      'Penjualan Kotor (IDR)': o.grossSales,
      'Diskon (IDR)': o.discount,
      'Refund (IDR)': o.refundAmount,
      'Penjualan Bersih (IDR)': o.netSales,
      'Kelayakan Komisi': o.commissionEligible ? 'LAYAK' : 'TIDAK LAYAK',
      'Status Pesanan': o.status.toUpperCase(),
      Catatan: o.notes || '-',
    }));
    const wsOrders = XLSX.utils.json_to_sheet(orderRows);
    XLSX.utils.book_append_sheet(wb, wsOrders, 'Pesanan & Atribusi');
  }

  // 5. Sheet: Database KOL & Influencer
  if (payload.kols && payload.kols.length > 0) {
    const kolRows = payload.kols.map((k) => {
      const kOrders = payload.orders?.filter((o) => o.kolId === k.id && o.status !== 'cancelled') || [];
      const kSales = kOrders.reduce((sum, o) => sum + o.netSales, 0);
      const kRecaps = payload.kolRecaps?.filter((r) => r.kolId === k.id) || [];
      const kPaid = kRecaps.reduce((sum, r) => sum + r.totalPaid, 0);

      return {
        'ID KOL': k.id,
        Nama: k.name,
        Akun: k.handleOrAccount,
        Platform: k.platform,
        Brand: brandMap.get(k.brandId) || k.brandId,
        'Jenis Kolaborasi': k.collaborationType,
        'Kode Referral / Link': k.affiliateCode || k.trackingLink || '-',
        'Metode Komisi': k.commissionMethod,
        'Tarif Komisi': k.commissionMethod === 'percentage_sales' ? `${k.commissionRate}%` : `Rp ${k.commissionRate}`,
        'Total Pesanan Teratribusi': kOrders.length,
        'Total Penjualan Teratribusi (IDR)': kSales,
        'Total Komisi Dibayar (IDR)': kPaid,
        Status: k.isActive ? 'AKTIF' : 'NONAKTIF',
      };
    });
    const wsKols = XLSX.utils.json_to_sheet(kolRows);
    XLSX.utils.book_append_sheet(wb, wsKols, 'Database KOL');
  }

  // 6. Sheet: Rekap Komisi KOL Bulanan
  if (payload.kolRecaps && payload.kolRecaps.length > 0) {
    const recapRows = payload.kolRecaps.map((r) => ({
      'ID Rekap': r.id,
      Nama: r.kolName,
      Brand: brandMap.get(r.brandId) || r.brandId,
      Periode: r.period,
      'Pesanan Valid': r.validOrdersCount,
      'Penjualan Teratribusi (IDR)': r.attributedGrossSales,
      'Refund Teratribusi (IDR)': r.refundedAmount,
      'Komisi Kotor (IDR)': r.grossCommission,
      'Penyesuaian (IDR)': r.adjustments,
      'Komisi Final (IDR)': r.finalCommission,
      'Total Sudah Dibayar (IDR)': r.totalPaid,
      'Saldo Terutang (IDR)': r.outstandingBalance,
      Status: r.status.toUpperCase(),
      'Tanggal Disetujui': r.approvalDate || '-',
    }));
    const wsRecaps = XLSX.utils.json_to_sheet(recapRows);
    XLSX.utils.book_append_sheet(wb, wsRecaps, 'Rekap Komisi KOL');
  }

  // 7. Sheet: Anggota Tim
  if (payload.teamMembers && payload.teamMembers.length > 0) {
    const teamRows = payload.teamMembers.map((t) => {
      const assigned = payload.tasks?.filter((tsk) => tsk.assigneeId === t.id).length || 0;
      const completed = payload.tasks?.filter((tsk) => tsk.assigneeId === t.id && tsk.status === 'done').length || 0;

      return {
        'ID Anggota': t.id,
        Nama: t.name,
        Role: t.roleOrPosition,
        Brand: brandMap.get(t.brandId) || t.brandId,
        'Jenis Kompensasi': t.compensationType,
        'Gaji Pokok / Tarif Dasar (IDR)': t.baseRate,
        'Tugas Ditugaskan': assigned,
        'Tugas Selesai': completed,
        Status: t.isActive ? 'AKTIF' : 'NONAKTIF',
        Kontak: t.contactInfo,
      };
    });
    const wsTeam = XLSX.utils.json_to_sheet(teamRows);
    XLSX.utils.book_append_sheet(wb, wsTeam, 'Anggota Tim');
  }

  // 8. Sheet: Tugas Kerja (Tasks)
  if (payload.tasks && payload.tasks.length > 0) {
    const taskRows = payload.tasks.map((t) => ({
      'ID Tugas': t.id,
      Judul: t.title,
      Brand: brandMap.get(t.brandId) || t.brandId,
      'Penanggung Jawab': t.assigneeName || '-',
      Prioritas: t.priority.toUpperCase(),
      Status: t.status.toUpperCase(),
      'Estimasi Biaya / Honor (IDR)': t.estimatedFee || 0,
      'Honorarium Disetujui': t.feeApproved ? 'DISETUJUI UNTUK PAYROLL' : 'BELUM',
      'Tenggat Waktu': t.deadline || '-',
    }));
    const wsTasks = XLSX.utils.json_to_sheet(taskRows);
    XLSX.utils.book_append_sheet(wb, wsTasks, 'Tugas Tim');
  }

  // 9. Sheet: Rekap Payroll Bulanan
  if (payload.payrollRecaps && payload.payrollRecaps.length > 0) {
    const payRows = payload.payrollRecaps.map((p) => ({
      'ID Payroll': p.id,
      Nama: p.teamMemberName,
      Brand: brandMap.get(p.brandId) || p.brandId,
      Periode: p.period,
      'Gaji Pokok (IDR)': p.baseSalary,
      'Honor Tugas / Proyek (IDR)': p.taskFees,
      'Insentif & Bonus (IDR)': p.incentives,
      'Reimbursement (IDR)': p.reimbursements,
      'Total Hak Kompensasi (IDR)': p.totalCompensation,
      'Total Sudah Dibayar (IDR)': p.totalPaid,
      'Saldo Terutang (IDR)': p.outstandingBalance,
      Status: p.status.toUpperCase(),
      'Tanggal Disetujui': p.approvalDate || '-',
    }));
    const wsPayroll = XLSX.utils.json_to_sheet(payRows);
    XLSX.utils.book_append_sheet(wb, wsPayroll, 'Rekap Payroll');
  }

  // 10. Sheet: Produk (jika ada)
  if (payload.products && payload.products.length > 0) {
    const prodRows = payload.products.map((p) => ({
      SKU: p.sku,
      'Nama Produk/Layanan': p.name,
      Brand: brandMap.get(p.brandId) || p.brandId,
      Kategori: p.category,
      'Harga Jual (IDR)': p.price,
      'Estimasi HPP (IDR)': p.estimatedHpp || 0,
      'Estimasi Laba Kotor': p.price - (p.estimatedHpp || 0),
      Stok: p.stock,
      Satuan: p.unit,
      'Batas Alert Stok': p.minStockAlert,
    }));
    const wsProd = XLSX.utils.json_to_sheet(prodRows);
    XLSX.utils.book_append_sheet(wb, wsProd, 'Katalog Produk');
  }

  // 11. Sheet: HPP & Resep (jika ada)
  if (payload.hppRecipes && payload.hppRecipes.length > 0) {
    const hppRows = payload.hppRecipes.map((h) => ({
      'Nama Produk': h.productName,
      'Batch Qty': h.batchQuantity,
      'Biaya Bahan Baku': h.materials.reduce((s, m) => s + m.totalCost, 0),
      'Tenaga Kerja Langsung': h.directLaborCost,
      'Biaya Kemasan': h.packagingCost,
      Overhead: h.overheadCost,
      'Total HPP Per Unit (IDR)': h.totalHppPerUnit,
      'Harga Jual (IDR)': h.sellingPrice,
      'Laba Kotor Per Unit (IDR)': h.grossProfitPerUnit,
      'Margin Kotor (%)': `${h.grossMarginPercent}%`,
    }));
    const wsHpp = XLSX.utils.json_to_sheet(hppRows);
    XLSX.utils.book_append_sheet(wb, wsHpp, 'HPP & Resep Biaya');
  }

  // Generate filename
  const cleanTitle = payload.workspaceName.replace(/\s+/g, '_');
  const dateStr = new Date().toISOString().slice(0, 10);
  const fileName = `BizFlow_${cleanTitle}_${dateStr}.xlsx`;

  XLSX.writeFile(wb, fileName);
}
