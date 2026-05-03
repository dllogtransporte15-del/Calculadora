import React, { useState } from 'react';
import { KeyRound, Eye, EyeOff, ShieldCheck, AlertCircle } from 'lucide-react';
import logo from '../assets/logo.png';
import { updateUser, setLoggedInUser, User } from '../utils/storage';

interface ForcePasswordChangeProps {
  user: User;
  onPasswordChanged: (updatedUser: User) => void;
}

export default function ForcePasswordChange({ user, onPasswordChanged }: ForcePasswordChangeProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newPassword || !confirmPassword) {
      setError('Preencha os dois campos.');
      return;
    }
    if (newPassword.length < 6) {
      setError('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (newPassword === 'dllog123') {
      setError('Você não pode usar a senha padrão. Escolha uma senha nova.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setIsLoading(true);
    const updated = await updateUser(user.id, {
      passwordHash: newPassword,
      mustChangePassword: false
    });

    if (updated) {
      const refreshedUser: User = { ...user, passwordHash: newPassword, mustChangePassword: false };
      setLoggedInUser(refreshedUser);
      onPasswordChanged(refreshedUser);
    } else {
      setError('Erro ao salvar a nova senha. Tente novamente.');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-luxury-bg flex items-center justify-center p-4 font-sans relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-primary/10 rounded-full blur-3xl" />

      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 space-y-8 relative z-10 border border-primary/10">
        {/* Header */}
        <div className="text-center space-y-4">
          <img src={logo} alt="DLLOG Logo" className="w-20 h-20 mx-auto object-contain" />
          <div className="space-y-1">
            <h1 className="text-xl font-bold tracking-[0.1em] text-luxury-text uppercase">Troca de Senha Obrigatória</h1>
            <p className="text-[10px] font-bold tracking-[0.2em] text-primary uppercase">
              Segurança da sua conta
            </p>
          </div>
        </div>

        {/* Alert */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-900 leading-relaxed">
            Sua senha foi redefinida pelo administrador. Por segurança, você precisa criar uma nova senha antes de continuar.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Nova senha */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              Nova Senha <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <KeyRound className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres..."
                className="w-full pl-10 pr-10 py-3 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
              />
              <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirmar senha */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              Confirmar Nova Senha <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <ShieldCheck className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Repita a nova senha..."
                className="w-full pl-10 pr-10 py-3 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
              />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Erro */}
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-100 p-3 flex gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center items-center gap-2 py-3.5 px-4 rounded-xl shadow-md text-base font-semibold text-white bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-300 disabled:opacity-60"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <ShieldCheck className="w-5 h-5" />
                SALVAR NOVA SENHA E ENTRAR
              </>
            )}
          </button>
        </form>

        <p className="text-center text-[10px] text-slate-400 font-medium uppercase tracking-wide">
          {user.companyName} · {user.email}
        </p>
      </div>
    </div>
  );
}
