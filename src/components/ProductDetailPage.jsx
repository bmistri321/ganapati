import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Star, 
  Check, 
  AlertTriangle, 
  XCircle, 
  ShoppingBag, 
  Zap, 
  ShieldCheck, 
  Truck, 
  Clock, 
  Plus, 
  Minus,
  Sparkles,
  Layers,
  Package
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import { ProductCard } from './ProductCard';

export const ProductDetailPage = ({ product, allProducts, onBack, onSelectProduct }) => {
  const { addToCart, setIsCartOpen, setIsCheckoutOpen, cartItems } = useCart();
  const { settings } = useSettings();
  const [selectedImage, setSelectedImage] = useState(product?.image || '');
  const [quantity, setQuantity] = useState(1);

  // Scroll to top when product changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (product) {
      setSelectedImage(product.image || '');
      setQuantity(1);
    }
  }, [product]);

  if (!product) return null;

  const cartItem = cartItems.find((i) => i.id === product.id);
  const qtyInCart = cartItem ? cartItem.quantity : 0;
  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 4;
  const isMaxInCart = qtyInCart >= product.stock;

  const validImages = (product.images || []).filter(Boolean);

  // Find similar products from the same category (excluding current product)
  const similarProducts = allProducts
    ? allProducts
        .filter((p) => p.id !== product.id && p.category && product.category && p.category.toLowerCase() === product.category.toLowerCase())
        .slice(0, 4)
    : [];

  // If no similar products in category, fallback to other top products
  const fallbackProducts = similarProducts.length === 0 && allProducts
    ? allProducts.filter((p) => p.id !== product.id).slice(0, 4)
    : similarProducts;

  const handleAddToCart = () => {
    addToCart(product, quantity);
  };

  const handleBuyNow = () => {
    const success = addToCart(product, quantity);
    if (success) {
      setIsCheckoutOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 animate-fade-in pb-16">
      
      {/* Top Breadcrumb Bar with Back Button */}
      <div className="bg-white border-b border-slate-200/80 sticky top-16 sm:top-20 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-700 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 px-3.5 py-1.5 rounded transition-all active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Products</span>
          </button>

          {/* Breadcrumbs */}
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span className="hover:text-slate-800 cursor-pointer" onClick={onBack}>Home</span>
            <span>/</span>
            <span className="text-slate-600 font-semibold">{product.category}</span>
            <span>/</span>
            <span className="text-slate-900 font-bold truncate max-w-[200px]">{product.title}</span>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        
        {/* Main Product Showcase Card */}
        <div className="bg-white rounded border border-slate-200/80 shadow-sm overflow-hidden p-6 sm:p-8 lg:p-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            
            {/* Gallery Column (6 cols) */}
            <div className="lg:col-span-6 space-y-4">
              <div className="relative aspect-square w-full rounded overflow-hidden bg-slate-100 border border-slate-200 shadow-inner flex items-center justify-center">
                {selectedImage ? (
                  <img
                    src={selectedImage}
                    alt={product.title}
                    className="w-full h-full object-cover object-center transition-all duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-slate-100 flex flex-col items-center justify-center text-slate-400 p-8">
                    <Package className="w-20 h-20 text-slate-400" />
                    <span className="text-xs font-semibold text-slate-500 mt-3 text-center uppercase tracking-wider">
                      {product.category || 'Inventory Item'}
                    </span>
                  </div>
                )}

                {product.badge && (
                  <span className="absolute top-4 left-4 px-3 py-1 rounded text-xs font-bold uppercase tracking-wider bg-slate-900/90 text-white backdrop-blur-md">
                    {product.badge}
                  </span>
                )}
                {product.originalPrice && (
                  <span className="absolute top-4 right-4 px-2.5 py-1 rounded text-xs font-bold uppercase bg-rose-600 text-white shadow-sm">
                    Sale
                  </span>
                )}
              </div>

              {/* Thumbnails list */}
              {validImages.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {validImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(img)}
                      className={`relative w-20 h-20 rounded overflow-hidden flex-shrink-0 border-2 transition-all ${
                        selectedImage === img
                          ? 'border-emerald-600 ring-2 ring-emerald-500/30 opacity-100'
                          : 'border-slate-200 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info Column (6 cols) */}
            <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                
                {/* Category & Rating */}
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider bg-emerald-50 border border-emerald-200 px-3 py-1 rounded">
                    {product.category}
                  </span>
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span>{product.rating}</span>
                    <span className="text-slate-400 text-xs">({product.reviewsCount} verified reviews)</span>
                  </div>
                </div>

                {/* Title */}
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                  {product.title}
                </h1>

                {/* Price Display */}
                <div className="flex items-baseline gap-3 pt-1">
                  <span className="text-3xl sm:text-4xl font-black text-slate-900">
                    {settings.currency}{product.price.toFixed(2)}
                  </span>
                  {product.originalPrice && (
                    <span className="text-base text-slate-400 line-through font-medium">
                      {settings.currency}{product.originalPrice.toFixed(2)}
                    </span>
                  )}
                  {product.originalPrice && (
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded">
                      Save {settings.currency}{(product.originalPrice - product.price).toFixed(2)}
                    </span>
                  )}
                </div>

                {/* Stock Status Badge */}
                <div>
                  {isOutOfStock ? (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                      <XCircle className="w-4 h-4 text-rose-600" />
                      Currently Out of Stock
                    </div>
                  ) : isLowStock ? (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 animate-pulse-subtle">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      Limited Stock: Only {product.stock} items available!
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      <Check className="w-4 h-4 text-emerald-600" />
                      In Stock &bull; Ready for Immediate Dispatch ({product.stock} units)
                    </div>
                  )}
                </div>

                {/* Description */}
                <div className="pt-2 border-t border-slate-100">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                    Product Description
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    {product.description}
                  </p>
                </div>

                {/* Features Checklist */}
                {product.features && (
                  <div className="space-y-2 pt-2">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Key Specifications & Highlights
                    </h3>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                      {product.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2 bg-slate-50 p-2.5 rounded border border-slate-100">
                          <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          <span className="font-medium text-slate-800">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

              </div>

              {/* Quantity Selector & Order Buttons */}
              <div className="space-y-4 pt-6 border-t border-slate-100">
                
                {!isOutOfStock && (
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Select Quantity:
                    </span>

                    {/* Stepper */}
                    <div className="flex items-center border border-slate-300 rounded bg-slate-50 p-1">
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        disabled={quantity <= 1}
                        className="w-9 h-9 rounded bg-white shadow-sm flex items-center justify-center text-slate-700 hover:bg-slate-100 font-bold disabled:opacity-40"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-12 text-center text-sm font-black text-slate-900">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                        disabled={quantity >= product.stock}
                        className="w-9 h-9 rounded bg-white shadow-sm flex items-center justify-center text-slate-700 hover:bg-slate-100 font-bold disabled:opacity-40"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Add to Cart & Buy Now Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={isOutOfStock}
                    className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-3.5 px-5 rounded text-sm transition-all shadow-md active:scale-98"
                  >
                    <ShoppingBag className="w-4 h-4 text-emerald-400" />
                    <span>Add to Cart ({quantity})</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleBuyNow}
                    disabled={isOutOfStock}
                    className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-3.5 px-5 rounded text-sm transition-all shadow-lg shadow-emerald-600/20 active:scale-98"
                  >
                    <Zap className="w-4 h-4" />
                    <span>Buy Now & Checkout</span>
                  </button>
                </div>

                {/* Trust Badges */}
                <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 justify-center py-2 bg-slate-50 rounded">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>WhatsApp Verified</span>
                  </div>
                  <div className="flex items-center gap-1.5 justify-center py-2 bg-slate-50 rounded">
                    <Truck className="w-4 h-4 text-emerald-600" />
                    <span>Quick Dispatch</span>
                  </div>
                  <div className="flex items-center gap-1.5 justify-center py-2 bg-slate-50 rounded">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    <span>Live Stock</span>
                  </div>
                </div>

              </div>

            </div>

          </div>
        </div>

        {/* Similar Category Products Section */}
        {fallbackProducts.length > 0 && (
          <div className="space-y-6 pt-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-emerald-600" />
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    Similar Products in {product.category}
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Customers who viewed this item also looked at these related products
                </p>
              </div>

              <button
                onClick={onBack}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded transition-colors hidden sm:inline-block"
              >
                View Full Catalog →
              </button>
            </div>

            {/* Similar Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
              {fallbackProducts.map((simProd) => (
                <ProductCard
                  key={simProd.id}
                  product={simProd}
                  onSelectProduct={(p) => {
                    onSelectProduct(p);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
              ))}
            </div>
          </div>
        )}

      </main>

    </div>
  );
};
