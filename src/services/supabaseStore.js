/**
 * supabaseStore.js
 * Integration with XYVOT Storefront API & Supabase Backend
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qirpufadoruqvgubpqzx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpcnB1ZmFkb3J1cXZndWJwcXp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzNjgwODUsImV4cCI6MjEwMzk0NDA4NX0.WBzX3E401higTSSrjYMx5LQEcOptiiaU_4Id5j_X8PI';

export const DEFAULT_STORE_API_KEY = 'xyvot_pk_live_8d59e2_n4tuqdx7wivkrw';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Fetch real products dynamically from Supabase database
 */
export async function fetchLiveProductsFromBackend() {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && Array.isArray(data)) {
      return data.map((p) => {
        const price = parseFloat(p.price ?? p.selling_price ?? p.unit_price ?? 0);
        const originalPrice = p.original_price ? parseFloat(p.original_price) : (p.mrp ? parseFloat(p.mrp) : null);
        const stock = parseInt(p.stock_quantity ?? p.stock ?? 0, 10);
        
        // Pure database image without any fake fallback URLs
        const primaryImage = p.image_url || p.image || (Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : null);
        const imageList = Array.isArray(p.images) && p.images.length > 0 
          ? p.images 
          : (primaryImage ? [primaryImage] : []);

        return {
          id: p.id,
          title: p.name || p.title || 'Product Item',
          category: p.category || 'General',
          price: isNaN(price) ? 0 : price,
          originalPrice: originalPrice && !isNaN(originalPrice) ? originalPrice : null,
          rating: parseFloat(p.rating) || 4.9,
          reviewsCount: parseInt(p.reviews_count ?? 48, 10),
          stock: isNaN(stock) ? 0 : stock,
          badge: stock <= 3 && stock > 0 ? 'Low Stock' : (p.badge || (p.featured ? 'Featured' : null)),
          image: primaryImage,
          images: imageList,
          description: p.description || `${p.name || 'Product'} - Real-time verified item from inventory.`,
          features: Array.isArray(p.features) && p.features.length > 0 
            ? p.features 
            : ['Verified Inventory Item', 'Direct WhatsApp Dispatch']
        };
      });
    }
  } catch (err) {
    console.error('Error fetching live products from Supabase:', err);
  }
  return [];
}

/**
 * Fetch real store organization info from database
 */
export async function fetchStoreInfoFromBackend() {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('name, owner_phone, owner_email')
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      return {
        storeName: data.name || 'Store Hub',
        whatsappNumber: data.owner_phone || '+91 9147364980',
        supportEmail: data.owner_email || ''
      };
    }
  } catch (err) {
    console.warn('Could not fetch store organization info:', err);
  }
  return null;
}

/**
 * Submit real order to backend sales_orders table
 */
export async function submitBackendOrder(orderPayload) {
  try {
    const invNumber = `INV-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const payload = {
      invoice_number: invNumber,
      customer_name: orderPayload.customer.name,
      customer_email: orderPayload.customer.email || null,
      subtotal: orderPayload.subtotal,
      discount_pct: 0,
      discount_amount: 0,
      taxable_amount: orderPayload.subtotal,
      gst_amount: 0,
      total_amount: orderPayload.total,
      payment_method: 'COD / WhatsApp',
      items: orderPayload.items
    };

    const { data, error } = await supabase.from('sales_orders').insert([payload]).select();
    if (!error && data && data.length > 0) {
      return { success: true, orderId: data[0].id, invoiceNumber: invNumber };
    }
  } catch (err) {
    console.warn('Could not record order in backend sales_orders:', err);
  }
  return { success: false };
}
