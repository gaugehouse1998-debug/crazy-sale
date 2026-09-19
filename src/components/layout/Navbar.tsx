import React, { useState } from 'react';
import { 
  Search, ShoppingBag, User, Menu, X, Phone, MessageSquare, 
  Sparkles, Shield, ChevronDown, LogOut, PackageCheck 
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from '../../router/Router';

export const Navbar: React.FC = () => {
  const { cartCount, cartSubtotal, setSearchOpen, categories, settings, openWhatsApp } = useStore();
  const { currentUser, isAdmin, logout } = useAuth();
  const { navigate, currentPath } = useRouter();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const activeCategories = categories.filter((c) => c.isActive).slice(0, 8);

  const handleNavClick = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200 transition-all">
      {/* 1. Top Announcement Strip */}
      <div className="bg-[#1C1917] text-stone-300 text-[11px] sm:text-xs py-2 px-4 border-b border-stone-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 truncate">
            <span className="inline-block px-1.5 py-0.5 rounded bg-amber-600/30 text-amber-300 text-[10px] font-bold uppercase tracking-wider">
              Special
            </span>
            <span className="truncate">
              {settings.tagline} • Nationwide Delivery in Pakistan
            </span>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <button
              onClick={() => openWhatsApp()}
              className="hidden md:flex items-center gap-1.5 text-stone-300 hover:text-emerald-400 transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
              <span>WhatsApp: {settings.whatsapp}</span>
            </button>

            {isAdmin && (
              <button
                onClick={() => handleNavClick('/admin')}
                className="flex items-center gap-1 text-amber-300 hover:text-amber-200 font-semibold px-2 py-0.5 rounded bg-amber-950/60 border border-amber-800/60 transition-colors"
              >
                <Shield className="w-3 h-3" />
                <span>Admin Portal</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 sm:py-4 flex items-center justify-between gap-4">
        {/* Mobile menu button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 -ml-2 text-stone-700 hover:text-stone-900 rounded-xl hover:bg-stone-100 transition-colors"
          aria-label="Open Navigation Menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* Brand Logo */}
        <div 
          onClick={() => handleNavClick('/')}
          className="cursor-pointer flex flex-col items-start select-none"
        >
          <div className="flex items-center gap-2">
            <span className="font-serif text-2xl sm:text-3xl font-black tracking-wider text-stone-950 uppercase">
              Crazy<span className="text-amber-700">Sale</span>
            </span>
            <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold uppercase tracking-wider">
              PKR Store
            </span>
          </div>
          <span className="text-[10px] sm:text-[11px] font-sans font-medium text-stone-500 tracking-widest uppercase -mt-1">
            Crockery & Luxury Decor
          </span>
        </div>

        {/* Search Trigger Bar (Desktop / Tablet) */}
        <div 
          onClick={() => setSearchOpen(true)}
          className="hidden md:flex flex-1 max-w-md mx-4 lg:mx-6 items-center justify-between pl-3.5 pr-1.5 py-1.5 rounded-2xl bg-stone-100 hover:bg-stone-200/70 border border-stone-200/80 cursor-pointer text-stone-500 transition-all shadow-inner"
        >
          <div className="flex items-center gap-2.5 text-xs text-stone-500 truncate mr-2">
            <Search className="w-4 h-4 text-stone-400 shrink-0" />
            <span className="truncate">Search crockery, dinner sets, decor...</span>
          </div>
          <button
            id="nav-search-button"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSearchOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-stone-900 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors shrink-0 cursor-pointer"
            aria-label="Search products"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search</span>
          </button>
        </div>

        {/* Right actions: Search button (mobile), WhatsApp, Account, Cart */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile visible search button */}
          <button
            id="mobile-nav-search-button"
            type="button"
            onClick={() => setSearchOpen(true)}
            className="md:hidden flex items-center gap-1.5 px-2.5 py-1.5 text-stone-800 hover:text-stone-950 rounded-xl bg-stone-100 hover:bg-stone-200 text-xs font-semibold transition-colors"
            aria-label="Search"
          >
            <Search className="w-4 h-4 text-stone-700" />
            <span>Search</span>
          </button>

          {/* Direct WhatsApp button (Desktop) */}
          <button
            onClick={() => openWhatsApp()}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
          >
            <MessageSquare className="w-4 h-4 text-emerald-600" />
            <span>Ask on WhatsApp</span>
          </button>

          {/* User Account / Auth Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                if (!currentUser) {
                  handleNavClick('/account');
                } else {
                  setUserDropdownOpen(!userDropdownOpen);
                }
              }}
              className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-2 text-stone-700 hover:text-stone-950 rounded-xl hover:bg-stone-100 transition-colors"
            >
              <User className="w-5 h-5 text-stone-700" />
              <span className="hidden sm:inline text-xs font-medium max-w-[100px] truncate">
                {currentUser ? currentUser.fullName.split(' ')[0] : 'Sign In'}
              </span>
              {currentUser && <ChevronDown className="w-3.5 h-3.5 text-stone-400" />}
            </button>

            {/* Dropdown Menu for Logged In User */}
            {currentUser && userDropdownOpen && (
              <div 
                className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-stone-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150"
                onClick={() => setUserDropdownOpen(false)}
              >
                <div className="px-4 py-2 border-b border-stone-100">
                  <p className="text-xs font-semibold text-stone-900 truncate">{currentUser.fullName}</p>
                  <p className="text-[11px] text-stone-500 truncate">{currentUser.email}</p>
                </div>
                
                <button
                  onClick={() => handleNavClick('/account')}
                  className="w-full text-left px-4 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50 flex items-center gap-2"
                >
                  <PackageCheck className="w-4 h-4 text-stone-500" />
                  My Orders & Profile
                </button>

                {isAdmin && (
                  <button
                    onClick={() => handleNavClick('/admin')}
                    className="w-full text-left px-4 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-50 flex items-center gap-2"
                  >
                    <Shield className="w-4 h-4 text-amber-600" />
                    Admin Control Panel
                  </button>
                )}

                <div className="border-t border-stone-100 my-1" />

                <button
                  onClick={async () => {
                    await logout();
                    handleNavClick('/');
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  Sign Out
                </button>
              </div>
            )}
          </div>

          {/* Cart Trigger */}
          <button
            onClick={() => handleNavClick('/cart')}
            className="flex items-center gap-2 bg-stone-900 text-white px-3 sm:px-4 py-2 rounded-xl text-xs font-semibold hover:bg-amber-700 transition-colors shadow-sm"
          >
            <div className="relative">
              <ShoppingBag className="w-4 h-4" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-rose-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                  {cartCount}
                </span>
              )}
            </div>
            <span className="hidden sm:inline">
              {cartCount > 0 
                ? `${settings.currencySymbol} ${cartSubtotal.toLocaleString()}` 
                : 'Bag'}
            </span>
          </button>
        </div>
      </div>

      {/* 3. Categories Ribbon (Desktop) */}
      <nav className="hidden lg:block bg-stone-50/80 border-t border-stone-200/70 py-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 overflow-x-auto">
          <div className="flex items-center gap-6 text-xs font-medium text-stone-700 whitespace-nowrap">
            <button
              onClick={() => handleNavClick('/')}
              className={`hover:text-amber-800 transition-colors ${
                currentPath === '/' ? 'text-amber-800 font-bold' : ''
              }`}
            >
              Home
            </button>
            <button
              onClick={() => handleNavClick('/catalog')}
              className={`hover:text-amber-800 transition-colors ${
                currentPath === '/catalog' ? 'text-amber-800 font-bold' : ''
              }`}
            >
              All Products
            </button>

            {activeCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleNavClick(`/category/${cat.slug}`)}
                className={`hover:text-amber-800 transition-colors ${
                  currentPath === `/category/${cat.slug}` ? 'text-amber-800 font-bold' : ''
                }`}
              >
                {cat.name}
              </button>
            ))}

            <button
              onClick={() => handleNavClick('/guides')}
              className={`hover:text-amber-800 transition-colors ${
                currentPath.startsWith('/guides') ? 'text-amber-800 font-bold' : ''
              }`}
            >
              Buying Guides
            </button>
          </div>

          {/* Hot Sale link */}
          <button
            onClick={() => handleNavClick('/catalog?filter=sale')}
            className="flex items-center gap-1.5 text-xs font-bold text-rose-700 hover:text-rose-900 bg-rose-50 px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 text-rose-600" />
            <span>Crazy Deals (Up to 40% Off)</span>
          </button>
        </div>
      </nav>

      {/* 4. Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-stone-200 px-4 py-6 space-y-5 animate-in slide-in-from-top duration-200">
          <div>
            <button
              id="drawer-search-btn"
              onClick={() => {
                setMobileMenuOpen(false);
                setSearchOpen(true);
              }}
              className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-bold text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-xl border border-stone-200 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Search className="w-4 h-4 text-amber-700" />
                <span>Search Products, SKUs & Categories</span>
              </span>
              <span className="text-[11px] font-semibold text-amber-900">Search</span>
            </button>
          </div>

          <div className="space-y-1">
            <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider px-3">
              Navigation
            </p>
            <button
              onClick={() => handleNavClick('/')}
              className="w-full text-left px-3 py-2 text-sm font-medium text-stone-800 hover:bg-stone-50 rounded-xl"
            >
              Home
            </button>
            <button
              onClick={() => handleNavClick('/catalog')}
              className="w-full text-left px-3 py-2 text-sm font-medium text-stone-800 hover:bg-stone-50 rounded-xl"
            >
              All Crockery & Decor
            </button>
            <button
              onClick={() => handleNavClick('/catalog?filter=sale')}
              className="w-full text-left px-3 py-2 text-sm font-bold text-rose-700 hover:bg-rose-50 rounded-xl"
            >
              Hot Crazy Deals
            </button>
            <button
              onClick={() => handleNavClick('/guides')}
              className="w-full text-left px-3 py-2 text-sm font-medium text-stone-800 hover:bg-stone-50 rounded-xl"
            >
              Tableware & Decor Guides
            </button>
          </div>

          <div className="space-y-1 border-t border-stone-100 pt-4">
            <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider px-3">
              Product Categories
            </p>
            <div className="grid grid-cols-2 gap-1">
              {categories.filter(c => c.isActive).map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleNavClick(`/category/${cat.slug}`)}
                  className="text-left px-3 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50 rounded-xl truncate"
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-stone-100 pt-4 flex flex-col gap-2">
            <button
              onClick={() => handleNavClick('/account')}
              className="w-full text-center py-2.5 bg-stone-100 text-stone-800 rounded-xl text-xs font-semibold"
            >
              {currentUser ? 'My Account & Orders' : 'Sign In / Register Customer'}
            </button>
            <button
              onClick={() => openWhatsApp()}
              className="w-full text-center py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              Chat on WhatsApp ({settings.whatsapp})
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
