import { supabase } from './supabase';

export interface User {
  id: string;
  companyName: string;
  email: string;
  passwordHash: string;
  documentType: 'CPF' | 'CNPJ';
  documentNumber: string;
  whatsapp: string;
  role: 'master' | 'admin';
  status: 'ativo' | 'bloqueado' | 'pendente';
  createdAt: string;
  planType: 'trial' | 'paid' | 'expired';
  subscriptionEndDate?: string;
  kiwifyLink?: string;
}

export interface SystemConfig {
  kiwifyMensalUrl: string;
  kiwifyTrimestralUrl: string;
  kiwifyAnualUrl: string;
}

export interface Client {
  id: string;
  companyId: string;
  name: string;
}

export interface StayRecord {
  id: string;
  companyId: string;
  clientName?: string;
  date: string;
  driver: string;
  plate: string;
  invoice: string;
  origin: string;
  destination: string;
  location: 'Origem' | 'Destino';
  entryDate: string;
  exitDate: string;
  totalHours: number;
  weight: number;
  valuePerHour: number;
  tolerance: number;
  totalValue: number;
}

export interface QuoteRecord {
  id: string;
  companyId: string;
  clientName?: string;
  date: string;
  origin: string;
  destination: string;
  distance: number;
  axes: number;
  cargoType: string;
  inputMode: 'PER_KM' | 'TOTAL' | 'PER_TON';
  valuePerKm: number;
  driverTotalValue: number;
  tollValue: number;
  anttValue: number;
  weight: number;
  margin: number;
  icms: number;
  driverFreightPerTon: number;
  companyFreightPerTon: number;
  companyTotalFreight: number;
  dieselPrice: number;
  averageConsumption: number;
  driverCommissionPercent: number;
  dieselCost: number;
  commissionValue: number;
  carrierNetProfit: number;
  carrierProfitMargin: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────
export const MASTER_EMAIL = 'dllogtransporte15@gmail.com';
export const MASTER_PASSWORD = 'mauricio15';
export const DEFAULT_KIWIFY_URL = 'https://pay.kiwify.com.br/Onzla'; // Link padrão (Mensal)
export const MENSAL_PRICE = '19,90';
export const TRIMESTRAL_PRICE = '49,90';
export const ANUAL_PRICE = '199,90';

export const MENSAL_URL = 'https://pay.kiwify.com.br/Onzla8l';
export const TRIMESTRAL_URL = 'https://pay.kiwify.com.br/H24XoUV';
export const ANUAL_URL = 'https://pay.kiwify.com.br/sMNFUxV';

// ─── Subscription Helpers ──────────────────────────────────────────────────
export const getSystemConfig = (): SystemConfig => {
  try {
    const config = localStorage.getItem('dllog_config');
    const defaultConfig: SystemConfig = {
      kiwifyMensalUrl: MENSAL_URL,
      kiwifyTrimestralUrl: TRIMESTRAL_URL,
      kiwifyAnualUrl: ANUAL_URL
    };
    return config ? { ...defaultConfig, ...JSON.parse(config) } : defaultConfig;
  } catch {
    return { 
      kiwifyMensalUrl: DEFAULT_KIWIFY_URL, 
      kiwifyTrimestralUrl: DEFAULT_KIWIFY_URL, 
      kiwifyAnualUrl: DEFAULT_KIWIFY_URL 
    };
  }
};

export const updateSystemConfig = (config: Partial<SystemConfig>) => {
  const current = getSystemConfig();
  localStorage.setItem('dllog_config', JSON.stringify({ ...current, ...config }));
};

export const getTrialEndDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1); // 24 horas de teste grátis
  return date.toISOString();
};

export const checkSubscriptionStatus = (user: User): User['planType'] => {
  if (user.role === 'master') return 'paid';
  if (!user.subscriptionEndDate) return 'expired';
  
  const now = new Date();
  const end = new Date(user.subscriptionEndDate);
  
  return now > end ? 'expired' : user.planType;
};

export const renewSubscription = async (userId: string, days: number = 30) => {
  const users = await getUsers();
  const user = users.find(u => u.id === userId);
  if (!user) return null;

  const currentEnd = user.subscriptionEndDate ? new Date(user.subscriptionEndDate) : new Date();
  const baseDate = currentEnd > new Date() ? currentEnd : new Date();
  
  baseDate.setDate(baseDate.getDate() + days);
  
  return updateUser(userId, {
    planType: 'paid',
    subscriptionEndDate: baseDate.toISOString()
  });
};

// ─── User Management (Supabase) ──────────────────────────────────────────────────────────
export const getUsers = async (): Promise<User[]> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(u => ({
      id: u.id,
      companyName: u.company_name,
      email: u.email,
      passwordHash: u.password_hash,
      documentType: u.document_type,
      documentNumber: u.document_number,
      whatsapp: u.whatsapp,
      role: u.role,
      status: u.status,
      planType: u.plan_type,
      subscriptionEndDate: u.subscription_end_date,
      createdAt: u.created_at
    }));
  } catch (e) {
    console.error('Error fetching users from Supabase:', e);
    return [];
  }
};

export const saveUser = async (user: Omit<User, 'id'>): Promise<User> => {
  try {
    // Para novos cadastros, geramos um ID amigável ou usamos o do Auth se fosse o caso.
    // Como estamos simplificando, vamos gerar um ID baseado no timestamp para unicidade.
    const id = `EMP-${Date.now().toString().slice(-6)}`;
    
    const { data, error } = await supabase
      .from('profiles')
      .insert([{
        id,
        company_name: user.companyName,
        email: user.email,
        password_hash: user.passwordHash,
        document_type: user.documentType,
        document_number: user.documentNumber,
        whatsapp: user.whatsapp,
        role: user.role,
        status: user.status,
        plan_type: user.planType,
        subscription_end_date: user.subscriptionEndDate,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;

    return {
      ...user,
      id: data.id,
      createdAt: data.created_at
    };
  } catch (e: any) {
    console.error('Error saving user to Supabase:', e);
    throw new Error(e.message || 'Erro ao salvar no banco de dados.');
  }
};

export const updateUser = async (id: string, data: Partial<Omit<User, 'id'>>): Promise<User | null> => {
  try {
    const updatePayload: any = {};
    if (data.companyName) updatePayload.company_name = data.companyName;
    if (data.email) updatePayload.email = data.email;
    if (data.passwordHash) updatePayload.password_hash = data.passwordHash;
    if (data.documentType) updatePayload.document_type = data.documentType;
    if (data.documentNumber) updatePayload.document_number = data.documentNumber;
    if (data.whatsapp) updatePayload.whatsapp = data.whatsapp;
    if (data.role) updatePayload.role = data.role;
    if (data.status) updatePayload.status = data.status;
    if (data.planType) updatePayload.plan_type = data.planType;
    if (data.subscriptionEndDate) updatePayload.subscription_end_date = data.subscriptionEndDate;

    const { data: updated, error } = await supabase
      .from('profiles')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return {
      id: updated.id,
      companyName: updated.company_name,
      email: updated.email,
      passwordHash: updated.password_hash,
      documentType: updated.document_type,
      documentNumber: updated.document_number,
      whatsapp: updated.whatsapp,
      role: updated.role,
      status: updated.status,
      planType: updated.plan_type,
      subscriptionEndDate: updated.subscription_end_date,
      createdAt: updated.created_at
    };
  } catch (e) {
    console.error('Error updating user in Supabase:', e);
    return null;
  }
};

export const deleteUser = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (e) {
    console.error('Error deleting user from Supabase:', e);
    return false;
  }
};

export const blockUser = (id: string) => updateUser(id, { status: 'bloqueado' });
export const unblockUser = (id: string) => updateUser(id, { status: 'ativo' });

export const isMaster = (user: User | null): boolean =>
  user?.email === MASTER_EMAIL && user?.role === 'master';

// Função para migrar dados locais para o Supabase (executada uma vez)
export const syncLocalUsersToSupabase = async () => {
  const localUsersJson = localStorage.getItem('dllog_users');
  if (!localUsersJson) return;

  try {
    const localUsers: User[] = JSON.parse(localUsersJson);
    for (const user of localUsers) {
      if (user.email === MASTER_EMAIL) continue; // Pula master que já existe
      
      await supabase.from('profiles').upsert({
        id: user.id,
        company_name: user.companyName,
        email: user.email,
        password_hash: user.passwordHash,
        document_type: user.documentType,
        document_number: user.documentNumber,
        whatsapp: user.whatsapp,
        role: user.role,
        status: user.status,
        plan_type: user.planType,
        subscription_end_date: user.subscriptionEndDate
      });
    }
    // Após migrar com sucesso, removemos permanentemente do localStorage
    localStorage.removeItem('dllog_users');
    console.log('✅ Migração concluída: localStorage limpo.');
  } catch (e) {
    console.error('Migration failed:', e);
  }
};

// Seed do usuário master — não é mais estritamente necessário se o SQL rodou,
// mas mantemos para garantir consistência.
export const initializeMasterUser = async (): Promise<void> => {
  // A migração já foi concluída. Desativamos para evitar que dados deletados retornem.
  // await syncLocalUsersToSupabase();
};

export const getLoggedInUser = (): User | null => {
  try {
    const userStr = localStorage.getItem('dllog_logged_in_user');
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
};

export const setLoggedInUser = (user: User | null) => {
  try {
    if (user) {
      localStorage.setItem('dllog_logged_in_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('dllog_logged_in_user');
    }
  } catch (e) {
    console.error('Error setting logged in user:', e);
  }
};

// ─── Client Management ────────────────────────────────────────────────────────
export const getClients = (companyId: string): Client[] => {
  try {
    const allClients: Client[] = JSON.parse(localStorage.getItem('dllog_clients') || '[]');
    return allClients.filter(c => c.companyId === companyId);
  } catch {
    return [];
  }
};

export const saveClient = (companyId: string, name: string): Client => {
  try {
    const allClients: Client[] = JSON.parse(localStorage.getItem('dllog_clients') || '[]');
    const existing = allClients.find(c => c.companyId === companyId && c.name.toLowerCase() === name.toLowerCase());
    if (existing) return existing;

    const id = `CLI-${String(allClients.length + 1).padStart(3, '0')}`;
    const newClient: Client = { id, companyId, name };
    localStorage.setItem('dllog_clients', JSON.stringify([...allClients, newClient]));
    return newClient;
  } catch (e) {
    console.error('Error saving client:', e);
    return { id: 'TEMP', companyId, name };
  }
};

// ─── Records Management ───────────────────────────────────────────────────────
export const getStays = (companyId: string): StayRecord[] => {
  try {
    const allStays: StayRecord[] = JSON.parse(localStorage.getItem('dllog_stays') || '[]');
    return allStays.filter(stay => stay.companyId === companyId);
  } catch {
    return [];
  }
};

export const saveStay = (stay: Omit<StayRecord, 'id' | 'date'>): StayRecord => {
  try {
    const allStays: StayRecord[] = JSON.parse(localStorage.getItem('dllog_stays') || '[]');
    const id = `EST-${String(allStays.length + 1).padStart(3, '0')}`;
    const newStay: StayRecord = { ...stay, id, date: new Date().toISOString() };
    localStorage.setItem('dllog_stays', JSON.stringify([newStay, ...allStays]));
    return newStay;
  } catch {
    const id = `EST-001`;
    const newStay: StayRecord = { ...stay, id, date: new Date().toISOString() };
    localStorage.setItem('dllog_stays', JSON.stringify([newStay]));
    return newStay;
  }
};

export const getQuotes = (companyId: string): QuoteRecord[] => {
  try {
    const allQuotes: QuoteRecord[] = JSON.parse(localStorage.getItem('dllog_quotes') || '[]');
    return allQuotes.filter(quote => quote.companyId === companyId);
  } catch {
    return [];
  }
};

export const saveQuote = (quote: Omit<QuoteRecord, 'id' | 'date'>): QuoteRecord => {
  try {
    const allQuotes: QuoteRecord[] = JSON.parse(localStorage.getItem('dllog_quotes') || '[]');
    const id = `COT-${String(allQuotes.length + 1).padStart(3, '0')}`;
    const newQuote: QuoteRecord = { ...quote, id, date: new Date().toISOString() };
    localStorage.setItem('dllog_quotes', JSON.stringify([newQuote, ...allQuotes]));
    return newQuote;
  } catch {
    const id = `COT-001`;
    const newQuote: QuoteRecord = { ...quote, id, date: new Date().toISOString() };
    localStorage.setItem('dllog_quotes', JSON.stringify([newQuote]));
    return newQuote;
  }
};

export const deleteStay = (id: string) => {
  try {
    const allStays: StayRecord[] = JSON.parse(localStorage.getItem('dllog_stays') || '[]');
    localStorage.setItem('dllog_stays', JSON.stringify(allStays.filter(stay => stay.id !== id)));
  } catch (e) {
    console.error('Error deleting stay:', e);
  }
};

export const deleteQuote = (id: string) => {
  try {
    const allQuotes: QuoteRecord[] = JSON.parse(localStorage.getItem('dllog_quotes') || '[]');
    localStorage.setItem('dllog_quotes', JSON.stringify(allQuotes.filter(quote => quote.id !== id)));
  } catch (e) {
    console.error('Error deleting quote:', e);
  }
};
