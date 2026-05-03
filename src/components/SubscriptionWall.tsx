import React from 'react';
import { CreditCard, LogOut, AlertCircle, ExternalLink, Check, Zap, Shield, Star } from 'lucide-react';
import { getSystemConfig } from '../utils/storage';
import logo from '../assets/logo.png';

interface SubscriptionWallProps {
  onLogout: () => void;
  userEmail: string;
}

export default function SubscriptionWall({ onLogout, userEmail }: SubscriptionWallProps) {
  const config = getSystemConfig();

  const plans = [
    {
      name: 'Mensal',
      price: '19,90',
      period: '/mês',
      url: config.kiwifyMensalUrl,
      icon: <Zap className="w-5 h-5" />,
      benefits: ['Acesso total', 'Suporte WhatsApp', 'Relatórios ilimitados'],
      popular: false
    },
    {
      name: 'Trimestral',
      price: '49,90',
      period: '/3 meses',
      url: config.kiwifyTrimestralUrl,
      icon: <Star className="w-5 h-5" />,
      benefits: ['Economia de 15%', 'Acesso total', 'Suporte Prioritário'],
      popular: true,
      badge: 'MAIS ESCOLHIDO'
    },
    {
      name: 'Anual',
      price: '199,90',
      period: '/ano',
      url: config.kiwifyAnualUrl,
      icon: <Shield className="w-5 h-5" />,
      benefits: ['Economia de 20%', 'Acesso Vitalício no ano', 'Consultoria VIP'],
      popular: false
    }
  ];
  
  return (
    <div className="min-h-screen bg-luxury-bg flex flex-col items-center justify-center p-4 font-sans text-luxury-text relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-primary/10 rounded-full blur-3xl"></div>

      <div className="max-w-5xl w-full relative z-10 space-y-8">
        <div className="text-center space-y-4">
          <img src={logo} alt="DLLOG Logo" className="w-24 h-24 mx-auto object-contain" />
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-[0.1em] text-luxury-text uppercase">PLANOS E ASSINATURAS</h1>
            <p className="text-[10px] font-bold tracking-[0.3em] text-primary uppercase">Escolha o melhor plano para sua transportadora</p>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 flex flex-col md:flex-row items-center gap-6 max-w-3xl mx-auto">
          <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
            <AlertCircle className="w-6 h-6 text-amber-600" />
          </div>
          <div className="text-center md:text-left">
            <h3 className="text-amber-900 font-bold uppercase tracking-wider text-sm mb-1">Acesso Suspenso</h3>
            <p className="text-sm text-amber-800/80 leading-relaxed">
              Sua assinatura expirou ou seu período de teste chegou ao fim. Selecione um dos planos abaixo para reativar seu acesso instantaneamente após a confirmação do pagamento.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div 
              key={plan.name}
              className={`relative bg-white rounded-[2.5rem] p-8 border-2 transition-all hover:translate-y-[-8px] flex flex-col ${
                plan.popular ? 'border-primary shadow-2xl scale-105 z-20' : 'border-slate-100 shadow-xl z-10'
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-white text-[10px] font-bold px-4 py-1.5 rounded-full tracking-widest shadow-lg">
                  {plan.badge}
                </div>
              )}

              <div className="mb-6 flex justify-between items-start">
                <div className={`p-3 rounded-2xl ${plan.popular ? 'bg-primary/10 text-primary' : 'bg-slate-50 text-slate-400'}`}>
                  {plan.icon}
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Plano</p>
                  <h4 className="text-xl font-bold text-luxury-text">{plan.name}</h4>
                </div>
              </div>

              <div className="mb-8">
                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-bold text-slate-400">R$</span>
                  <span className="text-4xl font-black text-luxury-text tracking-tighter">{plan.price.split(',')[0]}</span>
                  <span className="text-lg font-bold text-luxury-text">,{plan.price.split(',')[1]}</span>
                  <span className="text-sm font-medium text-slate-400 ml-1">{plan.period}</span>
                </div>
              </div>

              <div className="space-y-4 mb-10 flex-1">
                {plan.benefits.map((benefit) => (
                  <div key={benefit} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-green-600" />
                    </div>
                    <span className="text-sm text-slate-600 font-medium">{benefit}</span>
                  </div>
                ))}
              </div>

              <a
                href={plan.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`w-full flex items-center justify-center gap-3 font-bold py-4 px-6 rounded-2xl transition-all group shadow-md ${
                  plan.popular 
                    ? 'bg-gradient-to-r from-primary to-primary-dark text-white hover:shadow-primary/30' 
                    : 'bg-slate-900 text-white hover:bg-slate-800'
                }`}
              >
                ASSINAR AGORA
                <ExternalLink className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
              </a>
            </div>
          ))}
        </div>

        <div className="max-w-2xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 pt-8">
          <div className="text-center md:text-left">
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest mb-1">
              Logado como: <span className="text-primary">{userEmail}</span>
            </p>
            <p className="text-[10px] text-slate-400 leading-relaxed max-w-sm uppercase tracking-tighter">
              Pagamento processado em ambiente 100% seguro via Kiwify. Liberação automática após aprovação.
            </p>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 bg-white text-slate-500 font-bold py-3 px-6 rounded-2xl hover:bg-red-50 hover:text-red-500 transition-all border border-slate-100 shadow-sm"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-xs uppercase tracking-widest">Sair da Conta</span>
          </button>
        </div>
      </div>
    </div>
  );
}
