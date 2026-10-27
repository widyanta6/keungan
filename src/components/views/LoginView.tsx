import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  X,
  CheckCircle,
  Eye,
  EyeOff,
  UserCheck,
  KeyRound,
  ShieldAlert,
  Loader2,
} from 'lucide-react';
import { validatePasswordStrength } from '../../utils/authSecurity';

export const LoginView: React.FC = () => {
  const { login, requestPasswordReset, confirmPasswordReset, activateInvitation } = useApp();

  // Login Form States
  const [email, setEmail] = useState('superadmin@bizflow.id');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loginSuccessMsg, setLoginSuccessMsg] = useState('');

  // Password Reset Modal States
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetStep, setResetStep] = useState<'request' | 'confirm'>('request');
  const [resetEmail, setResetEmail] = useState('');
  const [generatedResetToken, setGeneratedResetToken] = useState('');
  const [enteredResetToken, setEnteredResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  // Invitation Activation Modal States
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteToken, setInviteToken] = useState('inv_token_chemi_maya2026');
  const [inviteName, setInviteName] = useState('Maya Kartika');
  const [inviteNewPassword, setInviteNewPassword] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [isActivating, setIsActivating] = useState(false);

  // Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoginSuccessMsg('');

    if (!email.trim()) {
      setErrorMsg('Silakan masukkan alamat email terdaftar.');
      return;
    }
    if (!password) {
      setErrorMsg('Silakan masukkan kata sandi Anda.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await login(email, password);
      if (!res.success) {
        setErrorMsg(res.error || 'Autentikasi gagal.');
      } else {
        setLoginSuccessMsg('Login berhasil! Mengalihkan ke workspace...');
      }
    } catch {
      setErrorMsg('Terjadi kesalahan saat memproses login. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (fillEmail: string, fillPass = 'password123') => {
    setEmail(fillEmail);
    setPassword(fillPass);
    setErrorMsg('');
    setLoginSuccessMsg('');
  };

  // Password Reset Flow
  const handleRequestReset = (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    if (!resetEmail.trim()) {
      setResetError('Silakan masukkan email akun Anda.');
      return;
    }
    const res = requestPasswordReset(resetEmail);
    if (!res.success) {
      setResetError(res.error || 'Gagal memproses permintaan reset sandi.');
    } else {
      setGeneratedResetToken(res.token || '');
      setEnteredResetToken(res.token || '');
      setResetStep('confirm');
    }
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    if (!enteredResetToken.trim()) {
      setResetError('Silakan masukkan token reset.');
      return;
    }
    const pwdStrength = validatePasswordStrength(newPassword);
    if (!pwdStrength.isValid) {
      setResetError(pwdStrength.feedback.join(' '));
      return;
    }

    const res = await confirmPasswordReset(enteredResetToken, newPassword);
    if (!res.success) {
      setResetError(res.error || 'Gagal mereset kata sandi.');
    } else {
      setResetSuccess(true);
      setTimeout(() => {
        setIsResetModalOpen(false);
        setResetSuccess(false);
        setResetStep('request');
        setEmail(resetEmail);
        setPassword(newPassword);
        setResetEmail('');
        setNewPassword('');
        setLoginSuccessMsg('Kata sandi berhasil diperbarui. Silakan login.');
      }, 1500);
    }
  };

  // Invitation Activation Flow
  const handleActivateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError('');
    if (!inviteToken.trim()) {
      setInviteError('Silakan masukkan token undangan.');
      return;
    }
    const pwdStrength = validatePasswordStrength(inviteNewPassword);
    if (!pwdStrength.isValid) {
      setInviteError(pwdStrength.feedback.join(' '));
      return;
    }

    setIsActivating(true);
    try {
      const res = await activateInvitation(inviteToken, inviteNewPassword, inviteName);
      if (!res.success) {
        setInviteError(res.error || 'Aktivasi gagal.');
      } else {
        setInviteSuccess(true);
        setTimeout(() => {
          setIsInviteModalOpen(false);
          setInviteSuccess(false);
          setInviteNewPassword('');
          setEmail('maya@bizflow.id');
          setPassword(inviteNewPassword);
          setLoginSuccessMsg('Akun berhasil diaktivasi! Silakan masuk dengan kata sandi baru Anda.');
        }, 1600);
      }
    } catch {
      setInviteError('Terjadi kesalahan pada saat aktivasi.');
    } finally {
      setIsActivating(false);
    }
  };

  const newPwdStrength = validatePasswordStrength(newPassword);
  const invitePwdStrength = validatePasswordStrength(inviteNewPassword);

  return (
    <div className="min-h-screen bg-[#0F071D] flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-purple-200/60 overflow-hidden">
        {/* Header Branding */}
        <div className="bg-gradient-to-br from-[#1B0E33] via-[#2A1550] to-[#3B1974] text-white p-7 text-center relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-violet-500/20 rounded-full blur-2xl" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-fuchsia-500/20 rounded-full blur-2xl" />

          <div className="w-13 h-13 mx-auto rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center font-black text-2xl shadow-lg border border-white/20 mb-2.5">
            B
          </div>
          <h1 className="text-xl font-bold tracking-tight">BizFlow Multi-Brand</h1>
          <p className="text-xs text-violet-200/80 mt-1 max-w-sm mx-auto">
            Sistem Manajemen Bisnis, Alur Kas, & Transparansi Keuangan Terpadu
          </p>

          <div className="mt-3 flex items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-violet-200 text-[11px] font-medium border border-white/15">
              <ShieldCheck className="w-3.5 h-3.5 text-violet-300" />
              <span>Autentikasi Terenkripsi Web Crypto</span>
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Feedback Messages */}
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{errorMsg}</span>
            </div>
          )}

          {loginSuccessMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-xs text-emerald-800">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{loginSuccessMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Alamat Email Terdaftar
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@bizflow.id"
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">Kata Sandi</label>
                <button
                  type="button"
                  onClick={() => {
                    setIsResetModalOpen(true);
                    setResetEmail(email);
                    setResetStep('request');
                    setResetError('');
                  }}
                  className="text-[11px] font-semibold text-violet-700 hover:text-violet-900 hover:underline cursor-pointer"
                >
                  Lupa sandi?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                  title={showPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-violet-600 hover:bg-violet-700 active:bg-violet-800 text-white font-semibold text-xs rounded-xl shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memverifikasi Akun...</span>
                </>
              ) : (
                <>
                  <span>Masuk ke Workspace BizFlow</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Invitation Activation Link */}
          <div className="p-3 bg-violet-50/70 border border-violet-100 rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-violet-900">
              <UserCheck className="w-4 h-4 text-violet-600 shrink-0" />
              <span className="font-medium">Menerima token undangan anggota baru?</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsInviteModalOpen(true);
                setInviteError('');
              }}
              className="text-[11px] font-bold text-violet-700 hover:text-violet-900 underline whitespace-nowrap cursor-pointer"
            >
              Aktivasi Akun
            </button>
          </div>

          {/* Quick Demo Credentials Matrix for Evaluation */}
          <div className="pt-4 border-t border-slate-100">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center mb-3 flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-violet-600" />
              <span>Pilih Cepat Akun Uji Coba (1-Click Fill)</span>
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Super Admin */}
              <button
                type="button"
                onClick={() => handleQuickFill('superadmin@bizflow.id')}
                className={`text-left p-2.5 rounded-xl border text-xs transition-all flex flex-col justify-between ${
                  email === 'superadmin@bizflow.id'
                    ? 'border-purple-600 bg-purple-50/80 font-semibold ring-1 ring-purple-500 text-purple-950'
                    : 'border-slate-200 hover:border-purple-300 bg-slate-50/60 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-purple-900 flex items-center gap-1">
                    <KeyRound className="w-3 h-3 text-purple-600" />
                    Super Admin
                  </span>
                  <span className="text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.2 rounded font-mono">
                    Utama
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">superadmin@bizflow.id</p>
                <span className="text-[10px] text-purple-600 font-medium mt-1">Kelola Akun & Brand</span>
              </button>

              {/* Ika */}
              <button
                type="button"
                onClick={() => handleQuickFill('ika@bizflow.id')}
                className={`text-left p-2.5 rounded-xl border text-xs transition-all flex flex-col justify-between ${
                  email === 'ika@bizflow.id'
                    ? 'border-violet-600 bg-violet-50/80 font-semibold ring-1 ring-violet-500 text-violet-950'
                    : 'border-slate-200 hover:border-violet-300 bg-slate-50/60 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-violet-900">Ika (Owner)</span>
                  <span className="text-[10px] bg-violet-100 text-violet-800 px-1.5 py-0.2 rounded font-mono">
                    Client
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">ika@bizflow.id</p>
                <span className="text-[10px] text-violet-600 font-medium mt-1">Tirama & CHEMI</span>
              </button>

              {/* Redi */}
              <button
                type="button"
                onClick={() => handleQuickFill('redi@bizflow.id')}
                className={`text-left p-2.5 rounded-xl border text-xs transition-all flex flex-col justify-between ${
                  email === 'redi@bizflow.id'
                    ? 'border-violet-600 bg-violet-50/80 font-semibold ring-1 ring-violet-500 text-violet-950'
                    : 'border-slate-200 hover:border-violet-300 bg-slate-50/60 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-violet-900">Redi (Owner)</span>
                  <span className="text-[10px] bg-violet-100 text-violet-800 px-1.5 py-0.2 rounded font-mono">
                    Client
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">redi@bizflow.id</p>
                <span className="text-[10px] text-violet-600 font-medium mt-1">BYE, Metamorph, Presta</span>
              </button>

              {/* Admin Baliyoutevolution */}
              <button
                type="button"
                onClick={() => handleQuickFill('admin@baliyoutevolution.org')}
                className={`text-left p-2.5 rounded-xl border text-xs transition-all flex flex-col justify-between ${
                  email === 'admin@baliyoutevolution.org'
                    ? 'border-amber-600 bg-amber-50/80 font-semibold ring-1 ring-amber-500 text-amber-950'
                    : 'border-slate-200 hover:border-amber-300 bg-slate-50/60 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-900 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-amber-600" />
                    Admin Yayasan
                  </span>
                  <span className="text-[10px] bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded font-mono">
                    Read-Only
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">admin@baliyoutevolution.org</p>
                <span className="text-[10px] text-amber-700 font-medium mt-1">Transparansi Keuangan</span>
              </button>
            </div>

            {/* Test Security Edge Cases */}
            <div className="mt-3 p-2.5 rounded-xl bg-slate-100/70 border border-slate-200 text-[11px] text-slate-600 space-y-1.5">
              <span className="font-semibold text-slate-800 flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-slate-500" />
                Uji Coba Penolakan Status Akun:
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickFill('budi@bizflow.id')}
                  className="px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200 font-medium transition-colors cursor-pointer"
                  title="Coba login dengan akun yang ditangguhkan (Suspended)"
                >
                  Test Suspended (Budi)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill('maya@bizflow.id')}
                  className="px-2 py-1 rounded bg-amber-100 text-amber-800 hover:bg-amber-200 font-medium transition-colors cursor-pointer"
                  title="Coba login dengan akun yang belum diaktivasi (Invited)"
                >
                  Test Belum Aktivasi (Maya)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL 1: FORGOT / RESET PASSWORD */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-purple-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <KeyRound className="w-4 h-4 text-violet-600" />
                <span>Pemulihan Kata Sandi Aman</span>
              </div>
              <button
                onClick={() => setIsResetModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {resetSuccess ? (
              <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl text-xs flex items-start gap-2.5 border border-emerald-200">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Kata Sandi Berhasil Direset!</p>
                  <p className="mt-0.5 text-emerald-700">
                    Sandi akun Anda telah dienkripsi dengan SHA-256 salt baru. Silakan login.
                  </p>
                </div>
              </div>
            ) : resetStep === 'request' ? (
              <form onSubmit={handleRequestReset} className="space-y-3.5 text-xs">
                <p className="text-slate-600 leading-relaxed">
                  Masukkan email akun terdaftar Anda. Sistem akan memverifikasi status akun dan membuat token reset yang aman.
                </p>

                {resetError && (
                  <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                    <span>{resetError}</span>
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email Akun</label>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="nama@bizflow.id"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsResetModalOpen(false)}
                    className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl"
                  >
                    Generate Token Reset
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleConfirmReset} className="space-y-3.5 text-xs">
                <div className="p-3 bg-violet-50 border border-violet-200 rounded-xl">
                  <p className="font-semibold text-violet-900">Token Reset Dihasilkan:</p>
                  <p className="text-violet-700 font-mono text-[11px] break-all select-all mt-0.5">
                    {generatedResetToken}
                  </p>
                  <p className="text-[10px] text-violet-600 mt-1">
                    *Pada lingkungan produksi token dikirim ke email. Di AI Studio token langsung terisi untuk evaluasi mudah.
                  </p>
                </div>

                {resetError && (
                  <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                    <span>{resetError}</span>
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Token Reset</label>
                  <input
                    type="text"
                    value={enteredResetToken}
                    onChange={(e) => setEnteredResetToken(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono text-slate-900"
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                    required
                  />
                  {/* Strength Bar */}
                  {newPassword && (
                    <div className="mt-1.5 space-y-1">
                      <div className="flex gap-1 h-1">
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
                      <p className="text-[10px] text-slate-500">
                        {newPwdStrength.feedback.join(' · ') || 'Kekuatan sandi mencukupi.'}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setResetStep('request')}
                    className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
                  >
                    Kembali
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl"
                  >
                    Simpan Sandi Baru
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: INVITATION ACTIVATION */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-purple-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <UserCheck className="w-4 h-4 text-violet-600" />
                <span>Aktivasi Undangan Anggota Baru</span>
              </div>
              <button
                onClick={() => setIsInviteModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {inviteSuccess ? (
              <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl text-xs flex items-start gap-2.5 border border-emerald-200">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Akun Berhasil Diaktivasi!</p>
                  <p className="mt-0.5 text-emerald-700">
                    Status akun diubah menjadi aktif. Mengalihkan ke halaman login...
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleActivateInvite} className="space-y-3.5 text-xs">
                <p className="text-slate-600 leading-relaxed">
                  Masukkan token undangan yang Anda terima dari Super Admin, kemudian buat kata sandi akun Anda untuk pertama kali.
                </p>

                {inviteError && (
                  <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                    <span>{inviteError}</span>
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Token Undangan</label>
                  <input
                    type="text"
                    value={inviteToken}
                    onChange={(e) => setInviteToken(e.target.value)}
                    placeholder="inv_token_..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    required
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Demo: gunakan token default di atas untuk aktivasi akun Maya Kartika.
                  </p>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Buat Kata Sandi Baru</label>
                  <input
                    type="password"
                    value={inviteNewPassword}
                    onChange={(e) => setInviteNewPassword(e.target.value)}
                    placeholder="Minimal 8 karakter (huruf, angka, simbol)"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    required
                  />
                  {inviteNewPassword && (
                    <div className="mt-1.5 space-y-1">
                      <div className="flex gap-1 h-1">
                        {[0, 1, 2, 3].map((step) => (
                          <div
                            key={step}
                            className={`flex-1 rounded-full ${
                              step <= invitePwdStrength.score
                                ? invitePwdStrength.score < 2
                                  ? 'bg-red-500'
                                  : invitePwdStrength.score < 3
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                                : 'bg-slate-200'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-[10px] text-slate-500">
                        {invitePwdStrength.feedback.join(' · ') || 'Kekuatan sandi mencukupi.'}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsInviteModalOpen(false)}
                    className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isActivating}
                    className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl flex items-center gap-1.5"
                  >
                    {isActivating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    <span>Aktivasi Akun Saya</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
