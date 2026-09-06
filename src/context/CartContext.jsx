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
    const itemStock = selectedVariant ? (parseInt(selectedVariant.stock_quantity ?? selectedVariant.stock ?? 0, 10)) : (product.stock || 0);
    const itemPrice = selectedVariant ? (parseFloat(selectedVariant.selling_price ?? selectedVariant.price ?? product.price)) : product.price;
    const variantLabel = selectedVariant ? (selectedVariant.name || selectedVariant.size) : null;
    const itemKey = selectedVariant ? `${product.id}_${selectedVariant.id}` : product.id;

    if (itemStock <= 0) {
      showToast(`Sorry, "${product.title}${variantLabel ? ` (${variantLabel})` : ''}" is out of stock.`, 'warning');
      return false;
    }

    let addedSuccessfully = false;

    setCartItems((prevItems) => {
      const existingIndex = prevItems.findIndex((item) => (item.cartItemId || item.id) === itemKey);

      if (existingIndex > -1) {
        const currentQty = prevItems[existingIndex].quantity;
        const newQty = currentQty + quantity;

        if (newQty > itemStock) {
          showToast(
            `Stock limit reached: Only ${itemStock} units available for "${product.title}${variantLabel ? ` (${variantLabel})` : ''}".`,
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
            cartItemId: itemKey,
            price: itemPrice,
            stock: itemStock,
            selectedVariant: selectedVariant || null,
            quantity 
          }
        ];
      }
    });

    if (addedSuccessfully) {
      setJustAddedId(itemKey);
      setTimeout(() => setJustAddedId(null), 1200);
      showToast(`Added "${product.title}${variantLabel ? ` (${variantLabel})` : ''}" to cart!`, 'success');
      return true;
    }
    return false;
  };

  const updateQuantity = (cartItemId, newQuantity, maxStock) => {
    if (newQuantity <= 0) {
      removeFromCart(cartItemId);
      return;
    }

    if (maxStock !== undefined && newQuantity > maxStock) {
      showToast(`Cannot exceed current stock level of ${maxStock}`, 'warning');
      return;
    }

    setCartItems((prevItems) =>
      prevItems.map((item) =>
        (item.cartItemId || item.id) === cartItemId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const removeFromCart = (cartItemId) => {
    const item = cartItems.find((i) => (i.cartItemId || i.id) === cartItemId);
    setCartItems((prevItems) => prevItems.filter((i) => (i.cartItemId || i.id) !== cartItemId));
    if (item) {
      const vLabel = item.selectedVariant ? ` (${item.selectedVariant.name || item.selectedVariant.size})` : '';
      showToast(`Removed "${item.title}${vLabel}" from cart`, 'info');
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
