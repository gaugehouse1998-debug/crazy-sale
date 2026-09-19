import React, { useState, useEffect } from 'react';
import { 
  Shield, Package, ShoppingBag, CreditCard, Truck, Settings, 
  Plus, Edit2, Trash2, CheckCircle2, XCircle, AlertCircle, 
  ExternalLink, Search, RefreshCw, Eye, EyeOff, Image as ImageIcon, 
  Layers, ChevronRight, Lock, Check, Copy, ArrowLeft, Upload, 
  KeyRound, LogOut, CheckCircle 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { useRouter } from '../router/Router';
import { storeService } from '../services/storeService';
import { 
  Order, Product, Category, PaymentAccount, 
  StoreSettings, OrderStatus, PaymentStatus 
} from '../types';
import { updateSEO } from '../utils/seo';

export const AdminDashboardPage: React.FC = () => {
  const { 
    currentUser, isAdmin, adminLogin, 
    changeAdminPassword, sendAdminPasswordReset, 
    logout 
  } = useAuth();
  const { 
    settings, updateSettings, products, categories, 
    paymentAccounts, addToast, refreshProducts, 
    refreshPaymentAccounts 
  } = useStore();
  const { navigate } = useRouter();

  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'categories' | 'banks' | 'settings'>('orders');

  // Admin Login Form State (when !isAdmin)
  const [adminEmail, setAdminEmail] = useState('crazysale2026@gmail.com');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [adminLoggingIn, setAdminLoggingIn] = useState(false);
  const [adminAuthError, setAdminAuthError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  // Orders State
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [orderFilter, setOrderFilter] = useState<'all' | 'pending_verification' | 'verified' | 'rejected' | 'new' | 'shipped'>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [trackingNumberInput, setTrackingNumberInput] = useState('');
  const [carrierInput, setCarrierInput] = useState('');

  // Product Edit/Create State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isNewProduct, setIsNewProduct] = useState(false);
  const [productForm, setProductForm] = useState<Partial<Product>>({});
  const [uploadingProductImage, setUploadingProductImage] = useState(false);

  // Category Edit/Create State
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isNewCategory, setIsNewCategory] = useState(false);
  const [categoryForm, setCategoryForm] = useState<Partial<Category>>({});

  // Bank Account Edit/Create State
  const [editingBank, setEditingBank] = useState<PaymentAccount | null>(null);
  const [isNewBank, setIsNewBank] = useState(false);
  const [bankForm, setBankForm] = useState<Partial<PaymentAccount>>({});
  const [savingBank, setSavingBank] = useState(false);

  // Settings & Security State
  const [settingsTab, setSettingsTab] = useState<'shipping' | 'security'>('shipping');
  const [settingsForm, setSettingsForm] = useState<StoreSettings>({ ...settings });

  // Security / Password Change State
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    updateSEO({
      title: 'Admin Control Center - Crazy Sale',
      description: 'Administrative portal for managing crockery inventory, bank transfer slips, and nationwide shipping.',
    });

    if (isAdmin) {
      loadOrders();
    }
  }, [isAdmin]);

  const loadOrders = async () => {
    setLoadingOrders(true);
    try {
      const list = await storeService.getOrders();
      setOrders(list);
    } catch (err) {
      console.error('Failed to load orders in admin:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  // Handle Admin Login submission
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminAuthError(null);
    setAdminLoggingIn(true);
    try {
      let email = adminEmail.trim().toLowerCase();
      if (!email.includes('@')) {
        email = `${email}@gmail.com`;
      } else if (email.endsWith('@gmail') && !email.endsWith('@gmail.com')) {
        email = `${email}.com`;
      }
      await adminLogin(email, adminPassword);
      addToast('success', 'Admin Authenticated', 'Welcome back, Store Administrator.');
      loadOrders();
    } catch (err: any) {
      console.error('Admin login error:', err);
      setAdminAuthError(err?.message || 'Authentication failed. Please verify admin email and password.');
    } finally {
      setAdminLoggingIn(false);
    }
  };

  // Handle Password Reset Dispatch
  const handlePasswordReset = async () => {
    let email = adminEmail.trim().toLowerCase();
    if (!email.includes('@')) email = `${email}@gmail.com`;
    try {
      await sendAdminPasswordReset(email);
      setResetSent(true);
      addToast('info', 'Reset Email Sent', `Password reset instructions sent to ${email}`);
    } catch (err: any) {
      addToast('error', 'Reset Failed', err?.message || 'Failed to dispatch password reset email.');
    }
  };

  // Handle Password Change in Settings
  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPasswordInput.length < 6) {
      addToast('error', 'Weak Password', 'New password must contain at least 6 characters.');
      return;
    }
    if (newPasswordInput !== confirmPasswordInput) {
      addToast('error', 'Mismatch', 'New password and confirmation do not match.');
      return;
    }
    setChangingPassword(true);
    try {
      await changeAdminPassword(currentPasswordInput, newPasswordInput);
      addToast('success', 'Password Updated', 'Administrator password has been successfully changed.');
      setCurrentPasswordInput('');
      setNewPasswordInput('');
      setConfirmPasswordInput('');
    } catch (err: any) {
      addToast('error', 'Update Failed', err?.message || 'Failed to update administrator password.');
    } finally {
      setChangingPassword(false);
    }
  };

  // If not admin: Show Admin Login gate
  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 sm:py-24 space-y-6">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/80 shadow-md space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto text-amber-800 shadow-2xs">
              <Shield className="w-7 h-7" />
            </div>
            <h1 className="font-serif text-2xl font-bold text-stone-900">
              Admin Portal Access
            </h1>
            <p className="text-xs text-stone-500">
              Authorized access only for Crazy Sale catalog, inventory, and order dispatch management.
            </p>
          </div>

          {adminAuthError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{adminAuthError}</span>
            </div>
          )}

          {resetSent && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Password reset link sent to {adminEmail}. Check your inbox.</span>
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-stone-700 block mb-1">
                Admin Email Address
              </label>
              <input
                type="text"
                required
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="crazysale2026@gmail.com"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:border-stone-900"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-stone-700">
                  Admin Password
                </label>
                <button
                  type="button"
                  onClick={handlePasswordReset}
                  className="text-[11px] text-amber-700 hover:underline font-semibold"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showAdminPassword ? 'text' : 'password'}
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:border-stone-900 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowAdminPassword(!showAdminPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                >
                  {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={adminLoggingIn}
              className="w-full py-3 bg-stone-900 hover:bg-amber-700 text-white rounded-xl font-bold transition-colors shadow-2xs flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {adminLoggingIn ? (
                <span>Authenticating Admin...</span>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Sign In as Store Administrator</span>
                </>
              )}
            </button>
          </form>
        </div>

        <button
          onClick={() => navigate('/')}
          className="text-xs text-stone-500 hover:underline block mx-auto text-center"
        >
          Return to Customer Storefront
        </button>
      </div>
    );
  }

  // Filter Orders
  const filteredOrders = orders.filter((o) => {
    if (orderFilter === 'pending_verification') return o.paymentStatus === 'pending_verification';
    if (orderFilter === 'verified') return o.paymentStatus === 'verified';
    if (orderFilter === 'rejected') return o.paymentStatus === 'rejected';
    if (orderFilter === 'new') return o.orderStatus === 'new';
    if (orderFilter === 'shipped') return o.orderStatus === 'shipped';
    return true;
  });

  // Verify Payment
  const handleVerifyPayment = async (orderId: string, approved: boolean) => {
    try {
      const updated = await storeService.verifyPayment(
        orderId, 
        approved, 
        currentUser?.fullName || 'Admin', 
        approved ? undefined : rejectionReasonInput
      );
      if (updated) {
        setOrders(orders.map(o => o.id === orderId ? updated : o));
        setSelectedOrder(updated);
        addToast(
          approved ? 'success' : 'info', 
          approved ? 'Payment Verified' : 'Payment Marked Rejected', 
          approved ? 'Order status updated to confirmed.' : 'Customer notified to review receipt.'
        );
      }
    } catch (err: any) {
      addToast('error', 'Action Failed', err?.message || 'Could not verify payment.');
    }
  };

  // Update Order Status
  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const updated = await storeService.updateOrderStatus(orderId, newStatus, {
        trackingNumber: trackingNumberInput.trim() || undefined,
        carrier: carrierInput.trim() || undefined,
      });
      if (updated) {
        setOrders(orders.map(o => o.id === orderId ? updated : o));
        setSelectedOrder(updated);
        addToast('success', 'Status Updated', `Order is now marked as ${newStatus}.`);
      }
    } catch (err: any) {
      addToast('error', 'Error', err?.message || 'Failed to update order status.');
    }
  };

  // Product Save
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.title || !productForm.regularPrice) {
      addToast('error', 'Validation', 'Title and Regular Price are required.');
      return;
    }

    const prodToSave: Product = {
      id: productForm.id || `prod_${Date.now()}`,
      title: productForm.title,
      slug: productForm.slug || productForm.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      category: productForm.category || categories[0]?.name || 'Dinner Sets',
      brand: productForm.brand || 'Crazy Sale Luxury',
      sku: productForm.sku || `CS-${Math.floor(1000 + Math.random() * 9000)}`,
      description: productForm.description || '',
      images: productForm.images?.length ? productForm.images : ['https://images.unsplash.com/photo-1615865417491-9941019fbc00?w=800&q=80'],
      regularPrice: Number(productForm.regularPrice),
      salePrice: productForm.salePrice ? Number(productForm.salePrice) : undefined,
      stockQuantity: Number(productForm.stockQuantity || 10),
      unit: productForm.unit || 'Piece',
      weightKg: Number(productForm.weightKg || 1.0),
      isFeatured: !!productForm.isFeatured,
      isPublished: productForm.isPublished !== false,
      isSample: !!productForm.isSample,
      tags: productForm.tags || [],
      specifications: productForm.specifications || [],
      createdAt: productForm.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await storeService.saveProduct(prodToSave);
    await refreshProducts();
    setEditingProduct(null);
    setIsNewProduct(false);
    addToast('success', 'Product Saved', `${prodToSave.title} updated in inventory.`);
  };

  // Delete Product
  const handleDeleteProduct = async (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete "${title}"?`)) {
      await storeService.deleteProduct(id);
      await refreshProducts();
      addToast('info', 'Deleted', `Product removed.`);
    }
  };

  // Handle Product Image Upload via Firebase Storage
  const handleProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      addToast('error', 'File Too Large', 'Product images must be under 10MB.');
      return;
    }
    setUploadingProductImage(true);
    try {
      const url = await storeService.uploadProductImage(file, productForm.id || `prod_${Date.now()}`);
      const current = productForm.images || [];
      setProductForm({
        ...productForm,
        images: [...current, url],
      });
      addToast('success', 'Image Uploaded', 'Product photo uploaded to Firebase Storage.');
    } catch (err: any) {
      console.error('Image upload failed:', err);
      addToast('error', 'Upload Error', err?.message || 'Failed to upload product image to Storage.');
    } finally {
      setUploadingProductImage(false);
    }
  };

  // Bank Account CRUD Handlers
  const handleSaveBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankForm.bankName || !bankForm.accountTitle || !bankForm.accountNumber) {
      addToast('error', 'Validation', 'Bank Name, Account Title, and Account Number are required.');
      return;
    }
    setSavingBank(true);
    try {
      const accountToSave: PaymentAccount = {
        id: bankForm.id || `bank_${Date.now()}`,
        bankName: bankForm.bankName,
        accountTitle: bankForm.accountTitle,
        accountNumber: bankForm.accountNumber,
        iban: bankForm.iban || '',
        branchName: bankForm.branchName || '',
        branchCode: bankForm.branchCode || '',
        instructions: bankForm.instructions || 'Please upload the deposit slip or transaction screenshot after transferring funds.',
        isActive: bankForm.isActive !== false,
        isDefault: !!bankForm.isDefault,
        createdAt: bankForm.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await storeService.savePaymentAccount(accountToSave);
      await refreshPaymentAccounts();
      setEditingBank(null);
      setIsNewBank(false);
      addToast('success', 'Bank Account Saved', `${accountToSave.bankName} account details updated.`);
    } catch (err: any) {
      console.error('Bank save error:', err);
      addToast('error', 'Save Failed', err?.message || 'Could not save payment account.');
    } finally {
      setSavingBank(false);
    }
  };

  const handleDeleteBank = async (id: string, bankName: string) => {
    if (confirm(`Are you sure you want to delete bank account "${bankName}"?`)) {
      try {
        await storeService.deletePaymentAccount(id);
        await refreshPaymentAccounts();
        addToast('info', 'Bank Account Removed', `${bankName} has been deleted.`);
      } catch (err: any) {
        addToast('error', 'Delete Failed', err?.message || 'Failed to delete bank account.');
      }
    }
  };

  const handleToggleBankActive = async (bank: PaymentAccount) => {
    try {
      await storeService.savePaymentAccount({
        ...bank,
        isActive: !bank.isActive,
      });
      await refreshPaymentAccounts();
      addToast('success', 'Status Updated', `${bank.bankName} is now ${!bank.isActive ? 'Active' : 'Inactive'}.`);
    } catch (err: any) {
      addToast('error', 'Update Failed', err?.message || 'Could not update status.');
    }
  };

  const handleSetDefaultBank = async (bank: PaymentAccount) => {
    try {
      await storeService.savePaymentAccount({
        ...bank,
        isDefault: true,
        isActive: true,
      });
      await refreshPaymentAccounts();
      addToast('success', 'Default Set', `${bank.bankName} is now the primary bank account for customer checkout.`);
    } catch (err: any) {
      addToast('error', 'Update Failed', err?.message || 'Could not set default.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Top Header */}
      <div className="bg-[#1C1917] text-white rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-serif text-2xl font-bold tracking-wider uppercase">
              Crazy<span className="text-amber-500">Sale</span>
            </span>
            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold uppercase tracking-wider border border-amber-500/30">
              Admin Portal
            </span>
          </div>
          <p className="text-xs text-stone-400 mt-1">
            Logged in as {currentUser?.fullName} ({currentUser?.email})
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Customer Storefront</span>
          </button>

          <button
            onClick={async () => {
              await logout();
              addToast('info', 'Logged Out', 'Signed out from admin console.');
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-800/40 text-rose-200 text-xs font-semibold transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
            activeTab === 'orders'
              ? 'bg-stone-900 text-white'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Orders & Slips ({orders.length})</span>
          {orders.some(o => o.paymentStatus === 'pending_verification') && (
            <span className="w-2 h-2 rounded-full bg-amber-400" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('products')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
            activeTab === 'products'
              ? 'bg-stone-900 text-white'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Products & Stock ({products.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
            activeTab === 'categories'
              ? 'bg-stone-900 text-white'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Categories ({categories.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('banks')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
            activeTab === 'banks'
              ? 'bg-stone-900 text-white'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Bank Accounts ({paymentAccounts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
            activeTab === 'settings'
              ? 'bg-stone-900 text-white'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Shipping & Store Rates</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ORDERS & PAYMENT VERIFICATION */}
      {/* ========================================================================= */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          {/* Quick Filters */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setOrderFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium ${
                  orderFilter === 'all' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-700'
                }`}
              >
                All Orders ({orders.length})
              </button>
              <button
                onClick={() => setOrderFilter('pending_verification')}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium ${
                  orderFilter === 'pending_verification' ? 'bg-amber-800 text-white' : 'bg-amber-50 text-amber-900 border border-amber-200'
                }`}
              >
                Needs Slip Verification ({orders.filter(o => o.paymentStatus === 'pending_verification').length})
              </button>
              <button
                onClick={() => setOrderFilter('verified')}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium ${
                  orderFilter === 'verified' ? 'bg-emerald-800 text-white' : 'bg-stone-100 text-stone-700'
                }`}
              >
                Verified ({orders.filter(o => o.paymentStatus === 'verified').length})
              </button>
              <button
                onClick={() => setOrderFilter('new')}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium ${
                  orderFilter === 'new' ? 'bg-blue-800 text-white' : 'bg-stone-100 text-stone-700'
                }`}
              >
                New ({orders.filter(o => o.orderStatus === 'new').length})
              </button>
            </div>

            <button
              onClick={loadOrders}
              className="flex items-center gap-1 text-xs text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 px-3 py-1.5 rounded-xl font-medium transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Orders</span>
            </button>
          </div>

          {/* Orders Table */}
          {loadingOrders ? (
            <div className="text-center py-12 text-xs text-stone-400">Loading orders...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center text-xs text-stone-500 border border-stone-200">
              No orders found in this filter category.
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-stone-200/80 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-stone-700">
                  <thead className="bg-stone-50 text-stone-500 font-semibold border-b border-stone-200">
                    <tr>
                      <th className="py-3 px-4">Order #</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">City</th>
                      <th className="py-3 px-4">Total</th>
                      <th className="py-3 px-4">Payment</th>
                      <th className="py-3 px-4">Verification</th>
                      <th className="py-3 px-4">Order Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredOrders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-stone-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-stone-950">
                          {ord.orderNumber}
                        </td>
                        <td className="py-3.5 px-4 text-stone-500 whitespace-nowrap">
                          {new Date(ord.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="font-semibold text-stone-900">{ord.customer.fullName}</p>
                          <p className="text-[10px] text-stone-400 font-mono">{ord.customer.phone}</p>
                        </td>
                        <td className="py-3.5 px-4 text-stone-600">{ord.customer.city}</td>
                        <td className="py-3.5 px-4 font-bold text-stone-950">
                          {settings.currencySymbol} {ord.total.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="capitalize text-[11px] font-medium text-stone-600">
                            {ord.paymentMethod === 'advance_bank_transfer' ? 'IBFT Bank' : 'COD'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {ord.paymentStatus === 'verified' ? (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold">
                              Verified
                            </span>
                          ) : ord.paymentStatus === 'pending_verification' ? (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-900 rounded text-[10px] font-bold animate-pulse">
                              Pending Slip Review
                            </span>
                          ) : ord.paymentStatus === 'rejected' ? (
                            <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded text-[10px] font-bold">
                              Rejected
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-stone-100 text-stone-600 rounded text-[10px]">
                              Awaiting Transfer
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="capitalize px-2 py-0.5 bg-stone-100 text-stone-800 rounded text-[10px] font-medium">
                            {ord.orderStatus.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedOrder(ord);
                              setTrackingNumberInput(ord.trackingNumber || '');
                              setCarrierInput(ord.carrier || '');
                              setRejectionReasonInput('');
                            }}
                            className="px-3 py-1.5 bg-stone-900 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs"
                          >
                            Inspect & Action
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ORDER INSPECTION DRAWER / MODAL */}
          {selectedOrder && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl animate-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                  <div>
                    <h3 className="font-serif text-xl font-bold text-stone-950">
                      Order #{selectedOrder.orderNumber}
                    </h3>
                    <p className="text-xs text-stone-500">
                      Customer: {selectedOrder.customer.fullName} • Phone: {selectedOrder.customer.phone}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="p-1.5 text-stone-400 hover:text-stone-900 rounded-lg hover:bg-stone-100"
                  >
                    ✕
                  </button>
                </div>

                {/* Recipient Address & Notes */}
                <div className="bg-stone-50 p-4 rounded-2xl text-xs space-y-1 text-stone-700">
                  <p><span className="font-semibold text-stone-900">Address:</span> {selectedOrder.customer.address}, {selectedOrder.customer.city}</p>
                  <p><span className="font-semibold text-stone-900">Email:</span> {selectedOrder.customer.email}</p>
                  {selectedOrder.customer.notes && (
                    <p><span className="font-semibold text-stone-900">Delivery Notes:</span> {selectedOrder.customer.notes}</p>
                  )}
                  <p><span className="font-semibold text-stone-900">Method:</span> {selectedOrder.deliveryServiceName} ({selectedOrder.totalWeightKg} KG)</p>
                </div>

                {/* PAYMENT PROOF SLIP INSPECTION (Crucial Requirement) */}
                <div className="p-5 rounded-2xl bg-amber-50/50 border border-amber-200/80 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center justify-between">
                    <span>Payment Verification Details</span>
                    <span className="font-mono text-stone-900 font-bold">
                      Order Total: {settings.currencySymbol} {selectedOrder.total.toLocaleString()}
                    </span>
                  </h4>

                  <div className="text-xs space-y-1">
                    <p><span className="font-semibold">Transaction ID (TID):</span> {selectedOrder.transactionId || 'None provided yet'}</p>
                    <p><span className="font-semibold">Paid Amount Recorded:</span> {selectedOrder.paidAmount ? `PKR ${selectedOrder.paidAmount.toLocaleString()}` : 'Pending'}</p>
                    {selectedOrder.paymentNotes && <p><span className="font-semibold">Customer Note:</span> {selectedOrder.paymentNotes}</p>}
                  </div>

                  {/* Uploaded Receipt Image Preview */}
                  {selectedOrder.paymentProofUrl ? (
                    <div className="space-y-2 pt-2">
                      <span className="text-[11px] font-semibold text-stone-700 block">Uploaded Receipt Slip:</span>
                      <div className="relative group max-w-sm rounded-xl overflow-hidden border border-stone-300 bg-black/5">
                        <img
                          src={selectedOrder.paymentProofUrl}
                          alt="Bank Slip"
                          className="w-full max-h-56 object-contain"
                        />
                        <a
                          href={selectedOrder.paymentProofUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="absolute bottom-2 right-2 bg-stone-900/80 text-white text-[10px] px-2 py-1 rounded-md font-bold flex items-center gap-1 hover:bg-stone-900"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Zoom Full Slip</span>
                        </a>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-rose-700 italic pt-1">
                      No deposit screenshot slip uploaded yet by customer.
                    </p>
                  )}

                  {/* Verification Actions */}
                  <div className="pt-3 border-t border-amber-200 flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => handleVerifyPayment(selectedOrder.id, true)}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Approve & Verify Payment</span>
                    </button>

                    <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                      <input
                        type="text"
                        value={rejectionReasonInput}
                        onChange={(e) => setRejectionReasonInput(e.target.value)}
                        placeholder="Rejection reason if rejecting..."
                        className="flex-1 px-3 py-1.5 bg-white border border-stone-200 rounded-xl text-xs outline-none"
                      />
                      <button
                        onClick={() => handleVerifyPayment(selectedOrder.id, false)}
                        className="px-3 py-1.5 bg-rose-700 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>

                {/* Items in Order */}
                <div className="space-y-2 text-xs">
                  <h4 className="font-bold text-stone-900">Items Ordered ({selectedOrder.items.length}):</h4>
                  <div className="divide-y divide-stone-100 max-h-40 overflow-y-auto">
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="py-2 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <img src={item.image} alt="" className="w-8 h-8 rounded object-cover bg-stone-100" />
                          <div>
                            <p className="font-semibold text-stone-900">{item.productTitle}</p>
                            <p className="text-stone-400 text-[10px]">{item.quantity} x PKR {item.price.toLocaleString()}</p>
                          </div>
                        </div>
                        <span className="font-bold text-stone-900">PKR {item.lineSubtotal.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Dispatch & Order Status Update */}
                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3 text-xs">
                  <h4 className="font-bold text-stone-900">Update Order Status & Courier Details</h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-stone-600 block mb-1">Carrier Name</label>
                      <input
                        type="text"
                        value={carrierInput}
                        onChange={(e) => setCarrierInput(e.target.value)}
                        placeholder="e.g. TCS / Trax / Al-Madina Cargo"
                        className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-xl outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-stone-600 block mb-1">Tracking Number / Cargo Bilty #</label>
                      <input
                        type="text"
                        value={trackingNumberInput}
                        onChange={(e) => setTrackingNumberInput(e.target.value)}
                        placeholder="e.g. 774819028"
                        className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-xl outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {(['processing', 'shipped', 'completed', 'cancelled'] as OrderStatus[]).map((st) => (
                      <button
                        key={st}
                        onClick={() => handleUpdateOrderStatus(selectedOrder.id, st)}
                        className={`px-3 py-1.5 rounded-xl font-bold uppercase text-[10px] transition-colors ${
                          selectedOrder.orderStatus === st
                            ? 'bg-stone-900 text-white'
                            : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
                        }`}
                      >
                        Set: {st}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PRODUCTS & INVENTORY */}
      {/* ========================================================================= */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setProductForm({
                    category: categories[0]?.name || 'Dinner Sets',
                    stockQuantity: 15,
                    weightKg: 2.0,
                    regularPrice: 4500,
                    isPublished: true,
                  });
                  setIsNewProduct(true);
                  setEditingProduct({} as Product);
                }}
                className="flex items-center gap-2 bg-stone-900 hover:bg-amber-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-colors shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Crockery Product</span>
              </button>
            </div>

            <span className="text-xs text-stone-500 font-medium">
              Total Products in Inventory: {products.length}
            </span>
          </div>

          {/* Products List Grid */}
          <div className="bg-white rounded-3xl border border-stone-200/80 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-stone-700">
                <thead className="bg-stone-50 text-stone-500 font-semibold border-b border-stone-200">
                  <tr>
                    <th className="py-3 px-4">Item</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">SKU</th>
                    <th className="py-3 px-4">Price</th>
                    <th className="py-3 px-4">Weight</th>
                    <th className="py-3 px-4">Stock</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {products.map((prod) => (
                    <tr key={prod.id} className="hover:bg-stone-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={prod.images[0]}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover bg-stone-100 shrink-0"
                          />
                          <div>
                            <p className="font-bold text-stone-900 truncate max-w-xs">{prod.title}</p>
                            {prod.isFeatured && (
                              <span className="text-[10px] text-amber-700 font-semibold">Featured</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-stone-600">{prod.category}</td>
                      <td className="py-3 px-4 font-mono text-[11px] text-stone-500">{prod.sku}</td>
                      <td className="py-3 px-4 font-bold text-stone-950">
                        {prod.salePrice ? (
                          <div>
                            <span>PKR {prod.salePrice.toLocaleString()}</span>
                            <span className="text-[10px] text-stone-400 line-through block">
                              PKR {prod.regularPrice.toLocaleString()}
                            </span>
                          </div>
                        ) : (
                          <span>PKR {prod.regularPrice.toLocaleString()}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-semibold text-stone-700">{prod.weightKg} KG</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          prod.stockQuantity > 5 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : prod.stockQuantity > 0 
                            ? 'bg-amber-100 text-amber-900' 
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {prod.stockQuantity} in stock
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-1">
                        <button
                          onClick={() => {
                            setProductForm({ ...prod });
                            setIsNewProduct(false);
                            setEditingProduct(prod);
                          }}
                          className="p-1.5 text-stone-500 hover:text-stone-900 rounded-lg hover:bg-stone-100"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(prod.id, prod.title)}
                          className="p-1.5 text-rose-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Product Create/Edit Modal */}
          {editingProduct && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
              <form onSubmit={handleSaveProduct} className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-5 shadow-2xl">
                <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                  <h3 className="font-serif text-xl font-bold text-stone-950">
                    {isNewProduct ? 'Add New Product' : `Edit: ${productForm.title}`}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setEditingProduct(null)}
                    className="text-stone-400 hover:text-stone-900"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="sm:col-span-2">
                    <label className="font-semibold block mb-1">Product Title</label>
                    <input
                      type="text"
                      required
                      value={productForm.title || ''}
                      onChange={(e) => setProductForm({ ...productForm, title: e.target.value })}
                      placeholder="e.g. Royal Bone China 72-Piece Dinner Set"
                      className="w-full px-3.5 py-2 border border-stone-200 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">Category</label>
                    <select
                      value={productForm.category || categories[0]?.name}
                      onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                      className="w-full px-3.5 py-2 border border-stone-200 rounded-xl"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">SKU Code</label>
                    <input
                      type="text"
                      value={productForm.sku || ''}
                      onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                      placeholder="CS-DS-01"
                      className="w-full px-3.5 py-2 border border-stone-200 rounded-xl font-mono"
                    />
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">Regular Price (PKR)</label>
                    <input
                      type="number"
                      required
                      value={productForm.regularPrice || ''}
                      onChange={(e) => setProductForm({ ...productForm, regularPrice: Number(e.target.value) })}
                      className="w-full px-3.5 py-2 border border-stone-200 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">Sale Price (PKR - Optional)</label>
                    <input
                      type="number"
                      value={productForm.salePrice || ''}
                      onChange={(e) => setProductForm({ ...productForm, salePrice: e.target.value ? Number(e.target.value) : undefined })}
                      placeholder="Leave blank if no sale"
                      className="w-full px-3.5 py-2 border border-stone-200 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">Weight in KG (Used for TCS / Cargo)</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={productForm.weightKg || 1.0}
                      onChange={(e) => setProductForm({ ...productForm, weightKg: Number(e.target.value) })}
                      className="w-full px-3.5 py-2 border border-stone-200 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">Stock Quantity</label>
                    <input
                      type="number"
                      required
                      value={productForm.stockQuantity || 10}
                      onChange={(e) => setProductForm({ ...productForm, stockQuantity: Number(e.target.value) })}
                      className="w-full px-3.5 py-2 border border-stone-200 rounded-xl"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-3 p-4 rounded-2xl bg-stone-50 border border-stone-200">
                    <div className="flex items-center justify-between">
                      <label className="font-semibold block text-stone-800">
                        Product Gallery Images
                      </label>
                      <span className="text-[10px] text-stone-400">
                        Upload to Firebase Storage or enter image URL
                      </span>
                    </div>

                    {/* Image preview grid */}
                    {productForm.images && productForm.images.length > 0 && (
                      <div className="flex flex-wrap gap-2.5">
                        {productForm.images.map((imgUrl, idx) => (
                          <div key={idx} className="relative group w-18 h-18 rounded-xl overflow-hidden border border-stone-200 bg-white">
                            <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                            {idx === 0 && (
                              <span className="absolute top-1 left-1 bg-amber-700 text-white text-[9px] px-1 rounded font-bold">
                                Cover
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                const updated = productForm.images?.filter((_, i) => i !== idx);
                                setProductForm({ ...productForm, images: updated });
                              }}
                              className="absolute top-1 right-1 bg-rose-600 text-white w-4 h-4 rounded-full flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Remove"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      {/* Storage file upload */}
                      <label className="w-full sm:w-auto px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center justify-center gap-2 transition-colors">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{uploadingProductImage ? 'Uploading...' : 'Upload Image File'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          disabled={uploadingProductImage}
                          onChange={handleProductImageUpload}
                          className="hidden"
                        />
                      </label>

                      <div className="flex items-center gap-2 flex-1 w-full">
                        <input
                          type="url"
                          id="manual-image-url-input"
                          placeholder="Or paste external image URL..."
                          className="flex-1 px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs outline-none"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const input = e.currentTarget;
                              if (input.value.trim()) {
                                const current = productForm.images || [];
                                setProductForm({ ...productForm, images: [...current, input.value.trim()] });
                                input.value = '';
                              }
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const input = document.getElementById('manual-image-url-input') as HTMLInputElement;
                            if (input && input.value.trim()) {
                              const current = productForm.images || [];
                              setProductForm({ ...productForm, images: [...current, input.value.trim()] });
                              input.value = '';
                            }
                          }}
                          className="px-3 py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-xl text-xs font-semibold"
                        >
                          Add URL
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="font-semibold block mb-1">Description</label>
                    <textarea
                      rows={3}
                      value={productForm.description || ''}
                      onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                      placeholder="Describe material, piece counts, dishwasher guidelines..."
                      className="w-full px-3.5 py-2 border border-stone-200 rounded-xl"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setEditingProduct(null)}
                    className="px-4 py-2 border border-stone-200 rounded-xl text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-stone-900 text-white rounded-xl text-xs font-bold hover:bg-amber-700"
                  >
                    Save Product
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: CATEGORIES */}
      {/* ========================================================================= */}
      {activeTab === 'categories' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-lg font-bold text-stone-900">
              Manage Product Categories ({categories.length})
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="bg-white rounded-2xl border border-stone-200 p-4 space-y-3 flex flex-col justify-between"
              >
                <div>
                  <img
                    src={cat.image}
                    alt=""
                    className="w-full h-28 rounded-xl object-cover bg-stone-100 mb-2"
                  />
                  <h4 className="font-bold text-stone-900 text-sm">{cat.name}</h4>
                  <p className="text-[11px] text-stone-500 font-mono">/category/{cat.slug}</p>
                  <p className="text-[11px] text-stone-600 line-clamp-2 mt-1">{cat.description}</p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-[11px]">
                  <span className="text-emerald-700 font-semibold">Active</span>
                  <span className="text-stone-400">Order: {cat.displayOrder}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* TAB 4: BANK ACCOUNTS */}
      {/* ========================================================================= */}
      {activeTab === 'banks' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-serif text-lg font-bold text-stone-900">
                Official Bank Transfer & RAAST Accounts
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Manage accounts presented to customers during checkout and on billing slips for advance payments.
              </p>
            </div>

            <button
              onClick={() => {
                setBankForm({
                  bankName: '',
                  accountTitle: '',
                  accountNumber: '',
                  iban: '',
                  branchName: '',
                  branchCode: '',
                  instructions: 'Send advance IBFT or RAAST transfer and upload receipt screenshot.',
                  isActive: true,
                  isDefault: paymentAccounts.length === 0,
                });
                setIsNewBank(true);
                setEditingBank({} as PaymentAccount);
              }}
              className="flex items-center gap-2 bg-stone-900 hover:bg-amber-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Payment Account</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {paymentAccounts.map((bank) => (
              <div
                key={bank.id}
                className={`bg-white rounded-3xl p-6 border shadow-xs space-y-4 flex flex-col justify-between transition-all ${
                  bank.isActive ? 'border-stone-200' : 'border-stone-200/50 bg-stone-50/50 opacity-70'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-bold text-stone-950 text-base flex items-center gap-2">
                        {bank.bankName}
                        {!bank.isActive && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-semibold">
                            Inactive
                          </span>
                        )}
                      </span>
                      <span className="text-xs text-stone-500 font-medium block mt-0.5">
                        {bank.accountTitle}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {bank.isDefault ? (
                        <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 border border-amber-300 rounded-md text-[10px] font-bold">
                          Default
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSetDefaultBank(bank)}
                          className="px-2 py-0.5 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded text-[10px] font-semibold transition-colors"
                        >
                          Make Default
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="text-xs space-y-1.5 text-stone-700 bg-stone-50/80 p-3.5 rounded-2xl border border-stone-100">
                    <p>
                      <span className="text-stone-400 font-medium">Account #:</span>{' '}
                      <span className="font-mono font-bold text-stone-900">{bank.accountNumber}</span>
                    </p>
                    {bank.iban && (
                      <p>
                        <span className="text-stone-400 font-medium">IBAN:</span>{' '}
                        <span className="font-mono text-[11px] text-stone-800">{bank.iban}</span>
                      </p>
                    )}
                    {(bank.branchName || bank.branchCode) && (
                      <p>
                        <span className="text-stone-400 font-medium">Branch:</span>{' '}
                        <span>{bank.branchName} {bank.branchCode ? `(${bank.branchCode})` : ''}</span>
                      </p>
                    )}
                    {bank.instructions && (
                      <p className="text-[11px] text-stone-500 italic pt-1 border-t border-stone-200/60 mt-2">
                        {bank.instructions}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-stone-100 text-xs">
                  <button
                    onClick={() => handleToggleBankActive(bank)}
                    className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] transition-colors ${
                      bank.isActive
                        ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                        : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
                    }`}
                  >
                    {bank.isActive ? 'Active for Checkout' : 'Hidden from Checkout'}
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setBankForm({ ...bank });
                        setIsNewBank(false);
                        setEditingBank(bank);
                      }}
                      className="p-1.5 text-stone-500 hover:text-stone-900 rounded-lg hover:bg-stone-100"
                      title="Edit Bank Details"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteBank(bank.id, bank.bankName)}
                      className="p-1.5 text-rose-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                      title="Delete Bank Account"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Bank Create/Edit Modal */}
          {editingBank && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
              <form onSubmit={handleSaveBank} className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl">
                <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                  <h3 className="font-serif text-xl font-bold text-stone-950">
                    {isNewBank ? 'Add Bank / RAAST Account' : `Edit: ${bankForm.bankName}`}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setEditingBank(null)}
                    className="text-stone-400 hover:text-stone-900"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="sm:col-span-2">
                    <label className="font-semibold block mb-1">
                      Bank Name or Payment Service <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={bankForm.bankName || ''}
                      onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                      placeholder="e.g. Meezan Bank / Bank Alfalah / RAAST ID"
                      className="w-full px-3.5 py-2.5 border border-stone-200 rounded-xl"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="font-semibold block mb-1">
                      Account Title <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={bankForm.accountTitle || ''}
                      onChange={(e) => setBankForm({ ...bankForm, accountTitle: e.target.value })}
                      placeholder="e.g. Crazy Sale Crockery & Luxury Decor"
                      className="w-full px-3.5 py-2.5 border border-stone-200 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">
                      Account Number / RAAST <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={bankForm.accountNumber || ''}
                      onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                      placeholder="010203040506"
                      className="w-full px-3.5 py-2.5 border border-stone-200 rounded-xl font-mono"
                    />
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">IBAN (24 Characters)</label>
                    <input
                      type="text"
                      value={bankForm.iban || ''}
                      onChange={(e) => setBankForm({ ...bankForm, iban: e.target.value })}
                      placeholder="PK36MEZN00010203040506"
                      className="w-full px-3.5 py-2.5 border border-stone-200 rounded-xl font-mono text-xs uppercase"
                    />
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">Branch Name</label>
                    <input
                      type="text"
                      value={bankForm.branchName || ''}
                      onChange={(e) => setBankForm({ ...bankForm, branchName: e.target.value })}
                      placeholder="e.g. F-7 Markaz Islamabad"
                      className="w-full px-3.5 py-2.5 border border-stone-200 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">Branch Code</label>
                    <input
                      type="text"
                      value={bankForm.branchCode || ''}
                      onChange={(e) => setBankForm({ ...bankForm, branchCode: e.target.value })}
                      placeholder="0102"
                      className="w-full px-3.5 py-2.5 border border-stone-200 rounded-xl font-mono"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="font-semibold block mb-1">Transfer Instructions for Buyer</label>
                    <textarea
                      rows={2}
                      value={bankForm.instructions || ''}
                      onChange={(e) => setBankForm({ ...bankForm, instructions: e.target.value })}
                      placeholder="Please add order # in transfer remarks and attach transaction receipt screenshot."
                      className="w-full px-3.5 py-2.5 border border-stone-200 rounded-xl"
                    />
                  </div>

                  <div className="sm:col-span-2 flex items-center gap-6 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={bankForm.isActive !== false}
                        onChange={(e) => setBankForm({ ...bankForm, isActive: e.target.checked })}
                        className="rounded text-amber-700 focus:ring-amber-500 w-4 h-4"
                      />
                      <span className="font-semibold text-stone-800">Active for Checkout</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!bankForm.isDefault}
                        onChange={(e) => setBankForm({ ...bankForm, isDefault: e.target.checked })}
                        className="rounded text-amber-700 focus:ring-amber-500 w-4 h-4"
                      />
                      <span className="font-semibold text-stone-800">Set as Default Account</span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setEditingBank(null)}
                    className="px-4 py-2 border border-stone-200 rounded-xl text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingBank}
                    className="px-6 py-2 bg-stone-900 text-white rounded-xl text-xs font-bold hover:bg-amber-700 transition-colors disabled:opacity-50"
                  >
                    {savingBank ? 'Saving...' : 'Save Payment Account'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: SHIPPING RATES & STORE SETTINGS */}
      {/* ========================================================================= */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs space-y-6 max-w-3xl">
          {/* Sub Navigation */}
          <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
            <button
              onClick={() => setSettingsTab('shipping')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                settingsTab === 'shipping'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              Shipping & Concierge Settings
            </button>
            <button
              onClick={() => setSettingsTab('security')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                settingsTab === 'security'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Admin Security & Password</span>
            </button>
          </div>

          {settingsTab === 'shipping' ? (
            <div className="space-y-4 text-xs">
              {/* Door to Door Courier */}
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
                <h4 className="font-bold text-stone-900">Door-to-Door Courier Service (TCS / Trax)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold block mb-1">Service Display Name</label>
                    <input
                      type="text"
                      value={settingsForm.doorToDoor?.serviceName || ''}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          doorToDoor: { ...settingsForm.doorToDoor!, serviceName: e.target.value },
                        })
                      }
                      className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">Rate per KG (PKR)</label>
                    <input
                      type="number"
                      value={settingsForm.doorToDoor?.ratePerKg || 250}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          doorToDoor: { ...settingsForm.doorToDoor!, ratePerKg: Number(e.target.value) },
                        })
                      }
                      className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-xl"
                    />
                  </div>
                </div>
              </div>

              {/* Heavy Goods Cargo */}
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
                <h4 className="font-bold text-stone-900">Heavy Goods Cargo (Bilty / Goods Transport)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold block mb-1">Cargo Service Name</label>
                    <input
                      type="text"
                      value={settingsForm.localCargo?.serviceName || ''}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          localCargo: { ...settingsForm.localCargo!, serviceName: e.target.value },
                        })
                      }
                      className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">Cargo Rate per KG (PKR)</label>
                    <input
                      type="number"
                      value={settingsForm.localCargo?.ratePerKg || 120}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          localCargo: { ...settingsForm.localCargo!, ratePerKg: Number(e.target.value) },
                        })
                      }
                      className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-xl"
                    />
                  </div>
                </div>
              </div>

              {/* General Contact Info */}
              <div className="space-y-3 pt-2">
                <h4 className="font-bold text-stone-900">Store Contact Numbers & WhatsApp</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold block mb-1">WhatsApp Concierge Number</label>
                    <input
                      type="text"
                      value={settingsForm.whatsapp}
                      onChange={(e) => setSettingsForm({ ...settingsForm, whatsapp: e.target.value })}
                      className="w-full px-3 py-1.5 border border-stone-200 rounded-xl font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">Support Phone</label>
                    <input
                      type="text"
                      value={settingsForm.phone}
                      onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                      className="w-full px-3 py-1.5 border border-stone-200 rounded-xl font-mono"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="font-semibold block mb-1">Store Address</label>
                    <input
                      type="text"
                      value={settingsForm.address}
                      onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
                      className="w-full px-3 py-1.5 border border-stone-200 rounded-xl"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={async () => {
                  await updateSettings(settingsForm);
                  addToast('success', 'Saved', 'Store shipping rates and settings updated.');
                }}
                className="px-6 py-2.5 bg-stone-900 hover:bg-amber-700 text-white rounded-xl font-bold transition-colors shadow-sm"
              >
                Save Shipping & Store Settings
              </button>
            </div>
          ) : (
            <div className="space-y-6 text-xs">
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1">
                <p className="font-bold text-sm">Store Administrator Credentials</p>
                <p className="text-[11px] text-amber-800">
                  Password changes are committed directly to Firebase Authentication. Store passwords are never saved in public repositories.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
                <span className="text-stone-400 font-semibold block text-[11px]">Primary Admin Email</span>
                <p className="font-mono text-stone-900 font-bold text-sm">
                  {currentUser?.email || 'crazysale2026@gmail.com'}
                </p>
              </div>

              <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
                <div>
                  <label className="font-semibold block text-stone-700 mb-1">Current Password</label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      required
                      value={currentPasswordInput}
                      onChange={(e) => setCurrentPasswordInput(e.target.value)}
                      placeholder="Enter current password"
                      className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl outline-none pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="font-semibold block text-stone-700 mb-1">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={newPasswordInput}
                      onChange={(e) => setNewPasswordInput(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl outline-none pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="font-semibold block text-stone-700 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    value={confirmPasswordInput}
                    onChange={(e) => setConfirmPasswordInput(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl outline-none"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={changingPassword}
                    className="px-6 py-2.5 bg-stone-900 hover:bg-amber-700 text-white rounded-xl font-bold transition-colors shadow-sm disabled:opacity-50"
                  >
                    {changingPassword ? 'Updating Password...' : 'Update Administrator Password'}
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      const email = currentUser?.email || 'crazysale2026@gmail.com';
                      try {
                        await sendAdminPasswordReset(email);
                        addToast('info', 'Reset Sent', `Reset link dispatched to ${email}`);
                      } catch (err: any) {
                        addToast('error', 'Error', err?.message || 'Could not send reset email.');
                      }
                    }}
                    className="text-xs text-amber-700 hover:underline font-semibold"
                  >
                    Send Password Reset Email Instead
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
