/**
 * inventoryApi.js
 * Real-time Mock Catalog and Inventory Sync Service
 */

const INITIAL_CATALOG = [
  {
    id: 'prod-1',
    title: 'AeroPulse Wireless ANC Headphones',
    category: 'Audio & Tech',
    price: 4499.00,
    originalPrice: 5999.00,
    rating: 4.9,
    reviewsCount: 128,
    stock: 8,
    badge: 'Best Seller',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=800&q=80'
    ],
    description: 'Ultra-low latency Bluetooth 5.3 headphones with hybrid active noise cancellation, 40-hour battery life, and plush memory foam ear cushions for all-day comfort.',
    features: ['40mm Custom Dynamic Drivers', 'Hybrid ANC with Transparency Mode', '40hr Battery with Fast Charge', 'Multi-point Bluetooth 5.3']
  },
  {
    id: 'prod-2',
    title: 'Minimalist Titanium Mechanical Keyboard',
    category: 'Workspace',
    price: 3899.00,
    originalPrice: 4599.00,
    rating: 4.8,
    reviewsCount: 94,
    stock: 4,
    badge: 'Low Stock',
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=800&q=80'
    ],
    description: 'Precision CNC-machined 75% mechanical keyboard with hot-swappable tactile switches, gasket mount design, and per-key RGB backlight.',
    features: ['Gasket Mount Structure', 'Hot-swappable Switches', 'Factory Lubed Stabilizers', 'Anodized Aluminum Frame']
  },
  {
    id: 'prod-3',
    title: 'Artisan Precision Pour-Over Kettle',
    category: 'Lifestyle',
    price: 1999.00,
    originalPrice: 2499.00,
    rating: 4.9,
    reviewsCount: 215,
    stock: 12,
    badge: 'Popular',
    image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80'
    ],
    description: 'Counterbalanced matte black gooseneck kettle featuring variable temperature control and a built-in brew stopwatch for the perfect extraction.',
    features: ['Gooseneck Spout for Precision Flow', 'Built-in Temperature Gauge', '1.0L Capacity 304 Stainless Steel', 'Ergonomic Cool-Touch Handle']
  },
  {
    id: 'prod-4',
    title: 'Chronos Ceramic Smart Chronometer',
    category: 'Wearables',
    price: 6999.00,
    originalPrice: 8499.00,
    rating: 4.7,
    reviewsCount: 68,
    stock: 3,
    badge: 'Limited Edition',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=800&q=80'
    ],
    description: 'Zirconia ceramic bezel with scratch-resistant sapphire crystal. Tracks heart rate, SpO2, sleep recovery metrics, and offers 14-day battery endurance.',
    features: ['Always-On AMOLED Display', 'Titanium & Ceramic Casing', '5ATM Water Resistance', '14-Day Battery Life']
  },
  {
    id: 'prod-5',
    title: 'Modular Water-Resistant Urban Backpack',
    category: 'Apparel & Bags',
    price: 2799.00,
    originalPrice: 3299.00,
    rating: 4.85,
    reviewsCount: 160,
    stock: 15,
    badge: null,
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?auto=format&fit=crop&w=800&q=80'
    ],
    description: 'Crafted from 100% recycled Cordura fabric with magnetic Fidlock buckles, dedicated 16” laptop compartment, and luggage pass-through.',
    features: ['Weatherproof Cordura 500D', 'Padded 16" Laptop Sleeve', 'Hidden Passport / AirTag Pocket', 'Fidlock Magnetic Buckles']
  },
  {
    id: 'prod-6',
    title: 'Luminary Ambient Desk Lamp & Qi Charger',
    category: 'Workspace',
    price: 1699.00,
    originalPrice: 2199.00,
    rating: 4.75,
    reviewsCount: 82,
    stock: 7,
    badge: null,
    image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80'
    ],
    description: 'Architectural aluminum LED bar with stepless color temperature adjustment (2700K-6500K) and integrated 15W fast wireless charging pad.',
    features: ['Stepless Dimming & Color Temp', '15W Fast Qi Wireless Base', 'Touch Gestures & Auto Timer', 'Eye-caring Flicker-Free CRI 95+']
  },
  {
    id: 'prod-7',
    title: 'Nordic Organic Roasted Coffee Beans (1kg)',
    category: 'Lifestyle',
    price: 899.00,
    originalPrice: 1099.00,
    rating: 4.95,
    reviewsCount: 310,
    stock: 25,
    badge: 'Fresh Batch',
    image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1611854779393-1b2da9d400fe?auto=format&fit=crop&w=800&q=80'
    ],
    description: 'Single-origin Ethiopian Yirgacheffe specialty beans. Medium roast with vibrant notes of bergamot, candied peach, and jasmine aroma.',
    features: ['100% Arabica Single Origin', 'Freshly Roasted Weekly', 'Degassing Valve Pouch', 'Direct Trade Certified']
  },
  {
    id: 'prod-8',
    title: 'Solid Walnut Ergonomic Monitor Riser',
    category: 'Workspace',
    price: 2299.00,
    originalPrice: 2799.00,
    rating: 4.88,
    reviewsCount: 142,
    stock: 0,
    badge: 'Out of Stock',
    image: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=800&q=80'
    ],
    description: 'Crafted from sustainable American Walnut with cork feet. Elevates screen to optimal eye height while storing your keyboard underneath.',
    features: ['Solid American Walnut', 'Supports up to 50kg', 'Non-slip Cork Feet', 'Integrated Cable Channel']
  }
];

// Local storage key for persistent simulation
const STORAGE_KEY = 'quickcart_inventory_data_inr_v2';

import { fetchLiveProductsFromBackend } from './supabaseStore';

class InventoryService {
  constructor() {
    this.listeners = new Set();
    this.products = this.loadInitialData();
    // Pre-fetch live products from Supabase API
    this.fetchCatalog();
  }

  loadInitialData() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Could not read inventory from localStorage', e);
    }
    return INITIAL_CATALOG;
  }

  saveData() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.products));
    } catch (e) {
      console.warn('Could not save inventory to localStorage', e);
    }
  }

  /**
   * Subscribe to real-time inventory updates
   */
  subscribe(callback) {
    this.listeners.add(callback);
    // Initial call
    callback(this.products);
    // Trigger async sync with backend
    this.fetchCatalog();
    return () => this.listeners.delete(callback);
  }

  notify() {
    this.saveData();
    for (const listener of this.listeners) {
      listener([...this.products]);
    }
  }

  /**
   * Fetch all products from XYVOT / Supabase backend or local cache
   */
  async fetchCatalog() {
    try {
      const liveProducts = await fetchLiveProductsFromBackend();
      if (liveProducts && liveProducts.length > 0) {
        this.products = liveProducts;
        this.notify();
        return liveProducts;
      }
    } catch (err) {
      console.warn('Live products fetch failed, using fallback catalog:', err);
    }
    return [...this.products];
  }

  /**
   * Get single product by ID
   */
  async getProductById(id) {
    const product = this.products.find((p) => p.id === id);
    return product ? { ...product } : null;
  }

  /**
   * Check if quantity is available in stock
   */
  checkStock(id, requestedQty = 1) {
    const product = this.products.find((p) => p.id === id);
    if (!product) return { available: false, currentStock: 0 };
    return {
      available: product.stock >= requestedQty,
      currentStock: product.stock,
      maxAllowed: product.stock
    };
  }

  /**
   * Decrement stock when order is placed
   */
  async decrementStockForOrder(items) {
    let updated = false;
    this.products = this.products.map((prod) => {
      const matched = items.find((item) => item.id === prod.id);
      if (matched) {
        const newStock = Math.max(0, prod.stock - matched.quantity);
        updated = true;
        return { ...prod, stock: newStock };
      }
      return prod;
    });

    if (updated) {
      this.notify();
    }
    return true;
  }

  /**
   * Restock catalog back to defaults
   */
  resetCatalog() {
    this.products = JSON.parse(JSON.stringify(INITIAL_CATALOG));
    this.notify();
  }

  /**
   * Update individual product stock (Admin / Mock trigger)
   */
  updateStock(id, newStock) {
    this.products = this.products.map((p) =>
      p.id === id ? { ...p, stock: Math.max(0, Number(newStock)) } : p
    );
    this.notify();
  }
}

export const inventoryApi = new InventoryService();
