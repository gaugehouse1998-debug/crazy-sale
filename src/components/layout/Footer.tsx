import React from 'react';
import { 
  Phone, Mail, MapPin, MessageSquare, ShieldCheck, 
  Truck, RefreshCw, Heart, Sparkles, ArrowRight 
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { useRouter } from '../../router/Router';

export const Footer: React.FC = () => {
  const { settings, categories, openWhatsApp } = useStore();
  const { navigate } = useRouter();

  return (
    <footer className="bg-[#181614] text-stone-300 border-t border-stone-800">
      {/* Trust & Guarantee Banner */}
      <div className="border-b border-stone-800/80 py-10 px-4 sm:px-6 lg:px-8 bg-[#1f1c19]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white text-sm font-semibold">Nationwide Delivery</h4>
              <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                Courier door-to-door (TCS / Trax) & heavy cargo across Karachi, Lahore, Islamabad, & all cities.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white text-sm font-semibold">Master Breakage Protection</h4>
              <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                Bubble-wrapped double corrugated box packaging engineered for fragile bone china & crystal glass.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white text-sm font-semibold">Crazy Price Guarantee</h4>
              <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                Direct wholesale pricing on royal dinnerware, table centerpieces, and aesthetic home decor.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white text-sm font-semibold">Instant WhatsApp Help</h4>
              <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                Have questions or need custom parcel dispatch? Chat directly with our customer concierge.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
        {/* Column 1: Brand & Contact */}
        <div className="lg:col-span-2 space-y-4">
          <div>
            <span className="font-serif text-2xl font-bold tracking-wider text-white uppercase">
              Crazy<span className="text-amber-500">Sale</span>
            </span>
            <p className="text-xs font-medium text-amber-500/90 uppercase tracking-widest mt-0.5">
              {settings.tagline}
            </p>
          </div>

          <p className="text-xs text-stone-400 leading-relaxed max-w-sm">
            Pakistan’s premier online destination for luxury crockery, bone china dinner sets, tea & coffee ware, 
            serving tureens, and curated aesthetic home decor. Bringing royal elegance into modern living spaces.
          </p>

          <div className="space-y-2.5 pt-2 text-xs text-stone-300">
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <span>{settings.address}</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-amber-500 shrink-0" />
              <span>{settings.phone}</span>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-amber-500 shrink-0" />
              <span>{settings.email}</span>
            </div>
            <div className="flex items-center gap-3">
              <MessageSquare className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>WhatsApp: {settings.whatsapp}</span>
            </div>
          </div>

          <button
            onClick={() => openWhatsApp()}
            className="mt-3 flex items-center gap-2 bg-emerald-700 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-semibold transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Chat on WhatsApp</span>
          </button>
        </div>

        {/* Column 2: Top Categories */}
        <div>
          <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-4">
            Crockery Categories
          </h4>
          <ul className="space-y-2 text-xs text-stone-400">
            {categories.slice(0, 6).map((cat) => (
              <li key={cat.id}>
                <button
                  onClick={() => navigate(`/category/${cat.slug}`)}
                  className="hover:text-amber-400 transition-colors text-left"
                >
                  {cat.name}
                </button>
              </li>
            ))}
            <li>
              <button
                onClick={() => navigate('/catalog')}
                className="text-amber-500 font-medium hover:underline flex items-center gap-1 mt-1"
              >
                <span>View Full Catalog</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </li>
          </ul>
        </div>

        {/* Column 3: Home Decor & Gifts */}
        <div>
          <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-4">
            Decor & Accents
          </h4>
          <ul className="space-y-2 text-xs text-stone-400">
            {categories.slice(6, 12).map((cat) => (
              <li key={cat.id}>
                <button
                  onClick={() => navigate(`/category/${cat.slug}`)}
                  className="hover:text-amber-400 transition-colors text-left"
                >
                  {cat.name}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 4: Customer Services & Information */}
        <div>
          <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-4">
            Customer Care
          </h4>
          <ul className="space-y-2 text-xs text-stone-400">
            <li>
              <button
                onClick={() => navigate('/account')}
                className="hover:text-amber-400 transition-colors"
              >
                My Account & Order History
              </button>
            </li>
            <li>
              <button
                onClick={() => navigate('/cart')}
                className="hover:text-amber-400 transition-colors"
              >
                Shopping Bag & Checkout
              </button>
            </li>
            <li>
              <button
                onClick={() => navigate('/guides')}
                className="hover:text-amber-400 transition-colors"
              >
                Crockery Care & Buying Guides
              </button>
            </li>
            <li>
              <button
                onClick={() => navigate('/catalog?filter=sale')}
                className="hover:text-rose-400 transition-colors text-rose-400 font-medium"
              >
                Hot Crazy Deals
              </button>
            </li>
            <li>
              <button
                onClick={() => navigate('/admin')}
                className="hover:text-stone-200 transition-colors text-stone-500 text-[11px]"
              >
                Store Admin Portal
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-stone-800/80 py-6 px-4 sm:px-6 lg:px-8 text-center text-xs text-stone-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 {settings.storeName}. All Rights Reserved. Crafted for Pakistani Homes.</p>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Currency: PKR (Pakistani Rupee)</span>
            <span>•</span>
            <span>Bank Transfer Verified</span>
            <span>•</span>
            <span>Safe Cargo Transit</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
