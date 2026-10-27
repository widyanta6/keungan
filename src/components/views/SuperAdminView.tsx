import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShieldAlert,
  Users,
  Building2,
  Sliders,
  History,
  KeyRound,
  CheckCircle,
  AlertCircle,
  UserPlus,
  Lock,
  Mail,
  Copy,
  Check,
  RefreshCw,
  Search,
  Filter,
  ShieldCheck,
  Clock,
  Sparkles,
  ArrowRight,
  X,
  Edit2,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { User, UserRole, UserAccountStatus, Brand, BusinessCategory, BrandPolicyConfig } from '../../types';

export const SuperAdminView: React.FC = () => {
  const {
    currentUser,
    users,
    brands,
    workspaces,
    brandPolicy,
    invitations,
    auditLogs,
    inviteUser,
    resendInvitation,
    updateUserStatus,
    updateUserRoleAndBrands,
    adminResetUserPassword,
    approveBrand,
    rejectBrand,
    archiveBrand,
    updateBrandPolicy,
  } = useApp();

  // Access Control Guard
  if (!currentUser || currentUser.role !== 'super_admin') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="bg-red-50 border border-red-200 rounded-3xl p-8 max-w-md w-full text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-red-100 flex items-center justify-center text-red-600">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-red-950">Akses Ditolak: Khusus Super Admin</h2>
          <p className="text-xs text-red-700 leading-relaxed">
            Halaman ini hanya dapat diakses oleh akun Super Admin Utama (superadmin@bizflow.id). Akun Anda tidak memiliki hak otorisasi untuk melihat atau mengelola konfigurasi akun sistem.
          </p>
        </div>
      </div>
    );
  }

  // Active Sub-Tab
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'invitations' | 'brands' | 'policy' | 'audit'>('overview');

  // Search & Filter States
  const [searchUser, setSearchUser] = useState('');
  const [filterUserRole, setFilterUserRole] = useState<string>('all');
  const [filterUserStatus, setFilterUserStatus] = useState<string>('all');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Invite User Modal States
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('staff');
  const [inviteWorkspaceId, setInviteWorkspaceId] = useState('ws_ika');
  const [inviteAllowedBrands, setInviteAllowedBrands] = useState<string[]>([]);
  const [inviteNotes, setInviteNotes] = useState('');
  const [inviteSuccessMsg, setInviteSuccessMsg] = useState('');
  const [inviteErrorMsg, setInviteErrorMsg] = useState('');

  // Edit User Permissions Modal States
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editRole, setEditRole] = useState<UserRole>('staff');
  const [editAllowedBrands, setEditAllowedBrands] = useState<string[]>([]);
  const [editWorkspaceId, setEditWorkspaceId] = useState('ws_ika');
  const [editUserMsg, setEditUserMsg] = useState('');

  // Reset Password Modal
  const [resettingUser, setResettingUser] = useState<User | null>(null);
  const [tempPassword, setTempPassword] = useState('');
  const [resetPwdSuccess, setResetPwdSuccess] = useState('');

  // Reject Brand Modal
  const [rejectingBrand, setRejectingBrand] = useState<Brand | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Policy Form State
  const [localPolicy, setLocalPolicy] = useState<BrandPolicyConfig>({ ...brandPolicy });
  const [policySavedMsg, setPolicySavedMsg] = useState('');

  // Statistics
  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.status === 'active').length;
  const invitedUsers = users.filter((u) => u.status === 'invited').length;
  const suspendedUsers = users.filter((u) => u.status === 'suspended').length;

  const totalBrands = brands.length;
  const activeBrands = brands.filter((b) => b.status === 'active').length;
  const pendingBrands = brands.filter((b) => b.status === 'pending_approval');

  // Filtered Users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchUser.toLowerCase()) ||
      u.email.toLowerCase().includes(searchUser.toLowerCase());
    const matchesRole = filterUserRole === 'all' || u.role === filterUserRole;
    const matchesStatus = filterUserStatus === 'all' || u.status === filterUserStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Handle Copy Token
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(text);
    setTimeout(() => setCopiedToken(null), 2500);
  };

  // Submit User Invitation
  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    setInviteErrorMsg('');
    setInviteSuccessMsg('');

    if (!inviteEmail.trim() || !inviteName.trim()) {
      setInviteErrorMsg('Email dan nama lengkap wajib diisi.');
      return;
    }

    const res = inviteUser({
      email: inviteEmail.trim(),
      name: inviteName.trim(),
      role: inviteRole,
      allowedBrandIds: inviteAllowedBrands,
      workspaceId: inviteWorkspaceId,
      notes: inviteNotes.trim(),
    });

    if (!res.success) {
      setInviteErrorMsg(res.error || 'Gagal mengirim undangan.');
    } else {
      setInviteSuccessMsg(`Undangan berhasil dibuat untuk ${inviteEmail}. Token aktivasi: ${res.invitation?.token}`);
      setInviteEmail('');
      setInviteName('');
      setInviteNotes('');
      setInviteAllowedBrands([]);
      setTimeout(() => {
        setIsInviteModalOpen(false);
        setInviteSuccessMsg('');
      }, 2500);
    }
  };

  // Submit User Permission Edit
  const handleSaveUserPermissions = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    const res = updateUserRoleAndBrands(editingUser.id, editRole, editAllowedBrands, editWorkspaceId);
    if (!res.success) {
      setEditUserMsg(res.error || 'Gagal menyimpan perubahan.');
    } else {
      setEditUserMsg('Izin role dan brand berhasil diperbarui!');
      setTimeout(() => {
        setEditingUser(null);
        setEditUserMsg('');
      }, 1200);
    }
  };

  // Submit Admin Reset Password
  const handleAdminResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingUser) return;

    const res = await adminResetUserPassword(resettingUser.id, tempPassword);
    if (res.success) {
      setResetPwdSuccess(`Kata sandi baru berhasil diset: ${res.temporaryPassword}`);
      setTimeout(() => {
        setResettingUser(null);
        setResetPwdSuccess('');
        setTempPassword('');
      }, 3000);
    }
  };

  // Approve Brand
  const handleApproveBrand = (brandId: string) => {
    approveBrand(brandId, 'Disetujui oleh Super Admin');
  };

  // Reject Brand
  const handleConfirmRejectBrand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingBrand) return;
    rejectBrand(rejectingBrand.id, rejectReason || 'Tidak memenuhi kebijakan kelayakan bisnis');
    setRejectingBrand(null);
    setRejectReason('');
  };

  // Save Policy
  const handleSavePolicy = (e: React.FormEvent) => {
    e.preventDefault();
    updateBrandPolicy(localPolicy);
    setPolicySavedMsg('Kebijakan brand global berhasil diperbarui dan aktif di seluruh workspace.');
    setTimeout(() => setPolicySavedMsg(''), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#1B0E33] via-[#2D1654] to-[#431D7E] text-white rounded-3xl p-6 sm:p-8 shadow-lg border border-purple-900/60 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-1.5 relative z-10">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-purple-500/30 text-purple-200 text-[11px] font-bold border border-purple-400/20 uppercase tracking-wider">
              Super Admin Console
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            Pusat Kendali Akun, Brand & Otorisasi
          </h1>
          <p className="text-xs text-purple-200/80 max-w-2xl leading-relaxed">
            Kelola seluruh identitas pengguna, hak akses isolasi brand, persetujuan brand baru, kebijakan sistem, dan audit trail keamanan secara terpusat.
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10 shrink-0">
          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs rounded-xl shadow-md transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Undang Pengguna Baru</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1.5 border-b border-purple-100 pb-2 overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-violet-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Ringkasan Sistem</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'users'
              ? 'bg-violet-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Manajemen Pengguna ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('invitations')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'invitations'
              ? 'bg-violet-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Daftar Undangan ({invitations.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('brands')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'brands'
              ? 'bg-violet-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Brand & Approval ({brands.length})</span>
          {pendingBrands.length > 0 && (
            <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
              {pendingBrands.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('policy')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'policy'
              ? 'bg-violet-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Kebijakan Brand Global</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'audit'
              ? 'bg-violet-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Audit Log Sistem ({auditLogs.length})</span>
        </button>
      </div>

      {/* SUB-TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-purple-100 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
                <span>Total Pengguna</span>
                <Users className="w-4 h-4 text-violet-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900 tabular-nums">{totalUsers}</p>
              <div className="mt-2 text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                <span>{activeUsers} Akun Aktif</span>
                <span className="text-slate-400">· {invitedUsers} Undangan</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-purple-100 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
                <span>Total Brand Terdaftar</span>
                <Building2 className="w-4 h-4 text-indigo-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900 tabular-nums">{totalBrands}</p>
              <div className="mt-2 text-[11px] text-purple-600 font-semibold flex items-center gap-1">
                <span>{activeBrands} Brand Aktif</span>
                {pendingBrands.length > 0 && (
                  <span className="text-amber-600 font-bold">· {pendingBrands.length} Menunggu</span>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-purple-100 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
                <span>Akun Ditangguhkan</span>
                <AlertTriangle className="w-4 h-4 text-red-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900 tabular-nums">{suspendedUsers}</p>
              <div className="mt-2 text-[11px] text-slate-500">
                <span>Akses dinonaktifkan sementara</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-purple-100 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
                <span>Ruang Kerja Terisolasi</span>
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900 tabular-nums">{workspaces.length}</p>
              <div className="mt-2 text-[11px] text-emerald-600 font-semibold">
                <span>Isolasi Ika, Redi & Admin</span>
              </div>
            </div>
          </div>

          {/* Pending Brand Approvals Callout */}
          {pendingBrands.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-600" />
                  <h3 className="text-sm font-bold text-amber-900">
                    Pengajuan Brand Menunggu Persetujuan ({pendingBrands.length})
                  </h3>
                </div>
                <button
                  onClick={() => setActiveTab('brands')}
                  className="text-xs font-bold text-amber-800 hover:text-amber-950 underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Buka Antrean</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {pendingBrands.map((b) => (
                  <div
                    key={b.id}
                    className="bg-white p-3.5 rounded-xl border border-amber-200/80 shadow-2xs flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <p className="font-bold text-slate-900">{b.name}</p>
                      <p className="text-[11px] text-slate-500">{b.category}</p>
                      <p className="text-[10px] text-amber-700 mt-1 italic">{b.approvalNotes}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleApproveBrand(b.id)}
                        className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-[11px] cursor-pointer"
                      >
                        Setujui
                      </button>
                      <button
                        onClick={() => setRejectingBrand(b)}
                        className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 font-semibold rounded-lg text-[11px] cursor-pointer"
                      >
                        Tolak
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Security Audit Stream */}
          <div className="bg-white rounded-2xl p-6 border border-purple-100 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Aktivitas & Log Keamanan Terkini</h3>
                <p className="text-xs text-slate-500">Rekaman audit setiap login, mutasi, dan perubahan otorisasi</p>
              </div>
              <button
                onClick={() => setActiveTab('audit')}
                className="text-xs font-semibold text-violet-700 hover:underline cursor-pointer"
              >
                Lihat Semua Log
              </button>
            </div>

            <div className="space-y-2">
              {auditLogs.slice(0, 6).map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-xl bg-slate-50/70 border border-slate-100 flex items-start justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{log.action}</span>
                      <span className="text-[10px] font-mono bg-purple-100 text-purple-800 px-1.5 py-0.2 rounded">
                        {log.userName} ({log.userRole})
                      </span>
                    </div>
                    <p className="text-slate-600 text-[11px] leading-relaxed">{log.details}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono shrink-0 whitespace-nowrap">
                    {log.timestamp}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: USER MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-6 border border-purple-100 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Daftar Akun Pengguna</h3>
                <p className="text-xs text-slate-500">
                  Kelola status aktif, hak akses brand, pemulihan kata sandi, dan role setiap pengguna
                </p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchUser}
                    onChange={(e) => setSearchUser(e.target.value)}
                    placeholder="Cari nama atau email..."
                    className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-violet-500 w-48"
                  />
                </div>

                <select
                  value={filterUserRole}
                  onChange={(e) => setFilterUserRole(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none"
                >
                  <option value="all">Semua Role</option>
                  <option value="super_admin">Super Admin</option>
                  <option value="ika">Ika (Client)</option>
                  <option value="redi">Redi (Client)</option>
                  <option value="admin">Admin Transparansi</option>
                  <option value="staff">Staff</option>
                </select>

                <select
                  value={filterUserStatus}
                  onChange={(e) => setFilterUserStatus(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none"
                >
                  <option value="all">Semua Status</option>
                  <option value="active">Aktif</option>
                  <option value="invited">Diundang (Invited)</option>
                  <option value="suspended">Ditangguhkan (Suspended)</option>
                  <option value="disabled">Dinonaktifkan (Disabled)</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200/80">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200/80">
                  <tr>
                    <th className="p-3">Pengguna</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Workspace</th>
                    <th className="p-3">Brand Diizinkan</th>
                    <th className="p-3">Status Akun</th>
                    <th className="p-3">Terakhir Login</th>
                    <th className="p-3 text-right">Aksi Manajemen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((u) => {
                    const isSelf = u.id === currentUser.id;

                    return (
                      <tr key={u.id} className="hover:bg-purple-50/30 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center gap-2.5">
                            {u.avatarUrl ? (
                              <img
                                src={u.avatarUrl}
                                alt={u.name}
                                className="w-8 h-8 rounded-full object-cover shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-violet-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                                {u.name.charAt(0)}
                              </div>
                            )}
                            <div>
                              <p className="font-bold text-slate-900 leading-tight">{u.name}</p>
                              <p className="text-[11px] text-slate-400 font-mono">{u.email}</p>
                            </div>
                          </div>
                        </td>

                        <td className="p-3">
                          <span className="font-semibold text-slate-800 uppercase text-[10px] px-2 py-0.5 rounded bg-slate-100">
                            {u.role}
                          </span>
                        </td>

                        <td className="p-3 text-slate-600 font-medium">
                          {u.workspaceId === 'ws_superadmin'
                            ? 'Master Super Admin'
                            : u.workspaceId === 'ws_ika'
                            ? 'Workspace Ika'
                            : u.workspaceId === 'ws_redi'
                            ? 'Workspace Redi'
                            : 'Transparansi Baliyoutevolution'}
                        </td>

                        <td className="p-3">
                          <div className="flex items-center gap-1 flex-wrap max-w-xs">
                            {u.allowedBrandIds && u.allowedBrandIds.length > 0 ? (
                              u.allowedBrandIds.map((bId) => {
                                const brand = brands.find((b) => b.id === bId);
                                return (
                                  <span
                                    key={bId}
                                    className="text-[10px] font-semibold bg-violet-100 text-violet-800 px-1.5 py-0.2 rounded"
                                  >
                                    {brand ? brand.code : bId}
                                  </span>
                                );
                              })
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">-</span>
                            )}
                          </div>
                        </td>

                        <td className="p-3">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              u.status === 'active'
                                ? 'bg-emerald-100 text-emerald-800'
                                : u.status === 'invited'
                                ? 'bg-amber-100 text-amber-800'
                                : u.status === 'suspended'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {u.status === 'active'
                              ? 'Aktif'
                              : u.status === 'invited'
                              ? 'Diundang'
                              : u.status === 'suspended'
                              ? 'Ditangguhkan'
                              : 'Dinonaktifkan'}
                          </span>
                        </td>

                        <td className="p-3 text-[11px] text-slate-500 font-mono">
                          {u.lastLoginAt || 'Belum pernah'}
                        </td>

                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* Edit Role & Brands */}
                            <button
                              onClick={() => {
                                setEditingUser(u);
                                setEditRole(u.role);
                                setEditAllowedBrands(u.allowedBrandIds || []);
                                setEditWorkspaceId(u.workspaceId);
                                setEditUserMsg('');
                              }}
                              disabled={isSelf}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-violet-700 hover:bg-violet-50 transition-colors disabled:opacity-30 cursor-pointer"
                              title="Edit Role & Akses Brand"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Reset Password */}
                            <button
                              onClick={() => {
                                setResettingUser(u);
                                setTempPassword('');
                                setResetPwdSuccess('');
                              }}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-amber-700 hover:bg-amber-50 transition-colors cursor-pointer"
                              title="Reset Password Akun"
                            >
                              <KeyRound className="w-3.5 h-3.5" />
                            </button>

                            {/* Status Toggles */}
                            {!isSelf && (
                              <>
                                {u.status === 'active' ? (
                                  <button
                                    onClick={() => updateUserStatus(u.id, 'suspended', 'Ditangguhkan oleh Super Admin')}
                                    className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-700 rounded font-semibold text-[10px] transition-colors cursor-pointer"
                                    title="Tangguhkan akses login pengguna ini"
                                  >
                                    Suspend
                                  </button>
                                ) : u.status === 'suspended' || u.status === 'disabled' ? (
                                  <button
                                    onClick={() => updateUserStatus(u.id, 'active', 'Diaktifkan kembali oleh Super Admin')}
                                    className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded font-semibold text-[10px] transition-colors cursor-pointer"
                                    title="Pulihkan dan aktifkan akun"
                                  >
                                    Aktifkan
                                  </button>
                                ) : null}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: INVITATIONS */}
      {activeTab === 'invitations' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-6 border border-purple-100 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Riwayat Undangan Pengguna</h3>
                <p className="text-xs text-slate-500">
                  Undang staf atau mitra baru dengan token aktivasi aman berbatas waktu kedaluwarsa 7 hari
                </p>
              </div>

              <button
                onClick={() => setIsInviteModalOpen(true)}
                className="flex items-center gap-2 px-3.5 py-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Buat Undangan Baru</span>
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200/80">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200/80">
                  <tr>
                    <th className="p-3">Nama & Email</th>
                    <th className="p-3">Role Ditugaskan</th>
                    <th className="p-3">Workspace</th>
                    <th className="p-3">Token Aktivasi</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Kedaluwarsa</th>
                    <th className="p-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invitations.map((inv) => (
                    <tr key={inv.id} className="hover:bg-purple-50/30">
                      <td className="p-3">
                        <p className="font-bold text-slate-900">{inv.fullName}</p>
                        <p className="text-[11px] text-slate-400 font-mono">{inv.email}</p>
                      </td>

                      <td className="p-3">
                        <span className="font-semibold text-slate-700 uppercase text-[10px] px-2 py-0.5 rounded bg-slate-100">
                          {inv.assignedRole}
                        </span>
                      </td>

                      <td className="p-3 text-slate-600">
                        {inv.workspaceId === 'ws_ika' ? 'Workspace Ika' : 'Workspace Redi'}
                      </td>

                      <td className="p-3 font-mono text-[11px] text-violet-700">
                        <div className="flex items-center gap-1.5">
                          <span>{inv.token}</span>
                          <button
                            onClick={() => handleCopy(inv.token)}
                            className="p-1 hover:bg-violet-100 rounded text-violet-600 cursor-pointer"
                            title="Salin Token"
                          >
                            {copiedToken === inv.token ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      <td className="p-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            inv.status === 'accepted'
                              ? 'bg-emerald-100 text-emerald-800'
                              : inv.status === 'pending'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {inv.status === 'accepted' ? 'Diterima' : 'Menunggu Aktivasi'}
                        </span>
                      </td>

                      <td className="p-3 text-[11px] text-slate-500 font-mono">
                        {inv.expiresAt}
                      </td>

                      <td className="p-3 text-right">
                        {inv.status === 'pending' && (
                          <button
                            onClick={() => resendInvitation(inv.id)}
                            className="px-2.5 py-1 text-[11px] font-semibold bg-violet-50 text-violet-700 hover:bg-violet-100 rounded-lg cursor-pointer"
                          >
                            Generate Token Baru
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: BRANDS & APPROVAL */}
      {activeTab === 'brands' && (
        <div className="space-y-6">
          {/* Pending Approval Section */}
          <div className="bg-white rounded-2xl p-6 border border-purple-100 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>Antrean Pengajuan Brand Menunggu Persetujuan ({pendingBrands.length})</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Verifikasi integritas brand baru yang diajukan oleh pengguna sebelum diizinkan mencatat transaksi
                </p>
              </div>
            </div>

            {pendingBrands.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                Tidak ada pengajuan brand baru yang menunggu persetujuan saat ini.
              </div>
            ) : (
              <div className="space-y-3">
                {pendingBrands.map((b) => (
                  <div
                    key={b.id}
                    className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{b.name}</span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                          {b.category}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">Kode: {b.code}</span>
                      </div>
                      <p className="text-slate-600 text-[11px]">{b.description}</p>
                      <p className="text-[11px] text-amber-700 italic">Catatan: {b.approvalNotes}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleApproveBrand(b.id)}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs cursor-pointer shadow-xs"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Setujui Brand</span>
                      </button>
                      <button
                        onClick={() => setRejectingBrand(b)}
                        className="px-3.5 py-1.5 bg-red-100 hover:bg-red-200 text-red-800 font-semibold rounded-xl text-xs cursor-pointer"
                      >
                        Tolak
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* All Brands Section */}
          <div className="bg-white rounded-2xl p-6 border border-purple-100 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Seluruh Brand Terdaftar di Sistem</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {brands.map((b) => (
                <div
                  key={b.id}
                  className="p-4 rounded-2xl border border-slate-200/90 bg-slate-50/50 flex flex-col justify-between text-xs space-y-3"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-white text-xs"
                          style={{ backgroundColor: b.color || '#8B5CF6' }}
                        >
                          {b.code}
                        </div>
                        <span className="font-bold text-slate-900">{b.name}</span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          b.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : b.status === 'pending_approval'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {b.status === 'active' ? 'Aktif' : b.status === 'pending_approval' ? 'Pending' : 'Arsip'}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 mt-2">{b.category}</p>
                    <p className="text-[11px] text-slate-600 line-clamp-2 mt-1">{b.description}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-mono text-[10px]">{b.id}</span>
                    {b.status === 'active' && (
                      <button
                        onClick={() => archiveBrand(b.id)}
                        className="text-red-600 hover:underline cursor-pointer"
                      >
                        Arsipkan
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 5: GLOBAL BRAND POLICY */}
      {activeTab === 'policy' && (
        <div className="max-w-2xl bg-white rounded-2xl p-6 border border-purple-100 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">Konfigurasi Kebijakan Brand Global</h3>
            <p className="text-xs text-slate-500">
              Atur hak mandiri pengguna dalam menambah brand dan batas kuota per ruang kerja
            </p>
          </div>

          {policySavedMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{policySavedMsg}</span>
            </div>
          )}

          <form onSubmit={handleSavePolicy} className="space-y-5 text-xs">
            {/* Toggle 1: Allow User Create Brand */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <div>
                <p className="font-bold text-slate-900">Izinkan Pengguna Membuat Brand Baru</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Bila dinonaktifkan, tombol tambah brand pada profil Ika & Redi akan dikunci.
                </p>
              </div>
              <input
                type="checkbox"
                checked={localPolicy.allowUserCreateBrand}
                onChange={(e) =>
                  setLocalPolicy({ ...localPolicy, allowUserCreateBrand: e.target.checked })
                }
                className="w-4 h-4 accent-violet-600 cursor-pointer"
              />
            </div>

            {/* Toggle 2: Require Admin Approval */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <div>
                <p className="font-bold text-slate-900">Wajibkan Persetujuan Super Admin</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Brand baru yang dibuat pengguna akan berstatus Menunggu Review (pending_approval) sampai disetujui.
                </p>
              </div>
              <input
                type="checkbox"
                checked={localPolicy.requireAdminApproval}
                onChange={(e) =>
                  setLocalPolicy({ ...localPolicy, requireAdminApproval: e.target.checked })
                }
                className="w-4 h-4 accent-violet-600 cursor-pointer"
              />
            </div>

            {/* Input 3: Max Brands per user */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
              <label className="font-bold text-slate-900 block">Maksimal Brand per Pengguna</label>
              <p className="text-[11px] text-slate-500">
                Batas jumlah brand aktif yang dapat dimiliki oleh satu akun owner.
              </p>
              <input
                type="number"
                min={1}
                max={20}
                value={localPolicy.maxBrandsPerUser}
                onChange={(e) =>
                  setLocalPolicy({ ...localPolicy, maxBrandsPerUser: parseInt(e.target.value) || 5 })
                }
                className="w-32 bg-white border border-slate-200 rounded-xl p-2 text-slate-900 font-bold"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl text-xs shadow-xs cursor-pointer"
              >
                Simpan Kebijakan Sistem
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SUB-TAB 6: AUDIT LOG */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl p-6 border border-purple-100 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Jejak Audit Keamanan & Akses (Audit Trail)</h3>
              <p className="text-xs text-slate-500">
                Catatan mutasi data, autentikasi, dan perubahan otoritas yang tidak dapat dimanipulasi
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-100 flex flex-col sm:flex-row sm:items-start justify-between gap-2 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900">{log.action}</span>
                    <span className="text-[10px] font-mono bg-violet-100 text-violet-800 px-1.5 py-0.2 rounded font-semibold">
                      {log.userName} ({log.userRole})
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      WS: {log.workspaceId}
                    </span>
                  </div>
                  <p className="text-slate-700 text-xs leading-relaxed">{log.details}</p>
                </div>
                <span className="text-[11px] text-slate-400 font-mono shrink-0 whitespace-nowrap">
                  {log.timestamp}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: INVITE USER */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-purple-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <UserPlus className="w-4 h-4 text-violet-600" />
                <span>Undang Pengguna Baru ke BizFlow</span>
              </div>
              <button
                onClick={() => setIsInviteModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {inviteSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{inviteSuccessMsg}</span>
              </div>
            )}

            {inviteErrorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{inviteErrorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSendInvite} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Alamat Email</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="staf@bizflow.id"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="Misal: Rina Wulandari"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Role Akun</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as UserRole)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                  >
                    <option value="staff">Staff Operasional</option>
                    <option value="owner">Workspace Owner</option>
                    <option value="admin">Admin Transparansi (Read-Only)</option>
                    <option value="ika">Client Ika</option>
                    <option value="redi">Client Redi</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Workspace Tujuan</label>
                  <select
                    value={inviteWorkspaceId}
                    onChange={(e) => setInviteWorkspaceId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                  >
                    <option value="ws_ika">Workspace Ika</option>
                    <option value="ws_redi">Workspace Redi</option>
                    <option value="ws_admin">Transparansi Baliyoutevolution</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Brand yang Diizinkan Diakses
                </label>
                <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
                  {brands
                    .filter((b) => b.status === 'active')
                    .map((b) => (
                      <label key={b.id} className="flex items-center gap-2 cursor-pointer text-slate-700">
                        <input
                          type="checkbox"
                          checked={inviteAllowedBrands.includes(b.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setInviteAllowedBrands([...inviteAllowedBrands, b.id]);
                            } else {
                              setInviteAllowedBrands(inviteAllowedBrands.filter((id) => id !== b.id));
                            }
                          }}
                          className="w-3.5 h-3.5 accent-violet-600"
                        />
                        <span className="font-medium truncate">{b.name} ({b.code})</span>
                      </label>
                    ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Catatan Tambahan</label>
                <input
                  type="text"
                  value={inviteNotes}
                  onChange={(e) => setInviteNotes(e.target.value)}
                  placeholder="Misal: PIC Produksi CHEMI"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl"
                >
                  Generate & Kirim Undangan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT USER ROLE & BRANDS */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-purple-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900">
                Ubah Otoritas Akun: {editingUser.name}
              </h3>
              <button
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {editUserMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{editUserMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveUserPermissions} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Peran (Role)</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as UserRole)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                >
                  <option value="staff">Staff Operasional</option>
                  <option value="owner">Workspace Owner</option>
                  <option value="ika">Client Ika</option>
                  <option value="redi">Client Redi</option>
                  <option value="admin">Admin Transparansi (Read-Only)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Workspace Terikat</label>
                <select
                  value={editWorkspaceId}
                  onChange={(e) => setEditWorkspaceId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                >
                  <option value="ws_ika">Workspace Ika</option>
                  <option value="ws_redi">Workspace Redi</option>
                  <option value="ws_admin">Transparansi Baliyoutevolution</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Izin Brand yang Dapat Diakses
                </label>
                <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200 max-h-48 overflow-y-auto">
                  {brands
                    .filter((b) => b.status === 'active')
                    .map((b) => (
                      <label key={b.id} className="flex items-center gap-2 cursor-pointer text-slate-700">
                        <input
                          type="checkbox"
                          checked={editAllowedBrands.includes(b.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEditAllowedBrands([...editAllowedBrands, b.id]);
                            } else {
                              setEditAllowedBrands(editAllowedBrands.filter((id) => id !== b.id));
                            }
                          }}
                          className="w-3.5 h-3.5 accent-violet-600"
                        />
                        <span className="font-medium">{b.name} ({b.code})</span>
                      </label>
                    ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl"
                >
                  Simpan Izin Baru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ADMIN RESET PASSWORD */}
      {resettingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-purple-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-sm text-slate-900">
                Reset Kata Sandi Akun
              </h3>
              <button
                onClick={() => setResettingUser(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {resetPwdSuccess ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="font-mono">{resetPwdSuccess}</span>
              </div>
            ) : (
              <form onSubmit={handleAdminResetPassword} className="space-y-3.5 text-xs">
                <p className="text-slate-600 leading-relaxed">
                  Reset kata sandi untuk <span className="font-bold text-slate-900">{resettingUser.name}</span> ({resettingUser.email}).
                </p>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Sandi Baru Sementara (Opsional)
                  </label>
                  <input
                    type="text"
                    value={tempPassword}
                    onChange={(e) => setTempPassword(e.target.value)}
                    placeholder="Biarkan kosong untuk auto-generate"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setResettingUser(null)}
                    className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl"
                  >
                    Reset & Enkripsi Ulang
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL 4: REJECT BRAND */}
      {rejectingBrand && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-purple-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-sm text-red-950">
                Tolak Pengajuan Brand: {rejectingBrand.name}
              </h3>
              <button
                onClick={() => setRejectingBrand(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmRejectBrand} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Alasan Penolakan</label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Misal: Dokumen atau kategori bisnis belum sesuai regulasi..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 resize-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectingBrand(null)}
                  className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl"
                >
                  Konfirmasi Penolakan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
