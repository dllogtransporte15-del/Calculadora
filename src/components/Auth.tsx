import React, { useState } from 'react';
import { Truck, LogIn, UserPlus, Mail, Lock, Building, AlertCircle, Send } from 'lucide-react';
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
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="p-3 bg-indigo-600 rounded-xl text-white shadow-sm">
            <Truck className="w-8 h-8" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
          DLLOG CONTROL
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          {isLogin ? 'Faça login para acessar o sistema' : 'Crie sua conta para começar'}
        </p>
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
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                {isLogin ? (
                  <><LogIn className="w-5 h-5 mr-2" /> Entrar</>
                ) : (
                  <><UserPlus className="w-5 h-5 mr-2" /> Cadastrar Empresa</>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-slate-500">
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
                className="w-full flex justify-center py-2.5 px-4 border border-slate-300 rounded-lg shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                {isLogin ? 'Criar uma conta' : 'Fazer login'}
              </button>
            </div>
          </div>
        </div>
      </div>
      {showForgotPassword && renderForgotPassword()}
    </div>
  );
}
