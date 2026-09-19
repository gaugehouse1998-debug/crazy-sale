import { 
  collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, query, where, orderBy 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, auth, isFirebaseConfigured } from '../config/firebase';
import { 
  Product, Category, HeroBanner, PaymentAccount, StoreSettings, Order, UserProfile, AdminUser, OrderStatusType, PaymentStatusType 
} from '../types';
import { 
  DEFAULT_PRODUCTS, DEFAULT_CATEGORIES, DEFAULT_BANNERS, 
  DEFAULT_PAYMENT_ACCOUNTS, DEFAULT_STORE_SETTINGS 
} from '../data/initialData';

// Local storage keys for caching and offline/local fallback
const STORAGE_KEYS = {
  PRODUCTS: 'cs_products',
  CATEGORIES: 'cs_categories',
  BANNERS: 'cs_banners',
  PAYMENT_ACCOUNTS: 'cs_payment_accounts',
  SETTINGS: 'cs_store_settings',
  ORDERS: 'cs_orders',
  USERS: 'cs_users',
  ADMIN_USERS: 'cs_admin_users',
};

// Helper: LocalStorage read with default fallback
function getLocal<T>(key: string, defaultVal: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultVal;
  } catch (e) {
    return defaultVal;
  }
}

// Helper: LocalStorage write
function setLocal<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.error('LocalStorage write error:', e);
  }
}

// Helper: Remove undefined values before saving to Firestore
export function cleanFirestoreData<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => cleanFirestoreData(item)) as unknown as T;
  }
  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = cleanFirestoreData(value);
      }
    }
    return cleaned;
  }
  return obj;
}

// Generate unique human-readable order number like CS-2026-104928
export function generateOrderNumber(): string {
  const year = 2026;
  const randomSuffix = Math.floor(100000 + Math.random() * 900000);
  return `CS-${year}-${randomSuffix}`;
}

export const storeService = {
  // -------------------------------------------------------------
  // STORE SETTINGS
  // -------------------------------------------------------------
  async getSettings(): Promise<StoreSettings> {
    if (isFirebaseConfigured && db) {
      try {
        const snap = await getDoc(doc(db, 'store_settings', 'default'));
        if (snap.exists()) {
          const data = snap.data() as StoreSettings;
          setLocal(STORAGE_KEYS.SETTINGS, data);
          return data;
        }
      } catch (err) {
        console.warn('Firestore settings fetch fallback to local:', err);
      }
    }
    return getLocal<StoreSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_STORE_SETTINGS);
  },

  async updateSettings(settings: StoreSettings): Promise<void> {
    setLocal(STORAGE_KEYS.SETTINGS, settings);
    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'store_settings', 'default'), settings);
      } catch (err) {
        console.error('Failed to sync settings to Firestore:', err);
      }
    }
  },

  // -------------------------------------------------------------
  // CATEGORIES
  // -------------------------------------------------------------
  async getCategories(): Promise<Category[]> {
    if (isFirebaseConfigured && db) {
      try {
        const snap = await getDocs(collection(db, 'categories'));
        if (!snap.empty) {
          const list = snap.docs.map(d => ({ ...d.data(), id: d.id } as Category));
          list.sort((a, b) => a.displayOrder - b.displayOrder);
          setLocal(STORAGE_KEYS.CATEGORIES, list);
          return list;
        }
      } catch (err) {
        console.warn('Firestore categories fetch fallback to local:', err);
      }
    }
    const raw = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    if (raw !== null) {
      try {
        return JSON.parse(raw);
      } catch {
        return [];
      }
    }
    setLocal(STORAGE_KEYS.CATEGORIES, DEFAULT_CATEGORIES);
    return DEFAULT_CATEGORIES;
  },

  async saveCategory(cat: Category): Promise<void> {
    const list = await this.getCategories();
    const idx = list.findIndex(c => c.id === cat.id);
    if (idx >= 0) {
      list[idx] = cat;
    } else {
      list.push(cat);
    }
    setLocal(STORAGE_KEYS.CATEGORIES, list);
    if (isFirebaseConfigured && db) {
      await setDoc(doc(db, 'categories', cat.id), cat);
    }
  },

  async deleteCategory(id: string): Promise<void> {
    if (!id) return;
    const current = await this.getCategories();
    const list = current.filter(c => c.id !== id);
    setLocal(STORAGE_KEYS.CATEGORIES, list);
    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, 'categories', id));
      } catch (err) {
        console.warn('Firestore deleteCategory notice:', err);
      }
    }
  },

  // -------------------------------------------------------------
  // HERO BANNERS
  // -------------------------------------------------------------
  async getBanners(): Promise<HeroBanner[]> {
    if (isFirebaseConfigured && db) {
      try {
        const snap = await getDocs(collection(db, 'banners'));
        if (!snap.empty) {
          const list = snap.docs.map(d => ({ ...d.data(), id: d.id } as HeroBanner));
          list.sort((a, b) => a.displayOrder - b.displayOrder);
          setLocal(STORAGE_KEYS.BANNERS, list);
          return list;
        }
      } catch (err) {
        console.warn('Firestore banners fetch fallback to local:', err);
      }
    }
    const local = getLocal<HeroBanner[]>(STORAGE_KEYS.BANNERS, []);
    if (local.length > 0) return local;
    setLocal(STORAGE_KEYS.BANNERS, DEFAULT_BANNERS);
    return DEFAULT_BANNERS;
  },

  async saveBanner(banner: HeroBanner): Promise<void> {
    const list = await this.getBanners();
    const idx = list.findIndex(b => b.id === banner.id);
    if (idx >= 0) {
      list[idx] = banner;
    } else {
      list.push(banner);
    }
    setLocal(STORAGE_KEYS.BANNERS, list);
    if (isFirebaseConfigured && db) {
      await setDoc(doc(db, 'banners', banner.id), banner);
    }
  },

  async deleteBanner(id: string): Promise<void> {
    const list = (await this.getBanners()).filter(b => b.id !== id);
    setLocal(STORAGE_KEYS.BANNERS, list);
    if (isFirebaseConfigured && db) {
      await deleteDoc(doc(db, 'banners', id));
    }
  },

  // -------------------------------------------------------------
  // PAYMENT ACCOUNTS
  // -------------------------------------------------------------
  async getPaymentAccounts(activeOnly = false): Promise<PaymentAccount[]> {
    let accounts: PaymentAccount[] = [];
    if (isFirebaseConfigured && db) {
      try {
        const snap = await getDocs(collection(db, 'payment_accounts'));
        if (!snap.empty) {
          accounts = snap.docs.map(d => ({ ...d.data(), id: d.id } as PaymentAccount));
          setLocal(STORAGE_KEYS.PAYMENT_ACCOUNTS, accounts);
        }
      } catch (err) {
        console.warn('Firestore accounts fetch fallback to local:', err);
      }
    }
    if (accounts.length === 0) {
      accounts = getLocal<PaymentAccount[]>(STORAGE_KEYS.PAYMENT_ACCOUNTS, DEFAULT_PAYMENT_ACCOUNTS);
      if (!localStorage.getItem(STORAGE_KEYS.PAYMENT_ACCOUNTS)) {
        setLocal(STORAGE_KEYS.PAYMENT_ACCOUNTS, DEFAULT_PAYMENT_ACCOUNTS);
      }
    }
    if (activeOnly) {
      return accounts.filter(a => a.isActive);
    }
    return accounts;
  },

  async savePaymentAccount(account: PaymentAccount): Promise<void> {
    let list = await this.getPaymentAccounts();
    if (account.isDefault) {
      list = list.map(a => ({ ...a, isDefault: a.id === account.id }));
    }
    const idx = list.findIndex(a => a.id === account.id);
    if (idx >= 0) {
      list[idx] = account;
    } else {
      list.push(account);
    }
    setLocal(STORAGE_KEYS.PAYMENT_ACCOUNTS, list);
    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'payment_accounts', account.id), cleanFirestoreData(account));
        // If this is default, update other accounts in Firestore
        if (account.isDefault) {
          for (const other of list) {
            if (other.id !== account.id && other.isDefault) {
              await setDoc(doc(db, 'payment_accounts', other.id), cleanFirestoreData({ ...other, isDefault: false }));
            }
          }
        }
      } catch (err: any) {
        console.error('Firestore savePaymentAccount error:', err);
        throw new Error(err?.message || 'Failed to save payment account to Firestore.');
      }
    }
  },

  async deletePaymentAccount(id: string): Promise<void> {
    if (!id) return;
    const current = await this.getPaymentAccounts();
    const list = current.filter(a => a.id !== id);
    setLocal(STORAGE_KEYS.PAYMENT_ACCOUNTS, list);
    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, 'payment_accounts', id));
      } catch (err: any) {
        console.warn('Firestore deletePaymentAccount notice:', err);
      }
    }
  },

  // -------------------------------------------------------------
  // PRODUCTS
  // -------------------------------------------------------------
  async getProducts(): Promise<Product[]> {
    if (isFirebaseConfigured && db) {
      try {
        const snap = await getDocs(collection(db, 'products'));
        if (!snap.empty) {
          const list = snap.docs.map(d => ({ ...d.data(), id: d.id } as Product));
          setLocal(STORAGE_KEYS.PRODUCTS, list);
          return list;
        }
      } catch (err) {
        console.warn('Firestore products fetch error, reading cached local:', err);
      }
    }
    const raw = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (raw !== null) {
      try {
        return JSON.parse(raw);
      } catch {
        return [];
      }
    }
    setLocal(STORAGE_KEYS.PRODUCTS, DEFAULT_PRODUCTS);
    return DEFAULT_PRODUCTS;
  },

  async getProductBySlug(slug: string): Promise<Product | null> {
    const list = await this.getProducts();
    return list.find(p => p.slug === slug) || null;
  },

  async saveProduct(product: Product): Promise<void> {
    const list = await this.getProducts();
    const idx = list.findIndex(p => p.id === product.id);
    const updatedProd = {
      ...product,
      updatedAt: new Date().toISOString(),
      createdAt: idx >= 0 ? (list[idx].createdAt || new Date().toISOString()) : new Date().toISOString(),
    };

    if (idx >= 0) {
      list[idx] = updatedProd;
    } else {
      list.unshift(updatedProd);
    }
    setLocal(STORAGE_KEYS.PRODUCTS, list);

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'products', product.id), cleanFirestoreData(updatedProd));
      } catch (err: any) {
        console.error('Firestore saveProduct error:', err);
        throw new Error(err?.message || 'Failed to save product in Firestore database.');
      }
    }
  },

  async deleteProduct(id: string): Promise<void> {
    if (!id) throw new Error('Invalid product ID');
    // Immediate and permanent local removal
    const current = await this.getProducts();
    const list = current.filter(p => p.id !== id);
    setLocal(STORAGE_KEYS.PRODUCTS, list);

    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, 'products', id));
      } catch (err: any) {
        console.warn('Firestore deleteProduct notice:', err);
      }
    }
  },

  async uploadProductImage(file: File, productId: string): Promise<string> {
    const validExtensions = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validExtensions.includes(file.type.toLowerCase())) {
      throw new Error('Unsupported image format. Please upload JPG, JPEG, PNG, or WEBP.');
    }
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('Image size exceeds 10MB limit. Please choose a smaller photo.');
    }

    if (isFirebaseConfigured && storage) {
      try {
        const safeName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const fileRef = ref(storage, `products/${productId}/${safeName}`);
        const snap = await uploadBytes(fileRef, file, { contentType: file.type });
        return await getDownloadURL(snap.ref);
      } catch (err: any) {
        console.error('Firebase Storage uploadProductImage error:', err);
        throw new Error(err?.message || 'Failed to upload product image to Firebase Storage.');
      }
    }

    // Local/offline fallback: Data URL
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read image file.'));
      reader.readAsDataURL(file);
    });
  },

  // -------------------------------------------------------------
  // ORDERS
  // -------------------------------------------------------------
  async getOrders(): Promise<Order[]> {
    if (isFirebaseConfigured && db) {
      try {
        const snap = await getDocs(collection(db, 'orders'));
        if (!snap.empty) {
          const list = snap.docs.map(d => ({ ...d.data(), id: d.id } as Order));
          list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setLocal(STORAGE_KEYS.ORDERS, list);
          return list;
        }
      } catch (err) {
        console.warn('Firestore orders fetch fallback to local:', err);
      }
    }
    return getLocal<Order[]>(STORAGE_KEYS.ORDERS, []);
  },

  async getCustomerOrders(customerUid: string): Promise<Order[]> {
    const all = await this.getOrders();
    return all.filter(o => o.customerUid === customerUid);
  },

  async getOrderById(id: string): Promise<Order | null> {
    const all = await this.getOrders();
    return all.find(o => o.id === id || o.orderNumber === id) || null;
  },

  async createOrder(order: Order): Promise<Order> {
    // 1. Enforce real authentication
    if (isFirebaseConfigured && auth) {
      if (!auth.currentUser) {
        throw new Error('Authentication Required: Please create an account or sign in before placing your order.');
      }
      order.customerUid = auth.currentUser.uid;
    } else if (!order.customerUid) {
      throw new Error('Authentication Required: Please create an account or sign in before placing your order.');
    }

    // 2. Mandatory Customer Information validation (Requirement 4)
    if (!order.customer?.fullName?.trim()) throw new Error('Full Name is required');
    if (!order.customer?.email?.trim() || !order.customer.email.includes('@')) throw new Error('Email is required');
    if (!order.customer?.phone?.trim() || order.customer.phone.replace(/\D/g, '').length < 10) throw new Error('Contact Number is required');
    if (!order.customer?.city?.trim()) throw new Error('City is required');
    if (!order.customer?.address?.trim() || order.customer.address.trim().length < 5) throw new Error('Complete Address is required');

    // 3. Cart & Item validation (Requirements 25, 27, 28)
    if (!order.items || order.items.length === 0) {
      throw new Error('Your cart is empty.');
    }

    // 4. Do not trust client-submitted product price - re-calculate using fresh catalog data (Requirement 26)
    const freshProducts = await this.getProducts();
    let verifiedSubtotal = 0;
    for (const item of order.items) {
      const prod = freshProducts.find(p => p.id === item.productId);
      if (!prod) {
        throw new Error(`Product "${item.productTitle}" is no longer available.`);
      }

      // Stock validation
      if (item.variantId && prod.variants) {
        const v = prod.variants.find(va => va.id === item.variantId);
        if (!v || item.quantity > v.stockQuantity) {
          throw new Error('Some products are no longer available in the requested quantity.');
        }
      } else if (item.quantity > prod.stockQuantity) {
        throw new Error('Some products are no longer available in the requested quantity.');
      }

      // Real price calculation from trusted data
      let unitPrice = prod.regularPrice;
      if (typeof prod.salePrice === 'number' && prod.salePrice < prod.regularPrice) {
        unitPrice = prod.salePrice;
      }
      if (item.variantId && prod.variants) {
        const v = prod.variants.find(va => va.id === item.variantId);
        if (v && typeof v.salePrice === 'number' && v.salePrice < v.regularPrice) {
          unitPrice = v.salePrice;
        } else if (v && typeof v.regularPrice === 'number') {
          unitPrice = v.regularPrice;
        }
      }
      item.price = unitPrice;
      item.lineSubtotal = unitPrice * item.quantity;
      verifiedSubtotal += item.lineSubtotal;
    }

    // Set verified totals
    order.subtotal = verifiedSubtotal;
    const shippingFee = typeof order.shipping === 'number' ? order.shipping : (order.deliveryFee ?? 0);
    order.shipping = shippingFee;
    order.deliveryFee = shippingFee;
    order.total = verifiedSubtotal + shippingFee;

    // Set flat customer fields for consistency and audit
    order.customerName = order.customer.fullName;
    order.customerEmail = order.customer.email;
    order.customerPhone = order.customer.phone;
    order.customerCity = order.customer.city;
    order.customerAddress = order.customer.address;
    order.paymentAccount = order.selectedBank;
    order.customerType = 'registered';

    // Anti-fake initial statuses (Requirement 5 & 6)
    order.verificationStatus = 'unverified';
    order.paymentStatus = 'unpaid';
    order.orderStatus = 'new';
    delete (order as any).verifiedBy;
    delete (order as any).verifiedDate;

    // Update local cache
    const all = await this.getOrders();
    all.unshift(order);
    setLocal(STORAGE_KEYS.ORDERS, all);
    
    // Deduct stock safely
    for (const item of order.items) {
      const prod = freshProducts.find(p => p.id === item.productId);
      if (prod) {
        if (item.variantId && prod.variants) {
          const v = prod.variants.find(va => va.id === item.variantId);
          if (v) {
            v.stockQuantity = Math.max(0, v.stockQuantity - item.quantity);
          }
        }
        prod.stockQuantity = Math.max(0, prod.stockQuantity - item.quantity);
      }
    }
    setLocal(STORAGE_KEYS.PRODUCTS, freshProducts);

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'orders', order.id), cleanFirestoreData(order));
        for (const item of order.items) {
          const prod = freshProducts.find(p => p.id === item.productId);
          if (prod) {
            await setDoc(doc(db, 'products', prod.id), cleanFirestoreData(prod));
          }
        }
      } catch (err: any) {
        console.error('Firestore createOrder error:', err);
        throw new Error(err?.message || 'Failed to submit order to database.');
      }
    }
    return order;
  },

  async clearLegacyDemoOrders(): Promise<number> {
    const all = await this.getOrders();
    const demoOrders = all.filter(o => 
      (o.customerUid && (o.customerUid.startsWith('demo_') || o.customerUid.startsWith('test_') || o.customerUid.startsWith('guest_'))) ||
      (o.customer?.email && (o.customer.email.includes('demo') || o.customer.email.includes('test') || o.customer.email.includes('sample'))) ||
      (o.customer?.fullName && (o.customer.fullName.toLowerCase().includes('sample') || o.customer.fullName.toLowerCase().includes('demo') || o.customer.fullName.toLowerCase().includes('fatima tariq')))
    );
    
    if (demoOrders.length === 0) return 0;
    
    const remaining = all.filter(o => !demoOrders.some(d => d.id === o.id));
    setLocal(STORAGE_KEYS.ORDERS, remaining);
    
    if (isFirebaseConfigured && db) {
      for (const order of demoOrders) {
        try {
          await deleteDoc(doc(db, 'orders', order.id));
        } catch (e) {
          console.error('Failed to delete legacy test order:', order.id, e);
        }
      }
    }
    return demoOrders.length;
  },

  async submitPaymentProof(
    orderId: string, 
    data: { transactionId: string; paidAmount: number; paymentProofUrl: string; paymentNotes?: string }
  ): Promise<Order | null> {
    const all = await this.getOrders();
    const idx = all.findIndex(o => o.id === orderId);
    if (idx === -1) return null;

    const updated: Order = {
      ...all[idx],
      transactionId: data.transactionId,
      paidAmount: data.paidAmount,
      paymentProofUrl: data.paymentProofUrl,
      paymentNotes: data.paymentNotes || all[idx].paymentNotes,
      paymentStatus: 'pending_verification',
      verificationStatus: 'unverified',
      rejectionReason: undefined,
      updatedAt: new Date().toISOString(),
    };

    all[idx] = updated;
    setLocal(STORAGE_KEYS.ORDERS, all);

    if (isFirebaseConfigured && db) {
      try {
        await updateDoc(doc(db, 'orders', orderId), {
          transactionId: data.transactionId,
          paidAmount: data.paidAmount,
          paymentProofUrl: data.paymentProofUrl,
          paymentNotes: data.paymentNotes || '',
          paymentStatus: 'pending_verification',
          verificationStatus: 'unverified',
          rejectionReason: '',
          updatedAt: new Date().toISOString(),
        });
      } catch (err) {
        console.error('Firestore submitPaymentProof error:', err);
      }
    }
    return updated;
  },

  async verifyPayment(
    orderId: string, 
    approved: boolean, 
    verifiedBy: string, 
    rejectionReason?: string
  ): Promise<Order | null> {
    const all = await this.getOrders();
    const idx = all.findIndex(o => o.id === orderId);
    if (idx === -1) return null;

    const current = all[idx];
    const updated: Order = {
      ...current,
      paymentStatus: approved ? 'verified' : 'rejected',
      verificationStatus: approved ? 'verified' : 'rejected',
      verifiedBy,
      verifiedDate: new Date().toISOString(),
      rejectionReason: approved ? undefined : (rejectionReason || 'Receipt details do not match transfer amount.'),
      orderStatus: approved ? 'confirmed' : 'payment_issue',
      updatedAt: new Date().toISOString(),
    };

    all[idx] = updated;
    setLocal(STORAGE_KEYS.ORDERS, all);

    if (isFirebaseConfigured && db) {
      try {
        await updateDoc(doc(db, 'orders', orderId), {
          paymentStatus: updated.paymentStatus,
          verificationStatus: updated.verificationStatus,
          verifiedBy,
          verifiedDate: updated.verifiedDate,
          rejectionReason: updated.rejectionReason || '',
          orderStatus: updated.orderStatus,
          updatedAt: new Date().toISOString(),
        });
      } catch (err) {
        console.error('Firestore verifyPayment error:', err);
      }
    }
    return updated;
  },

  async updateOrderStatus(
    orderId: string, 
    newStatus: OrderStatusType, 
    meta?: { trackingNumber?: string; carrier?: string; trackingUrl?: string }
  ): Promise<Order | null> {
    const all = await this.getOrders();
    const idx = all.findIndex(o => o.id === orderId);
    if (idx === -1) return null;

    const current = all[idx];
    // Workflow protection: cannot mark advance bank transfer as processing or shipped if payment is not verified!
    if (current.paymentMethod === 'advance_bank_transfer') {
      if ((newStatus === 'processing' || newStatus === 'shipped' || newStatus === 'completed') && current.paymentStatus !== 'verified') {
        throw new Error('Advance payment order cannot be marked as Processing/Shipped until payment is verified.');
      }
    }

    const updated: Order = {
      ...current,
      orderStatus: newStatus,
      trackingNumber: meta?.trackingNumber ?? current.trackingNumber,
      carrier: meta?.carrier ?? current.carrier,
      trackingUrl: meta?.trackingUrl ?? current.trackingUrl,
      updatedAt: new Date().toISOString(),
    };

    all[idx] = updated;
    setLocal(STORAGE_KEYS.ORDERS, all);

    if (isFirebaseConfigured && db) {
      try {
        await updateDoc(doc(db, 'orders', orderId), {
          orderStatus: newStatus,
          trackingNumber: updated.trackingNumber || '',
          carrier: updated.carrier || '',
          trackingUrl: updated.trackingUrl || '',
          updatedAt: new Date().toISOString(),
        });
      } catch (err) {
        console.error('Firestore updateOrderStatus error:', err);
      }
    }
    return updated;
  },

  async uploadPaymentProof(file: File, _orderId?: string): Promise<string> {
    return this.uploadImage(file, 'payment_proofs');
  },

  async deleteOrder(orderId: string): Promise<void> {
    const all = (await this.getOrders()).filter(o => o.id !== orderId);
    setLocal(STORAGE_KEYS.ORDERS, all);
    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, 'orders', orderId));
      } catch (err) {
        console.error('Firestore deleteOrder error:', err);
      }
    }
  },

  // -------------------------------------------------------------
  // USERS & CUSTOMERS
  // -------------------------------------------------------------
  async getUsers(): Promise<UserProfile[]> {
    if (isFirebaseConfigured && db) {
      try {
        const snap = await getDocs(collection(db, 'users'));
        if (!snap.empty) {
          const list = snap.docs.map(d => ({ ...d.data(), uid: d.id } as UserProfile));
          setLocal(STORAGE_KEYS.USERS, list);
          return list;
        }
      } catch (e) {
        console.warn('Firestore users fallback:', e);
      }
    }
    return getLocal<UserProfile[]>(STORAGE_KEYS.USERS, []);
  },

  async saveUser(user: UserProfile): Promise<void> {
    const list = await this.getUsers();
    const idx = list.findIndex(u => u.uid === user.uid);
    const updatedUser = {
      ...user,
      updatedAt: new Date().toISOString(),
      createdAt: idx >= 0 ? (list[idx].createdAt || user.createdAt) : (user.createdAt || new Date().toISOString()),
    };
    if (idx >= 0) {
      list[idx] = updatedUser;
    } else {
      list.push(updatedUser);
    }
    setLocal(STORAGE_KEYS.USERS, list);
    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'users', user.uid), cleanFirestoreData(updatedUser));
      } catch (e) {
        console.error('Firestore saveUser error:', e);
      }
    }
  },

  // -------------------------------------------------------------
  // ADMIN USERS (admin_users collection)
  // -------------------------------------------------------------
  async getAdminUser(uid: string): Promise<AdminUser | null> {
    if (isFirebaseConfigured && db) {
      try {
        const snap = await getDoc(doc(db, 'admin_users', uid));
        if (snap.exists()) {
          return snap.data() as AdminUser;
        }
      } catch (err) {
        console.warn('Firestore getAdminUser error:', err);
      }
    }
    const local = getLocal<AdminUser[]>(STORAGE_KEYS.ADMIN_USERS, []);
    return local.find(a => a.uid === uid) || null;
  },

  async saveAdminUser(admin: AdminUser): Promise<void> {
    const list = getLocal<AdminUser[]>(STORAGE_KEYS.ADMIN_USERS, []);
    const idx = list.findIndex(a => a.uid === admin.uid);
    if (idx >= 0) {
      list[idx] = admin;
    } else {
      list.push(admin);
    }
    setLocal(STORAGE_KEYS.ADMIN_USERS, list);
    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'admin_users', admin.uid), cleanFirestoreData(admin));
      } catch (err) {
        console.error('Firestore saveAdminUser error:', err);
      }
    }
  },

  // -------------------------------------------------------------
  // FILE UPLOAD (Firebase Storage or Local DataURL)
  // -------------------------------------------------------------
  async uploadImage(file: File, folder: 'products' | 'categories' | 'banners' | 'payment_proofs'): Promise<string> {
    if (isFirebaseConfigured && storage) {
      try {
        const safeName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const fileRef = ref(storage, `${folder}/${safeName}`);
        await uploadBytes(fileRef, file, { contentType: file.type });
        return await getDownloadURL(fileRef);
      } catch (err) {
        console.warn('Firebase storage upload fallback to dataURL:', err);
      }
    }
    // Fallback: convert to base64 Data URL for client-side storage
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },
};
