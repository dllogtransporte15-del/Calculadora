import React, { useState } from 'react';
import { LogIn, UserPlus, Mail, Lock, Building, AlertCircle, Send, FileText, Phone } from 'lucide-react';
import logo from '../assets/logo.png';
import { getUsers, saveUser, setLoggedInUser, User } from '../utils/storage';

interface AuthProps {
  onLogin: (user: User) => void;
}

// Formata CPF: 000.000.000-00
function formatCPF(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

// Formata CNPJ: 00.000.000/0000-00
function formatCNPJ(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 14);
  return digits
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
}

function validateCPF(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, '');
  return digits.length === 11;
}

function validateCNPJ(cnpj: string): boolean {
  const digits = cnpj.replace(/\D/g, '');
  return digits.length === 14;
}

// Formata telefone: (00) 00000-0000
function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 10) {
    return digits
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d{1,4})$/, '$1-$2');
  }
  return digits
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d{1,4})$/, '$1-$2');
}

export default function Auth({ onLogin }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [documentType, setDocumentType] = useState<'CPF' | 'CNPJ'>('CNPJ');
  const [documentNumber, setDocumentNumber] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryMessage, setRecoveryMessage] = useState('');

  const handleDocumentChange = (value: string) => {
    const formatted = documentType === 'CPF' ? formatCPF(value) : formatCNPJ(value);
    setDocumentNumber(formatted);
  };

  const handleDocumentTypeChange = (type: 'CPF' | 'CNPJ') => {
    setDocumentType(type);
    setDocumentNumber(''); // limpa ao trocar de tipo
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (!email || !password || (!isLogin && !companyName)) {
        setError('Por favor, preencha todos os campos.');
        return;
      }

      // Validação do documento no cadastro
      if (!isLogin) {
        const isValid = documentType === 'CPF'
          ? validateCPF(documentNumber)
          : validateCNPJ(documentNumber);

        if (!documentNumber) {
          setError(`Por favor, informe o ${documentType}.`);
          return;
        }
        if (!isValid) {
          setError(`${documentType} inválido. Verifique os dígitos informados.`);
          return;
        }
        if (!whatsapp || whatsapp.replace(/\D/g, '').length < 10) {
          setError('Por favor, informe um WhatsApp válido com DDD.');
          return;
        }
      }

      const users = getUsers();

      if (isLogin) {
        const user = users.find(u => u.email === email && u.passwordHash === password);
        if (user) {
          if (user.status === 'bloqueado') {
            setError('Conta bloqueada. Entre em contato com o administrador DLLOG.');
            return;
          }
          setLoggedInUser(user);
          onLogin(user);
        } else {
          setError('E-mail ou senha incorretos.');
        }
      } else {
        if (users.some(u => u.email === email)) {
          setError('Este e-mail já está cadastrado.');
          return;
        }
        // Verifica documento duplicado
        if (users.some(u => u.documentNumber?.replace(/\D/g, '') === documentNumber.replace(/\D/g, ''))) {
          setError(`Este ${documentType} já está cadastrado.`);
          return;
        }
        const newUser = saveUser({
          companyName,
          email,
          passwordHash: password,
          documentType,
          documentNumber,
          whatsapp,
          role: 'admin',
          status: 'ativo',
          createdAt: new Date().toISOString(),
        });
        setLoggedInUser(newUser);
        onLogin(newUser);
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || 'Ocorreu um erro inesperado. Tente novamente.');
    }
  };

  const SUPPORT_WHATSAPP = '5564993058754';

  const handleForgotPassword = () => {
    setRecoveryMessage('');
    if (!recoveryEmail) {
      setRecoveryMessage('Por favor, insira seu e-mail cadastrado.');
      return;
    }
    const message = encodeURIComponent(
      `Olá! Preciso recuperar minha senha do sistema *DLLOG CONTROL*.\n\nMeu e-mail cadastrado é: *${recoveryEmail}*`
    );
    window.open(`https://wa.me/${SUPPORT_WHATSAPP}?text=${message}`, '_blank');
    setShowForgotPassword(false);
    setRecoveryEmail('');
  };

  const renderForgotPassword = () => (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-sm w-full">
        <div className="space-y-5 text-center">
          {/* WhatsApp Icon */}
          <div className="w-16 h-16 mx-auto bg-green-50 rounded-2xl flex items-center justify-center border border-green-100">
            <svg viewBox="0 0 24 24" className="w-9 h-9 fill-green-500">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-800">Recuperar Senha</h2>
            <p className="text-sm text-slate-500 mt-1">
              Informe seu e-mail e será redirecionado ao nosso suporte via WhatsApp.
            </p>
          </div>

          <div className="relative text-left">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="email"
              placeholder="Seu e-mail cadastrado"
              value={recoveryEmail}
              onChange={(e) => setRecoveryEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleForgotPassword()}
              className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-400 focus:border-green-400 outline-none text-sm transition-all"
            />
          </div>

          {recoveryMessage && (
            <p className="text-sm text-red-500 font-medium">{recoveryMessage}</p>
          )}

          <p className="text-[10px] text-slate-400">
            Você será direcionado ao WhatsApp do suporte DLLOG.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => { setShowForgotPassword(false); setRecoveryMessage(''); setRecoveryEmail(''); }}
              className="w-full bg-slate-100 text-slate-700 font-semibold py-3 px-4 rounded-xl hover:bg-slate-200 transition-colors text-sm"
            >
              Cancelar
            </button>
            <button
              onClick={handleForgotPassword}
              className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-xl transition-colors shadow-sm text-sm"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white flex-shrink-0">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Falar no WhatsApp
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const inputClass = "focus:ring-primary focus:border-primary block w-full pl-10 sm:text-sm border-slate-300 rounded-lg py-2 border outline-none transition-all";

  return (
    <div className="min-h-screen bg-luxury-bg flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-primary/10 rounded-full blur-3xl"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="w-24 h-24 mb-2">
            <img src={logo} alt="DLLOG Logo" className="w-full h-full object-contain" />
          </div>
          <div className="text-center space-y-1">
            <h2 className="text-sm font-medium tracking-[0.2em] text-primary uppercase">
              Sistema de Gestão Logística
            </h2>
            <div className="w-12 h-1 bg-primary mx-auto rounded-full"></div>
          </div>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-2xl sm:px-10 border border-slate-200">
          <form key={isLogin ? 'login' : 'register'} className="space-y-5" onSubmit={handleSubmit}>

            {/* Nome da Empresa (só no cadastro) */}
            {!isLogin && (
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Nome da Empresa <span className="text-red-500">*</span>
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className={inputClass}
                    placeholder="Sua Empresa Ltda"
                  />
                </div>
              </div>
            )}

            {/* CPF / CNPJ (só no cadastro) */}
            {!isLogin && (
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Tipo de Documento <span className="text-red-500">*</span>
                </label>

                {/* Toggle CPF / CNPJ */}
                <div className="flex gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => handleDocumentTypeChange('CPF')}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all ${
                      documentType === 'CPF'
                        ? 'bg-primary text-white border-primary shadow-md'
                        : 'bg-white text-slate-500 border-slate-200 hover:border-primary/50'
                    }`}
                  >
                    CPF
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDocumentTypeChange('CNPJ')}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all ${
                      documentType === 'CNPJ'
                        ? 'bg-primary text-white border-primary shadow-md'
                        : 'bg-white text-slate-500 border-slate-200 hover:border-primary/50'
                    }`}
                  >
                    CNPJ
                  </button>
                </div>

                {/* Número do documento */}
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FileText className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={documentNumber}
                    onChange={(e) => handleDocumentChange(e.target.value)}
                    className={inputClass}
                    placeholder={documentType === 'CPF' ? '000.000.000-00' : '00.000.000/0000-00'}
                    inputMode="numeric"
                  />
                </div>
                <p className="mt-1 text-[10px] text-slate-400">
                  {documentType === 'CPF' ? '11 dígitos — Pessoa Física' : '14 dígitos — Pessoa Jurídica'}
                </p>
              </div>
            )}

            {/* WhatsApp (só no cadastro) */}
            {!isLogin && (
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  WhatsApp <span className="text-red-500">*</span>
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-slate-400" />
                  </div>
                  <div className="absolute inset-y-0 left-9 flex items-center pointer-events-none">
                    <span className="text-xs font-bold text-slate-400 border-r border-slate-200 pr-2">+55</span>
                  </div>
                  <input
                    type="text"
                    required
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(formatPhone(e.target.value))}
                    className="focus:ring-primary focus:border-primary block w-full pl-16 sm:text-sm border-slate-300 rounded-lg py-2 border outline-none transition-all"
                    placeholder="(00) 00000-0000"
                    inputMode="numeric"
                  />
                </div>
                <p className="mt-1 text-[10px] text-slate-400">Informe o DDD + número com 9 dígitos</p>
              </div>
            )}

            {/* E-mail */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                E-mail Administrativo <span className="text-red-500">*</span>
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                  placeholder="admin@empresa.com"
                />
              </div>
            </div>

            {/* Senha */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Senha <span className="text-red-500">*</span>
                </label>
                {isLogin && (
                  <button 
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-xs font-semibold text-primary hover:text-primary-dark"
                  >
                    Esqueceu a senha?
                  </button>
                )}
              </div>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Erro */}
            {error && (
              <div className="rounded-xl bg-red-50 border border-red-100 p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                  <h3 className="ml-3 text-sm font-medium text-red-800">{error}</h3>
                </div>
              </div>
            )}

            {/* Botão submit */}
            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-md text-base font-semibold text-white bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0"
              >
                {isLogin ? (
                  <><LogIn className="w-5 h-5 mr-2" /> ENTRAR NO SISTEMA</>
                ) : (
                  <><UserPlus className="w-5 h-5 mr-2" /> CADASTRAR AGORA</>
                )}
              </button>
            </div>
          </form>

          <div className="mt-8 flex justify-center space-x-4 text-[10px] font-bold tracking-widest text-primary/60 uppercase">
             <span>TRANSPARÊNCIA</span>
             <span>•</span>
             <span>CUIDADO</span>
             <span>•</span>
             <span>PRAZO</span>
          </div>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-100" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-white text-slate-400 font-medium">
                  {isLogin ? 'Novo por aqui?' : 'Já tem uma conta?'}
                </span>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                  setCompanyName('');
                  setEmail('');
                  setPassword('');
                  setDocumentNumber('');
                  setDocumentType('CNPJ');
                  setWhatsapp('');
                }}
                className="w-full flex justify-center py-3 px-4 border border-primary/20 rounded-xl shadow-sm text-sm font-semibold text-primary-dark bg-white hover:bg-primary/5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all"
              >
                {isLogin ? 'CRIAR UMA CONTA' : 'FAZER LOGIN'}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-8 text-center">
        <p className="text-[10px] text-slate-400 font-medium tracking-wide">
          © 2025 DLLOG — Todos os direitos reservados
        </p>
      </div>
      {showForgotPassword && renderForgotPassword()}
    </div>
  );
}
