import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface User {
  id: string;
  email: string;
  balance: number;
  virtual_number?: string;
  created_at: string;
}

interface CallLog {
  id: string;
  user_id: string;
  call_sid?: string;
  from_number: string;
  to_number: string;
  duration: number;
  cost: number;
  status: string;
  recording_url?: string;
  is_anonymous: boolean;
  alias_name?: string;
  created_at: string;
}

interface Contact {
  id: string;
  user_id: string;
  name: string;
  phone_number: string;
  created_at: string;
}

interface Message {
  id: string;
  user_id: string;
  to_number: string;
  body: string;
  direction: string;
  status: string;
  created_at: string;
}

interface Transaction {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  description: string;
  created_at: string;
}

interface AppState {
  user: User | null;
  token: string | null;
  callLogs: CallLog[];
  contacts: Contact[];
  messages: Message[];
  transactions: Transaction[];
  isLoading: boolean;
  activeCall: {
    callSid: string;
    toNumber: string;
    status: string;
    startTime: Date | null;
  } | null;

  // Auth
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  loadToken: () => Promise<boolean>;
  refreshUser: () => Promise<void>;

  // Calls
  initiateCall: (toNumber: string, record: boolean, anonymous: boolean, aliasName?: string) => Promise<string | null>;
  endCall: (callSid: string) => Promise<void>;
  getCallStatus: (callSid: string) => Promise<any>;
  loadCallLogs: () => Promise<void>;
  setActiveCall: (call: AppState['activeCall']) => void;

  // Contacts
  loadContacts: () => Promise<void>;
  addContact: (name: string, phoneNumber: string) => Promise<boolean>;
  deleteContact: (contactId: string) => Promise<boolean>;

  // Messages
  loadMessages: () => Promise<void>;
  sendMessage: (toNumber: string, body: string) => Promise<boolean>;

  // Balance
  topupBalance: (amount: number) => Promise<boolean>;
  transferBalance: (toNumber: string, amount: number) => Promise<boolean>;
  loadTransactions: () => Promise<void>;

  // Rates
  checkRate: (phoneNumber: string) => Promise<{ country: string; rate_per_minute: number } | null>;
}

export const useStore = create<AppState>((set, get) => ({
  user: null,
  token: null,
  callLogs: [],
  contacts: [],
  messages: [],
  transactions: [],
  isLoading: false,
  activeCall: null,

  // Auth
  login: async (email: string, password: string) => {
    try {
      set({ isLoading: true });
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Login failed');
      }

      const data = await response.json();
      await AsyncStorage.setItem('token', data.access_token);
      set({ token: data.access_token, user: data.user, isLoading: false });
      return true;
    } catch (error) {
      console.error('Login error:', error);
      set({ isLoading: false });
      return false;
    }
  },

  signup: async (email: string, password: string) => {
    try {
      set({ isLoading: true });
      const response = await fetch(`${API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Signup failed');
      }

      const data = await response.json();
      await AsyncStorage.setItem('token', data.access_token);
      set({ token: data.access_token, user: data.user, isLoading: false });
      return true;
    } catch (error) {
      console.error('Signup error:', error);
      set({ isLoading: false });
      return false;
    }
  },

  logout: async () => {
    await AsyncStorage.removeItem('token');
    set({ user: null, token: null, callLogs: [], contacts: [], messages: [], transactions: [] });
  },

  loadToken: async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        set({ token });
        // Verify token and get user
        const response = await fetch(`${API_URL}/api/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (response.ok) {
          const user = await response.json();
          set({ user });
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Load token error:', error);
      return false;
    }
  },

  refreshUser: async () => {
    const { token } = get();
    if (!token) return;
    
    try {
      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const user = await response.json();
        set({ user });
      }
    } catch (error) {
      console.error('Refresh user error:', error);
    }
  },

  // Calls
  initiateCall: async (toNumber: string, record: boolean, anonymous: boolean, aliasName?: string) => {
    const { token } = get();
    if (!token) return null;

    try {
      const response = await fetch(`${API_URL}/api/calls/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ to_number: toNumber, record, anonymous, alias_name: aliasName }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Call failed');
      }

      const data = await response.json();
      set({
        activeCall: {
          callSid: data.call_sid,
          toNumber: data.to_number,
          status: data.status,
          startTime: new Date(),
        },
      });
      return data.call_sid;
    } catch (error) {
      console.error('Initiate call error:', error);
      return null;
    }
  },

  endCall: async (callSid: string) => {
    const { token } = get();
    if (!token) return;

    try {
      await fetch(`${API_URL}/api/calls/end/${callSid}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      set({ activeCall: null });
      get().loadCallLogs();
      get().refreshUser();
    } catch (error) {
      console.error('End call error:', error);
    }
  },

  getCallStatus: async (callSid: string) => {
    const { token } = get();
    if (!token) return null;

    try {
      const response = await fetch(`${API_URL}/api/calls/status/${callSid}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Get call status error:', error);
    }
    return null;
  },

  loadCallLogs: async () => {
    const { token } = get();
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/api/calls/logs`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const callLogs = await response.json();
        set({ callLogs });
      }
    } catch (error) {
      console.error('Load call logs error:', error);
    }
  },

  setActiveCall: (call) => set({ activeCall: call }),

  // Contacts
  loadContacts: async () => {
    const { token } = get();
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/api/contacts`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const contacts = await response.json();
        set({ contacts });
      }
    } catch (error) {
      console.error('Load contacts error:', error);
    }
  },

  addContact: async (name: string, phoneNumber: string) => {
    const { token } = get();
    if (!token) return false;

    try {
      const response = await fetch(`${API_URL}/api/contacts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name, phone_number: phoneNumber }),
      });
      if (response.ok) {
        get().loadContacts();
        return true;
      }
    } catch (error) {
      console.error('Add contact error:', error);
    }
    return false;
  },

  deleteContact: async (contactId: string) => {
    const { token } = get();
    if (!token) return false;

    try {
      const response = await fetch(`${API_URL}/api/contacts/${contactId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        get().loadContacts();
        return true;
      }
    } catch (error) {
      console.error('Delete contact error:', error);
    }
    return false;
  },

  // Messages
  loadMessages: async () => {
    const { token } = get();
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/api/messages`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const messages = await response.json();
        set({ messages });
      }
    } catch (error) {
      console.error('Load messages error:', error);
    }
  },

  sendMessage: async (toNumber: string, body: string) => {
    const { token } = get();
    if (!token) return false;

    try {
      const response = await fetch(`${API_URL}/api/messages/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ to_number: toNumber, body }),
      });
      if (response.ok) {
        get().loadMessages();
        get().refreshUser();
        return true;
      }
    } catch (error) {
      console.error('Send message error:', error);
    }
    return false;
  },

  // Balance
  topupBalance: async (amount: number) => {
    const { token } = get();
    if (!token) return false;

    try {
      const response = await fetch(`${API_URL}/api/balance/topup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ amount }),
      });
      if (response.ok) {
        get().refreshUser();
        get().loadTransactions();
        return true;
      }
    } catch (error) {
      console.error('Topup balance error:', error);
    }
    return false;
  },

  transferBalance: async (toNumber: string, amount: number) => {
    const { token } = get();
    if (!token) return false;

    try {
      const response = await fetch(`${API_URL}/api/balance/transfer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ to_number: toNumber, amount }),
      });
      if (response.ok) {
        get().refreshUser();
        get().loadTransactions();
        return true;
      }
    } catch (error) {
      console.error('Transfer balance error:', error);
    }
    return false;
  },

  loadTransactions: async () => {
    const { token } = get();
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/api/transactions`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const transactions = await response.json();
        set({ transactions });
      }
    } catch (error) {
      console.error('Load transactions error:', error);
    }
  },

  // Rates
  checkRate: async (phoneNumber: string) => {
    try {
      const response = await fetch(`${API_URL}/api/rates/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: phoneNumber }),
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Check rate error:', error);
    }
    return null;
  },
}));
