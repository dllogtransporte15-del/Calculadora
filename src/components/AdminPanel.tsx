import React, { useState, useMemo, useEffect } from 'react';
import {
  Users, Search, ShieldCheck, ShieldOff, Trash2, CheckCircle2,
  XCircle, Clock, Building, FileText, Mail, Calendar, Crown,
  LogOut, AlertTriangle, Phone, KeyRound, Eye, EyeOff, Check,
  CreditCard, CalendarCheck, Settings, ExternalLink
} from 'lucide-react';
import logo from '../assets/logo.png';
import { 
  getUsers, blockUser, unblockUser, deleteUser, updateUser, User, 
  setLoggedInUser, getLoggedInUser, MASTER_EMAIL, 
  renewSubscription, getSystemConfig, updateSystemConfig 
} from '../utils/storage';

interface AdminPanelProps {
  onLogout: () => void;
}

type FilterStatus = 'todos' | 'ativo' | 'bloqueado';

function formatDate(iso: string): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  } catch {
    return '—';
  }
}

function StatusBadge({ status }: { status: User['status'] }) {
  const map = {
    ativo: { icon: <CheckCircle2 className="w-3 h-3" />, label: 'Ativo', cls: 'bg-green-50 text-green-700 border-green-200' },
    bloqueado: { icon: <XCircle className="w-3 h-3" />, label: 'Bloqueado', cls: 'bg-red-50 text-red-700 border-red-200' },
    pendente: { icon: <Clock className="w-3 h-3" />, label: 'Pendente', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  };
  const s = map[status] || map.pendente;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${s.cls}`}>
      {s.icon} {s.label}
    </span>
  );
}

export default function AdminPanel({ onLogout }: AdminPanelProps) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('todos');
  const [confirmDelete, setConfirmDelete] = useState<User | null>(null);
  const [confirmReset, setConfirmReset] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState('');
  // Master password change
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [pwdMessage, setPwdMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [showConfigSection, setShowConfigSection] = useState(false);
  const [kiwifyLinks, setKiwifyLinks] = useState(() => getSystemConfig());

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const refresh = async () => {
    setIsLoading(true);
    const data = await getUsers();
    setUsers(data);
    setIsLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  const nonMasterUsers = useMemo(
    () => users.filter(u => u.role !== 'master'),
    [users]
  );

  const filtered = useMemo(() => {
    return nonMasterUsers.filter(u => {
      const matchSearch =
        u.companyName.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        (u.documentNumber || '').includes(search);
      const matchStatus = filterStatus === 'todos' || u.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [nonMasterUsers, search, filterStatus]);

  const stats = useMemo(() => ({
    total: nonMasterUsers.length,
    ativos: nonMasterUsers.filter(u => u.status === 'ativo').length,
    bloqueados: nonMasterUsers.filter(u => u.status === 'bloqueado').length,
    pendentes: nonMasterUsers.filter(u => u.status === 'pendente').length,
  }), [nonMasterUsers]);

  const handleBlock = async (user: User) => {
    const newStatus = user.status === 'bloqueado' ? 'ativo' : 'bloqueado';
    const updated = await updateUser(user.id, { status: newStatus });
    if (updated) {
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: newStatus } : u));
      showToast(newStatus === 'ativo' ? `✅ ${user.companyName} foi reativado.` : `🔒 ${user.companyName} foi bloqueado.`);
    } else {
      showToast(`❌ Erro ao alterar status.`);
    }
  };

  const handleDelete = async (user: User) => {
    const success = await deleteUser(user.id);
    if (success) {
      setUsers(prev => prev.filter(u => u.id !== user.id));
      setConfirmDelete(null);
      showToast(`🗑️ ${user.companyName} foi removido.`);
    } else {
      showToast(`❌ Erro ao excluir ${user.companyName}.`);
    }
  };

  const handleResetPassword = async (user: User) => {
    const updated = await updateUser(user.id, { passwordHash: 'dllog123' });
    if (updated) {
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, passwordHash: 'dllog123' } : u));
      setConfirmReset(null);
      showToast(`🔑 Senha de ${user.companyName} redefinida para dllog123.`);
    } else {
      showToast(`❌ Erro ao resetar senha.`);
    }
  };
  const handleChangeMasterPassword = async () => {
    setPwdMessage(null);
    if (!newPassword || !confirmPassword) {
      setPwdMessage({ type: 'error', text: 'Preencha os dois campos.' });
      return;
    }
    if (newPassword.length < 6) {
      setPwdMessage({ type: 'error', text: 'A senha deve ter pelo menos 6 caracteres.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdMessage({ type: 'error', text: 'As senhas não coincidem.' });
      return;
    }
    const currentUsers = await getUsers();
    const masterUser = currentUsers.find(u => u.email === MASTER_EMAIL);
    if (!masterUser) {
      setPwdMessage({ type: 'error', text: 'Usuário master não encontrado.' });
      return;
    }
    const updated = await updateUser(masterUser.id, { passwordHash: newPassword });
    if (updated) {
      const loggedUser = getLoggedInUser();
      if (loggedUser) setLoggedInUser({ ...loggedUser, passwordHash: newPassword });
      setPwdMessage({ type: 'success', text: 'Senha alterada com sucesso!' });
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => { setPwdMessage(null); setShowPasswordSection(false); }, 2500);
    }
  };

  const handleRenewSubscription = async (userId: string) => {
    const updated = await renewSubscription(userId, 30);
    if (updated) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, planType: 'paid', subscriptionEndDate: updated.subscriptionEndDate } : u));
      showToast(`\u2705 Assinatura renovada por +30 dias.`);
    } else {
      showToast(`❌ Erro ao renovar assinatura.`);
    }
  };

  const handleUpdateKiwify = () => {
    updateSystemConfig(kiwifyLinks);
    showToast(`\u2705 Links da Kiwify atualizados.`);
    setShowConfigSection(false);
  };

  const handleLogout = () => {
    setLoggedInUser(null);
    onLogout();
  };

  const exportCSV = () => {
    const header = 'Empresa,Email,Documento,Status,Cadastro\n';
    const rows = nonMasterUsers.map(u =>
      `"${u.companyName}","${u.email}","${u.documentNumber}","${u.status}","${formatDate(u.createdAt)}"`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dllog-usuarios-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-luxury-bg font-sans text-luxury-text">

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-white border border-primary/20 shadow-xl rounded-xl px-4 py-3 text-sm font-medium text-luxury-text">
          {toast}
        </div>
      )}

      {/* Confirm Delete Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-lg font-bold">Confirmar exclusão</h3>
            </div>
            <p className="text-slate-600 text-sm">
              Tem certeza que deseja excluir <strong>{confirmDelete.companyName}</strong>? Esta ação é irreversível.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                className="flex-1 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-all"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Reset Password Modal */}
      {confirmReset && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center gap-3 text-amber-600">
              <KeyRound className="w-6 h-6" />
              <h3 className="text-lg font-bold">Redefinir Senha</h3>
            </div>
            <p className="text-slate-600 text-sm">
              A senha de <strong>{confirmReset.companyName}</strong> será redefinida para <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-xs">dllog123</code>. O usuário deverá alterar após o próximo acesso.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmReset(null)}
                className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleResetPassword(confirmReset)}
                className="flex-1 py-2 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-all"
              >
                Redefinir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-primary/10 px-4 md:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={logo} alt="DLLOG" className="w-12 h-12 object-contain" />
            <div>
              <h1 className="text-lg font-bold tracking-[0.12em] uppercase text-luxury-text">
                Painel Administrativo
              </h1>
              <div className="flex items-center gap-1.5">
                <Crown className="w-3 h-3 text-primary" />
                <span className="text-[10px] font-bold tracking-widest text-primary uppercase">
                  Master — DLLOG TRANSPORTES
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowConfigSection(!showConfigSection)}
              title="Configurações do Sistema"
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${
                showConfigSection 
                  ? 'bg-primary text-white border-primary' 
                  : 'border-primary/20 text-primary hover:bg-primary/5'
              } text-xs font-bold uppercase tracking-wider`}
            >
              <Settings className="w-4 h-4" />
              Configurações
            </button>
            <button
              onClick={() => setShowPasswordSection(!showPasswordSection)}
              title="Alterar minha senha"
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${
                showPasswordSection 
                  ? 'bg-primary text-white border-primary' 
                  : 'border-primary/20 text-primary hover:bg-primary/5'
              } text-xs font-bold uppercase tracking-wider`}
            >
              <KeyRound className="w-4 h-4" />
              Minha Senha
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-slate-500 text-sm font-semibold hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </div>
        </div>

        {/* System Configuration Section */}
        {showConfigSection && (
          <div className="border-t border-primary/10 pt-6 mt-4 bg-slate-50/50 -mx-4 md:-mx-8 px-4 md:px-8 pb-6">
            <div className="max-w-4xl">
              <div className="flex items-center gap-2 mb-4">
                <Settings className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-luxury-text">Links de Checkout Kiwify</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Plano Mensal</label>
                  <input 
                    type="text" 
                    value={kiwifyLinks.kiwifyMensalUrl} 
                    onChange={e => setKiwifyLinks({...kiwifyLinks, kiwifyMensalUrl: e.target.value})}
                    placeholder="https://pay.kiwify.com.br/..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Plano Trimestral</label>
                  <input 
                    type="text" 
                    value={kiwifyLinks.kiwifyTrimestralUrl} 
                    onChange={e => setKiwifyLinks({...kiwifyLinks, kiwifyTrimestralUrl: e.target.value})}
                    placeholder="https://pay.kiwify.com.br/..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Plano Anual</label>
                  <input 
                    type="text" 
                    value={kiwifyLinks.kiwifyAnualUrl} 
                    onChange={e => setKiwifyLinks({...kiwifyLinks, kiwifyAnualUrl: e.target.value})}
                    placeholder="https://pay.kiwify.com.br/..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleUpdateKiwify}
                  className="flex items-center gap-2 px-6 py-2 bg-primary text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-primary-dark shadow-md"
                >
                  <Check className="w-4 h-4" />
                  Salvar Configurações
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Change Master Password Section */}
        {showPasswordSection && (
          <div className="border-t border-primary/10 pt-6 mt-4 bg-slate-50/50 -mx-4 md:-mx-8 px-4 md:px-8 pb-6">
            <div className="max-w-md">
              <div className="flex items-center gap-2 mb-4">
                <KeyRound className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-luxury-text">Alterar Minha Senha</h3>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 items-end">
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nova Senha</label>
                  <div className="relative">
                    <input 
                      type={showNewPwd ? 'text' : 'password'}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres..."
                      className="w-full pr-9 pl-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                    />
                    <button type="button" onClick={() => setShowNewPwd(!showNewPwd)} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showNewPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Confirmar Senha</label>
                  <div className="relative">
                    <input 
                      type={showConfirmPwd ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Repita a senha..."
                      className="w-full pr-9 pl-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                    />
                    <button type="button" onClick={() => setShowConfirmPwd(!showConfirmPwd)} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showConfirmPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button
                  onClick={handleChangeMasterPassword}
                  className="flex items-center gap-1.5 px-6 py-2 bg-primary text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-primary-dark shadow-md whitespace-nowrap"
                >
                  <Check className="w-4 h-4" />
                  Salvar
                </button>
              </div>
              {pwdMessage && (
                <p className={`mt-2 text-xs font-semibold ${ pwdMessage.type === 'success' ? 'text-green-600' : 'text-red-500' }`}>
                  {pwdMessage.text}
                </p>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total de Usuários', value: stats.total, icon: <Users className="w-5 h-5" />, color: 'text-primary' },
            { label: 'Ativos', value: stats.ativos, icon: <CheckCircle2 className="w-5 h-5" />, color: 'text-green-600' },
            { label: 'Bloqueados', value: stats.bloqueados, icon: <XCircle className="w-5 h-5" />, color: 'text-red-600' },
            { label: 'Pendentes', value: stats.pendentes, icon: <Clock className="w-5 h-5" />, color: 'text-amber-500' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3">
              <div className={`p-2 bg-slate-50 rounded-xl ${s.color}`}>{s.icon}</div>
              <div>
                <p className="text-2xl font-bold text-luxury-text">{s.value}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col md:flex-row gap-3 items-center">
          {/* Search */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por empresa, e-mail ou documento..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
            />
          </div>

          {/* Filter */}
          <div className="flex gap-2">
            {(['todos', 'ativo', 'bloqueado'] as FilterStatus[]).map(f => (
              <button
                key={f}
                onClick={() => setFilterStatus(f)}
                className={`px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all ${
                  filterStatus === f
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-slate-400 border-slate-200 hover:border-primary/40'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Export */}
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider hover:bg-primary/5 transition-all whitespace-nowrap"
          >
            <FileText className="w-4 h-4" />
            Exportar CSV
          </button>
        </div>

        {/* User Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80">
                  <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Empresa</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Contato</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Assinatura</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Cadastro</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Status</th>
                  <th className="text-right px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Ações</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-16 text-slate-400">
                      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-sm font-medium">Carregando usuários...</p>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-16 text-slate-400">
                      <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                      <p className="text-sm font-medium">Nenhum usuário encontrado</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map(user => (
                    <tr key={user.id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                            <Building className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold text-luxury-text text-sm">{user.companyName}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{user.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <span className="text-xs truncate max-w-[160px]">{user.email}</span>
                          </div>
                          {user.whatsapp && (
                            <a
                              href={`https://wa.me/55${user.whatsapp.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={`Abrir WhatsApp: ${user.whatsapp}`}
                              className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-green-50 border border-green-200 text-green-700 hover:bg-green-100 hover:border-green-300 transition-all group"
                            >
                              <Phone className="w-3 h-3 flex-shrink-0 group-hover:animate-bounce" />
                              <span className="text-[11px] font-semibold">{user.whatsapp}</span>
                              <svg className="w-2.5 h-2.5 opacity-60" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"/>
                                <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z"/>
                              </svg>
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest border ${
                            user.planType === 'paid' ? 'bg-green-50 text-green-600 border-green-100' : 
                            user.planType === 'trial' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                            'bg-red-50 text-red-600 border-red-100'
                          }`}>
                            <CreditCard className="w-2.5 h-2.5" />
                            {user.planType === 'paid' ? 'PAGO' : user.planType === 'trial' ? 'TESTE' : 'EXPIRADO'}
                          </div>
                          {user.subscriptionEndDate && (
                            <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                              <CalendarCheck className="w-3 h-3 text-slate-400" />
                              Expira: {formatDate(user.subscriptionEndDate)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <Calendar className="w-3.5 h-3.5" />
                          <span className="text-xs">{formatDate(user.createdAt)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={user.status || 'ativo'} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleRenewSubscription(user.id)}
                            title="Renovar +30 dias"
                            className="p-1.5 rounded-lg border border-green-200 text-green-600 hover:bg-green-50 transition-all"
                          >
                            <CalendarCheck className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setConfirmReset(user)}
                            title="Resetar senha para dllog123"
                            className="p-1.5 rounded-lg border border-amber-200 text-amber-600 hover:bg-amber-50 transition-all"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleBlock(user)}
                            title={user.status === 'bloqueado' ? 'Reativar' : 'Bloquear'}
                            className={`p-1.5 rounded-lg border transition-all ${
                              user.status === 'bloqueado'
                                ? 'border-green-200 text-green-600 hover:bg-green-50'
                                : 'border-orange-200 text-orange-500 hover:bg-orange-50'
                            }`}
                          >
                            {user.status === 'bloqueado'
                              ? <ShieldCheck className="w-4 h-4" />
                              : <ShieldOff className="w-4 h-4" />
                            }
                          </button>
                          <button
                            onClick={() => setConfirmDelete(user)}
                            title="Excluir"
                            className="p-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {filtered.length > 0 && (
            <div className="px-4 py-2 border-t border-slate-100 text-[10px] text-slate-400 font-medium">
              Exibindo {filtered.length} de {nonMasterUsers.length} usuário(s)
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
