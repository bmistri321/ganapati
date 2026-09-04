/**
 * supabase.js
 * Primary XYVOT Store API & WhatsApp Integration Service
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://qirpufadoruqvgubpqzx.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpcnB1ZmFkb3J1cXZndWJwcXp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzNjgwODUsImV4cCI6MjEwMzk0NDA4NX0.WBzX3E401higTSSrjYMx5LQEcOptiiaU_4Id5j_X8PI';

export const STORE_API_KEY = import.meta.env.VITE_STORE_API_KEY || 'xyvot_pk_live_8d59e2_n4tuqdx7wivkrw';
export const DEFAULT_STORE_API_KEY = STORE_API_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// In-memory OTP store for active verification sessions
const activeOtpSessions = new Map();

/**
 * WhatsApp Meta Cloud API - Approved Template Dispatcher
 */
export const sendWhatsAppOtp = async (phone, otp) => {
  // Format phone to 919876543210 (digits only)
  let formattedPhone = phone.replace(/[^0-9]/g, '');
  if (formattedPhone.length === 10) formattedPhone = '91' + formattedPhone;

  const url = 'https://graph.facebook.com/v21.0/1258313577369410/messages';
  const token = 'EAAY8LkWvYLcBSQFCgBTUp7StgPTU9qBXxGAdlD1mthALTOlkZAerq6CY9JewYO9WTzdHdbE5o9oZCDChyPkq5wsh0xZAGTrEYWhdwZATQvUtJ6Hh6c6InKszieDLtGJtTmcaHuPDZBZBbZBO76dCjBeyKhP4buI4NUsDZCr1IfBWxEBjL3gypbiJ1s7QJNvAXwZDZD';

  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: formattedPhone,
    type: 'template',
    template: {
      name: 'xyvot_otp',
      language: {
        code: 'en_US'
      },
      components: [
        {
          type: 'body',
          parameters: [
            {
              type: 'text',
              text: String(otp)
            }
          ]
        },
        {
          type: 'button',
          sub_type: 'copy_code',
          index: '0',
          parameters: [
            {
              type: 'coupon_code',
              coupon_code: String(otp)
            }
          ]
        }
      ]
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  if (!response.ok) {
    console.error('Meta WhatsApp API Error:', data);
    throw new Error(data?.error?.message || 'Failed to dispatch WhatsApp OTP');
  }
  return data;
};

/**
 * 1. WhatsApp OTP Request Flow (Dispatches via Meta Cloud API)
 */
export async function requestStoreWhatsAppOtp(phoneNumber) {
  const cleanPhone = (phoneNumber || '').replace(/\D/g, '');
  if (cleanPhone.length < 10) {
    throw new Error('Please enter a valid 10-digit mobile number');
  }

  // Generate 6-digit OTP code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 mins

  activeOtpSessions.set(cleanPhone, { code, expiresAt });

  console.log(`[XYVOT WhatsApp Auth] Sending real OTP to +91 ${cleanPhone.slice(-10)} via Meta Cloud API...`);

  // Dispatch live WhatsApp OTP via Meta Cloud API
  await sendWhatsAppOtp(cleanPhone, code);

  return {
    success: true,
    status: 200,
    otp: code,
    message: `6-digit OTP sent to your WhatsApp (+91 ${cleanPhone.slice(-10)})`
  };
}

/**
 * 2. Verify WhatsApp OTP Code
 */
export async function verifyStoreWhatsAppOtp(phoneNumber, enteredOtp) {
  const cleanPhone = (phoneNumber || '').replace(/\D/g, '');
  const entered = (enteredOtp || '').toString().trim();

  const session = activeOtpSessions.get(cleanPhone);
  
  // Verify matching OTP code
  const isValid = session && session.code === entered && Date.now() <= session.expiresAt;

  if (!isValid) {
    throw new Error('Invalid OTP code. Please check your WhatsApp.');
  }

  // Load existing profile from localStorage if present
  let existingCustomer = {};
  try {
    const raw = localStorage.getItem('customer_session');
    if (raw) existingCustomer = JSON.parse(raw);
  } catch (e) {}

  const customer = {
    phone: cleanPhone,
    fullName: existingCustomer.fullName || existingCustomer.name || 'Verified Customer',
    name: existingCustomer.name || existingCustomer.fullName || 'Verified Customer',
    email: existingCustomer.email || '',
    address: existingCustomer.address || existingCustomer.shippingAddress?.street || '',
    city: existingCustomer.city || existingCustomer.shippingAddress?.city || '',
    gpsLat: existingCustomer.gpsLat || existingCustomer.shippingAddress?.coordinates?.lat || 28.6139,
    gpsLng: existingCustomer.gpsLng || existingCustomer.shippingAddress?.coordinates?.lng || 77.2090,
    shippingAddress: existingCustomer.shippingAddress || {
      street: existingCustomer.address || '',
      city: existingCustomer.city || '',
      state: 'Maharashtra',
      postalCode: '400001',
      coordinates: {
        lat: existingCustomer.gpsLat || 28.6139,
        lng: existingCustomer.gpsLng || 77.2090
      }
    },
    verified: true,
    lastLogin: new Date().toISOString()
  };

  activeOtpSessions.delete(cleanPhone);

  return {
    success: true,
    status: 200,
    token: `xyvot_cust_${Date.now()}`,
    customer
  };
}

/**
 * 3. Upsert Customer Profile with GPS Map Location
 */
export async function upsertStoreCustomerProfile({ phone, fullName, name, email, address, city, state, postalCode, gpsLat, gpsLng }) {
  const cleanPhone = (phone || '').replace(/\D/g, '');
  const updatedCustomer = {
    phone: cleanPhone,
    fullName: fullName || name || 'Customer',
    name: fullName || name || 'Customer',
    email: email || '',
    address: address || '',
    city: city || '',
    gpsLat: parseFloat(gpsLat || 28.6139),
    gpsLng: parseFloat(gpsLng || 77.2090),
    shippingAddress: {
      street: address || '',
      city: city || '',
      state: state || 'Maharashtra',
      postalCode: postalCode || '400001',
      coordinates: {
        lat: parseFloat(gpsLat || 28.6139),
        lng: parseFloat(gpsLng || 77.2090)
      }
    },
    verified: true,
    updatedAt: new Date().toISOString()
  };

  // 1. Save in customer_session localStorage
  localStorage.setItem('customer_session', JSON.stringify(updatedCustomer));

  // 2. Also try updating Supabase backend if customer table exists
  try {
    await supabase.from('customers').upsert([
      {
        phone: cleanPhone,
        full_name: updatedCustomer.fullName,
        email: updatedCustomer.email,
        address: updatedCustomer.address,
        city: updatedCustomer.city,
        gps_lat: updatedCustomer.gpsLat,
        gps_lng: updatedCustomer.gpsLng,
        updated_at: new Date().toISOString()
      }
    ], { onConflict: 'phone' });
  } catch (err) {
    // Ignore schema variance
  }

  return {
    success: true,
    status: 200,
    customer: updatedCustomer
  };
}

/**
 * 4. Submit Store API Order (COD / Website Checkout)
 */
export async function submitStoreApiOrder(apiKey, orderPayload) {
  const invNumber = `INV-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
  const totalAmount = parseFloat(orderPayload.total_amount || orderPayload.total || 0);
  const subtotalAmount = parseFloat(orderPayload.subtotal || totalAmount);

  const formattedOrder = {
    invoice_number: invNumber,
    orderId: invNumber,
    customer_name: orderPayload.customer_name || orderPayload.customer?.name || 'Website Customer',
    customer_phone: orderPayload.customer_phone || orderPayload.customer?.phone || '',
    customer_email: orderPayload.customer_email || orderPayload.customer?.email || null,
    delivery_address: orderPayload.delivery_address || (orderPayload.shippingAddress ? `${orderPayload.shippingAddress.street}, ${orderPayload.shippingAddress.city}` : 'Store Pickup'),
    gps_lat: orderPayload.gps_lat || orderPayload.shippingAddress?.coordinates?.lat || null,
    gps_lng: orderPayload.gps_lng || orderPayload.shippingAddress?.coordinates?.lng || null,
    channel: orderPayload.channel || 'website',
    payment_gateway: orderPayload.payment_gateway || orderPayload.paymentMethod || 'Cash on Delivery (COD)',
    payment_method: 'Cash on Delivery (COD)',
    status: 'pending_cod',
    subtotal: subtotalAmount,
    discount_pct: 0,
    discount_amount: 0,
    taxable_amount: subtotalAmount,
    gst_amount: ((subtotalAmount * 0.18) / 1.18),
    total_amount: totalAmount,
    total: totalAmount,
    deliveryFee: orderPayload.deliveryFee || 0,
    items: (orderPayload.items || []).map((item) => ({
      id: item.id,
      title: item.product_name || item.title || item.name,
      product_name: item.product_name || item.title || item.name,
      price: parseFloat(item.unit_price || item.price || 0),
      unit_price: parseFloat(item.unit_price || item.price || 0),
      quantity: parseInt(item.quantity || 1, 10),
      image: item.image || null
    })),
    createdAt: new Date().toISOString()
  };

  // Save to Supabase sales_orders table
  try {
    const { data, error } = await supabase
      .from('sales_orders')
      .insert([{
        invoice_number: formattedOrder.invoice_number,
        customer_name: formattedOrder.customer_name,
        customer_phone: formattedOrder.customer_phone,
        customer_email: formattedOrder.customer_email,
        delivery_address: formattedOrder.delivery_address,
        gps_lat: formattedOrder.gps_lat,
        gps_lng: formattedOrder.gps_lng,
        subtotal: formattedOrder.subtotal,
        discount_pct: 0,
        discount_amount: 0,
        taxable_amount: formattedOrder.taxable_amount,
        gst_amount: formattedOrder.gst_amount,
        total_amount: formattedOrder.total_amount,
        payment_method: formattedOrder.payment_method,
        channel: formattedOrder.channel,
        status: 'pending_cod',
        items: formattedOrder.items
      }])
      .select();

    if (!error && data && data.length > 0) {
      formattedOrder.id = data[0].id;
    }
  } catch (err) {
    console.warn('Could not record in sales_orders table:', err);
  }

  // Backup to localStorage for client order history
  try {
    const existing = JSON.parse(localStorage.getItem('quickcart_saved_orders') || '[]');
    existing.unshift(formattedOrder);
    localStorage.setItem('quickcart_saved_orders', JSON.stringify(existing.slice(0, 50)));
  } catch (e) {}

  return {
    status: 201,
    success: true,
    order: formattedOrder,
    invoice_number: invNumber
  };
}
