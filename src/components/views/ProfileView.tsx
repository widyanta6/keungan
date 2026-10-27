import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  User as UserIcon,
  Mail,
  Phone,
  Building2,
  Lock,
  KeyRound,
  CheckCircle,
  AlertCircle,
  Plus,
  Edit2,
  ShieldCheck,
  Tag,
  Clock,
  Sparkles,
  ExternalLink,
  Save,
  X,
  Palette,
  Briefcase,
  Layers,
} from 'lucide-react';
import { BusinessCategory, Brand, BrandBusinessContact } from '../../types';
import { validatePasswordStrength } from '../../utils/authSecurity';

export const ProfileView: React.FC = () => {
  const {
    currentUser,
    brands,
    brandPolicy,
    updateUserProfile,
    changePassword,
    addBrand,
    updateBrand,
    selectedBrandId,
    setSelectedBrandId,
  } = useApp();

  if (!currentUser) return null;

  // Tabs inside Profile View
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'brands' | 'security'>('profile');

  // Edit Profile Form State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [name, setName] = useState(currentUser.name);
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [bio, setBio] = useState(currentUser.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatarUrl || '');
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');
  const [profileErrorMsg, setProfileErrorMsg] = useState('');

  // Change Password Form State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdSuccessMsg, setPwdSuccessMsg] = useState('');
  const [pwdErrorMsg, setPwdErrorMsg] = useState('');
  const [isSavingPwd, setIsSavingPwd] = useState(false);

  // Brand Management State
  const [isAddBrandModalOpen, setIsAddBrandModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [brandName, setBrandName] = useState('');
  const [brandCategory, setBrandCategory] = useState<BusinessCategory>('Aksesori / Perhiasan Handmade');
  const [brandDescription, setBrandDescription] = useState('');
  const [brandColor, setBrandColor] = useState('#8B5CF6');
  const [brandEmail, setBrandEmail] = useState('');
  const [brandPhone, setBrandPhone] = useState('');
  const [brandAddress, setBrandAddress] = useState('');
  const [brandModalError, setBrandModalError] = useState('');
  const [brandModalSuccess, setBrandModalSuccess] = useState('');

  const isAdmin = currentUser.role === 'admin';
  const isSuperAdmin = currentUser.role === 'super_admin';

  // Brands accessible to current user
  const userBrands = isSuperAdmin
    ? brands
    : brands.filter((b) => {
        if (currentUser.allowedBrandIds?.includes(b.id)) return true;
        if (b.ownerUserId === currentUser.id) return true;
        if (b.workspaceId === currentUser.workspaceId) return true;
        return false;
      });

  const activeBrands = userBrands.filter((b) => b.status === 'active');
  const pendingBrands = userBrands.filter((b) => b.status === 'pending_approval');

  // Handle Save Profile
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileErrorMsg('');
    setProfileSuccessMsg('');

    if (!name.trim()) {
      setProfileErrorMsg('Nama lengkap tidak boleh kosong.');
      return;
    }

    const res = updateUserProfile({
      name: name.trim(),
      phone: phone.trim(),
      bio: bio.trim(),
      avatarUrl: avatarUrl.trim(),
    });

    if (!res.success) {
      setProfileErrorMsg(res.error || 'Gagal menyimpan profil.');
    } else {
      setProfileSuccessMsg('Profil berhasil diperbarui dan tersimpan.');
      setIsEditingProfile(false);
      setTimeout(() => setProfileSuccessMsg(''), 4000);
    }
  };

  const handleCancelEditProfile = () => {
    setName(currentUser.name);
    setPhone(currentUser.phone || '');
    setBio(currentUser.bio || '');
    setAvatarUrl(currentUser.avatarUrl || '');
    setIsEditingProfile(false);
    setProfileErrorMsg('');
  };

  // Handle Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdErrorMsg('');
    setPwdSuccessMsg('');

    if (!oldPassword) {
      setPwdErrorMsg('Silakan masukkan kata sandi saat ini.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdErrorMsg('Konfirmasi kata sandi baru tidak cocok.');
      return;
    }

    const strength = validatePasswordStrength(newPassword);
    if (!strength.isValid) {
      setPwdErrorMsg(strength.feedback.join(' '));
      return;
    }

    setIsSavingPwd(true);
    try {
      const res = await changePassword(oldPassword, newPassword);
      if (!res.success) {
        setPwdErrorMsg(res.error || 'Gagal mengganti kata sandi.');
      } else {
        setPwdSuccessMsg('Kata sandi berhasil diperbarui dengan hashing SHA-256 dan salt baru.');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPwdSuccessMsg(''), 4000);
      }
    } catch {
      setPwdErrorMsg('Terjadi kesalahan saat memproses perubahan sandi.');
    } finally {
      setIsSavingPwd(false);
    }
  };

  // Open Add Brand Modal
  const handleOpenAddBrand = () => {
    setEditingBrand(null);
    setBrandName('');
    setBrandCategory('Fashion & Pakaian');
    setBrandDescription('');
    setBrandColor('#8B5CF6');
    setBrandEmail('');
    setBrandPhone('');
    setBrandAddress('');
    setBrandModalError('');
    setBrandModalSuccess('');
    setIsAddBrandModalOpen(true);
  };

  // Open Edit Brand Modal
  const handleOpenEditBrand = (b: Brand) => {
    setEditingBrand(b);
    setBrandName(b.name);
    setBrandCategory(b.category);
    setBrandDescription(b.description || '');
    setBrandColor(b.color || '#8B5CF6');
    setBrandEmail(b.businessContact?.email || '');
    setBrandPhone(b.businessContact?.phone || '');
    setBrandAddress(b.businessContact?.address || '');
    setBrandModalError('');
    setBrandModalSuccess('');
    setIsAddBrandModalOpen(true);
  };

  // Save or Submit Brand
  const handleSaveBrand = (e: React.FormEvent) => {
    e.preventDefault();
    setBrandModalError('');
    setBrandModalSuccess('');

    if (!brandName.trim()) {
      setBrandModalError('Nama brand wajib diisi.');
      return;
    }

    const contact: BrandBusinessContact = {
      email: brandEmail.trim() || undefined,
      phone: brandPhone.trim() || undefined,
      address: brandAddress.trim() || undefined,
    };

    if (editingBrand) {
      const res = updateBrand(editingBrand.id, {
        name: brandName.trim(),
        category: brandCategory,
        description: brandDescription.trim(),
        color: brandColor,
        businessContact: contact,
      });

      if (!res.success) {
        setBrandModalError(res.error || 'Gagal memperbarui informasi brand.');
      } else {
        setBrandModalSuccess('Informasi brand berhasil diperbarui!');
        setTimeout(() => {
          setIsAddBrandModalOpen(false);
          setBrandModalSuccess('');
        }, 1200);
      }
    } else {
      const res = addBrand({
        name: brandName.trim(),
        category: brandCategory,
        description: brandDescription.trim(),
        color: brandColor,
        businessContact: contact,
      });

      if (!res.success) {
        setBrandModalError(res.error || 'Gagal mengajukan brand baru.');
      } else {
        if (res.requiresApproval) {
          setBrandModalSuccess(
            'Brand berhasil diajukan! Menunggu peninjauan dan persetujuan dari Super Admin.'
          );
        } else {
          setBrandModalSuccess('Brand baru berhasil ditambahkan dan aktif!');
        }
        setTimeout(() => {
          setIsAddBrandModalOpen(false);
          setBrandModalSuccess('');
        }, 1600);
      }
    }
  };

  const newPwdStrength = validatePasswordStrength(newPassword);

  const roleBadgeStyles: Record<string, string> = {
    super_admin: 'bg-purple-100 text-purple-800 border-purple-200',
    ika: 'bg-pink-100 text-pink-800 border-pink-200',
    redi: 'bg-blue-100 text-blue-800 border-blue-200',
    owner: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    admin: 'bg-amber-100 text-amber-800 border-amber-200',
    staff: 'bg-slate-100 text-slate-800 border-slate-200',
  };

  const roleDisplayNames: Record<string, string> = {
    super_admin: 'Super Admin BizFlow (Master Controller)',
    ika: 'Client Owner (Ika - Tirama & CHEMI)',
    redi: 'Client Owner (Redi - BYE, MTM, PRM)',
    owner: 'Workspace Owner',
    admin: 'Admin Transparansi (Read-Only Baliyoutevolution)',
    staff: 'Staff Operasional Brand',
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-purple-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            {currentUser.avatarUrl ? (
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.name}
                className="w-16 h-16 rounded-2xl object-cover ring-4 ring-purple-100"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center font-bold text-2xl text-white shadow-sm">
                {currentUser.name.charAt(0)}
              </div>
            )}
            <span
              className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                currentUser.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
              title={`Status: ${currentUser.status}`}
            />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-slate-900">{currentUser.name}</h1>
              <span
                className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-md border ${
                  roleBadgeStyles[currentUser.role] || 'bg-slate-100 text-slate-800 border-slate-200'
                }`}
              >
                {roleDisplayNames[currentUser.role] || currentUser.role}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
              <span>{currentUser.email}</span>
              {currentUser.phone && (
                <>
                  <span className="text-slate-300">·</span>
                  <span>{currentUser.phone}</span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Brand Summary Counter */}
        <div className="flex items-center gap-3">
          <div className="bg-purple-50/60 border border-purple-100/80 rounded-xl px-3.5 py-2 text-right">
            <span className="text-[11px] font-medium text-purple-700 block">Brand Terhubung</span>
            <span className="text-base font-bold text-purple-950 tabular-nums">
              {activeBrands.length} Aktif
              {pendingBrands.length > 0 && (
                <span className="text-amber-600 text-xs ml-1 font-semibold">
                  (+{pendingBrands.length} Menunggu)
                </span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Sub-Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-purple-100 pb-2 text-xs font-semibold">
        <button
          onClick={() => setActiveSubTab('profile')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all ${
            activeSubTab === 'profile'
              ? 'bg-violet-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <UserIcon className="w-4 h-4" />
          <span>Informasi Profil</span>
        </button>

        <button
          onClick={() => setActiveSubTab('brands')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all ${
            activeSubTab === 'brands'
              ? 'bg-violet-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Kelola Brand ({userBrands.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('security')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all ${
            activeSubTab === 'security'
              ? 'bg-violet-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>Keamanan & Kata Sandi</span>
        </button>
      </div>

      {/* TAB 1: INFORMASI PROFIL */}
      {activeSubTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info Card */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-purple-100 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Data Identitas Pengguna</h3>
                <p className="text-xs text-slate-500">
                  Informasi profil resmi akun Anda yang terdaftar pada sistem BizFlow
                </p>
              </div>
              {!isEditingProfile && (
                <button
                  onClick={() => setIsEditingProfile(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-violet-50 text-violet-700 hover:bg-violet-100 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Profil</span>
                </button>
              )}
            </div>

            {profileSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{profileSuccessMsg}</span>
              </div>
            )}

            {profileErrorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{profileErrorMsg}</span>
              </div>
            )}

            {isEditingProfile ? (
              <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Alamat Email (Terkunci)
                    </label>
                    <input
                      type="email"
                      value={currentUser.email}
                      disabled
                      className="w-full bg-slate-100 border border-slate-200 rounded-xl p-2.5 text-slate-500 cursor-not-allowed"
                      title="Perubahan email memerlukan verifikasi Super Admin"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Email login diikat secara permanen demi integritas audit kas.
                    </p>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Nomor Kontak / WhatsApp</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+62 812-xxxx-xxxx"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">URL Foto Profil (Avatar)</label>
                  <input
                    type="url"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Bio / Informasi Posisi Bisnis
                  </label>
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Deskripsi singkat tanggung jawab dan operasional..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleCancelEditProfile}
                    className="px-4 py-2 border border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl transition-all shadow-xs"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Simpan Perubahan</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[11px] font-medium text-slate-400 block">Nama Lengkap</span>
                    <span className="font-bold text-slate-900 text-sm mt-0.5 block">{currentUser.name}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[11px] font-medium text-slate-400 block">Alamat Email</span>
                    <span className="font-bold text-slate-900 text-sm mt-0.5 block font-mono">
                      {currentUser.email}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[11px] font-medium text-slate-400 block">Nomor Kontak</span>
                    <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                      {currentUser.phone || '-'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[11px] font-medium text-slate-400 block">Ruang Kerja (Workspace)</span>
                    <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                      {currentUser.workspaceId === 'ws_superadmin'
                        ? 'Master Super Admin'
                        : currentUser.workspaceId === 'ws_ika'
                        ? 'Workspace Ika'
                        : currentUser.workspaceId === 'ws_redi'
                        ? 'Workspace Redi'
                        : 'Transparansi Baliyoutevolution'}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] font-medium text-slate-400 block mb-1">
                    Bio & Catatan Bisnis
                  </span>
                  <p className="text-slate-700 leading-relaxed">
                    {currentUser.bio || 'Belum ada ringkasan bio yang ditambahkan.'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Security & Access Guard Info */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-5 border border-purple-100 shadow-xs space-y-3">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Aturan Keamanan Akun</span>
              </h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Setiap akun di BizFlow memiliki batas izin ketat yang diverifikasi di level backend.
              </p>

              <div className="space-y-2 text-[11px]">
                <div className="p-2.5 rounded-lg bg-purple-50 text-purple-900 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-600 mt-1.5 shrink-0" />
                  <span>Role hanya dapat diubah oleh Super Admin melalui panel manajemen.</span>
                </div>
                <div className="p-2.5 rounded-lg bg-purple-50 text-purple-900 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-600 mt-1.5 shrink-0" />
                  <span>Ika dan Redi tidak memiliki akses silang ke brand privat masing-masing.</span>
                </div>
                <div className="p-2.5 rounded-lg bg-amber-50 text-amber-900 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-1.5 shrink-0" />
                  <span>Admin Baliyoutevolution memiliki hak baca transparan tanpa izin mutasi keuangan.</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-violet-900 to-indigo-950 text-white rounded-2xl p-5 shadow-xs space-y-2">
              <div className="flex items-center gap-2 text-violet-200 text-xs font-semibold">
                <Clock className="w-4 h-4" />
                <span>Sesi & Riwayat Akses</span>
              </div>
              <p className="text-xs text-violet-100/90 font-medium">
                Terakhir Masuk: {currentUser.lastLoginAt || 'Hari ini'}
              </p>
              <p className="text-[10px] text-violet-300/70">
                Sesi Anda diamankan dengan token kriptografis dan dilindungi dari manipulasi DOM browser.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: KELOLA BRAND */}
      {activeSubTab === 'brands' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-purple-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Daftar Brand Terhubung</h3>
              <p className="text-xs text-slate-500">
                Kelola informasi, kategori bisnis, dan kontak operasional brand yang berada di bawah wewenang Anda
              </p>
            </div>

            {!isAdmin && (
              <button
                onClick={handleOpenAddBrand}
                disabled={!isSuperAdmin && !brandPolicy.allowUserCreateBrand}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                title={
                  !isSuperAdmin && !brandPolicy.allowUserCreateBrand
                    ? 'Pembuatan brand baru saat ini dinonaktifkan oleh Super Admin'
                    : 'Tambah Brand Baru'
                }
              >
                <Plus className="w-4 h-4" />
                <span>Tambah / Ajukan Brand</span>
              </button>
            )}
          </div>

          {/* Pending Approval Notice */}
          {pendingBrands.length > 0 && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 space-y-1">
              <div className="flex items-center gap-2 font-bold text-amber-800">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>Pengajuan Brand Sedang Ditinjau Super Admin ({pendingBrands.length})</span>
              </div>
              <p className="text-amber-700 leading-relaxed">
                Brand berikut telah diajukan dan sedang menunggu verifikasi oleh Super Admin. Setelah disetujui, brand akan otomatis aktif di workspace Anda.
              </p>
            </div>
          )}

          {/* Brand Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userBrands.map((b) => {
              const isActive = b.status === 'active';
              const isSelected = selectedBrandId === b.id;

              return (
                <div
                  key={b.id}
                  className={`bg-white rounded-2xl p-5 border transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'border-violet-500 ring-2 ring-violet-400/30 shadow-sm'
                      : 'border-purple-100/90 hover:border-purple-200 shadow-xs'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-sm shadow-xs"
                          style={{ backgroundColor: b.color || '#8B5CF6' }}
                        >
                          {b.code || b.name.substring(0, 3).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-slate-900 leading-tight">{b.name}</h4>
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                            Kode: {b.code}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isActive
                            ? 'bg-emerald-100 text-emerald-800'
                            : b.status === 'pending_approval'
                            ? 'bg-amber-100 text-amber-800'
                            : b.status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {isActive
                          ? 'Aktif'
                          : b.status === 'pending_approval'
                          ? 'Menunggu Review'
                          : b.status === 'rejected'
                          ? 'Ditolak'
                          : 'Arsip'}
                      </span>
                    </div>

                    <div className="p-2 rounded-lg bg-purple-50/50 border border-purple-100/50">
                      <span className="text-[10px] font-semibold text-purple-700 uppercase tracking-wider block">
                        Kategori Bisnis:
                      </span>
                      <span className="text-xs font-semibold text-purple-950 block mt-0.5">
                        {b.category}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {b.description || 'Tidak ada deskripsi.'}
                    </p>

                    {b.businessContact && (
                      <div className="space-y-1 pt-1 text-[11px] text-slate-500 border-t border-slate-100">
                        {b.businessContact.email && (
                          <div className="flex items-center gap-1.5 truncate">
                            <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{b.businessContact.email}</span>
                          </div>
                        )}
                        {b.businessContact.phone && (
                          <div className="flex items-center gap-1.5 truncate">
                            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{b.businessContact.phone}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {b.approvalNotes && (
                      <div className="p-2 rounded-lg bg-amber-50 text-amber-800 text-[10px]">
                        <span className="font-bold">Catatan: </span>
                        <span>{b.approvalNotes}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                    {isActive ? (
                      <button
                        onClick={() => setSelectedBrandId(b.id)}
                        className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                          isSelected
                            ? 'bg-violet-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-violet-50 hover:text-violet-700'
                        }`}
                      >
                        {isSelected ? 'Brand Terpilih' : 'Pilih untuk Workspace'}
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">Belum dapat dipilih</span>
                    )}

                    {!isAdmin && (
                      <button
                        onClick={() => handleOpenEditBrand(b)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                        title="Edit Informasi Brand"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: KEAMANAN & KATA SANDI */}
      {activeSubTab === 'security' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-purple-100 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Perbarui Kata Sandi Akun</h3>
              <p className="text-xs text-slate-500">
                Sandi baru Anda akan dienkripsi menggunakan Web Crypto API dengan SHA-256 dan salt kriptografis unik.
              </p>
            </div>

            {pwdSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{pwdSuccessMsg}</span>
              </div>
            )}

            {pwdErrorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{pwdErrorMsg}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Kata Sandi Saat Ini</label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Kata Sandi Baru</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 8 karakter (huruf, angka, simbol)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white"
                  required
                />

                {/* Password strength meter */}
                {newPassword && (
                  <div className="mt-2 space-y-1">
                    <div className="flex gap-1 h-1.5">
                      {[0, 1, 2, 3].map((step) => (
                        <div
                          key={step}
                          className={`flex-1 rounded-full ${
                            step <= newPwdStrength.score
                              ? newPwdStrength.score < 2
                                ? 'bg-red-500'
                                : newPwdStrength.score < 3
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                              : 'bg-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {newPwdStrength.feedback.join(' · ') || 'Kekuatan sandi mencukupi.'}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Konfirmasi Kata Sandi Baru</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi kata sandi baru"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={isSavingPwd}
                  className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl transition-all shadow-xs disabled:opacity-50"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{isSavingPwd ? 'Menyimpan...' : 'Perbarui Kata Sandi'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Cryptographic Security Details */}
          <div className="bg-white rounded-2xl p-6 border border-purple-100 shadow-xs space-y-4">
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-violet-600" />
              <span>Standar Keamanan BizFlow</span>
            </h4>
            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="font-bold text-slate-800 block text-[11px]">Enkripsi Salt Kriptografis</span>
                <span className="text-[11px] text-slate-500 mt-0.5 block">
                  Password tidak pernah disimpan dalam format teks biasa (plain text). Setiap akun memiliki salt acak berbeda.
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="font-bold text-slate-800 block text-[11px]">Validasi Sesi Otentik</span>
                <span className="text-[11px] text-slate-500 mt-0.5 block">
                  Saat login kembali, integritas status akun diverifikasi langsung ke tabel pengguna.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: TAMBAH / EDIT BRAND */}
      {isAddBrandModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-purple-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Building2 className="w-4 h-4 text-violet-600" />
                <span>{editingBrand ? 'Edit Informasi Brand' : 'Tambah / Ajukan Brand Baru'}</span>
              </div>
              <button
                onClick={() => setIsAddBrandModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {brandModalSuccess && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{brandModalSuccess}</span>
              </div>
            )}

            {brandModalError && (
              <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{brandModalError}</span>
              </div>
            )}

            <form onSubmit={handleSaveBrand} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Brand</label>
                <input
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="Misal: Studio Kreatif Bali"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Kategori Bisnis</label>
                <select
                  value={brandCategory}
                  onChange={(e) => setBrandCategory(e.target.value as BusinessCategory)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="Aksesori / Perhiasan Handmade">Aksesori / Perhiasan Handmade</option>
                  <option value="Fashion & Pakaian">Fashion & Pakaian</option>
                  <option value="Event / Program Pemuda">Event / Program Pemuda</option>
                  <option value="Media / Promosi / Agency">Media / Promosi / Agency</option>
                  <option value="Jasa / Proyek Kreatif">Jasa / Proyek Kreatif</option>
                  <option value="Retail / Reseller">Retail / Reseller</option>
                  <option value="Workshop / Kursus">Workshop / Kursus</option>
                  <option value="Lainnya / Custom">Lainnya / Custom</option>
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Kategori menentukan rekomendasi field transaksi, modul stok, dan kalkulasi HPP.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Deskripsi Singkat</label>
                <textarea
                  rows={2}
                  value={brandDescription}
                  onChange={(e) => setBrandDescription(e.target.value)}
                  placeholder="Penjelasan lini produk atau jasa yang ditawarkan..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Warna Aksen Brand</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={brandColor}
                      onChange={(e) => setBrandColor(e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200 p-0.5"
                    />
                    <input
                      type="text"
                      value={brandColor}
                      onChange={(e) => setBrandColor(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-900 font-mono text-[11px]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email Kontak Bisnis</label>
                  <input
                    type="email"
                    value={brandEmail}
                    onChange={(e) => setBrandEmail(e.target.value)}
                    placeholder="contact@brand.id"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nomor Telepon Bisnis</label>
                  <input
                    type="text"
                    value={brandPhone}
                    onChange={(e) => setBrandPhone(e.target.value)}
                    placeholder="+62 812-..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Alamat Operasional</label>
                  <input
                    type="text"
                    value={brandAddress}
                    onChange={(e) => setBrandAddress(e.target.value)}
                    placeholder="Kota, Lokasi..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                  />
                </div>
              </div>

              {!isSuperAdmin && brandPolicy.requireAdminApproval && !editingBrand && (
                <div className="p-3 rounded-xl bg-violet-50 text-violet-900 border border-violet-100 text-[11px] leading-relaxed">
                  <span className="font-bold">Kebijakan Persetujuan: </span>
                  Pengajuan brand baru memerlukan peninjauan oleh Super Admin sebelum dapat digunakan untuk mencatat transaksi keuangan.
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddBrandModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl"
                >
                  {editingBrand ? 'Simpan Perubahan' : 'Ajukan Brand'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
