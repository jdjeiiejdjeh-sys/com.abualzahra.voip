import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import {
  getDatabase,
  ref,
  set as firebaseSet,
  get as firebaseGet,
  push,
  onValue,
  off,
  update,
  runTransaction,
  query,
  orderByKey,
  limitToLast
} from 'firebase/database';

// Firebase Configuration - From user's HTML
const firebaseConfig = {
  apiKey: "AIzaSyD8hrO2kX1zXaA46PImzMGqOt4iTwhXKI0",
  authDomain: "call-now-24582.firebaseapp.com",
  projectId: "call-now-24582",
  storageBucket: "call-now-24582.firebasestorage.app",
  databaseURL: "https://call-now-24582-default-rtdb.firebaseio.com",
  messagingSenderId: "982107544824",
  appId: "1:982107544824:web:c5b6806042ba44ff896f0d",
  measurementId: "G-W27HMG1TKV"
};

// Initialize Firebase
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

const auth = getAuth(app);
const database = getDatabase(app);

// Twilio Configuration
const TWILIO_PHONE_NUMBER = '+12365066055';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface UserData {
  uid: string;
  email: string;
  balance: number;
}

interface Contact {
  id: string;
  name: string;
  number: string;
}

interface CallLog {
  id: string;
  to: string;
  type: 'outgoing' | 'incoming' | 'transfer';
  date: number;
  duration?: string;
  cost?: number;
}

interface Message {
  id: string;
  number: string;
  name?: string;
  text: string;
  type: 'sent' | 'received';
  timestamp: number;
}

interface AppState {
  user: UserData | null;
  firebaseUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  balance: number;
  contacts: Contact[];
  callLogs: CallLog[];
  messages: Message[];
  activeCall: {
    callSid?: string;
    toNumber: string;
    status: string;
    startTime: Date | null;
    displayName?: string;
  } | null;

  // Auth
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string) => Promise<boolean>;
  loginWithGoogle: (email: string, googleId: string, displayName?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  initAuthListener: () => () => void;

  // Balance
  updateBalance: (amount: number) => Promise<void>;
  transferBalance: (receiverUid: string, amount: number) => Promise<boolean>;

  // Contacts
  loadContacts: () => void;
  addContact: (name: string, number: string) => Promise<boolean>;
  deleteContact: (contactId: string) => Promise<boolean>;

  // Calls
  initiateCall: (toNumber: string, displayName?: string, shouldRecord?: boolean) => Promise<string | null>;
  endCall: () => void;
  logCall: (to: string, type: 'outgoing' | 'incoming' | 'transfer', cost: number, duration?: string) => Promise<void>;
  loadCallLogs: () => void;
  setActiveCall: (call: AppState['activeCall']) => void;

  // Messages
  loadMessages: () => void;
  sendMessage: (toNumber: string, text: string) => Promise<boolean>;
  getConversation: (number: string) => Message[];

  // Rates
  checkRate: (phoneNumber: string) => { country: string; rate: number };
}

export const useStore = create<AppState>((set, get) => ({
  user: null,
  firebaseUser: null,
  isAuthenticated: false,
  isLoading: true,
  balance: 0,
  contacts: [],
  callLogs: [],
  messages: [],
  activeCall: null,

  // Auth
  login: async (email: string, password: string) => {
    try {
      set({ isLoading: true });
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // Get user data from database
      const userRef = ref(database, `users/${firebaseUser.uid}`);
      const snapshot = await firebaseGet(userRef);
      let userData = snapshot.val();
      
      if (!userData) {
        // Create user data if not exists
        userData = { balance: 0.63, email: firebaseUser.email };
        await firebaseSet(userRef, userData);
      }
      
      set({ 
        user: { uid: firebaseUser.uid, email: firebaseUser.email || '', balance: userData.balance || 0.63 },
        firebaseUser: firebaseUser,
        isAuthenticated: true,
        balance: userData.balance || 0.63,
        isLoading: false 
      });

      // Load user data
      const state = get();
      state.loadContacts();
      state.loadCallLogs();
      state.loadMessages();
      
      return true;
    } catch (error: any) {
      console.error('Login error:', error);
      set({ isLoading: false });
      
      // If user not found or invalid credential, try to register
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        console.log('User not found, attempting to register...');
        return get().register(email, password);
      }
      return false;
    }
  },

  register: async (email: string, password: string) => {
    try {
      set({ isLoading: true });
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // Create user data with initial balance
      const userRef = ref(database, `users/${firebaseUser.uid}`);
      await firebaseSet(userRef, { 
        balance: 0.63, 
        email: firebaseUser.email,
        createdAt: Date.now()
      });
      
      set({ 
        user: { uid: firebaseUser.uid, email: firebaseUser.email || '', balance: 0.63 },
        firebaseUser: firebaseUser,
        isAuthenticated: true,
        balance: 0.63,
        isLoading: false 
      });

      // Load user data
      const state = get();
      state.loadContacts();
      state.loadCallLogs();
      state.loadMessages();
      
      return true;
    } catch (error) {
      console.error('Register error:', error);
      set({ isLoading: false });
      return false;
    }
  },

  loginWithGoogle: async (email: string, googleId: string, displayName?: string) => {
    try {
      set({ isLoading: true });
      
      // For Google Sign-In, we create/get user in Firebase database
      const userId = `google_${googleId}`;
      const userRef = ref(database, `users/${userId}`);
      const snapshot = await firebaseGet(userRef);
      let userData = snapshot.val();
      
      if (!userData) {
        // New Google user - create account with initial balance
        userData = { 
          balance: 0.63, 
          email: email,
          displayName: displayName,
          provider: 'google',
          createdAt: Date.now()
        };
        await firebaseSet(userRef, userData);
      }
      
      set({ 
        user: { uid: userId, email: email, balance: userData.balance || 0.63 },
        isAuthenticated: true,
        balance: userData.balance || 0.63,
        isLoading: false 
      });
      
      // Load user data
      const state = get();
      state.loadContacts();
      state.loadCallLogs();
      state.loadMessages();
      
      return true;
    } catch (error) {
      console.error('Google login error:', error);
      set({ isLoading: false });
      return false;
    }
  },

  logout: async () => {
    try {
      await signOut(auth);
      set({ 
        user: null, 
        firebaseUser: null, 
        isAuthenticated: false,
        balance: 0,
        contacts: [],
        callLogs: [],
        messages: []
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  },

  initAuthListener: () => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Get user data
          const userRef = ref(database, `users/${firebaseUser.uid}`);
          const snapshot = await firebaseGet(userRef);
          let userData = snapshot.val();
          
          if (!userData) {
            userData = { balance: 0.63, email: firebaseUser.email };
            await firebaseSet(userRef, userData);
          }
          
          set({ 
            user: { uid: firebaseUser.uid, email: firebaseUser.email || '', balance: userData.balance || 0 },
            firebaseUser,
            isAuthenticated: true,
            balance: userData.balance || 0,
            isLoading: false 
          });
          
          // Load user data
          const state = get();
          state.loadContacts();
          state.loadCallLogs();
          state.loadMessages();
          
          // Listen for balance changes
          const balanceRef = ref(database, `users/${firebaseUser.uid}/balance`);
          onValue(balanceRef, (balanceSnapshot) => {
            const balance = balanceSnapshot.val() || 0;
            set({ balance });
          });
        } catch (error) {
          console.error('Auth listener error:', error);
          set({ isLoading: false });
        }
      } else {
        set({ 
          user: null, 
          firebaseUser: null, 
          isAuthenticated: false,
          isLoading: false 
        });
      }
    });
    
    return unsubscribe;
  },

  // Balance
  updateBalance: async (amount: number) => {
    const state = get();
    if (!state.user) return;
    
    const newBalance = state.balance + amount;
    const balanceRef = ref(database, `users/${state.user.uid}/balance`);
    await firebaseSet(balanceRef, newBalance);
    set({ balance: newBalance });
  },

  transferBalance: async (receiverUid: string, amount: number) => {
    const state = get();
    if (!state.user || amount > state.balance) return false;
    
    try {
      // Deduct from sender
      const senderRef = ref(database, `users/${state.user.uid}/balance`);
      await runTransaction(senderRef, (currentBalance) => {
        if ((currentBalance || 0) < amount) return;
        return (currentBalance || 0) - amount;
      });
      
      // Add to receiver
      const receiverRef = ref(database, `users/${receiverUid}/balance`);
      await runTransaction(receiverRef, (currentBalance) => {
        return (currentBalance || 0) + amount;
      });
      
      // Log the transfer
      await state.logCall(`تحويل إلى ${receiverUid}`, 'transfer', amount);
      
      return true;
    } catch (error) {
      console.error('Transfer error:', error);
      return false;
    }
  },

  // Contacts
  loadContacts: () => {
    const state = get();
    if (!state.user) return;
    
    const contactsRef = ref(database, `users/${state.user.uid}/contacts`);
    onValue(contactsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const contacts = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        set({ contacts });
      } else {
        set({ contacts: [] });
      }
    });
  },

  addContact: async (name: string, number: string) => {
    const state = get();
    if (!state.user) return false;
    
    try {
      const contactsRef = ref(database, `users/${state.user.uid}/contacts`);
      await push(contactsRef, { name, number });
      return true;
    } catch (error) {
      console.error('Add contact error:', error);
      return false;
    }
  },

  deleteContact: async (contactId: string) => {
    const state = get();
    if (!state.user) return false;
    
    try {
      const contactRef = ref(database, `users/${state.user.uid}/contacts/${contactId}`);
      await firebaseSet(contactRef, null);
      return true;
    } catch (error) {
      console.error('Delete contact error:', error);
      return false;
    }
  },

  // Calls
  initiateCall: async (toNumber: string, displayName?: string, shouldRecord?: boolean) => {
    const state = get();
    if (!state.user || state.balance < 0.05) return null;
    
    try {
      // Show call UI immediately
      set({
        activeCall: {
          toNumber,
          status: 'connecting',
          startTime: new Date(),
          displayName: displayName || toNumber
        }
      });

      // Try to call backend
      try {
        const response = await fetch(`${API_URL}/api/calls/initiate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to_number: toNumber,
            record: shouldRecord || false,
            anonymous: !!displayName,
            alias_name: displayName,
            user_id: state.user.uid
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          set({
            activeCall: {
              callSid: data.call_sid,
              toNumber,
              status: 'connecting',
              startTime: new Date(),
              displayName: displayName || toNumber
            }
          });
          return data.call_sid;
        }
      } catch (e) {
        console.log('Backend call failed, using demo mode');
      }
      
      // Deduct balance
      await state.updateBalance(-0.05);
      await state.logCall(toNumber, 'outgoing', 0.05);
      
      return 'demo-call';
    } catch (error) {
      console.error('Initiate call error:', error);
      return 'demo-call';
    }
  },

  endCall: () => {
    set({ activeCall: null });
  },

  logCall: async (to: string, type: 'outgoing' | 'incoming' | 'transfer', cost: number, duration?: string) => {
    const state = get();
    if (!state.user) return;
    
    const logsRef = ref(database, `users/${state.user.uid}/logs`);
    await push(logsRef, {
      to,
      type,
      date: Date.now(),
      cost,
      duration
    });
  },

  loadCallLogs: () => {
    const state = get();
    if (!state.user) return;
    
    const logsRef = query(ref(database, `users/${state.user.uid}/logs`), orderByKey(), limitToLast(50));
    onValue(logsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const callLogs = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        })).reverse();
        set({ callLogs });
      } else {
        set({ callLogs: [] });
      }
    });
  },

  setActiveCall: (call) => set({ activeCall: call }),

  // Messages
  loadMessages: () => {
    const state = get();
    if (!state.user) return;
    
    const msgsRef = query(ref(database, `users/${state.user.uid}/messages`), orderByKey(), limitToLast(100));
    onValue(msgsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const messages = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        set({ messages });
      } else {
        set({ messages: [] });
      }
    });
  },

  sendMessage: async (toNumber: string, text: string) => {
    const state = get();
    if (!state.user || state.balance < 0.02) return false;
    
    try {
      const msgsRef = ref(database, `users/${state.user.uid}/messages`);
      await push(msgsRef, {
        number: toNumber,
        text,
        type: 'sent',
        timestamp: Date.now()
      });
      
      // Try to send via Twilio
      try {
        await fetch(`${API_URL}/api/messages/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to_number: toNumber,
            body: text,
            user_id: state.user.uid
          })
        });
      } catch (e) {
        // Ignore if Twilio fails
      }
      
      return true;
    } catch (error) {
      console.error('Send message error:', error);
      return false;
    }
  },

  getConversation: (number: string) => {
    const state = get();
    return state.messages.filter(m => m.number === number);
  },

  // Rates
  checkRate: (phoneNumber: string) => {
    const rates: { [key: string]: { country: string; rate: number } } = {
      '967': { country: 'اليمن', rate: 0.15 },
      '966': { country: 'السعودية', rate: 0.08 },
      '971': { country: 'الإمارات', rate: 0.10 },
      '20': { country: 'مصر', rate: 0.07 },
      '962': { country: 'الأردن', rate: 0.09 },
      '961': { country: 'لبنان', rate: 0.12 },
      '970': { country: 'فلسطين', rate: 0.11 },
      '964': { country: 'العراق', rate: 0.14 },
      '963': { country: 'سوريا', rate: 0.16 },
      '1': { country: 'أمريكا/كندا', rate: 0.05 },
      '44': { country: 'المملكة المتحدة', rate: 0.06 },
    };
    
    const cleanNumber = phoneNumber.replace(/[+\s-]/g, '');
    
    for (const code in rates) {
      if (cleanNumber.startsWith(code)) {
        return rates[code];
      }
    }
    
    return { country: 'دولي', rate: 0.20 };
  }
}));
