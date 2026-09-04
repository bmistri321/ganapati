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
 * Fetch real products from Supabase products table
 */
export async function fetchLiveProductsFromBackend() {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      return data.map((p) => ({
        id: p.id,
        title: p.name || p.title,
        category: p.category || 'General',
        price: parseFloat(p.price || p.selling_price || p.unit_price) || 0,
        originalPrice: p.original_price || p.mrp || (parseFloat(p.price) ? parseFloat(p.price) * 1.2 : null),
        rating: p.rating || 4.9,
        reviewsCount: p.reviews_count || 48,
        stock: parseInt(p.stock_quantity ?? p.stock ?? 10),
        badge: p.stock_quantity <= 3 && p.stock_quantity > 0 ? 'Low Stock' : (p.badge || (p.featured ? 'Featured' : null)),
        image: p.image_url || p.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
        images: p.images && Array.isArray(p.images) && p.images.length > 0
          ? p.images
          : [p.image_url || p.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80'],
        description: p.description || `${p.name || 'Premium Product'} - High quality product ready for immediate dispatch.`,
        features: p.features || ['Verified Authentic Product', 'Quick Dispatch & Secure Packaging', 'Direct WhatsApp Support']
      }));
    }
  } catch (err) {
    console.warn('Could not query live Supabase products table:', err);
  }
  return null;
}

/**
 * Submit order to backend sales_orders table
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
