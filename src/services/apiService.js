/**
 * apiService.js
 * Unified API Service for WhatsApp OTP Auth, Live Products, COD Checkout & Invoices
 * XYVOT handles all WhatsApp dispatching securely - ZERO Meta tokens in frontend.
 */
import { 
  submitStoreApiSendOtp, 
  submitStoreApiVerifyOtp, 
  submitStoreApiOrder, 
  STORE_API_KEY, 
  supabase 
} from './supabase.js';
import { saveOrder, getSavedOrders } from './orderService';

export { STORE_API_KEY };

// 1. Ask XYVOT to send the OTP
export const sendWhatsAppOtp = async (phone) => {
  const res = await submitStoreApiSendOtp(STORE_API_KEY, { phone });
  if (res.status !== 200) {
    throw new Error(res.error || 'Failed to send OTP');
  }
  return res; // { success: true, message: "OTP sent" }
};

// 2. Ask XYVOT to verify the OTP
export const verifyWhatsAppOtp = async (phone, otp) => {
  const res = await submitStoreApiVerifyOtp(STORE_API_KEY, { phone, otp });
  if (res.status !== 200) {
    throw new Error(res.error || 'Invalid or expired OTP');
  }
  return res; // { success: true, customer: {...}, session_token: "..." }
};

// Aliases for compatibility
export const sendWhatsAppOtpApi = sendWhatsAppOtp;
export const verifyWhatsAppOtpApi = verifyWhatsAppOtp;

/**
 * 3. 1-Click Cash on Delivery (COD) Checkout Endpoint
 */
export async function submitCODCheckout(orderPayload) {
  try {
    const backendResult = await submitStoreApiOrder(STORE_API_KEY, orderPayload);
    
    const savedOrder = await saveOrder({
      ...orderPayload,
      invoice_number: backendResult?.invoice_number || `INV-${Date.now()}`,
      status: 'Pending COD Confirmation',
      paymentMethod: 'Cash on Delivery (COD)'
    });

    return {
      success: true,
      order: {
        ...savedOrder,
        invoice_number: backendResult?.invoice_number || savedOrder.orderId
      }
    };
  } catch (error) {
    console.error('COD Checkout API Error:', error);
    const localOrder = await saveOrder({
      ...orderPayload,
      status: 'Pending COD Confirmation',
      paymentMethod: 'Cash on Delivery (COD)'
    });
    return { success: true, order: localOrder };
  }
}

/**
 * 4. Get Customer Orders for My Orders Portal
 */
export async function fetchCustomerOrders(phone) {
  const localOrders = getSavedOrders();
  const cleanedPhone = phone ? phone.replace(/\D/g, '') : '';

  try {
    const { data, error } = await supabase
      .from('sales_orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (!error && Array.isArray(data)) {
      const formattedBackendOrders = data.map((ord) => ({
        id: ord.id,
        orderId: ord.invoice_number || `ORD-${ord.id.slice(0, 6)}`,
        invoice_number: ord.invoice_number,
        createdAt: ord.created_at,
        customer: {
          name: ord.customer_name,
          phone: cleanedPhone || 'Verified Customer',
          email: ord.customer_email || ''
        },
        deliveryMethod: 'shipping',
        paymentMethod: 'Cash on Delivery (COD)',
        status: ord.status || 'Dispatched / On the Way',
        subtotal: parseFloat(ord.subtotal || 0),
        deliveryFee: 0,
        total: parseFloat(ord.total_amount || 0),
        items: []
      }));

      const allOrders = [...localOrders];
      for (const bo of formattedBackendOrders) {
        if (!allOrders.some((o) => o.orderId === bo.orderId || o.invoice_number === bo.invoice_number)) {
          allOrders.push(bo);
        }
      }
      return allOrders;
    }
  } catch (e) {
    console.warn('Could not fetch Supabase orders:', e);
  }

  return localOrders;
}
