import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { 
  Product, Category, HeroBanner, PaymentAccount, StoreSettings, CartItem, ProductVariant 
} from '../types';
import { storeService } from '../services/storeService';
import { DEFAULT_STORE_SETTINGS } from '../data/initialData';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
}

interface StoreContextType {
  products: Product[];
  categories: Category[];
  banners: HeroBanner[];
  paymentAccounts: PaymentAccount[];
  settings: StoreSettings;
  loading: boolean;
  
  // Cart
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number, selectedVariant?: ProductVariant) => boolean;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, newQty: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartSubtotal: number;
  cartTotalWeightKg: number;
  
  // Modals & UI
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  quickViewProduct: Product | null;
  setQuickViewProduct: (product: Product | null) => void;
  
  // Refresh data triggers
  refreshAll: () => Promise<void>;
  refreshProducts: () => Promise<void>;
  refreshCategories: () => Promise<void>;
  refreshBanners: () => Promise<void>;
  refreshSettings: () => Promise<void>;
  refreshPaymentAccounts: () => Promise<void>;
  updateSettings: (newSettings: StoreSettings) => Promise<void>;
  
  // Toasts
  toasts: ToastMessage[];
  addToast: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
  removeToast: (id: string) => void;
  
  // WhatsApp helper
  openWhatsApp: (params?: { text?: string; product?: Product; variantName?: string; orderNumber?: string }) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'cs_shopping_cart';

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [banners, setBanners] = useState<HeroBanner[]>([]);
  const [paymentAccounts, setPaymentAccounts] = useState<PaymentAccount[]>([]);
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS);
  const [loading, setLoading] = useState(true);

  // Cart state persisted to localStorage
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // UI state
  const [searchOpen, setSearchOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    const id = `${Date.now()}_${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Sync cart to localStorage
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const refreshProducts = async () => {
    const data = await storeService.getProducts();
    setProducts(data);
  };

  const refreshCategories = async () => {
    const data = await storeService.getCategories();
    setCategories(data);
  };

  const refreshBanners = async () => {
    const data = await storeService.getBanners();
    setBanners(data);
  };

  const refreshPaymentAccounts = async () => {
    const data = await storeService.getPaymentAccounts();
    setPaymentAccounts(data);
  };

  const refreshSettings = async () => {
    const data = await storeService.getSettings();
    setSettings(data);
  };

  const updateSettings = async (newSettings: StoreSettings) => {
    await storeService.updateSettings(newSettings);
    setSettings(newSettings);
  };

  const refreshAll = async () => {
    setLoading(true);
    try {
      const [prods, cats, bans, accounts, sett] = await Promise.all([
        storeService.getProducts(),
        storeService.getCategories(),
        storeService.getBanners(),
        storeService.getPaymentAccounts(),
        storeService.getSettings(),
      ]);
      setProducts(prods);
      setCategories(cats);
      setBanners(bans);
      setPaymentAccounts(accounts);
      setSettings(sett);
    } catch (err) {
      console.error('Error loading store data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAll();
  }, []);

  // Cart operations
  const addToCart = (product: Product, quantity = 1, selectedVariant?: ProductVariant): boolean => {
    const effectiveStock = selectedVariant ? selectedVariant.stockQuantity : product.stockQuantity;
    
    if (effectiveStock <= 0) {
      addToast('error', 'Out of Stock', `Sorry, ${product.title} is currently out of stock.`);
      return false;
    }

    // Determine effective price: if sale price is valid and lower, use sale price
    const hasSale = typeof (selectedVariant?.salePrice ?? product.salePrice) === 'number' && 
      (selectedVariant?.salePrice ?? product.salePrice)! < (selectedVariant?.regularPrice ?? product.regularPrice);
    
    const activePrice = hasSale 
      ? (selectedVariant?.salePrice ?? product.salePrice)! 
      : (selectedVariant?.regularPrice ?? product.regularPrice);

    const cartItemId = selectedVariant ? `${product.id}_${selectedVariant.id}` : product.id;

    setCart((prev) => {
      const existing = prev.find((item) => item.id === cartItemId);
      if (existing) {
        const newQty = existing.quantity + quantity;
        if (newQty > effectiveStock) {
          addToast('info', 'Stock Limit Reached', `Maximum available quantity (${effectiveStock}) reached.`);
          return prev.map((item) => item.id === cartItemId ? { ...item, quantity: effectiveStock } : item);
        }
        addToast('success', 'Cart Updated', `Updated quantity for ${product.title}`);
        return prev.map((item) => item.id === cartItemId ? { ...item, quantity: newQty } : item);
      } else {
        const initialQty = Math.min(quantity, effectiveStock);
        addToast('success', 'Added to Cart', `${product.title} added to your bag.`);
        const newItem: CartItem = {
          id: cartItemId,
          productId: product.id,
          productTitle: product.title,
          productSlug: product.slug,
          image: selectedVariant?.image || product.images[0] || '',
          sku: selectedVariant?.sku || product.sku,
          selectedVariant,
          variantDescription: selectedVariant?.name,
          unitPrice: activePrice,
          salePrice: hasSale ? activePrice : undefined,
          quantity: initialQty,
          maxStock: effectiveStock,
          weightKg: product.weightKg || 1,
        };
        return [...prev, newItem];
      }
    });

    return true;
  };

  const removeFromCart = (cartItemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== cartItemId));
    addToast('info', 'Item Removed', 'Product removed from your shopping bag.');
  };

  const updateQuantity = (cartItemId: string, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(cartItemId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === cartItemId) {
          const finalQty = Math.min(newQty, item.maxStock);
          return { ...item, quantity: finalQty };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);

  const cartSubtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    [cart]
  );

  const cartTotalWeightKg = useMemo(
    () => Number(cart.reduce((sum, item) => sum + (item.weightKg * item.quantity), 0).toFixed(2)),
    [cart]
  );

  // WhatsApp generator
  const openWhatsApp = (params?: { 
    text?: string; 
    product?: Product; 
    variantName?: string; 
    orderNumber?: string 
  }) => {
    const rawNumber = settings.whatsapp || '03000000000';
    const cleanNumber = rawNumber.replace(/[^0-9]/g, '');
    const targetNumber = cleanNumber.startsWith('92') 
      ? cleanNumber 
      : cleanNumber.startsWith('0') 
        ? `92${cleanNumber.slice(1)}` 
        : cleanNumber || '923000000000';

    let message = params?.text || 'Assalam-o-Alaikum Crazy Sale! I am interested in purchasing items from your store.';

    if (params?.orderNumber) {
      message = `Assalam-o-Alaikum Crazy Sale! I have a question regarding my Order #${params.orderNumber}.`;
    } else if (params?.product) {
      const variantInfo = params.variantName ? ` (${params.variantName})` : '';
      message = `Assalam-o-Alaikum Crazy Sale! I am interested in ordering: "${params.product.title}"${variantInfo}, SKU: ${params.product.sku}. Please let me know the availability and payment details.`;
    }

    const url = `https://wa.me/${targetNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <StoreContext.Provider
      value={{
        products,
        categories,
        banners,
        paymentAccounts,
        settings,
        loading,
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartCount,
        cartSubtotal,
        cartTotalWeightKg,
        searchOpen,
        setSearchOpen,
        quickViewProduct,
        setQuickViewProduct,
        refreshAll,
        refreshProducts,
        refreshCategories,
        refreshBanners,
        refreshSettings,
        refreshPaymentAccounts,
        updateSettings,
        toasts,
        addToast,
        removeToast,
        openWhatsApp,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within a StoreProvider');
  return context;
};
