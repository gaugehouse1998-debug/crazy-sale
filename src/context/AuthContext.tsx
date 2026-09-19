import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  deleteUser as firebaseDeleteUser,
  updatePassword,
  sendPasswordResetEmail,
  EmailAuthProvider,
  reauthenticateWithCredential
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../config/firebase';
import { storeService } from '../services/storeService';
import { UserProfile, StoreSettings } from '../types';
import { DEFAULT_STORE_SETTINGS } from '../data/initialData';

interface AuthContextType {
  currentUser: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  isAdmin: boolean;
  loading: boolean;
  login: (email: string, pass: string) => Promise<UserProfile>;
  registerCustomer: (data: {
    fullName: string;
    email: string;
    password: string;
    phone: string;
    address: string;
    city: string;
  }) => Promise<UserProfile>;
  register: (data: {
    fullName: string;
    email: string;
    password: string;
    phone: string;
    address: string;
    city: string;
  }) => Promise<UserProfile>;
  adminLogin: (email: string, pass: string) => Promise<UserProfile>;
  changeAdminPassword: (oldPassword: string, newPassword: string) => Promise<void>;
  sendAdminPasswordReset: (email: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  deleteAccount: () => Promise<void>;
  storeSettings: StoreSettings;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_USER_KEY = 'cs_active_user';

export function normalizeAdminEmail(email: string): string {
  let clean = email.trim().toLowerCase();
  if (clean === 'crazysale2026@gmail' || clean === 'crazysale2026') {
    clean = 'crazysale2026@gmail.com';
  } else if (!clean.includes('@') && clean.length > 0) {
    clean = `${clean}@gmail.com`;
  }
  return clean;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_USER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS);

  useEffect(() => {
    storeService.getSettings().then(setStoreSettings).catch(console.error);
  }, []);

  // Listen to Firebase auth if configured
  useEffect(() => {
    if (isFirebaseConfigured && auth) {
      const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
        setFirebaseUser(fbUser);
        if (fbUser) {
          const cleanEmail = (fbUser.email || '').toLowerCase();
          // Check admin status in admin_users collection first
          const adminRecord = await storeService.getAdminUser(fbUser.uid);
          const isUserAdmin = Boolean(
            (adminRecord && adminRecord.role === 'admin' && adminRecord.active === true) ||
            cleanEmail === 'crazysale2026@gmail.com' ||
            cleanEmail === storeSettings.adminEmail.toLowerCase()
          );

          const users = await storeService.getUsers();
          let profile = users.find(u => u.uid === fbUser.uid);
          if (!profile) {
            profile = {
              uid: fbUser.uid,
              email: fbUser.email || '',
              fullName: fbUser.displayName || fbUser.email?.split('@')[0] || (isUserAdmin ? 'Store Administrator' : 'Customer'),
              phone: '',
              address: '',
              city: 'Karachi',
              role: isUserAdmin ? 'admin' : 'customer',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            await storeService.saveUser(profile);
          } else if (isUserAdmin && profile.role !== 'admin') {
            profile = { ...profile, role: 'admin', updatedAt: new Date().toISOString() };
            await storeService.saveUser(profile);
          }
          setCurrentUser(profile);
          localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(profile));
        } else {
          // If was logged in via firebase
          if (!localStorage.getItem('cs_offline_auth')) {
            setCurrentUser(null);
            localStorage.removeItem(LOCAL_USER_KEY);
          }
        }
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      setLoading(false);
    }
  }, [storeSettings.adminEmail]);

  const isAdmin = Boolean(
    currentUser &&
    currentUser.role === 'admin'
  );

  const login = async (email: string, pass: string): Promise<UserProfile> => {
    const cleanEmail = email.trim().toLowerCase();
    
    if (isFirebaseConfigured && auth) {
      const cred = await signInWithEmailAndPassword(auth, cleanEmail, pass);
      const adminRecord = await storeService.getAdminUser(cred.user.uid);
      const isUserAdmin = Boolean(
        (adminRecord && adminRecord.role === 'admin' && adminRecord.active === true) ||
        cleanEmail === 'crazysale2026@gmail.com' ||
        cleanEmail === storeSettings.adminEmail.toLowerCase()
      );

      const users = await storeService.getUsers();
      const profile = users.find(u => u.uid === cred.user.uid) || {
        uid: cred.user.uid,
        email: cleanEmail,
        fullName: cred.user.displayName || cleanEmail.split('@')[0],
        phone: '',
        address: '',
        city: 'Karachi',
        role: isUserAdmin ? 'admin' : 'customer',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setCurrentUser(profile);
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(profile));
      return profile;
    }

    // Local authentication fallback for stored accounts only
    const users = await storeService.getUsers();
    const profile = users.find(u => u.email.toLowerCase() === cleanEmail);
    if (!profile) {
      throw new Error('Account not found. Please create an account or verify your email.');
    }
    setCurrentUser(profile);
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(profile));
    localStorage.setItem('cs_offline_auth', 'true');
    return profile;
  };

  const registerCustomer = async (data: {
    fullName: string;
    email: string;
    password: string;
    phone: string;
    address: string;
    city: string;
  }): Promise<UserProfile> => {
    const cleanEmail = data.email.trim().toLowerCase();

    // Strict validation of mandatory fields (Requirements 13 & 17)
    if (!data.fullName.trim()) throw new Error('Full Name is required');
    if (!cleanEmail || !cleanEmail.includes('@')) throw new Error('Email is required');
    if (!data.password || data.password.length < 6) throw new Error('Password must be at least 6 characters');
    if (!data.phone.trim()) throw new Error('Contact Number is required');
    if (!data.city.trim()) throw new Error('City is required');
    if (!data.address.trim()) throw new Error('Complete Address is required');

    // Rule: Do not allow administrator email to register through the customer registration form
    if (cleanEmail === storeSettings.adminEmail.toLowerCase() || cleanEmail === 'crazysale2026@gmail.com') {
      throw new Error('This email address is reserved for administrative access. Please sign in via the Admin portal.');
    }

    if (isFirebaseConfigured && auth) {
      const cred = await createUserWithEmailAndPassword(auth, cleanEmail, data.password);
      const newProfile: UserProfile = {
        uid: cred.user.uid,
        email: cleanEmail,
        fullName: data.fullName.trim(),
        phone: data.phone.trim(),
        address: data.address.trim(),
        city: data.city.trim(),
        role: 'customer',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await storeService.saveUser(newProfile);
      setCurrentUser(newProfile);
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(newProfile));
      return newProfile;
    }

    // Local fallback
    const newProfile: UserProfile = {
      uid: `user_${Date.now()}`,
      email: cleanEmail,
      fullName: data.fullName.trim(),
      phone: data.phone.trim(),
      address: data.address.trim(),
      city: data.city.trim(),
      role: 'customer',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await storeService.saveUser(newProfile);
    setCurrentUser(newProfile);
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(newProfile));
    localStorage.setItem('cs_offline_auth', 'true');
    return newProfile;
  };

  const adminLogin = async (email: string, pass: string): Promise<UserProfile> => {
    const cleanEmail = normalizeAdminEmail(email);

    if (isFirebaseConfigured && auth) {
      let cred;
      try {
        cred = await signInWithEmailAndPassword(auth, cleanEmail, pass);
      } catch (err: any) {
        // Bootstrap authorized admin account if not created in Firebase Auth yet
        if ((err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') &&
            (cleanEmail === 'crazysale2026@gmail.com' || cleanEmail === storeSettings.adminEmail.toLowerCase())) {
          try {
            cred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
          } catch (createErr) {
            throw err;
          }
        } else {
          throw err;
        }
      }

      // Check admin authorization in admin_users collection
      let adminRecord = await storeService.getAdminUser(cred.user.uid);
      if (!adminRecord) {
        if (cleanEmail === 'crazysale2026@gmail.com' || cleanEmail === storeSettings.adminEmail.toLowerCase()) {
          adminRecord = {
            uid: cred.user.uid,
            email: cleanEmail,
            role: 'admin',
            active: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          await storeService.saveAdminUser(adminRecord);
        } else {
          await firebaseSignOut(auth);
          throw new Error('Access Denied: You do not have administrator permissions.');
        }
      } else if (adminRecord.role !== 'admin' || !adminRecord.active) {
        await firebaseSignOut(auth);
        throw new Error('Access Denied: Your administrator access has been revoked or deactivated.');
      }

      const adminProfile: UserProfile = {
        uid: cred.user.uid,
        email: cleanEmail,
        fullName: 'Store Administrator',
        phone: storeSettings.phone || '0300-0000000',
        address: storeSettings.address || 'Crazy Sale HQ',
        city: 'Karachi',
        role: 'admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await storeService.saveUser(adminProfile);
      setCurrentUser(adminProfile);
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(adminProfile));
      return adminProfile;
    }

    // Local fallback
    if (cleanEmail !== 'crazysale2026@gmail.com' && cleanEmail !== storeSettings.adminEmail.toLowerCase()) {
      throw new Error(`Access Denied: Only authorized administrator (${storeSettings.adminEmail}) can access Admin Portal.`);
    }

    const adminProfile: UserProfile = {
      uid: 'admin_master_1',
      email: cleanEmail,
      fullName: 'Store Administrator',
      phone: storeSettings.phone || '0300-0000000',
      address: storeSettings.address || 'Crazy Sale HQ',
      city: 'Karachi',
      role: 'admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await storeService.saveAdminUser({
      uid: adminProfile.uid,
      email: cleanEmail,
      role: 'admin',
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    await storeService.saveUser(adminProfile);
    setCurrentUser(adminProfile);
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(adminProfile));
    localStorage.setItem('cs_offline_auth', 'true');
    return adminProfile;
  };

  const changeAdminPassword = async (oldPassword: string, newPassword: string): Promise<void> => {
    if (!newPassword || newPassword.length < 6) {
      throw new Error('New password must be at least 6 characters long.');
    }

    if (isFirebaseConfigured && auth && auth.currentUser) {
      const user = auth.currentUser;
      if (oldPassword && user.email) {
        try {
          const credential = EmailAuthProvider.credential(user.email, oldPassword);
          await reauthenticateWithCredential(user, credential);
        } catch (reauthErr: any) {
          throw new Error(reauthErr?.message || 'Current password reauthentication failed.');
        }
      }
      await updatePassword(user, newPassword);
      return;
    }

    // Offline mode: simulated password update without exposing or storing plaintext
    return;
  };

  const sendAdminPasswordReset = async (email: string): Promise<void> => {
    const cleanEmail = normalizeAdminEmail(email);
    if (!cleanEmail || !cleanEmail.includes('@')) {
      throw new Error('Please enter a valid email address for password reset.');
    }
    if (isFirebaseConfigured && auth) {
      await sendPasswordResetEmail(auth, cleanEmail);
    }
  };

  const sendPasswordReset = async (email: string): Promise<void> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      throw new Error('Please enter a valid email address for password reset.');
    }
    if (isFirebaseConfigured && auth) {
      await sendPasswordResetEmail(auth, cleanEmail);
    }
  };

  const logout = async (): Promise<void> => {
    if (isFirebaseConfigured && auth) {
      await firebaseSignOut(auth);
    }
    setCurrentUser(null);
    localStorage.removeItem(LOCAL_USER_KEY);
    localStorage.removeItem('cs_offline_auth');
  };

  const updateProfile = async (data: Partial<UserProfile>): Promise<void> => {
    if (!currentUser) return;
    const updated: UserProfile = { 
      ...currentUser, 
      ...data, 
      updatedAt: new Date().toISOString() 
    };
    setCurrentUser(updated);
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(updated));
    await storeService.saveUser(updated);
  };

  const deleteAccount = async (): Promise<void> => {
    if (!currentUser) return;
    if (isFirebaseConfigured && auth && firebaseUser) {
      await firebaseDeleteUser(firebaseUser);
    }
    setCurrentUser(null);
    localStorage.removeItem(LOCAL_USER_KEY);
    localStorage.removeItem('cs_offline_auth');
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        firebaseUser,
        isAdmin,
        loading,
        login,
        registerCustomer,
        register: registerCustomer,
        adminLogin,
        changeAdminPassword,
        sendAdminPasswordReset,
        sendPasswordReset,
        logout,
        updateProfile,
        deleteAccount,
        storeSettings,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
