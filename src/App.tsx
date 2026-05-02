/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Calculator, Truck, Route, History as HistoryIcon, LogOut, User as UserIcon, Key } from 'lucide-react';
import { APIProvider } from '@vis.gl/react-google-maps';
import StayCalculator from './components/StayCalculator';
import FreightQuote from './components/FreightQuote';
import History from './components/History';
import Auth from './components/Auth';
import { getLoggedInUser, setLoggedInUser, User } from './utils/storage';

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_PLATFORM_KEY || '';

export default function App() {
  const [activeTab, setActiveTab] = useState<'estadias' | 'cotacao' | 'historico'>('estadias');
  const [user, setUser] = useState<User | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const loggedInUser = getLoggedInUser();
    if (loggedInUser) {
      setUser(loggedInUser);
    }
    setIsCheckingAuth(false);
  }, []);

  const handleLogout = () => {
    setLoggedInUser(null);
    setUser(null);
  };

  if (isCheckingAuth) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500 font-medium">Carregando...</div>;
  }

  if (!user) {
    return <Auth onLogin={setUser} />;
  }

  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY} version="weekly">
      <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-900">
        <div className="max-w-7xl mx-auto space-y-6">
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-indigo-600 rounded-xl text-white shadow-sm">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900">DLLOG CONTROL</h1>
                <p className="text-sm text-slate-500">Gestão de Estadias e Cotação de Fretes</p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="flex bg-slate-200/50 p-1 rounded-xl overflow-x-auto">
                <button
                  onClick={() => setActiveTab('estadias')}
                  className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    activeTab === 'estadias'
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  <Calculator className="w-4 h-4 mr-2" />
                  Cálculo de Estadias
                </button>
                <button
                  onClick={() => setActiveTab('cotacao')}
                  className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    activeTab === 'cotacao'
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  <Route className="w-4 h-4 mr-2" />
                  Cotação de Frete
                </button>
                <button
                  onClick={() => setActiveTab('historico')}
                  className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    activeTab === 'historico'
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  <HistoryIcon className="w-4 h-4 mr-2" />
                  Histórico
                </button>
              </div>

              <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                <div className="flex flex-col items-end">
                  <span className="text-sm font-medium text-slate-900 flex items-center">
                    <UserIcon className="w-4 h-4 mr-1 text-slate-400" />
                    {user.companyName}
                  </span>
                  <span className="text-xs text-slate-500">{user.id}</span>
                </div>
                <button 
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Sair"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </header>

          <main>
            {activeTab === 'estadias' && <StayCalculator companyId={user.id} />}
            {activeTab === 'cotacao' && <FreightQuote companyId={user.id} />}
            {activeTab === 'historico' && <History companyId={user.id} />}
          </main>
        </div>
      </div>
    </APIProvider>
  );
}

