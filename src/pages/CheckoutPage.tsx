import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Truck, CreditCard, Building, Copy, Check, 
  Upload, ArrowLeft, ArrowRight, AlertCircle, ShoppingBag, 
  Scale, FileText, CheckCircle2, Info, Lock, User, LogIn, UserPlus 
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useAuth } from '../context/AuthContext';
import { useRouter } from '../router/Router';
import { storeService, generateOrderNumber } from '../services/storeService';
import { 
  DeliveryMethodType, PaymentMethodType, Order, OrderItem, 
  PaymentAccount, CustomerInfo 
} from '../types';
import { updateSEO } from '../utils/seo';

const PAKISTAN_CITIES = [
  'Karachi',
  'Lahore',
  'Islamabad',
  'Rawalpindi',
  'Faisalabad',
  'Multan',
  'Peshawar',
  'Quetta',
  'Gujranwala',
  'Sialkot',
  'Hyderabad',
  'Abbottabad',
  'Bahawalpur',
  'Sargodha',
  'Sukkur',
  'Gujrat',
  'Mardan',
  'Sheikhupura',
  'Jhelum',
  'Other / Azad Kashmir / Gilgit',
];

export const CheckoutPage: React.FC = () => {
  const { 
    cart, clearCart, cartSubtotal, cartTotalWeightKg, 
    settings, paymentAccounts, addToast 
  } = useStore();
  const { currentUser, login, register, updateProfile } = useAuth();
  const { navigate } = useRouter();

  useEffect(() => {
    updateSEO({
      title: 'Secure Checkout',
      description: 'Complete your luxury crockery and home decor order with safe bank transfer and nationwide insured delivery.',
    });
  }, []);

  // Customer Details Form State
  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [address, setAddress] = useState(currentUser?.address || '');
  const [city, setCity] = useState(currentUser?.city || 'Karachi');
  const [notes, setNotes] = useState('');

  // Synchronize customer profile values when user logs in or registers
  useEffect(() => {
    if (currentUser) {
      if (currentUser.fullName) setFullName(currentUser.fullName);
      if (currentUser.phone) setPhone(currentUser.phone);
      if (currentUser.email) setEmail(currentUser.email);
      if (currentUser.address) setAddress(currentUser.address);
      if (currentUser.city) setCity(currentUser.city);
    }
  }, [currentUser]);

  // Inline Auth State for unauthenticated shoppers
  const [authMode, setAuthMode] = useState<'signin' | 'register'>('signin');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authFullName, setAuthFullName] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authCity, setAuthCity] = useState('Karachi');
  const [authAddress, setAuthAddress] = useState('');
  const [authSubmitting, setAuthSubmitting] = useState(false);

  // Delivery Method State
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethodType>('door_to_door');

  // Payment Method State
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('advance_bank_transfer');
  
  // Default selected bank account (from active bank accounts only)
  const activeBanks = paymentAccounts.filter((b) => b.isActive);
  const defaultBank = activeBanks.find((b) => b.isDefault) || activeBanks[0];
  const [selectedBank, setSelectedBank] = useState<PaymentAccount | undefined>(defaultBank);

  // Keep selectedBank updated when payment accounts load
  useEffect(() => {
    if (paymentAccounts.length > 0) {
      const active = paymentAccounts.filter((b) => b.isActive);
      if (!selectedBank || !active.some((b) => b.id === selectedBank.id)) {
        const def = active.find((b) => b.isDefault) || active[0];
        setSelectedBank(def);
      }
    }
  }, [paymentAccounts]);

  // Bank Proof details
  const [transactionId, setTransactionId] = useState('');
  const [paymentProofUrl, setPaymentProofUrl] = useState('');
  const [paymentProofFileName, setPaymentProofFileName] = useState('');
  const [uploadingProof, setUploadingProof] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Submission State
  const [submitting, setSubmitting] = useState(false);

  // Handle in-checkout sign in / register
  const handleInlineAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthSubmitting(true);
    try {
      if (authMode === 'signin') {
        await login(authEmail.trim(), authPassword);
        addToast('success', 'Logged In', 'Account verified. Your cart is ready for checkout.');
      } else {
        await register({
          email: authEmail.trim(),
          password: authPassword,
          fullName: authFullName.trim(),
          phone: authPhone.trim(),
          city: authCity,
          address: authAddress.trim(),
        });
        addToast('success', 'Account Registered', 'Welcome to Crazy Sale! Your details are ready.');
      }
    } catch (err: any) {
      addToast('error', 'Authentication Failed', err?.message || 'Please check your information.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  // If cart is empty, redirect or display empty state
  if (cart.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-5">
        <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto text-stone-400">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-stone-900">Your Shopping Bag is Empty</h2>
        <p className="text-xs text-stone-500">Add products to your cart before proceeding to checkout.</p>
        <button
          onClick={() => navigate('/catalog')}
          className="inline-flex items-center gap-2 bg-stone-900 text-white px-6 py-3 rounded-xl text-xs font-bold hover:bg-amber-700 transition-colors"
        >
          <span>Return to Catalog</span>
        </button>
      </div>
    );
  }

  // Calculate Delivery Fee
  const roundedWeight = Math.max(1, Math.ceil(cartTotalWeightKg));
  let deliveryFee = 0;
  let deliveryServiceName = 'Express Door-to-Door Courier';
  let deliveryTime = '2 - 4 Working Days';
  let ratePerKg = 0;

  if (deliveryMethod === 'door_to_door') {
    ratePerKg = settings.doorToDoor?.ratePerKg || 250;
    deliveryFee = roundedWeight * ratePerKg;
    deliveryServiceName = settings.doorToDoor?.serviceName || 'TCS / Trax Express Courier';
    deliveryTime = settings.doorToDoor?.deliveryTime || '2 - 4 Working Days';
  } else if (deliveryMethod === 'local_cargo') {
    ratePerKg = settings.localCargo?.ratePerKg || 120;
    deliveryFee = roundedWeight * ratePerKg;
    deliveryServiceName = settings.localCargo?.serviceName || 'Nationwide Heavy Goods Cargo';
    deliveryTime = settings.localCargo?.deliveryTime || '3 - 5 Working Days';
  } else if (deliveryMethod === 'self_pickup') {
    ratePerKg = 0;
    deliveryFee = 0;
    deliveryServiceName = 'Warehouse Self-Pickup';
    deliveryTime = settings.selfPickup?.readyTime || 'Ready within 24 Hours after confirmation';
  }

  const grandTotal = cartSubtotal + deliveryFee;

  // Copy helper
  const copyToClipboard = (text: string, fieldName: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      addToast('info', 'Copied', `${fieldName} copied to clipboard.`);
      setTimeout(() => setCopiedField(null), 2500);
    }
  };

  // Handle Receipt Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 8MB)
    if (file.size > 8 * 1024 * 1024) {
      addToast('error', 'File Too Large', 'Please upload a receipt screenshot under 8MB.');
      return;
    }

    setUploadingProof(true);
    setPaymentProofFileName(file.name);
    try {
      const url = await storeService.uploadPaymentProof(file, `order_temp_${Date.now()}`);
      setPaymentProofUrl(url);
      addToast('success', 'Slip Attached', 'Payment receipt uploaded successfully.');
    } catch (err: any) {
      console.error(err);
      addToast('error', 'Upload Failed', err?.message || 'Could not upload receipt.');
    } finally {
      setUploadingProof(false);
    }
  };

  // Handle Order Submit
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mandatory Authentication Check
    if (!currentUser) {
      addToast('error', 'Customer Sign In Required', 'An account is required to place your order. Please sign in or create an account.');
      const authSection = document.getElementById('checkout-auth-section');
      if (authSection) {
        authSection.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }

    // Required Buyer Information Validation
    if (!fullName.trim() || fullName.trim().length < 2) {
      addToast('error', 'Missing Full Name', 'Please enter a valid recipient full name.');
      return;
    }
    const cleanPhone = phone.replace(/\D/g, '');
    if (!phone.trim() || cleanPhone.length < 10) {
      addToast('error', 'Invalid Phone Number', 'Please provide an 11-digit Pakistani mobile number (e.g. 0300-1234567).');
      return;
    }
    if (!email.trim() || !email.includes('@') || !email.includes('.')) {
      addToast('error', 'Invalid Email', 'Please provide a valid email address.');
      return;
    }
    if (!city.trim()) {
      addToast('error', 'Missing City', 'Please select a delivery city.');
      return;
    }
    if (deliveryMethod !== 'self_pickup' && (!address.trim() || address.trim().length < 10)) {
      addToast('error', 'Incomplete Address', 'Please provide a complete street address with house number, sector, and area for safe transit (minimum 10 characters).');
      return;
    }

    setSubmitting(true);

    try {
      const orderNumber = generateOrderNumber();
      const orderId = `order_${Date.now()}`;

      const customer: CustomerInfo = {
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim().toLowerCase(),
        address: address.trim(),
        city,
        notes: notes.trim(),
      };

      const orderItems: OrderItem[] = cart.map((item) => ({
        productId: item.productId,
        productTitle: item.productTitle,
        productSlug: item.productSlug,
        sku: item.sku,
        image: item.image,
        variantId: item.selectedVariant?.id,
        variantName: item.variantDescription,
        price: item.unitPrice,
        originalPrice: item.salePrice ? item.unitPrice : undefined,
        quantity: item.quantity,
        lineSubtotal: item.unitPrice * item.quantity,
        weightKg: item.weightKg,
      }));

      const newOrder: Order = {
        id: orderId,
        orderNumber,
        customer,
        customerUid: currentUser.uid,
        customerType: 'registered',
        items: orderItems,
        subtotal: cartSubtotal,
        shipping: deliveryFee,
        total: grandTotal,

        deliveryMethod,
        deliveryServiceName,
        deliveryTime,
        totalWeightKg: cartTotalWeightKg,
        deliveryRatePerKg: ratePerKg,

        paymentMethod,
        paymentStatus: paymentMethod === 'advance_bank_transfer'
          ? (paymentProofUrl || transactionId ? 'pending_verification' : 'payment_pending')
          : 'unpaid',
        selectedBank: paymentMethod === 'advance_bank_transfer' ? selectedBank : undefined,
        transactionId: transactionId.trim() || undefined,
        paidAmount: paymentMethod === 'advance_bank_transfer' && (paymentProofUrl || transactionId) ? grandTotal : undefined,
        paymentProofUrl: paymentProofUrl || undefined,
        paymentNotes: notes.trim() || undefined,

        verificationStatus: 'unverified',
        orderStatus: 'new',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Permanently save order to Firestore
      await storeService.createOrder(newOrder);

      // Synchronize latest customer details to user profile
      try {
        await updateProfile({
          fullName: customer.fullName,
          phone: customer.phone,
          address: customer.address,
          city: customer.city,
        });
      } catch (profileErr) {
        console.warn('Profile sync notice:', profileErr);
      }

      // Clear the local cart
      clearCart();

      addToast('success', 'Order Placed!', `Order #${orderNumber} has been received.`);
      navigate(`/order-success/${newOrder.orderNumber}`);
    } catch (err: any) {
      console.error('Order creation error:', err);
      addToast('error', 'Checkout Error', err?.message || 'Failed to place your order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/cart')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-stone-600 hover:text-stone-950 mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Shopping Bag</span>
        </button>
        <span className="text-xs font-bold text-amber-700 uppercase tracking-widest block">
          Checkout & Dispatch
        </span>
        <h1 className="font-serif text-2xl sm:text-4xl font-extrabold text-stone-950 mt-1">
          Complete Your Order
        </h1>
      </div>

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* LEFT COLUMN: Customer info, Delivery options, Payment */}
        <div className="lg:col-span-7 space-y-8">
          {/* Customer Authentication Required Gate */}
          {!currentUser && (
            <div id="checkout-auth-section" className="bg-stone-900 text-white rounded-3xl p-6 sm:p-8 shadow-md space-y-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300 text-[11px] font-bold tracking-wide uppercase">
                    <Lock className="w-3.5 h-3.5" />
                    Customer Account Required
                  </div>
                  <h3 className="font-serif text-lg sm:text-xl font-bold text-white">
                    Sign In or Create an Account to Complete Order
                  </h3>
                  <p className="text-xs text-stone-300">
                    Your shopping bag and selected crockery will be preserved. Registered buyers enjoy tracked shipments and order history.
                  </p>
                </div>
              </div>

              {/* Mode switch */}
              <div className="flex rounded-xl bg-stone-800 p-1 max-w-sm">
                <button
                  type="button"
                  onClick={() => setAuthMode('signin')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    authMode === 'signin' ? 'bg-amber-700 text-white shadow-sm' : 'text-stone-400 hover:text-white'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('register')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    authMode === 'register' ? 'bg-amber-700 text-white shadow-sm' : 'text-stone-400 hover:text-white'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Create Account
                </button>
              </div>

              {/* Form */}
              <div className="pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {authMode === 'register' && (
                    <>
                      <div>
                        <label className="block text-stone-300 text-[11px] font-semibold mb-1">
                          Full Name <span className="text-amber-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={authFullName}
                          onChange={(e) => setAuthFullName(e.target.value)}
                          placeholder="e.g. Fatima Tariq"
                          className="w-full px-3.5 py-2.5 bg-stone-800 border border-stone-700 rounded-xl text-white outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-stone-300 text-[11px] font-semibold mb-1">
                          Mobile Number <span className="text-amber-400">*</span>
                        </label>
                        <input
                          type="tel"
                          value={authPhone}
                          onChange={(e) => setAuthPhone(e.target.value)}
                          placeholder="0300-1234567"
                          className="w-full px-3.5 py-2.5 bg-stone-800 border border-stone-700 rounded-xl text-white font-mono outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-stone-300 text-[11px] font-semibold mb-1">
                          City <span className="text-amber-400">*</span>
                        </label>
                        <select
                          value={authCity}
                          onChange={(e) => setAuthCity(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-stone-800 border border-stone-700 rounded-xl text-white outline-none focus:border-amber-500"
                        >
                          {PAKISTAN_CITIES.map((c) => (
                            <option key={c} value={c} className="bg-stone-900 text-white">
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-stone-300 text-[11px] font-semibold mb-1">
                          Complete Address <span className="text-amber-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={authAddress}
                          onChange={(e) => setAuthAddress(e.target.value)}
                          placeholder="House/Apt #, Street, Sector..."
                          className="w-full px-3.5 py-2.5 bg-stone-800 border border-stone-700 rounded-xl text-white outline-none focus:border-amber-500"
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-stone-300 text-[11px] font-semibold mb-1">
                      Email Address <span className="text-amber-400">*</span>
                    </label>
                    <input
                      type="email"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      placeholder="customer@example.com"
                      className="w-full px-3.5 py-2.5 bg-stone-800 border border-stone-700 rounded-xl text-white outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-300 text-[11px] font-semibold mb-1">
                      Password <span className="text-amber-400">*</span>
                    </label>
                    <input
                      type="password"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 bg-stone-800 border border-stone-700 rounded-xl text-white outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-end gap-3 mt-4 pt-3 border-t border-stone-800">
                  <button
                    type="button"
                    onClick={handleInlineAuth}
                    disabled={authSubmitting}
                    className="w-full sm:w-auto px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                  >
                    {authSubmitting ? 'Authenticating...' : authMode === 'signin' ? 'Sign In & Continue' : 'Create Account & Continue'}
                  </button>
                </div>
              </div>
            </div>
          )}
          {/* 1. Customer Shipping Details */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/80 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h2 className="font-serif text-base sm:text-lg font-bold text-stone-950 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-stone-900 text-white text-xs flex items-center justify-center font-sans font-bold">
                  1
                </span>
                Recipient & Delivery Information
              </h2>
              {currentUser && (
                <span className="text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  Logged in as {currentUser.fullName}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1.5">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Fatima Tariq"
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs outline-none focus:border-stone-900 focus:bg-white transition-colors"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1.5">
                  Pakistani Mobile Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0300-1234567"
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs outline-none focus:border-stone-900 focus:bg-white transition-colors font-mono"
                />
                <span className="text-[10px] text-stone-400 mt-1 block">
                  Courier/Cargo driver will call on this number for delivery.
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1.5">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs outline-none focus:border-stone-900 focus:bg-white transition-colors"
                />
                <span className="text-[10px] text-stone-400 mt-1 block">
                  Order receipts & parcel tracking link will be emailed.
                </span>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1.5">
                  Destination City <span className="text-rose-500">*</span>
                </label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs outline-none focus:border-stone-900 focus:bg-white transition-colors cursor-pointer"
                >
                  {PAKISTAN_CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1.5">
                Complete Street Address <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={2}
                required={deliveryMethod !== 'self_pickup'}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="House / Apartment #, Street Name, Sector/Block, Nearby Landmark..."
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs outline-none focus:border-stone-900 focus:bg-white transition-colors"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1.5">
                Special Delivery Instructions / Gate Code (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Please deliver between 2pm to 6pm, fragile crockery package."
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs outline-none focus:border-stone-900"
              />
            </div>
          </div>

          {/* 2. Delivery Method Selection */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h2 className="font-serif text-base sm:text-lg font-bold text-stone-950 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-stone-900 text-white text-xs flex items-center justify-center font-sans font-bold">
                  2
                </span>
                Choose Delivery & Transit Service
              </h2>
              <div className="flex items-center gap-1.5 text-xs text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 font-medium">
                <Scale className="w-3.5 h-3.5 text-amber-700" />
                <span>Parcel: {cartTotalWeightKg} KG ({roundedWeight} KG billed)</span>
              </div>
            </div>

            <div className="space-y-3">
              {/* Option 1: Door to Door Courier */}
              {settings.doorToDoor?.enabled && (
                <label
                  onClick={() => setDeliveryMethod('door_to_door')}
                  className={`flex items-start justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                    deliveryMethod === 'door_to_door'
                      ? 'border-stone-900 bg-amber-50/20 ring-1 ring-stone-900'
                      : 'border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <input
                      type="radio"
                      name="deliveryMethod"
                      checked={deliveryMethod === 'door_to_door'}
                      onChange={() => setDeliveryMethod('door_to_door')}
                      className="mt-1 text-stone-900 focus:ring-stone-900 cursor-pointer"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs sm:text-sm text-stone-900">
                          {settings.doorToDoor.serviceName}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-stone-100 text-stone-700">
                          Doorstep
                        </span>
                      </div>
                      <p className="text-stone-500 text-[11px] mt-0.5">
                        TCS / Trax door-to-door courier service. Best for dinner sets, tea sets, and glassware.
                      </p>
                      <p className="text-stone-400 text-[10px] mt-1">
                        Rate: {settings.doorToDoor.ratePerKg} PKR/KG • Est. Time: {settings.doorToDoor.deliveryTime}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-extrabold text-sm sm:text-base text-stone-950">
                      {settings.currencySymbol} {(roundedWeight * settings.doorToDoor.ratePerKg).toLocaleString()}
                    </span>
                  </div>
                </label>
              )}

              {/* Option 2: Heavy Goods Cargo */}
              {settings.localCargo?.enabled && (
                <label
                  onClick={() => setDeliveryMethod('local_cargo')}
                  className={`flex items-start justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                    deliveryMethod === 'local_cargo'
                      ? 'border-stone-900 bg-amber-50/20 ring-1 ring-stone-900'
                      : 'border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <input
                      type="radio"
                      name="deliveryMethod"
                      checked={deliveryMethod === 'local_cargo'}
                      onChange={() => setDeliveryMethod('local_cargo')}
                      className="mt-1 text-stone-900 focus:ring-stone-900 cursor-pointer"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs sm:text-sm text-stone-900">
                          {settings.localCargo.serviceName}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800">
                          Economical Cargo
                        </span>
                      </div>
                      <p className="text-stone-500 text-[11px] mt-0.5">
                        Shipped via Intercity Goods Transport / Bilty. Highly recommended for heavy dinner sets & wholesale parcels.
                      </p>
                      <p className="text-stone-400 text-[10px] mt-1">
                        Rate: {settings.localCargo.ratePerKg} PKR/KG • Est. Time: {settings.localCargo.deliveryTime}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-extrabold text-sm sm:text-base text-stone-950">
                      {settings.currencySymbol} {(roundedWeight * settings.localCargo.ratePerKg).toLocaleString()}
                    </span>
                  </div>
                </label>
              )}

              {/* Option 3: Self Pickup */}
              {settings.selfPickup?.enabled && (
                <label
                  onClick={() => setDeliveryMethod('self_pickup')}
                  className={`flex items-start justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                    deliveryMethod === 'self_pickup'
                      ? 'border-stone-900 bg-amber-50/20 ring-1 ring-stone-900'
                      : 'border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <input
                      type="radio"
                      name="deliveryMethod"
                      checked={deliveryMethod === 'self_pickup'}
                      onChange={() => setDeliveryMethod('self_pickup')}
                      className="mt-1 text-stone-900 focus:ring-stone-900 cursor-pointer"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs sm:text-sm text-stone-900">
                          Self-Pickup at Crazy Sale Warehouse
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                          FREE
                        </span>
                      </div>
                      <p className="text-stone-500 text-[11px] mt-0.5">
                        Collect your packed parcel directly from our warehouse after order confirmation.
                      </p>
                      <p className="text-stone-400 text-[10px] mt-1">
                        Location: {settings.selfPickup.pickupAddress}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-extrabold text-sm text-emerald-700">
                      FREE (0 PKR)
                    </span>
                  </div>
                </label>
              )}
            </div>
          </div>

          {/* 3. Payment Method & Advance Bank Transfer Details */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/80 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h2 className="font-serif text-base sm:text-lg font-bold text-stone-950 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-stone-900 text-white text-xs flex items-center justify-center font-sans font-bold">
                  3
                </span>
                Payment Options
              </h2>
              <span className="text-[11px] text-stone-500 flex items-center gap-1">
                <Lock className="w-3 h-3 text-emerald-600" /> Insured Fragile Transit
              </span>
            </div>

            {/* Payment Method Switcher */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('advance_bank_transfer')}
                className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                  paymentMethod === 'advance_bank_transfer'
                    ? 'border-stone-900 bg-amber-50/20 ring-1 ring-stone-900'
                    : 'border-stone-200 bg-stone-50/50 hover:bg-stone-50'
                }`}
              >
                <Building className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-stone-900">Advance Bank Transfer</span>
                    <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[9px] font-bold">
                      Recommended
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 mt-1">
                    IBFT, Meezan, HBL or RAAST. Immediate priority packing & insured dispatch.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('cash_on_delivery')}
                className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                  paymentMethod === 'cash_on_delivery'
                    ? 'border-stone-900 bg-amber-50/20 ring-1 ring-stone-900'
                    : 'border-stone-200 bg-stone-50/50 hover:bg-stone-50'
                }`}
              >
                <CreditCard className="w-5 h-5 text-stone-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-xs text-stone-900 block">Cash on Delivery (COD)</span>
                  <p className="text-[11px] text-stone-500 mt-1">
                    Pay upon doorstep delivery. Delivery charges may be verified via WhatsApp prior to dispatch.
                  </p>
                </div>
              </button>
            </div>

            {/* If Advance Bank Transfer: Show Bank Accounts Box */}
            {paymentMethod === 'advance_bank_transfer' && (
              <div className="space-y-4 pt-2">
                <div>
                  <label className="text-xs font-semibold text-stone-800 block mb-2">
                    Select Bank Account to Transfer:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {activeBanks.map((bank) => (
                      <button
                        key={bank.id}
                        type="button"
                        onClick={() => setSelectedBank(bank)}
                        className={`p-3 rounded-xl border text-left text-xs transition-all ${
                          selectedBank?.id === bank.id
                            ? 'border-amber-600 bg-amber-50/40 font-semibold shadow-2xs'
                            : 'border-stone-200 hover:border-stone-300'
                        }`}
                      >
                        <div className="font-bold text-stone-900 flex items-center justify-between">
                          <span>{bank.bankName}</span>
                          {bank.isDefault && (
                            <span className="text-[10px] text-amber-700 font-medium">Default</span>
                          )}
                        </div>
                        <p className="text-[11px] text-stone-500 font-mono mt-0.5">{bank.accountNumber}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Selected Bank Details Card */}
                {selectedBank && (
                  <div className="p-4 sm:p-5 rounded-2xl bg-[#F7F5F0] border border-amber-200/80 space-y-3.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
                        {selectedBank.bankName} Official Account
                      </span>
                      <span className="text-[10px] bg-amber-200/60 text-amber-900 px-2 py-0.5 rounded font-medium">
                        Branch Code: {selectedBank.branchCode}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="bg-white p-3 rounded-xl border border-stone-200 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-stone-400 uppercase font-semibold block">Account Title</span>
                          <span className="font-bold text-stone-900 select-all">{selectedBank.accountTitle}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(selectedBank.accountTitle, 'Account Title')}
                          className="p-1.5 text-stone-400 hover:text-stone-800 rounded-lg hover:bg-stone-100"
                          title="Copy Account Title"
                        >
                          {copiedField === 'Account Title' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>

                      <div className="bg-white p-3 rounded-xl border border-stone-200 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-stone-400 uppercase font-semibold block">Account Number</span>
                          <span className="font-bold text-stone-900 font-mono select-all">{selectedBank.accountNumber}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(selectedBank.accountNumber, 'Account Number')}
                          className="p-1.5 text-stone-400 hover:text-stone-800 rounded-lg hover:bg-stone-100"
                          title="Copy Account Number"
                        >
                          {copiedField === 'Account Number' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>

                      <div className="bg-white p-3 rounded-xl border border-stone-200 flex items-center justify-between sm:col-span-2">
                        <div>
                          <span className="text-[10px] text-stone-400 uppercase font-semibold block">IBAN Number (1Link / RAAST)</span>
                          <span className="font-bold text-stone-900 font-mono text-[11px] sm:text-xs select-all">
                            {selectedBank.iban}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(selectedBank.iban, 'IBAN')}
                          className="p-1.5 text-stone-400 hover:text-stone-800 rounded-lg hover:bg-stone-100"
                          title="Copy IBAN"
                        >
                          {copiedField === 'IBAN' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <p className="text-[11px] text-stone-600 italic">
                      Instructions: {selectedBank.instructions}
                    </p>
                  </div>
                )}

                {/* Optional Slip Upload / Transaction ID */}
                <div className="p-4 rounded-2xl border border-dashed border-stone-300 bg-stone-50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-stone-500" />
                      Attach Bank Slip / Screenshot (Optional now, or submit later):
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-stone-600 block mb-1">
                        Transaction ID / Reference (Optional)
                      </label>
                      <input
                        type="text"
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        placeholder="e.g. TID 948102938"
                        className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs font-mono outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-stone-600 block mb-1">
                        Upload Receipt Screenshot
                      </label>
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="w-full text-xs text-stone-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-stone-900 file:text-white hover:file:bg-amber-700 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  {uploadingProof && (
                    <p className="text-xs text-amber-700 animate-pulse font-medium">
                      Uploading bank receipt screenshot...
                    </p>
                  )}

                  {paymentProofUrl && (
                    <div className="flex items-center gap-3 p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="truncate flex-1">Slip attached: {paymentProofFileName || 'Payment Slip'}</span>
                      <a
                        href={paymentProofUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-amber-800 underline font-semibold text-[11px]"
                      >
                        Preview
                      </a>
                    </div>
                  )}

                  <p className="text-[10px] text-stone-400">
                    *If you haven&apos;t transferred yet, you can place the order now and upload your bank slip on the Order Confirmation or Track Order page anytime.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Order Review, Breakdown, Badges */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-28">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/80 shadow-sm space-y-6">
            <h3 className="font-serif text-lg font-bold text-stone-900 pb-3 border-b border-stone-100 flex items-center justify-between">
              <span>Order Summary ({cart.length} items)</span>
              <button
                type="button"
                onClick={() => navigate('/cart')}
                className="text-xs text-amber-700 hover:text-amber-900 font-sans font-medium"
              >
                Edit Bag
              </button>
            </h3>

            {/* Cart items list */}
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center gap-3 text-xs">
                  <img
                    src={item.image}
                    alt=""
                    className="w-12 h-12 rounded-lg object-cover bg-stone-100 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-stone-900 truncate">{item.productTitle}</p>
                    {item.variantDescription && (
                      <p className="text-[10px] text-stone-500">{item.variantDescription}</p>
                    )}
                    <p className="text-stone-400 text-[10px]">
                      {item.quantity} x {settings.currencySymbol} {item.unitPrice.toLocaleString()} ({item.weightKg} kg each)
                    </p>
                  </div>
                  <span className="font-bold text-stone-950 shrink-0">
                    {settings.currencySymbol} {(item.unitPrice * item.quantity).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            {/* Price Calculations */}
            <div className="space-y-2.5 pt-4 border-t border-stone-100 text-xs">
              <div className="flex items-center justify-between text-stone-600">
                <span>Products Subtotal:</span>
                <span className="font-bold text-stone-950">
                  {settings.currencySymbol} {cartSubtotal.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between text-stone-600">
                <span className="flex items-center gap-1">
                  <Scale className="w-3.5 h-3.5 text-stone-400" />
                  Total Parcel Weight:
                </span>
                <span className="font-semibold text-stone-900">
                  {cartTotalWeightKg} KG
                </span>
              </div>

              <div className="flex items-center justify-between text-stone-600">
                <span>Delivery ({deliveryServiceName}):</span>
                <span className="font-bold text-stone-950">
                  {deliveryFee === 0 
                    ? 'FREE (0 PKR)' 
                    : `${settings.currencySymbol} ${deliveryFee.toLocaleString()}`}
                </span>
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-baseline justify-between">
                <div>
                  <span className="text-sm font-extrabold text-stone-950 block">Grand Total:</span>
                  <span className="text-[10px] text-stone-400 font-medium">All taxes & packaging included</span>
                </div>
                <span className="text-2xl font-black text-stone-950">
                  {settings.currencySymbol} {grandTotal.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Submit CTA */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 bg-stone-900 hover:bg-amber-700 text-white py-4 px-6 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-98 disabled:opacity-50"
            >
              {submitting ? (
                <span>Generating Order...</span>
              ) : (
                <>
                  <span>Confirm & Place Order</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Guarantees Box */}
            <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/60 space-y-2.5 text-xs text-stone-700">
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-stone-900">Breakage Protection Policy:</span>
                  <p className="text-[11px] text-stone-600 mt-0.5">
                    We pack with heavy-duty air bubbles and export cartons. Record an unboxing video upon receipt; if broken, we dispatch a free replacement immediately.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Truck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-stone-900">Nationwide Coverage:</span>
                  <p className="text-[11px] text-stone-600 mt-0.5">
                    Dispatching to all cities across Sindh, Punjab, KPK, Balochistan, AJK and Gilgit.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
