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
import logo from './assets/logo.png';

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
    return <div className="min-h-screen bg-luxury-bg flex items-center justify-center text-primary font-medium tracking-widest animate-pulse">CARREGANDO...</div>;
  }

  if (!user) {
    return <Auth onLogin={setUser} />;
  }

  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY} version="weekly">
      <div className="min-h-screen bg-luxury-bg p-4 md:p-8 font-sans text-luxury-text">
        <div className="max-w-7xl mx-auto space-y-6">
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-primary/10">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16">
                <img src={logo} alt="DLLOG Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-[0.15em] text-luxury-text uppercase">CONTROLE DLLOG</h1>
                <p className="text-[10px] font-bold tracking-widest text-primary uppercase">Gestão Logística de Alta Performance</p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="flex bg-primary/5 p-1 rounded-xl border border-primary/10 overflow-x-auto">
                <button
                  onClick={() => setActiveTab('estadias')}
                  className={`flex items-center px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                    activeTab === 'estadias'
                      ? 'bg-white text-primary shadow-sm'
                      : 'text-slate-400 hover:text-primary hover:bg-white/50'
                  }`}
                >
                  <Calculator className="w-4 h-4 mr-2" />
                  Estadias
                </button>
                <button
                  onClick={() => setActiveTab('cotacao')}
                  className={`flex items-center px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                    activeTab === 'cotacao'
                      ? 'bg-white text-primary shadow-sm'
                      : 'text-slate-400 hover:text-primary hover:bg-white/50'
                  }`}
                >
                  <Route className="w-4 h-4 mr-2" />
                  Fretes
                </button>
                <button
                  onClick={() => setActiveTab('historico')}
                  className={`flex items-center px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                    activeTab === 'historico'
                      ? 'bg-white text-primary shadow-sm'
                      : 'text-slate-400 hover:text-primary hover:bg-white/50'
                  }`}
                >
                  <HistoryIcon className="w-4 h-4 mr-2" />
                  Histórico
                </button>
              </div>

              <div className="flex items-center gap-3 pl-4 border-l border-primary/10">
                <div className="flex flex-col items-end">
                  <span className="text-xs font-bold text-luxury-text tracking-tight flex items-center">
                    <UserIcon className="w-3 h-3 mr-1 text-primary" />
                    {user.companyName}
                  </span>
                  <span className="text-[10px] font-medium text-primary/60 tracking-widest">{user.id}</span>
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

