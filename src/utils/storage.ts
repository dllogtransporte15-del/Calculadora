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
  planType?: 'free' | 'paid';
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
export const MASTER_PASSWORD = 'dllog@master2025';

// ─── User Management ──────────────────────────────────────────────────────────
export const getUsers = (): User[] => {
  try {
    return JSON.parse(localStorage.getItem('dllog_users') || '[]');
  } catch {
    return [];
  }
};

export const saveUser = (user: Omit<User, 'id'>): User => {
  try {
    const users = getUsers();
    const id = `EMP-${String(users.length + 1).padStart(3, '0')}`;
    const newUser: User = { ...user, id };
    localStorage.setItem('dllog_users', JSON.stringify([...users, newUser]));
    return newUser;
  } catch (e) {
    console.error('Error saving user:', e);
    throw new Error('Não foi possível salvar o usuário. Verifique se o seu navegador permite o uso de armazenamento local.');
  }
};

export const updateUser = (id: string, data: Partial<Omit<User, 'id'>>): User | null => {
  try {
    const users = getUsers();
    const index = users.findIndex(u => u.id === id);
    if (index === -1) return null;
    const updated = { ...users[index], ...data };
    users[index] = updated;
    localStorage.setItem('dllog_users', JSON.stringify(users));
    return updated;
  } catch (e) {
    console.error('Error updating user:', e);
    return null;
  }
};

export const deleteUser = (id: string): boolean => {
  try {
    const users = getUsers().filter(u => u.id !== id);
    localStorage.setItem('dllog_users', JSON.stringify(users));
    return true;
  } catch (e) {
    console.error('Error deleting user:', e);
    return false;
  }
};

export const blockUser = (id: string) => updateUser(id, { status: 'bloqueado' });
export const unblockUser = (id: string) => updateUser(id, { status: 'ativo' });

export const isMaster = (user: User | null): boolean =>
  user?.email === MASTER_EMAIL && user?.role === 'master';

// Seed do usuário master — chamado na inicialização do app
export const initializeMasterUser = (): void => {
  const users = getUsers();
  const masterExists = users.some(u => u.email === MASTER_EMAIL);
  if (!masterExists) {
    saveUser({
      companyName: 'DLLOG TRANSPORTES',
      email: MASTER_EMAIL,
      passwordHash: MASTER_PASSWORD,
      documentType: 'CNPJ',
      documentNumber: '00.000.000/0000-00',
      role: 'master',
      status: 'ativo',
      createdAt: new Date().toISOString(),
      planType: 'paid',
    });
  } else {
    // Garante que o master sempre tenha o role correto (migração)
    const master = users.find(u => u.email === MASTER_EMAIL);
    if (master && master.role !== 'master') {
      updateUser(master.id, { role: 'master', status: 'ativo' });
    }
  }
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
