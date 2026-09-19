import React, { useEffect } from 'react';
import { 
  ShoppingBag, Trash2, ArrowRight, ArrowLeft, 
  ShieldCheck, Truck, Scale, RotateCcw 
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useRouter } from '../router/Router';
import { updateSEO } from '../utils/seo';

export const CartPage: React.FC = () => {
  const { 
    cart, removeFromCart, updateQuantity, clearCart, 
    cartSubtotal, cartTotalWeightKg, settings 
  } = useStore();
  const { navigate } = useRouter();

  useEffect(() => {
    updateSEO({
      title: 'Shopping Bag',
      description: 'Review your selected crockery, dinner sets, and home decor before proceeding to secure checkout.',
    });
  }, []);

  if (cart.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center mx-auto text-stone-400">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
          Your Shopping Bag is Empty
        </h1>
        <p className="text-xs sm:text-sm text-stone-500 max-w-md mx-auto leading-relaxed">
          Looks like you haven&apos;t added any luxury crockery or decor items yet. Discover our latest bone china dinner sets, crystal glassware, and table accents at crazy wholesale prices.
        </p>
        <button
          onClick={() => navigate('/catalog')}
          className="inline-flex items-center gap-2 bg-stone-900 text-white px-6 py-3.5 rounded-xl text-xs font-bold hover:bg-amber-700 transition-colors shadow-sm"
        >
          <span>Explore Crockery Catalog</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // Estimated door-to-door courier cost indicator
  const estimatedCourier = Math.ceil(cartTotalWeightKg) * (settings.doorToDoor?.ratePerKg || 250);
  const estimatedCargo = Math.ceil(cartTotalWeightKg) * (settings.localCargo?.ratePerKg || 120);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-8">
        <div>
          <span className="text-xs font-bold text-amber-700 uppercase tracking-widest">
            Review Order
          </span>
          <h1 className="font-serif text-2xl sm:text-4xl font-extrabold text-stone-950 mt-1">
            Your Shopping Bag
          </h1>
        </div>
        <button
          onClick={clearCart}
          className="text-xs font-semibold text-rose-600 hover:text-rose-800 flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Clear Shopping Bag</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
        {/* Cart Items List */}
        <div className="lg:col-span-2 space-y-4">
          {cart.map((item) => {
            const lineTotal = item.unitPrice * item.quantity;
            const isDiscounted = Boolean(item.salePrice);

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6"
              >
                {/* Thumbnail */}
                <div 
                  onClick={() => navigate(`/product/${item.productSlug}`)}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-stone-100 shrink-0 cursor-pointer"
                >
                  <img
                    src={item.image}
                    alt={item.productTitle}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-[11px] text-stone-400 font-mono">
                    <span>SKU: {item.sku}</span>
                    <span>•</span>
                    <span>Weight: {item.weightKg} kg</span>
                  </div>

                  <h3 
                    onClick={() => navigate(`/product/${item.productSlug}`)}
                    className="font-serif text-sm sm:text-base font-bold text-stone-900 truncate hover:text-amber-700 cursor-pointer mt-0.5"
                  >
                    {item.productTitle}
                  </h3>

                  {item.variantDescription && (
                    <span className="inline-block px-2 py-0.5 mt-1 bg-stone-100 text-stone-700 rounded-md text-[11px] font-medium">
                      {item.variantDescription}
                    </span>
                  )}

                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-sm font-bold text-stone-950">
                      {settings.currencySymbol} {item.unitPrice.toLocaleString()}
                    </span>
                    <span className="text-[11px] text-stone-400">each</span>
                  </div>
                </div>

                {/* Quantity Controls & Line Total */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-stone-100">
                  <div className="flex items-center border border-stone-200 rounded-xl overflow-hidden bg-stone-50">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="px-2.5 py-1 text-xs text-stone-700 hover:bg-stone-200"
                    >
                      -
                    </button>
                    <span className="px-3 py-1 text-xs font-bold text-stone-900 min-w-8 text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      disabled={item.quantity >= item.maxStock}
                      className="px-2.5 py-1 text-xs text-stone-700 hover:bg-stone-200 disabled:opacity-40"
                    >
                      +
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-sm sm:text-base font-bold text-stone-950">
                      {settings.currencySymbol} {lineTotal.toLocaleString()}
                    </span>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="p-1.5 text-stone-400 hover:text-rose-600 transition-colors"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          <div className="pt-2 flex items-center justify-between">
            <button
              onClick={() => navigate('/catalog')}
              className="inline-flex items-center gap-2 text-xs font-semibold text-stone-700 hover:text-stone-950"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Continue Shopping</span>
            </button>
          </div>
        </div>

        {/* Cart Summary Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/80 shadow-sm space-y-6">
          <h3 className="font-serif text-lg font-bold text-stone-900 pb-3 border-b border-stone-100">
            Order Summary
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between text-stone-600">
              <span>Items Subtotal:</span>
              <span className="font-bold text-stone-950">
                {settings.currencySymbol} {cartSubtotal.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center justify-between text-stone-600">
              <span className="flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-amber-700" />
                Total Parcel Weight:
              </span>
              <span className="font-bold text-stone-950">{cartTotalWeightKg} KG</span>
            </div>

            <div className="pt-3 border-t border-stone-100 space-y-1 text-stone-500 text-[11px]">
              <div className="flex items-center justify-between">
                <span>Est. Courier (TCS / Trax):</span>
                <span>~{settings.currencySymbol} {estimatedCourier.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Est. Heavy Cargo:</span>
                <span>~{settings.currencySymbol} {estimatedCargo.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-emerald-700 font-medium">
                <span>Self Pickup at Warehouse:</span>
                <span>FREE (0 PKR)</span>
              </div>
              <p className="text-[10px] text-stone-400 italic pt-1">
                *Exact delivery method and final shipping cost will be selected on checkout page.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-stone-100 flex items-baseline justify-between">
            <span className="text-sm font-bold text-stone-900">Total Before Delivery:</span>
            <span className="text-xl font-extrabold text-stone-950">
              {settings.currencySymbol} {cartSubtotal.toLocaleString()}
            </span>
          </div>

          <button
            onClick={() => navigate('/checkout')}
            className="w-full flex items-center justify-center gap-2 bg-stone-900 text-white py-3.5 px-6 rounded-xl text-xs font-bold hover:bg-amber-700 transition-all shadow-sm active:scale-98"
          >
            <span>Proceed to Secure Checkout</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="space-y-2 pt-2 text-[11px] text-stone-500">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Fragile safety guaranteed with break-proof padding</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Door-to-door delivery across all cities of Pakistan</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
