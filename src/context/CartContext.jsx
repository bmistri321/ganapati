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

  const addToCart = (product, quantity = 1) => {
    if (product.stock <= 0) {
      showToast(`Sorry, "${product.title}" is currently out of stock.`, 'warning');
      return false;
    }

    let addedSuccessfully = false;

    setCartItems((prevItems) => {
      const existingIndex = prevItems.findIndex((item) => item.id === product.id);

      if (existingIndex > -1) {
        const currentQty = prevItems[existingIndex].quantity;
        const newQty = currentQty + quantity;

        if (newQty > product.stock) {
          showToast(
            `Stock limit reached: Only ${product.stock} units available for "${product.title}".`,
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
        if (quantity > product.stock) {
          showToast(
            `Only ${product.stock} units available in stock.`,
            'warning'
          );
          return prevItems;
        }
        addedSuccessfully = true;
        return [...prevItems, { ...product, quantity }];
      }
    });

    if (addedSuccessfully) {
      setJustAddedId(product.id);
      setTimeout(() => setJustAddedId(null), 1200);
      showToast(`Added "${product.title}" to cart!`, 'success');
      return true;
    }
    return false;
  };

  const updateQuantity = (productId, newQuantity, maxStock) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    if (maxStock !== undefined && newQuantity > maxStock) {
      showToast(`Cannot exceed current stock level of ${maxStock}`, 'warning');
      return;
    }

    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === productId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const removeFromCart = (productId) => {
    const item = cartItems.find((i) => i.id === productId);
    setCartItems((prevItems) => prevItems.filter((i) => i.id !== productId));
    if (item) {
      showToast(`Removed "${item.title}" from cart`, 'info');
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
