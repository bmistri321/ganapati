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
import { CategoryVisualGrid } from './components/CategoryVisualGrid';
import { CategoryShelf } from './components/CategoryShelf';

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
        onHomeClick={() => setSelectedProduct(null)}
      />

      {/* Main View: Full Product Detail Page OR Store Catalog */}
      {selectedProduct ? (
        <ProductDetailPage
          product={selectedProduct}
          allProducts={products}
          onBack={() => setSelectedProduct(null)}
          onSelectProduct={(p) => setSelectedProduct(p)}
        />
      ) : (
        <>
          {/* Hero Section */}
          <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 text-white py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
            
            <div className="max-w-7xl mx-auto relative z-10">
              <div className="max-w-3xl space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold backdrop-blur-md">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Real-Time Inventory &bull; Instant WhatsApp Dispatch</span>
                </div>

                <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight text-white">
                  Effortless Shopping,{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
                    Zero Friction Checkout.
                  </span>
                </h1>

                <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl">
                  Select your gear from our live stock, pinpoint your delivery map, and place orders directly to WhatsApp without creating an account.
                </p>

                {/* Value Props */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 text-xs font-medium text-slate-300">
                  <div className="flex items-center gap-2 bg-white/5 border border-white/10 p-3 rounded backdrop-blur-sm">
                    <MessageCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Instant WhatsApp Order</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/5 border border-white/10 p-3 rounded backdrop-blur-sm">
                    <Truck className="w-4 h-4 text-teal-400 flex-shrink-0" />
                    <span>Precise GPS Pinpoint</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/5 border border-white/10 p-3 rounded backdrop-blur-sm col-span-2 sm:col-span-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Live Firestore Backup</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Catalog Main Grid Area */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
            
            {/* Clean, Borderless Blinkit-Style Category Row (Image + Title) */}
            <div className="pb-2 border-b border-slate-200/60">
              <CategoryVisualGrid
                categories={dynamicCategories}
                products={products}
                selectedCategory={selectedCategory}
                onSelectCategory={(cat) => {
                  setSelectedCategory(cat);
                  setSearchQuery('');
                }}
              />
            </div>

            {/* Sorting & Filter Summary Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded border border-slate-200/80 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800">
                  {selectedCategory === 'All Products' && !searchQuery.trim() ? 'All Department Shelves' : `Showing: ${selectedCategory}`}
                </span>
                {selectedCategory !== 'All Products' && (
                  <button
                    onClick={() => setSelectedCategory('All Products')}
                    className="text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded transition-colors"
                  >
                    View All &times;
                  </button>
                )}
                {searchQuery.trim() && (
                  <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    Query: "{searchQuery}"
                  </span>
                )}
              </div>

              {/* Sorting */}
              <div className="flex items-center gap-3 self-end sm:self-auto">
                <span className="text-xs text-slate-500 font-medium hidden md:inline">
                  {filteredProducts.length} items found
                </span>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded px-3 py-1.5 shadow-sm">
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="text-xs font-semibold text-slate-700 bg-transparent outline-none cursor-pointer"
                  >
                    <option value="featured">Featured First</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="rating">Highest Rated</option>
                    <option value="stock">Most in Stock</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Product Catalog Display */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-white rounded p-4 border border-slate-100 space-y-3 animate-pulse">
                    <div className="aspect-square bg-slate-200 rounded" />
                    <div className="h-4 bg-slate-200 rounded w-2/3" />
                    <div className="h-3 bg-slate-200 rounded w-full" />
                    <div className="h-6 bg-slate-200 rounded w-1/3 pt-2" />
                  </div>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="bg-white rounded p-12 text-center border border-slate-200/80 space-y-4 max-w-lg mx-auto my-8 shadow-sm">
                <div className="w-16 h-16 rounded bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <Search className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">No matching products found</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Try searching with different keywords or switch categories.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedCategory('All Products');
                    setSearchQuery('');
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded transition-colors shadow-sm"
                >
                  Reset Filters
                </button>
              </div>
            ) : selectedCategory === 'All Products' && !searchQuery.trim() ? (
              /* Blinkit-Style Multi-Category Shelves View */
              <div className="space-y-12">
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
                        onSelectProduct={(p) => setSelectedProduct(p)}
                        onViewCategory={(cat) => setSelectedCategory(cat)}
                      />
                    );
                  })}
              </div>
            ) : (
              /* Filtered / Single Category Grid */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onSelectProduct={(p) => setSelectedProduct(p)}
                  />
                ))}
              </div>
            )}

          </main>
        </>
      )}

      {/* Floating Cart Button on Mobile */}
      {totalItemsCount > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 sm:hidden animate-slide-up">
          <button
            onClick={() => setIsCartOpen(true)}
            className="flex items-center gap-3 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded font-bold text-sm shadow-xl shadow-emerald-600/30 active:scale-95"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>View Cart ({totalItemsCount})</span>
          </button>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200/80 mt-16 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">{settings.storeName}</span>
            <span>&bull;</span>
            <span>Frictionless WhatsApp Ordering System</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Built with React, Tailwind & Firebase</span>
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
    </div>
  );
}
