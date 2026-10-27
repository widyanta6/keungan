import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PayrollRecap, RecapStatus } from '../../types';
import {
  DollarSign,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  CreditCard,
  History,
  FileSpreadsheet,
  Search,
  Filter,
  X,
  UserCheck,
  Building2,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

export const PayrollView: React.FC = () => {
  const {
    currentUser,
    brands,
    assets,
    payrollRecaps,
    teamMembers,
    tasks,
    selectedBrandId,
    createPayrollRecap,
    reviewPayrollRecap,
    approvePayrollRecap,
    payPayrollPartial,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [periodFilter, setPeriodFilter] = useState<string>('all');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [payingPayroll, setPayingPayroll] = useState<PayrollRecap | null>(null);
  const [viewingHistoryPayroll, setViewingHistoryPayroll] = useState<PayrollRecap | null>(null);

  // New Payroll Form State
  const [newTeamMemberId, setNewTeamMemberId] = useState('');
  const [newBrandId, setNewBrandId] = useState('');
  const [newPeriod, setNewPeriod] = useState('2026-10');
  const [newBaseSalary, setNewBaseSalary] = useState<number>(0);
  const [newTaskFees, setNewTaskFees] = useState<number>(0);
  const [newIncentives, setNewIncentives] = useState<number>(0);
  const [newReimbursements, setNewReimbursements] = useState<number>(0);
  const [newNotes, setNewNotes] = useState('');
  const [formError, setFormError] = useState('');

  // Payment Modal State
  const [payAmountStr, setPayAmountStr] = useState('');
  const [payAssetId, setPayAssetId] = useState('');
  const [payMethod, setPayMethod] = useState('Transfer Bank');
  const [payNotes, setPayNotes] = useState('');
  const [payError, setPayError] = useState('');

  if (!currentUser) return null;
  const isAdmin = currentUser.role === 'admin';

  const userBrands = brands;
  const userAssets = assets;

  const brandMap = new Map<string, string>();
  brands.forEach((b) => brandMap.set(b.id, b.name));

  const userTeamMembers = teamMembers;

  // Filter Recaps
  const filteredRecaps = payrollRecaps.filter((p) => {
    if (p.brandId && !brands.some((b) => b.id === p.brandId)) return false;
    if (selectedBrandId !== 'all' && p.brandId !== selectedBrandId) return false;
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (periodFilter !== 'all' && p.period !== periodFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = p.teamMemberName.toLowerCase().includes(q);
      const bName = brandMap.get(p.brandId) || '';
      const matchBrand = bName.toLowerCase().includes(q);
      const matchPeriod = p.period.toLowerCase().includes(q);
      if (!matchName && !matchBrand && !matchPeriod) return false;
    }
    return true;
  });

  // Calculate KPIs
  const totalHakBulanIni = filteredRecaps.reduce((acc, p) => acc + p.totalCompensation, 0);
  const totalSudahDibayar = filteredRecaps.reduce((acc, p) => acc + p.totalPaid, 0);
  const totalSaldoTerutang = filteredRecaps.reduce((acc, p) => acc + p.outstandingBalance, 0);
  const pendingApprovalCount = filteredRecaps.filter(
    (p) => p.status === 'draft' || p.status === 'review'
  ).length;

  const handleOpenCreateModal = () => {
    const defaultBrand = userBrands[0]?.id || '';
    setNewBrandId(defaultBrand);
    const availableMembers = userTeamMembers.filter(
      (m) => defaultBrand === '' || m.brandId === defaultBrand
    );
    const defaultMember = availableMembers[0] || userTeamMembers[0];
    if (defaultMember) {
      setNewTeamMemberId(defaultMember.id);
      setNewBaseSalary(defaultMember.baseRate || 0);
    } else {
      setNewTeamMemberId('');
      setNewBaseSalary(0);
    }
    setNewPeriod('2026-10');
    setNewTaskFees(0);
    setNewIncentives(0);
    setNewReimbursements(0);
    setNewNotes('');
    setFormError('');
    setIsCreateModalOpen(true);
  };

  const handleMemberSelectChange = (memberId: string) => {
    setNewTeamMemberId(memberId);
    const m = userTeamMembers.find((mem) => mem.id === memberId);
    if (m) {
      setNewBaseSalary(m.baseRate || 0);
      setNewBrandId(m.brandId);
      // Auto-calculate completed task fees for this member
      const memberTasks = tasks.filter(
        (t) => t.assigneeId === memberId && t.status === 'done' && t.estimatedFee
      );
      const totalEstimatedFees = memberTasks.reduce((acc, t) => acc + (t.estimatedFee || 0), 0);
      setNewTaskFees(totalEstimatedFees);
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!newTeamMemberId) {
      setFormError('Pilih anggota tim terlebih dahulu.');
      return;
    }
    if (!newBrandId) {
      setFormError('Pilih brand terlebih dahulu.');
      return;
    }
    if (!newPeriod.trim()) {
      setFormError('Periode payroll (YYYY-MM) wajib diisi.');
      return;
    }

    const member = userTeamMembers.find((m) => m.id === newTeamMemberId);
    const brand = userBrands.find((b) => b.id === newBrandId);
    if (!member || !brand) {
      setFormError('Data anggota tim atau brand tidak ditemukan.');
      return;
    }

    const res = createPayrollRecap({
      teamMemberId: member.id,
      teamMemberName: member.name,
      brandId: brand.id,
      period: newPeriod.trim(),
      baseSalary: Number(newBaseSalary) || 0,
      taskFees: Number(newTaskFees) || 0,
      incentives: Number(newIncentives) || 0,
      reimbursements: Number(newReimbursements) || 0,
      notes: newNotes.trim() || undefined,
    });

    if (!res.success) {
      setFormError(res.error || 'Gagal membuat rekap payroll.');
      return;
    }

    setIsCreateModalOpen(false);
  };

  const handleOpenPayModal = (p: PayrollRecap) => {
    setPayingPayroll(p);
    setPayAmountStr(p.outstandingBalance.toString());
    setPayAssetId(userAssets[0]?.id || '');
    setPayMethod('Transfer Bank');
    setPayNotes(`Pembayaran payroll periode ${p.period} (${p.teamMemberName})`);
    setPayError('');
  };

  const handleExecutePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingPayroll) return;
    setPayError('');

    const amt = parseFloat(payAmountStr) || 0;
    if (amt <= 0) {
      setPayError('Nominal pembayaran harus lebih besar dari Rp 0.');
      return;
    }
    if (amt > payingPayroll.outstandingBalance) {
      setPayError(
        `Nominal melebihi saldo terutang (Rp ${payingPayroll.outstandingBalance.toLocaleString(
          'id-ID'
        )}).`
      );
      return;
    }
    if (!payAssetId) {
      setPayError('Pilih aset sumber dana pembayaran.');
      return;
    }

    const res = payPayrollPartial(
      payingPayroll.id,
      amt,
      payAssetId,
      payMethod,
      payNotes.trim() || undefined
    );

    if (!res.success) {
      setPayError(res.error || 'Gagal memproses pembayaran.');
      return;
    }

    setPayingPayroll(null);
  };

  const getStatusBadge = (status: RecapStatus) => {
    switch (status) {
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
            <Clock className="w-3 h-3 text-slate-500" />
            Draft
          </span>
        );
      case 'review':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <AlertCircle className="w-3 h-3 text-amber-600" />
            Menunggu Review
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
            <CheckCircle2 className="w-3 h-3 text-blue-600" />
            Disetujui (Kewajiban)
          </span>
        );
      case 'partially_paid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-violet-50 text-violet-700 border border-violet-200">
            <CreditCard className="w-3 h-3 text-violet-600" />
            Dibayar Sebagian
          </span>
        );
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Lunas
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
            Dibatalkan
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-violet-600" />
            Payroll & Honorarium Tim
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Kelola gaji bulanan, honorarium tugas/proyek, review persetujuan, dan pencatatan
            pembayaran kas resmi.
          </p>
        </div>

        {!isAdmin && (
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-medium text-sm shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Buat Rekap Payroll
          </button>
        )}
      </div>

      {/* Financial Integrity Note */}
      <div className="bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-100 rounded-xl p-4 text-xs text-violet-950 flex items-start gap-3">
        <ShieldAlert className="w-4 h-4 text-violet-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-violet-900">
            Prinsip Integritas Keuangan Payroll (Seksi 8 & 9 PRD):
          </p>
          <p className="text-violet-800/90 leading-relaxed">
            Persetujuan payroll mencatat <strong>kewajiban resmi</strong> (liabilitas). Saldo kas dan
            arus kas <strong>hanya berkurang saat pembayaran riil</strong> dieksekusi. Pembayaran
            sebagian didukung penuh dengan referensi transaksi pengeluaran tunggal untuk mencegah
            double-counting beban di laporan laba rugi.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Hak Kompensasi
            </span>
            <DollarSign className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 text-xl font-bold font-mono text-slate-900 tabular-nums">
            Rp {totalHakBulanIni.toLocaleString('id-ID')}
          </div>
          <p className="text-xs text-slate-400 mt-1">Gaji pokok + honor + insentif</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
              Sudah Dibayarkan (Kas Keluar)
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-xl font-bold font-mono text-emerald-600 tabular-nums">
            Rp {totalSudahDibayar.toLocaleString('id-ID')}
          </div>
          <p className="text-xs text-slate-400 mt-1">Mengurangi saldo kas/bank resmi</p>
        </div>

        <div className="bg-white rounded-xl border border-amber-200 bg-amber-50/30 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">
              Saldo Terutang (Kewajiban)
            </span>
            <AlertCircle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 text-xl font-bold font-mono text-amber-700 tabular-nums">
            Rp {totalSaldoTerutang.toLocaleString('id-ID')}
          </div>
          <p className="text-xs text-amber-700/80 mt-1">Belum mengurangi kas</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Perlu Review / Approval
            </span>
            <UserCheck className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-2 text-xl font-bold font-mono text-indigo-600 tabular-nums">
            {pendingApprovalCount} Rekap
          </div>
          <p className="text-xs text-slate-400 mt-1">Status draft / review</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari anggota tim, brand, atau periode..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-200 rounded-lg text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20"
          >
            <option value="all">Semua Status</option>
            <option value="draft">Draft</option>
            <option value="review">Menunggu Review</option>
            <option value="approved">Disetujui</option>
            <option value="partially_paid">Dibayar Sebagian</option>
            <option value="paid">Lunas</option>
          </select>

          <select
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-200 rounded-lg text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20"
          >
            <option value="all">Semua Periode</option>
            <option value="2026-10">Oktober 2026 (2026-10)</option>
            <option value="2026-09">September 2026 (2026-09)</option>
          </select>
        </div>
      </div>

      {/* Payroll Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Anggota Tim & Brand</th>
                <th className="py-3 px-3">Periode</th>
                <th className="py-3 px-3 text-right">Gaji Pokok</th>
                <th className="py-3 px-3 text-right">Honor Tugas</th>
                <th className="py-3 px-3 text-right">Insentif & Reimb.</th>
                <th className="py-3 px-3 text-right font-bold text-slate-800">Total Hak</th>
                <th className="py-3 px-3 text-right text-emerald-700">Dibayar</th>
                <th className="py-3 px-3 text-right text-amber-700 font-bold">Terutang</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecaps.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    Belum ada data rekap payroll untuk filter ini.
                  </td>
                </tr>
              ) : (
                filteredRecaps.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{p.teamMemberName}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <span className="font-medium text-violet-700">{brandMap.get(p.brandId) || p.brandId}</span>
                        <span>·</span>
                        <span>#{p.id}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-700 font-medium">{p.period}</td>
                    <td className="py-3 px-3 text-right font-mono text-slate-600">
                      Rp {p.baseSalary.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-600">
                      Rp {p.taskFees.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-600">
                      Rp {(p.incentives + p.reimbursements).toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                      Rp {p.totalCompensation.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-semibold text-emerald-600">
                      Rp {p.totalPaid.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-amber-700 bg-amber-50/30">
                      Rp {p.outstandingBalance.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-3 text-center">{getStatusBadge(p.status)}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {p.status === 'draft' && !isAdmin && (
                          <button
                            onClick={() => reviewPayrollRecap(p.id)}
                            className="px-2.5 py-1 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                          >
                            Ajukan Review
                          </button>
                        )}

                        {p.status === 'review' && !isAdmin && (
                          <button
                            onClick={() => approvePayrollRecap(p.id)}
                            className="px-2.5 py-1 text-[11px] font-medium bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg transition-colors"
                          >
                            Setujui
                          </button>
                        )}

                        {(p.status === 'approved' || p.status === 'partially_paid') &&
                          p.outstandingBalance > 0 &&
                          !isAdmin && (
                            <button
                              onClick={() => handleOpenPayModal(p)}
                              className="px-2.5 py-1 text-[11px] font-semibold bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors shadow-xs"
                            >
                              Bayar Kas
                            </button>
                          )}

                        {p.payments && p.payments.length > 0 && (
                          <button
                            onClick={() => setViewingHistoryPayroll(p)}
                            title="Riwayat Pembayaran Kas"
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Buat Rekap Payroll */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-violet-600" />
                Buat Rekap Payroll Baru
              </h2>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-3 p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Pilih Anggota Tim</label>
                <select
                  value={newTeamMemberId}
                  onChange={(e) => handleMemberSelectChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                >
                  <option value="">-- Pilih Anggota Tim --</option>
                  {userTeamMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.roleOrPosition}) — {brandMap.get(m.brandId) || m.brandId}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Brand</label>
                  <select
                    value={newBrandId}
                    onChange={(e) => setNewBrandId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                  >
                    {userBrands.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Periode (YYYY-MM)</label>
                  <input
                    type="month"
                    value={newPeriod}
                    onChange={(e) => setNewPeriod(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Gaji Pokok (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    value={newBaseSalary}
                    onChange={(e) => setNewBaseSalary(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Honor Tugas/Proyek (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    value={newTaskFees}
                    onChange={(e) => setNewTaskFees(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Insentif / Bonus (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    value={newIncentives}
                    onChange={(e) => setNewIncentives(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Reimbursement (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    value={newReimbursements}
                    onChange={(e) => setNewReimbursements(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Catatan Tambahan</label>
                <textarea
                  rows={2}
                  placeholder="Catatan komponen payroll atau evaluasi kinerja..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between font-mono">
                <span className="font-semibold text-slate-600">Total Kompensasi Dihitung:</span>
                <span className="font-bold text-sm text-violet-700">
                  Rp{' '}
                  {(
                    Number(newBaseSalary) +
                    Number(newTaskFees) +
                    Number(newIncentives) +
                    Number(newReimbursements)
                  ).toLocaleString('id-ID')}
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors"
                >
                  Simpan Draft Rekap
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Bayar Sebagian / Penuh */}
      {payingPayroll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                Bayar Payroll Kas Tim
              </h2>
              <button
                onClick={() => setPayingPayroll(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {payError && (
              <div className="mt-3 p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
                {payError}
              </div>
            )}

            <div className="mt-3 p-3 bg-violet-50/60 rounded-xl border border-violet-100 text-xs text-violet-900 space-y-1">
              <div className="flex justify-between">
                <span>Penerima:</span>
                <span className="font-semibold">{payingPayroll.teamMemberName}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Hak Kompensasi:</span>
                <span className="font-mono">
                  Rp {payingPayroll.totalCompensation.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Sudah Dibayar:</span>
                <span className="font-mono text-emerald-700">
                  Rp {payingPayroll.totalPaid.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between font-bold text-amber-800 pt-1 border-t border-violet-200/60">
                <span>Saldo Terutang Saat Ini:</span>
                <span className="font-mono">
                  Rp {payingPayroll.outstandingBalance.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <form onSubmit={handleExecutePayment} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nominal Pembayaran (Rp)
                </label>
                <input
                  type="number"
                  min="1"
                  max={payingPayroll.outstandingBalance}
                  value={payAmountStr}
                  onChange={(e) => setPayAmountStr(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                />
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Mendukung pelunasan penuh atau bertahap (sebagian).
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Aset Sumber Dana (Kas / Bank)
                </label>
                <select
                  value={payAssetId}
                  onChange={(e) => setPayAssetId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                >
                  <option value="">-- Pilih Rekening / Kas --</option>
                  {userAssets.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} (Saldo: Rp {a.currentBalance.toLocaleString('id-ID')})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Metode Pembayaran</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                >
                  <option value="Transfer Bank">Transfer Bank</option>
                  <option value="Kas Tunai">Kas Tunai</option>
                  <option value="E-Wallet">E-Wallet</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Catatan / Bukti Transfer</label>
                <input
                  type="text"
                  placeholder="No referensi transfer atau catatan..."
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPayingPayroll(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                >
                  Konfirmasi Pembayaran Kas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Riwayat Pembayaran */}
      {viewingHistoryPayroll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <History className="w-4 h-4 text-violet-600" />
                Riwayat Pembayaran Kas #{viewingHistoryPayroll.id}
              </h2>
              <button
                onClick={() => setViewingHistoryPayroll(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-3 text-xs text-slate-600">
              Penerima: <strong className="text-slate-900">{viewingHistoryPayroll.teamMemberName}</strong> · Periode:{' '}
              <span className="font-mono">{viewingHistoryPayroll.period}</span>
            </div>

            <div className="mt-4 space-y-2 max-h-72 overflow-y-auto">
              {viewingHistoryPayroll.payments.map((pay, idx) => (
                <div
                  key={pay.id || idx}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-slate-500">{pay.paymentDate}</span>
                    <span className="font-mono font-bold text-emerald-600">
                      Rp {pay.amount.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="text-slate-600 flex items-center justify-between">
                    <span>
                      Sumber: <strong>{pay.assetName}</strong> ({pay.paymentMethod})
                    </span>
                    <span className="text-[11px] text-slate-400">Oleh: {pay.paidBy}</span>
                  </div>
                  {pay.receiptNote && (
                    <div className="text-[11px] text-slate-500 italic">"{pay.receiptNote}"</div>
                  )}
                  <div className="text-[10px] font-mono text-violet-600">
                    ID Transaksi Kas: {pay.transactionId}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setViewingHistoryPayroll(null)}
                className="px-4 py-2 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
