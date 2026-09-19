import React, { useState, useEffect } from 'react';
import { X, Check, ShoppingBag, ArrowRight, ExternalLink, ShieldCheck, Truck } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { useRouter } from '../../router/Router';
import { ProductVariant } from '../../types';

export const QuickViewModal: React.FC = () => {
  const { quickViewProduct, setQuickViewProduct, addToCart, settings } = useStore();
  const { navigate } = useRouter();

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(undefined);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState<string>('');

  useEffect(() => {
    if (quickViewProduct) {
      if (quickViewProduct.variants && quickViewProduct.variants.length > 0) {
        setSelectedVariant(quickViewProduct.variants[0]);
      } else {
        setSelectedVariant(undefined);
      }
      setActiveImage(quickViewProduct.images[0] || '');
      setQuantity(1);
    }
  }, [quickViewProduct]);

  if (!quickViewProduct) return null;

  const product = quickViewProduct;
  const isDiscounted = typeof (selectedVariant?.salePrice ?? product.salePrice) === 'number' &&
    (selectedVariant?.salePrice ?? product.salePrice)! < (selectedVariant?.regularPrice ?? product.regularPrice);

  const activePrice = isDiscounted
    ? (selectedVariant?.salePrice ?? product.salePrice)!
    : (selectedVariant?.regularPrice ?? product.regularPrice);

  const regularPrice = selectedVariant?.regularPrice ?? product.regularPrice;
  const currentStock = selectedVariant ? selectedVariant.stockQuantity : product.stockQuantity;

  const handleClose = () => {
    setQuickViewProduct(null);
  };

  const handleAddToCart = () => {
    const success = addToCart(product, quantity, selectedVariant);
    if (success) {
      handleClose();
    }
  };

  const handleViewFullPage = () => {
    handleClose();
    navigate(`/product/${product.slug}`);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className="relative bg-white rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-20 p-2 text-stone-400 hover:text-stone-900 bg-white/80 backdrop-blur-xs rounded-full shadow-sm hover:bg-stone-100 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Gallery side */}
          <div className="bg-stone-100 p-6 flex flex-col justify-between">
            <div className="aspect-square rounded-2xl overflow-hidden bg-white shadow-inner flex items-center justify-center">
              <img
                src={activeImage || product.images[0]}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Thumbnail dots/selectors if multiple images */}
            {product.images.length > 1 && (
              <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-1">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(img)}
                    className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
                      activeImage === img ? 'border-stone-900 scale-105' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details side */}
          <div className="p-6 md:p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-stone-500 font-medium mb-1">
                <span>{product.category}</span>
                <span className="font-mono text-stone-400">SKU: {selectedVariant?.sku || product.sku}</span>
              </div>

              <h2 className="font-serif text-xl sm:text-2xl font-bold text-stone-900 leading-tight">
                {product.title}
              </h2>

              <p className="text-xs text-stone-500 mt-1">Brand: {product.brand}</p>

              {/* Price section */}
              <div className="flex items-baseline gap-3 mt-4">
                <span className="text-2xl font-bold text-stone-950">
                  {settings.currencySymbol} {activePrice.toLocaleString()}
                </span>
                {isDiscounted && (
                  <span className="text-sm text-stone-400 line-through">
                    {settings.currencySymbol} {regularPrice.toLocaleString()}
                  </span>
                )}
                {isDiscounted && (
                  <span className="px-2 py-0.5 bg-rose-100 text-rose-800 text-xs font-bold rounded-md">
                    Save {Math.round(((regularPrice - activePrice) / regularPrice) * 100)}%
                  </span>
                )}
              </div>

              {/* Stock info */}
              <div className="mt-3 flex items-center gap-2 text-xs">
                {currentStock > 0 ? (
                  <span className="text-emerald-700 font-medium flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    In Stock ({currentStock} available)
                  </span>
                ) : (
                  <span className="text-rose-600 font-medium">Currently Out of Stock</span>
                )}
                {product.weightKg > 0 && (
                  <span className="text-stone-400">• Weight: {product.weightKg} kg</span>
                )}
              </div>

              {/* Variant Selector */}
              {product.variants && product.variants.length > 0 && (
                <div className="mt-5 pt-4 border-t border-stone-100">
                  <label className="text-xs font-semibold text-stone-800 block mb-2">
                    Select Option / Variant:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {product.variants.map((v) => {
                      const isSelected = selectedVariant?.id === v.id;
                      return (
                        <button
                          key={v.id}
                          onClick={() => {
                            setSelectedVariant(v);
                            if (v.image) setActiveImage(v.image);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                            isSelected
                              ? 'border-stone-900 bg-stone-900 text-white shadow-xs'
                              : 'border-stone-200 bg-white text-stone-700 hover:border-stone-400'
                          }`}
                        >
                          {v.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quantity selector */}
              <div className="mt-5 flex items-center gap-3">
                <span className="text-xs font-semibold text-stone-800">Quantity:</span>
                <div className="flex items-center border border-stone-200 rounded-xl overflow-hidden bg-stone-50">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="px-3 py-1.5 text-stone-700 hover:bg-stone-200 transition-colors disabled:opacity-40"
                  >
                    -
                  </button>
                  <span className="px-3 py-1.5 text-xs font-semibold min-w-8 text-center text-stone-900">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(currentStock, q + 1))}
                    disabled={quantity >= currentStock}
                    className="px-3 py-1.5 text-stone-700 hover:bg-stone-200 transition-colors disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="mt-6 pt-4 border-t border-stone-100 flex flex-col gap-2.5">
              <button
                onClick={handleAddToCart}
                disabled={currentStock <= 0}
                className="w-full flex items-center justify-center gap-2 bg-stone-900 text-white py-3 rounded-xl text-sm font-semibold hover:bg-amber-700 transition-colors shadow-sm disabled:bg-stone-200 disabled:text-stone-400"
              >
                <ShoppingBag className="w-4 h-4" />
                Add to Shopping Bag
              </button>

              <button
                onClick={handleViewFullPage}
                className="w-full flex items-center justify-center gap-1.5 text-stone-600 hover:text-stone-950 py-2 text-xs font-medium transition-colors"
              >
                <span>View Full Product Details & Specs</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
