import React, { useState } from 'react';
import { Truck, LogIn, UserPlus, Mail, Lock, Building, AlertCircle, Send, ShieldCheck, Clock, CheckCircle2 } from 'lucide-react';
import logo from '../assets/logo.png';
import { getUsers, saveUser, setLoggedInUser, User } from '../utils/storage';

interface AuthProps {
  onLogin: (user: User) => void;
}

export default function Auth({ onLogin }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryMessage, setRecoveryMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (!email || !password || (!isLogin && !companyName)) {
        setError('Por favor, preencha todos os campos.');
        return;
      }

      const users = getUsers();

      if (isLogin) {
        const user = users.find(u => u.email === email && u.passwordHash === password);
        if (user) {
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
        const newUser = saveUser({ companyName, email, passwordHash: password });
        setLoggedInUser(newUser);
        onLogin(newUser);
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || 'Ocorreu um erro inesperado. Tente novamente.');
    }
  };

  const handleForgotPassword = () => {
    setRecoveryMessage('');
    if (!recoveryEmail) {
      setRecoveryMessage('Por favor, insira seu e-mail.');
      return;
    }
    // Simulate sending email
    console.log(`Password recovery email sent to ${recoveryEmail}`);
    setRecoveryMessage(`Um e-mail de recuperação foi enviado para ${recoveryEmail}.`);
    setRecoveryEmail('');
  };

  const renderForgotPassword = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-sm w-full mx-4">
        <div className="space-y-4 text-center">
          <h2 className="text-2xl font-bold text-slate-800">Recuperar Senha</h2>
          <p className="text-slate-500">Insira seu e-mail para receber um link de recuperação.</p>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="email" 
              placeholder="Seu e-mail cadastrado" 
              value={recoveryEmail}
              onChange={(e) => setRecoveryEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          {recoveryMessage && <p className="text-sm text-green-600">{recoveryMessage}</p>}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button 
              onClick={() => { setShowForgotPassword(false); setRecoveryMessage(''); }}
              className="w-full bg-slate-100 text-slate-700 font-medium py-3 px-4 rounded-lg hover:bg-slate-200 transition-colors"
            >
              Cancelar
            </button>
            <button 
              onClick={handleForgotPassword} 
              className="w-full flex items-center justify-center bg-indigo-600 text-white font-medium py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <Send className="w-5 h-5 mr-2" />
              Enviar
            </button>
          </div>
        </div>
      </div>
    </div>
  );

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
          <form key={isLogin ? 'login' : 'register'} className="space-y-6" onSubmit={handleSubmit}>
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Nome da Empresa
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-slate-300 rounded-lg py-2 border outline-none transition-all"
                    placeholder="Sua Empresa Ltda"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700">
                E-mail Administrativo
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-slate-300 rounded-lg py-2 border outline-none transition-all"
                  placeholder="admin@empresa.com"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-slate-700">
                  Senha
                </label>
                {isLogin && (
                  <div className="text-sm">
                    <button 
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="font-medium text-indigo-600 hover:text-indigo-500"
                    >
                      Esqueceu a senha?
                    </button>
                  </div>
                )}
              </div>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-slate-300 rounded-lg py-2 border outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">{error}</h3>
                  </div>
                </div>
              </div>
            )}

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

          <div className="mt-10">
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
