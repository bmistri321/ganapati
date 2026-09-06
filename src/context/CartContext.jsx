import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from './ToastContext';

const CartContext = createContext();
const CART_STORAGE_KEY = 'quickcart_cart_items';

export const CartProvider = ({ children }) => {
  const { showToast } = useToast();
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [justAddedId, setJustAddedId] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch (e) {
      console.error(e);
    }
  }, [cartItems]);

  const addToCart = (product, quantity = 1, selectedVariant = null) => {
    const itemStock = selectedVariant 
      ? parseInt(selectedVariant.stock_quantity ?? selectedVariant.stock ?? 0, 10) 
      : parseInt(product.stock_quantity ?? product.stock ?? 0, 10);
    const itemPrice = selectedVariant 
      ? parseFloat(selectedVariant.selling_price ?? selectedVariant.price) 
      : parseFloat(product.selling_price ?? product.price ?? 0);
    const variantLabel = selectedVariant ? (selectedVariant.name || selectedVariant.size) : null;
    const cartKey = selectedVariant ? `${product.id}_${selectedVariant.id}` : product.id;

    if (itemStock <= 0) {
      showToast(`Sorry, "${product.title || product.name}${variantLabel ? ` (${variantLabel})` : ''}" is out of stock.`, 'warning');
      return false;
    }

    let addedSuccessfully = false;

    setCartItems((prevItems) => {
      const existingIndex = prevItems.findIndex((item) => (item.cartKey || item.cartItemId || item.id) === cartKey);

      if (existingIndex > -1) {
        const currentQty = prevItems[existingIndex].quantity;
        const newQty = currentQty + quantity;

        if (newQty > itemStock) {
          showToast(
            `Stock limit reached: Only ${itemStock} units available for "${product.title || product.name}${variantLabel ? ` (${variantLabel})` : ''}".`,
            'warning'
          );
          return prevItems;
        }

        const updated = [...prevItems];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
        };
        addedSuccessfully = true;
        return updated;
      } else {
        if (quantity > itemStock) {
          showToast(
            `Only ${itemStock} units available in stock.`,
            'warning'
          );
          return prevItems;
        }
        addedSuccessfully = true;
        return [
          ...prevItems, 
          { 
            ...product, 
            cartKey: cartKey,
            cartItemId: cartKey,
            id: product.id,
            variantId: selectedVariant?.id || null,
            variantName: variantLabel,
            sku: selectedVariant?.sku || product.sku || '',
            name: product.name || product.title,
            title: product.title || product.name,
            price: itemPrice,
            quantity: quantity,
            stockQuantity: itemStock,
            stock: itemStock,
            imageUrl: product.image_url || product.image || (product.images && product.images[0]) || '',
            image: product.image_url || product.image || (product.images && product.images[0]) || '',
            selectedVariant: selectedVariant || null
          }
        ];
      }
    });

    if (addedSuccessfully) {
      setJustAddedId(cartKey);
      setTimeout(() => setJustAddedId(null), 1200);
      showToast(`Added "${product.title || product.name}${variantLabel ? ` (${variantLabel})` : ''}" to cart!`, 'success');
      return true;
    }
    return false;
  };

  const updateQuantity = (cartKey, newQuantity, maxStock) => {
    if (newQuantity <= 0) {
      removeFromCart(cartKey);
      return;
    }

    if (maxStock !== undefined && newQuantity > maxStock) {
      showToast(`Cannot exceed current stock level of ${maxStock}`, 'warning');
      return;
    }

    setCartItems((prevItems) =>
      prevItems.map((item) =>
        (item.cartKey || item.cartItemId || item.id) === cartKey 
          ? { ...item, quantity: Math.min(newQuantity, item.stockQuantity || item.stock || maxStock || newQuantity) } 
          : item
      )
    );
  };

  const removeFromCart = (cartKey) => {
    const item = cartItems.find((i) => (i.cartKey || i.cartItemId || i.id) === cartKey);
    setCartItems((prevItems) => prevItems.filter((i) => (i.cartKey || i.cartItemId || i.id) !== cartKey));
    if (item) {
      const vLabel = item.variantName || (item.selectedVariant ? (item.selectedVariant.name || item.selectedVariant.size) : '');
      showToast(`Removed "${item.title || item.name}${vLabel ? ` (${vLabel})` : ''}" from cart`, 'info');
    }
  };

  const clearCart = () => {
    setCartItems([]);
    showToast('Cart cleared', 'info');
  };

  const totalItemsCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const subtotal = cartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        totalItemsCount,
        subtotal,
        isCartOpen,
        setIsCartOpen,
        isCheckoutOpen,
        setIsCheckoutOpen,
        justAddedId,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
