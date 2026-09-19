import React, { useState, useEffect } from 'react';
import { 
  User, PackageCheck, MapPin, Mail, Phone, Lock, 
  ArrowRight, Shield, ExternalLink, LogOut, CheckCircle2, Clock 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { useRouter } from '../router/Router';
import { storeService } from '../services/storeService';
import { Order } from '../types';
import { updateSEO } from '../utils/seo';

export const AccountPage: React.FC = () => {
  const { currentUser, login, register, logout, isAdmin, updateProfile, sendPasswordReset } = useAuth();
  const { settings, addToast } = useStore();
  const { navigate } = useRouter();

  const [activeTab, setActiveTab] = useState<'orders' | 'profile'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Auth form states
  const [authMode, setAuthMode] = useState<'signin' | 'register' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Karachi');
  const [authSubmitting, setAuthSubmitting] = useState(false);

  // Profile Edit states
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editCity, setEditCity] = useState('Karachi');
  const [editAddress, setEditAddress] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setEditFullName(currentUser.fullName || '');
      setEditPhone(currentUser.phone || '');
      setEditCity(currentUser.city || 'Karachi');
      setEditAddress(currentUser.address || '');
    }
  }, [currentUser]);

  useEffect(() => {
    updateSEO({
      title: currentUser ? `Account - ${currentUser.fullName}` : 'Sign In or Track Orders',
      description: 'Customer portal for tracking tableware deliveries, reviewing payment slips, and managing Pakistani shipping addresses.',
    });

    if (currentUser) {
      loadCustomerOrders(currentUser.uid);
    }
  }, [currentUser]);

  const loadCustomerOrders = async (uid: string) => {
    setLoadingOrders(true);
    try {
      const list = await storeService.getCustomerOrders(uid);
      setOrders(list);
    } catch (err) {
      console.error('Failed to load customer orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthSubmitting(true);
    try {
      if (authMode === 'forgot') {
        if (!email.trim() || !email.includes('@')) {
          throw new Error('Please enter a valid email address.');
        }
        await sendPasswordReset(email.trim());
        addToast('success', 'Reset Email Sent', 'Password reset instructions have been sent to your email.');
        setAuthMode('signin');
      } else if (authMode === 'signin') {
        await login(email.trim(), password);
        addToast('success', 'Welcome Back', 'You are now signed in.');
      } else {
        await register({
          email: email.trim(),
          password,
          fullName: fullName.trim(),
          phone: phone.trim(),
          address: address.trim(),
          city,
        });
        addToast('success', 'Account Created', 'Welcome to Crazy Sale!');
      }
    } catch (err: any) {
      addToast('error', 'Authentication Failed', err?.message || 'Please check your credentials.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  // If user is not logged in: show Auth form
  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 sm:py-20 space-y-6">
        <div className="text-center space-y-2">
          <span className="font-serif text-2xl sm:text-3xl font-bold text-stone-950 uppercase tracking-wider">
            Crazy<span className="text-amber-700">Sale</span>
          </span>
          <h1 className="text-lg font-bold text-stone-900">
            {authMode === 'signin' 
              ? 'Sign in to Your Customer Account' 
              : authMode === 'register' 
              ? 'Create a New Customer Account' 
              : 'Reset Your Password'}
          </h1>
          <p className="text-xs text-stone-500">
            {authMode === 'forgot'
              ? 'Enter your registered email address and we will send you password reset instructions.'
              : 'Access your orders, payment verification receipts, and saved delivery addresses.'}
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/80 shadow-sm space-y-5">
          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {authMode === 'register' && (
              <>
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Ayesha Khan"
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs outline-none focus:border-stone-900"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Pakistani Mobile Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0300-1234567"
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono outline-none focus:border-stone-900"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    City <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs outline-none focus:border-stone-900"
                  >
                    <option value="Karachi">Karachi</option>
                    <option value="Lahore">Lahore</option>
                    <option value="Islamabad">Islamabad</option>
                    <option value="Rawalpindi">Rawalpindi</option>
                    <option value="Faisalabad">Faisalabad</option>
                    <option value="Multan">Multan</option>
                    <option value="Peshawar">Peshawar</option>
                    <option value="Quetta">Quetta</option>
                    <option value="Sialkot">Sialkot</option>
                    <option value="Gujranwala">Gujranwala</option>
                    <option value="Hyderabad">Hyderabad</option>
                    <option value="Other / Azad Kashmir / Gilgit">Other / Azad Kashmir / Gilgit</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Complete Street Address <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="House/Apartment #, Street, Sector, Area..."
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs outline-none focus:border-stone-900"
                  />
                </div>
              </>
            )}

            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="customer@example.com"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs outline-none focus:border-stone-900"
              />
            </div>

            {authMode !== 'forgot' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-stone-700">Password</label>
                  {authMode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => setAuthMode('forgot')}
                      className="text-[11px] font-semibold text-amber-800 hover:underline"
                    >
                      Forgot Password?
                    </button>
                  )}
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs outline-none focus:border-stone-900"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={authSubmitting}
              className="w-full bg-stone-900 hover:bg-amber-700 text-white py-3 rounded-xl text-xs font-bold transition-colors shadow-sm disabled:opacity-50"
            >
              {authSubmitting 
                ? 'Processing...' 
                : authMode === 'signin' 
                ? 'Sign In' 
                : authMode === 'register' 
                ? 'Create Account' 
                : 'Send Password Reset Email'}
            </button>
          </form>

          {/* Switch Mode */}
          <div className="pt-2 text-center text-xs text-stone-500 border-t border-stone-100">
            {authMode === 'signin' ? (
              <p>
                Don&apos;t have an account yet?{' '}
                <button
                  onClick={() => setAuthMode('register')}
                  className="text-amber-800 font-bold hover:underline"
                >
                  Create Account
                </button>
              </p>
            ) : authMode === 'register' ? (
              <p>
                Already have an account?{' '}
                <button
                  onClick={() => setAuthMode('signin')}
                  className="text-amber-800 font-bold hover:underline"
                >
                  Sign In
                </button>
              </p>
            ) : (
              <p>
                Remembered your password?{' '}
                <button
                  onClick={() => setAuthMode('signin')}
                  className="text-amber-800 font-bold hover:underline"
                >
                  Back to Sign In
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Quick link to Track Order directly */}
        <div className="text-center">
          <button
            onClick={() => navigate('/track')}
            className="text-xs text-stone-600 hover:text-stone-900 underline font-medium"
          >
            Looking to track an order by Order Number? Click here.
          </button>
        </div>
      </div>
    );
  }

  // Logged-in Customer View
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-8">
      {/* Profile Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-700 flex items-center justify-center font-bold font-serif text-xl">
            {currentUser.fullName.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-xl sm:text-2xl font-bold text-stone-950">
                {currentUser.fullName}
              </h1>
              {isAdmin && (
                <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold uppercase tracking-wider">
                  Store Admin
                </span>
              )}
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              {currentUser.email} • {currentUser.phone || 'No phone registered'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isAdmin && (
            <button
              onClick={() => navigate('/admin')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-900 text-amber-100 text-xs font-bold hover:bg-amber-800 transition-colors shadow-xs"
            >
              <Shield className="w-3.5 h-3.5 text-amber-300" />
              <span>Admin Portal</span>
            </button>
          )}

          <button
            onClick={async () => {
              await logout();
              navigate('/');
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-stone-200 text-stone-700 hover:text-rose-600 hover:border-rose-200 text-xs font-medium transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-3 border-b border-stone-200 pb-2">
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'orders'
              ? 'bg-stone-900 text-white'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          My Orders ({orders.length})
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'profile'
              ? 'bg-stone-900 text-white'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          Delivery Profile & Details
        </button>
      </div>

      {/* TAB 1: Orders */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {loadingOrders ? (
            <div className="text-center py-12 text-xs text-stone-400">Loading order history...</div>
          ) : orders.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 border border-stone-200 text-center space-y-3">
              <PackageCheck className="w-12 h-12 text-stone-300 mx-auto" />
              <h3 className="font-serif text-lg font-bold text-stone-900">No Orders Placed Yet</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Explore our fine bone china dinner sets, tea ware, and home decor items.
              </p>
              <button
                onClick={() => navigate('/catalog')}
                className="bg-stone-900 text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-amber-700 transition-colors"
              >
                Browse Catalog
              </button>
            </div>
          ) : (
            orders.map((ord) => (
              <div
                key={ord.id}
                className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200/80 shadow-xs space-y-4 hover:border-stone-300 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
                  <div>
                    <span className="font-mono font-bold text-sm text-stone-950">
                      Order #{ord.orderNumber}
                    </span>
                    <p className="text-xs text-stone-400 mt-0.5">
                      Placed on {new Date(ord.createdAt).toLocaleDateString()} • {ord.items.length} item(s) • Total: {settings.currencySymbol} {ord.total.toLocaleString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Payment badge */}
                    {ord.paymentStatus === 'verified' ? (
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-[11px] font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Payment Verified
                      </span>
                    ) : ord.paymentStatus === 'pending_verification' ? (
                      <span className="px-2.5 py-1 bg-amber-100 text-amber-900 rounded-full text-[11px] font-bold flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-amber-700" /> Slip Under Review
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-rose-100 text-rose-800 rounded-full text-[11px] font-bold">
                        Unpaid / Awaiting Transfer
                      </span>
                    )}

                    {/* Order status */}
                    <span className="px-2.5 py-1 bg-stone-100 text-stone-800 rounded-full text-[11px] font-bold capitalize">
                      {ord.orderStatus.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Items preview thumbnails */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 overflow-x-auto py-1">
                    {ord.items.map((item, i) => (
                      <img
                        key={i}
                        src={item.image}
                        alt=""
                        title={item.productTitle}
                        className="w-12 h-12 rounded-lg object-cover bg-stone-100 shrink-0 border border-stone-200"
                      />
                    ))}
                  </div>

                  <button
                    onClick={() => navigate(`/track/${ord.orderNumber}`)}
                    className="flex items-center gap-1 text-xs font-bold text-stone-900 hover:text-amber-700 shrink-0 whitespace-nowrap bg-stone-50 hover:bg-stone-100 px-4 py-2 rounded-xl transition-colors"
                  >
                    <span>Track & View Details</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 2: Profile Details */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/80 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div>
              <h2 className="font-serif text-lg font-bold text-stone-900">
                Saved Shipping & Contact Information
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Keep your details updated for swift order dispatch and courier booking.
              </p>
            </div>
            {!isEditingProfile ? (
              <button
                type="button"
                onClick={() => setIsEditingProfile(true)}
                className="px-4 py-2 bg-stone-900 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Edit Profile
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditingProfile(false)}
                className="px-4 py-2 border border-stone-200 hover:bg-stone-50 rounded-xl text-xs font-semibold text-stone-700 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>

          {isEditingProfile ? (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!editFullName.trim() || !editPhone.trim() || !editAddress.trim()) {
                  addToast('error', 'Validation Error', 'Full name, phone number, and address are required.');
                  return;
                }
                setSavingProfile(true);
                try {
                  await updateProfile({
                    fullName: editFullName.trim(),
                    phone: editPhone.trim(),
                    city: editCity,
                    address: editAddress.trim(),
                  });
                  setIsEditingProfile(false);
                  addToast('success', 'Profile Updated', 'Your shipping details have been saved to your account.');
                } catch (err: any) {
                  addToast('error', 'Update Failed', err?.message || 'Failed to update profile.');
                } finally {
                  setSavingProfile(false);
                }
              }}
              className="space-y-4 text-xs"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:border-stone-900"
                  />
                </div>

                <div>
                  <label className="font-semibold text-stone-700 block mb-1">
                    Email Address (Read-only)
                  </label>
                  <input
                    type="email"
                    disabled
                    value={currentUser.email}
                    className="w-full px-3.5 py-2.5 bg-stone-100 border border-stone-200 rounded-xl text-stone-500 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="font-semibold text-stone-700 block mb-1">
                    Contact Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="0300-1234567"
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl font-mono outline-none focus:border-stone-900"
                  />
                </div>

                <div>
                  <label className="font-semibold text-stone-700 block mb-1">
                    Destination City <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:border-stone-900"
                  >
                    <option value="Karachi">Karachi</option>
                    <option value="Lahore">Lahore</option>
                    <option value="Islamabad">Islamabad</option>
                    <option value="Rawalpindi">Rawalpindi</option>
                    <option value="Faisalabad">Faisalabad</option>
                    <option value="Multan">Multan</option>
                    <option value="Peshawar">Peshawar</option>
                    <option value="Quetta">Quetta</option>
                    <option value="Sialkot">Sialkot</option>
                    <option value="Gujranwala">Gujranwala</option>
                    <option value="Hyderabad">Hyderabad</option>
                    <option value="Other / Azad Kashmir / Gilgit">Other / Azad Kashmir / Gilgit</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="font-semibold text-stone-700 block mb-1">
                    Complete Street Address <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:border-stone-900"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="px-4 py-2 border border-stone-200 rounded-xl text-xs font-semibold hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-5 py-2 bg-stone-900 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs disabled:opacity-50"
                >
                  {savingProfile ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-stone-400 font-semibold block uppercase text-[10px]">Full Name</span>
                <p className="font-bold text-stone-900 mt-1">{currentUser.fullName}</p>
              </div>

              <div>
                <span className="text-stone-400 font-semibold block uppercase text-[10px]">Email Address</span>
                <p className="font-bold text-stone-900 mt-1">{currentUser.email}</p>
              </div>

              <div>
                <span className="text-stone-400 font-semibold block uppercase text-[10px]">Phone Number</span>
                <p className="font-bold text-stone-900 font-mono mt-1">{currentUser.phone || 'Not specified'}</p>
              </div>

              <div>
                <span className="text-stone-400 font-semibold block uppercase text-[10px]">Default City</span>
                <p className="font-bold text-stone-900 mt-1">{currentUser.city || 'Karachi'}, Pakistan</p>
              </div>

              <div className="sm:col-span-2">
                <span className="text-stone-400 font-semibold block uppercase text-[10px]">Street Address</span>
                <p className="font-bold text-stone-900 mt-1">{currentUser.address || 'Not specified'}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
