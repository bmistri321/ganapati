/**
 * orderService.js
 * Handles saving orders to Firestore and formatting WhatsApp messages
 */
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getFirestoreDb, isFirebaseConfigured } from './firebase';
import { inventoryApi } from './inventoryApi';
import { submitBackendOrder } from './supabaseStore';

const LOCAL_ORDERS_KEY = 'quickcart_saved_orders';

export const saveOrder = async (orderData) => {
  const orderId = 'ORD-' + Math.random().toString(36).substring(2, 9).toUpperCase();
  const timestamp = new Date().toISOString();

  const completeOrder = {
    orderId,
    createdAt: timestamp,
    status: 'PLACED_PENDING_WHATSAPP',
    ...orderData,
  };

  let savedToFirestore = false;
  let firestoreId = null;

  // 1. Try saving to Firestore if configured
  if (isFirebaseConfigured()) {
    try {
      const db = getFirestoreDb();
      if (db) {
        const docRef = await addDoc(collection(db, 'orders'), {
          ...completeOrder,
          serverTimestamp: serverTimestamp(),
        });
        firestoreId = docRef.id;
        savedToFirestore = true;
      }
    } catch (err) {
      console.warn('Could not save to Firestore, falling back to local store:', err);
    }
  }

  // 2. Fallback / local backup in localStorage
  try {
    const existing = JSON.parse(localStorage.getItem(LOCAL_ORDERS_KEY) || '[]');
    existing.unshift({
      ...completeOrder,
      firestoreId,
      savedToFirestore
    });
    localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(existing.slice(0, 50)));
  } catch (err) {
    console.error('Error saving order locally', err);
  }

  // 3. Sync with XYVOT / Supabase backend orders
  try {
    await submitBackendOrder(completeOrder);
  } catch (err) {
    console.log('Backend sync status:', err);
  }

  // 4. Decrement inventory
  if (orderData.items && orderData.items.length > 0) {
    await inventoryApi.decrementStockForOrder(orderData.items);
  }

  return {
    ...completeOrder,
    firestoreId,
    savedToFirestore
  };
};

/**
 * Generate formatted WhatsApp message
 */
export const formatWhatsAppMessage = (order, storeSettings = {}) => {
  const currency = storeSettings.currency || '$';
  const divider = '━━━━━━━━━━━━━━━━━━━━';
  
  let msg = `🛍️ *NEW ORDER: ${order.orderId}*\n`;
  msg += `${divider}\n\n`;

  // Customer Info
  msg += `👤 *Customer Details:*\n`;
  msg += `• *Name:* ${order.customer.name}\n`;
  msg += `• *Phone:* ${order.customer.phone}\n`;
  if (order.customer.email) {
    msg += `• *Email:* ${order.customer.email}\n`;
  }
  msg += `\n`;

  // Delivery Method
  msg += `📦 *Fulfillment Method:* ${order.deliveryMethod === 'shipping' ? '🚚 Home Delivery / Shipping' : '🏪 Store Pickup'}\n`;

  if (order.deliveryMethod === 'shipping') {
    const addr = order.shippingAddress;
    msg += `📍 *Delivery Address:*\n`;
    msg += `${addr.street}\n${addr.city}, ${addr.state} ${addr.postalCode}\n`;
    
    if (addr.coordinates && addr.coordinates.lat && addr.coordinates.lng) {
      const { lat, lng } = addr.coordinates;
      const mapsUrl = `https://maps.google.com/?q=${lat},${lng}`;
      msg += `🗺️ *Pin Location (Google Maps):*\n${mapsUrl}\n`;
    }
  } else {
    msg += `🏢 *Pickup Store:* ${storeSettings.storeAddress || 'Main Central Hub'}\n`;
    msg += `ℹ️ *Pickup Time:* Will be confirmed via WhatsApp reply\n`;
  }

  msg += `\n${divider}\n`;
  msg += `🛒 *Itemized Cart:*\n`;

  order.items.forEach((item, index) => {
    const itemTotal = (item.price * item.quantity).toFixed(2);
    msg += `${index + 1}. *${item.title}*\n`;
    msg += `   └ ${item.quantity} x ${currency}${item.price.toFixed(2)} = *${currency}${itemTotal}*\n`;
  });

  msg += `${divider}\n`;
  
  const subtotal = order.subtotal.toFixed(2);
  const deliveryFee = order.deliveryFee ? order.deliveryFee.toFixed(2) : '0.00';
  const total = order.total.toFixed(2);

  msg += `Subtotal: ${currency}${subtotal}\n`;
  if (order.deliveryMethod === 'shipping') {
    msg += `Delivery Fee: ${order.deliveryFee === 0 ? 'FREE' : `${currency}${deliveryFee}`}\n`;
  }
  msg += `💰 *TOTAL AMOUNT:* *${currency}${total}*\n\n`;

  msg += `💳 *Payment:* Cash on Delivery / Direct Confirmation\n`;
  msg += `🕒 *Order Time:* ${new Date(order.createdAt).toLocaleString()}\n`;
  msg += `\n_Thank you for ordering with ${storeSettings.storeName || 'QuickOrder Store'}!_`;

  return msg;
};

/**
 * Clean phone number & create wa.me link
 */
export const buildWhatsAppUrl = (rawPhoneNumber, messageText) => {
  // Strip out spaces, dashes, parentheses, plus
  let cleaned = (rawPhoneNumber || '').replace(/[^0-9]/g, '');
  
  // If 10 digit Indian number without country code, prepend 91
  if (cleaned.length === 10) {
    cleaned = '91' + cleaned;
  }
  
  const encodedText = encodeURIComponent(messageText);
  return `https://wa.me/${cleaned}?text=${encodedText}`;
};

export const getSavedOrders = () => {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_ORDERS_KEY) || '[]');
  } catch {
    return [];
  }
};
