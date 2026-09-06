import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { ProductCard } from './components/ProductCard';
import { ProductDetailPage } from './components/ProductDetailPage';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderSuccessModal } from './components/OrderSuccessModal';
import { ToastContainer } from './components/Toast';
import { inventoryApi } from './services/inventoryApi';
import { useSettings } from './context/SettingsContext';
import { useCart } from './context/CartContext';
import { useToast } from './context/ToastContext';
import { 
  SlidersHorizontal, 
  ArrowUpDown, 
  Sparkles, 
  ShieldCheck, 
  Truck, 
  MessageCircle, 
  Package, 
  Search,
  RefreshCw,
  ShoppingBag,
  Grid
} from 'lucide-react';
import { smartSearchProducts } from './utils/searchHelper';
import { CategorySidebar } from './components/CategorySidebar';
import { CategoryShelf } from './components/CategoryShelf';
import { WhatsAppLoginModal } from './components/WhatsAppLoginModal';
import { MyOrdersModal } from './components/MyOrdersModal';
import { CustomerProfileModal } from './components/CustomerProfileModal';
import { fetchSingleProductById } from './services/supabaseStore';

export function App() {
  const { settings } = useSettings();
  const { totalItemsCount, setIsCartOpen } = useCart();
  const { showToast } = useToast();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters & Sorting
  const [selectedCategory, setSelectedCategory] = useState('All Products');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('featured'); // 'featured' | 'price-low' | 'price-high' | 'rating' | 'stock'

  // Modals state
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [latestOrderInfo, setLatestOrderInfo] = useState(null);

  // Helper to extract productId from current window.location
  const getProductIdFromUrl = () => {
    // 1. Check path: /product/:id or /p/:id (supports trailing slashes)
    const pathname = window.location.pathname;
    const pathMatch = pathname.match(/\/(?:product|p)\/([^/?#]+)/i);
    if (pathMatch && pathMatch[1]) {
      return decodeURIComponent(pathMatch[1]).replace(/\/+$/, '');
    }

    // 2. Check query params: ?p=:id or ?product=:id
    const params = new URLSearchParams(window.location.search);
    const paramId = params.get('p') || params.get('product');
    if (paramId) {
      return decodeURIComponent(paramId).trim();
    }

    // 3. Check hash: #/product/:id or #product-:id
    const hash = window.location.hash;
    const hashMatch = hash.match(/#\/?(?:product|p)?\/?([^/?#]+)/i);
    if (hashMatch && hashMatch[1]) {
      return decodeURIComponent(hashMatch[1]).replace(/\/+$/, '');
    }

    return null;
  };

  // Instant Direct Deep-Link Resolution on Initial Mount
  useEffect(() => {
    const urlProductId = getProductIdFromUrl();
    if (urlProductId) {
      fetchSingleProductById(urlProductId).then((prod) => {
        if (prod) {
          setSelectedProduct(prod);
          document.title = `${prod.title || prod.name} — Ganapati Store`;
        }
      });
    }
  }, []);

  // Sync product from URL when products list loads or changes
  useEffect(() => {
    const urlProductId = getProductIdFromUrl();
    if (urlProductId && products.length > 0) {
      const found = products.find((p) => String(p.id).toLowerCase() === String(urlProductId).toLowerCase());
      if (found) {
        setSelectedProduct(found);
        document.title = `${found.title || found.name} — Ganapati Store`;
      }
    }
  }, [products]);

  // Handle Browser Back / Forward buttons (popstate)
  useEffect(() => {
    const handlePopState = () => {
      const urlProductId = getProductIdFromUrl();
      if (urlProductId) {
        const found = products.find((p) => String(p.id).toLowerCase() === String(urlProductId).toLowerCase());
        if (found) {
          setSelectedProduct(found);
          document.title = `${found.title || found.name} — Ganapati Store`;
        } else {
          fetchSingleProductById(urlProductId).then((prod) => {
            if (prod) {
              setSelectedProduct(prod);
              document.title = `${prod.title || prod.name} — Ganapati Store`;
            } else {
              setSelectedProduct(null);
              document.title = 'Ganapati Store — Fresh Groceries & Daily Essentials';
            }
          });
        }
      } else {
        setSelectedProduct(null);
        document.title = 'Ganapati Store — Fresh Groceries & Daily Essentials';
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [products]);

  // Handle selecting a product with clean URL update
  const handleSelectProduct = (prod) => {
    setSelectedProduct(prod);
    if (prod) {
      window.history.pushState({ productId: prod.id }, '', `/product/${prod.id}`);
      document.title = `${prod.title || prod.name} — Ganapati Store`;
    } else {
      window.history.pushState({}, '', '/');
      document.title = 'Ganapati Store — Fresh Groceries & Daily Essentials';
    }
  };

  // Handle navigating back to home
  const handleBackToShop = () => {
    setSelectedProduct(null);
    window.history.pushState({}, '', '/');
    document.title = 'Ganapati Store — Fresh Groceries & Daily Essentials';
  };

  // Dynamically extract unique categories from actual products
  const dynamicCategories = useMemo(() => {
    const cats = new Set();
    products.forEach((p) => {
      if (p.category && typeof p.category === 'string' && p.category.trim()) {
        cats.add(p.category.trim());
      }
    });
    return ['All Products', ...Array.from(cats)];
  }, [products]);

  // Subscribe to real-time inventory updates
  useEffect(() => {
    const unsubscribe = inventoryApi.subscribe((updatedProducts) => {
      setProducts(updatedProducts);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleRefreshInventory = async () => {
    setIsRefreshing(true);
    const catalog = await inventoryApi.fetchCatalog();
    setProducts(catalog);
    setTimeout(() => {
      setIsRefreshing(false);
      showToast('Inventory stock synced in real-time!', 'info');
    }, 400);
  };

  // Filter & Sort computation with Smart Typo-Tolerant Search
  const filteredProducts = useMemo(() => {
    // 1. Filter by category
    const categoryFiltered = products.filter((p) => {
      return (
        selectedCategory === 'All Products' ||
        (p.category && p.category.toLowerCase() === selectedCategory.toLowerCase())
      );
    });

    // 2. Apply smart typo-tolerant fuzzy search
    const searched = searchQuery.trim()
      ? smartSearchProducts(categoryFiltered, searchQuery)
      : categoryFiltered;

    // 3. Apply sorting (if explicit sort chosen, otherwise preserve relevance)
    return [...searched].sort((a, b) => {
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'stock') return b.stock - a.stock;
      return 0; // relevance / featured default
    });
  }, [products, selectedCategory, searchQuery, sortBy]);

  const inStockCount = products.filter((p) => p.stock > 0).length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* Toast notifications */}
      <ToastContainer />

      {/* Navigation */}
      <Navbar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onHomeClick={handleBackToShop}
      />

      {/* Main View: Full Product Detail Page OR Store Catalog */}
      {selectedProduct ? (
        <ProductDetailPage
          product={selectedProduct}
          allProducts={products}
          onBack={handleBackToShop}
          onSelectProduct={handleSelectProduct}
        />
      ) : (
        <>
          {/* Hero Section (Light Version matching Ganapati Store) */}
          <section className="relative overflow-hidden bg-gradient-to-b from-white via-emerald-50/30 to-slate-50 border-b border-slate-200/80 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
            <div className="absolute inset-0 opacity-[0.12] bg-[radial-gradient(#059669_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />
            
            <div className="max-w-7xl mx-auto relative z-10">
              <div className="max-w-3xl space-y-3 sm:space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/70 border border-emerald-200/80 text-emerald-800 text-xs font-bold shadow-xs">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Fresh Groceries &bull; Live Inventory &bull; WhatsApp COD</span>
                </div>

                <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight text-slate-900">
                  Ganapati Store{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">
                    &bull; Daily Essentials & Staples
                  </span>
                </h1>

                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed max-w-2xl font-normal">
                  Order authentic groceries, staples, spices, and fresh household essentials. Enjoy live stock availability, GPS map pinpointing for doorstep delivery, and 100% verified Cash on Delivery.
                </p>

                {/* Value Props */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3 pt-2 text-xs font-semibold text-slate-700">
                  <div className="flex items-center gap-2.5 bg-white border border-slate-200/90 p-2.5 sm:p-3 rounded-lg shadow-xs hover:border-emerald-300 transition-colors">
                    <div className="w-7 h-7 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                      <MessageCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">WhatsApp OTP</p>
                      <p className="text-[10px] text-slate-500 font-normal">Instant 1-Click Login</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2.5 bg-white border border-slate-200/90 p-2.5 sm:p-3 rounded-lg shadow-xs hover:border-emerald-300 transition-colors">
                    <div className="w-7 h-7 rounded-md bg-teal-50 text-teal-600 flex items-center justify-center flex-shrink-0">
                      <Truck className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">GPS Map Pin</p>
                      <p className="text-[10px] text-slate-500 font-normal">Accurate Doorstep Drop</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 bg-white border border-slate-200/90 p-2.5 sm:p-3 rounded-lg shadow-xs hover:border-emerald-300 transition-colors col-span-2 sm:col-span-1">
                    <div className="w-7 h-7 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">Cash on Delivery</p>
                      <p className="text-[10px] text-slate-500 font-normal">Pay When Delivered</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Catalog Main 2-Column Split Layout Area (Mobile & Desktop) */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-6">
            
            <div className="flex flex-row gap-2 sm:gap-4 lg:gap-6 items-start">
              
              {/* Left Column: Blinkit-Style Vertical Category Rail */}
              <CategorySidebar
                categories={dynamicCategories}
                products={products}
                selectedCategory={selectedCategory}
                onSelectCategory={(cat) => {
                  setSelectedCategory(cat);
                  setSearchQuery('');
                }}
              />

              {/* Right Column: High-Density Product Catalog */}
              <div className="flex-1 min-w-0 space-y-4">
                
                {/* Department Header & Sort Bar (Clean & Transparent) */}
                {(selectedCategory !== 'All Products' || searchQuery.trim()) && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2.5 border-b border-slate-200/80">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-600" />
                      <h1 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-700">
                        {selectedCategory}
                      </h1>
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-200/70 px-1.5 py-0.5 rounded">
                        {filteredProducts.length} {filteredProducts.length === 1 ? 'item' : 'items'}
                      </span>
                      <button
                        onClick={() => setSelectedCategory('All Products')}
                        className="text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded transition-colors"
                      >
                        Clear Filter &times;
                      </button>
                    </div>

                    {/* Sorting dropdown */}
                    <div className="flex items-center gap-2 self-end sm:self-auto bg-white border border-slate-200 rounded px-2.5 py-1 shadow-xs">
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="text-xs font-bold text-slate-700 bg-transparent outline-none cursor-pointer"
                      >
                        <option value="featured">Featured First</option>
                        <option value="price-low">Price: Low to High</option>
                        <option value="price-high">Price: High to Low</option>
                        <option value="rating">Highest Rated</option>
                        <option value="stock">Most in Stock</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Products Grid */}
                {loading ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-3">
                    {[...Array(10)].map((_, i) => (
                      <div key={i} className="bg-white rounded p-3 border border-slate-100 space-y-2 animate-pulse">
                        <div className="aspect-square bg-slate-200 rounded" />
                        <div className="h-3 bg-slate-200 rounded w-2/3" />
                        <div className="h-3 bg-slate-200 rounded w-1/2" />
                        <div className="h-6 bg-slate-200 rounded w-full pt-1" />
                      </div>
                    ))}
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="bg-white rounded p-10 text-center border border-slate-200/90 space-y-3 max-w-md mx-auto my-6 shadow-xs">
                    <div className="w-12 h-12 rounded bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                      <Search className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">No matching products found</h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Try searching with different keywords or switch department categories.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedCategory('All Products');
                        setSearchQuery('');
                      }}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded transition-colors shadow-xs"
                    >
                      Reset Filters
                    </button>
                  </div>
                ) : selectedCategory === 'All Products' && !searchQuery.trim() ? (
                  /* Multi-Category Shelves View within Split Layout */
                  <div className="space-y-8">
                    {dynamicCategories
                      .filter((cat) => cat !== 'All Products')
                      .map((catName) => {
                        const catProducts = products.filter(
                          (p) => p.category && p.category.toLowerCase() === catName.toLowerCase()
                        );
                        return (
                          <CategoryShelf
                            key={catName}
                            categoryName={catName}
                            products={catProducts}
                            onSelectProduct={handleSelectProduct}
                            onViewCategory={(cat) => setSelectedCategory(cat)}
                          />
                        );
                      })}
                  </div>
                ) : (
                  /* High-Density Compact Product Grid */
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-3">
                    {filteredProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onSelectProduct={handleSelectProduct}
                      />
                    ))}
                  </div>
                )}

              </div>

            </div>

          </main>
        </>
      )}

      {/* Floating Cart Button on Mobile */}
      {totalItemsCount > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 sm:hidden animate-slide-up">
          <button
            onClick={() => setIsCartOpen(true)}
            className="flex items-center gap-2.5 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded font-bold text-xs uppercase tracking-wider shadow-xl shadow-emerald-600/30 active:scale-95"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>View Cart ({totalItemsCount})</span>
          </button>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200/80 mt-16 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">{settings.storeName}</span>
            <span>&bull;</span>
            <span>WhatsApp OTP & Cash on Delivery (COD) Storefront</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Direct WhatsApp Quick Dispatch</span>
          </div>
        </div>
      </footer>

      {/* Modals & Drawers */}
      <CartDrawer />

      <CheckoutModal
        onOrderSuccess={(orderData) => setLatestOrderInfo(orderData)}
      />

      <OrderSuccessModal
        orderDetails={latestOrderInfo}
        onClose={() => setLatestOrderInfo(null)}
      />

      <WhatsAppLoginModal />

      <MyOrdersModal />

      <CustomerProfileModal />
    </div>
  );
}
