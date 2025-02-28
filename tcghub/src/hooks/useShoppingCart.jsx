import { useState, useCallback } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export const useShoppingCart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const addToCart = useCallback((item) => {
    setCartItems(prev => {
      const existingItem = prev.find(i => 
        i.cid === item.cid && i.shop_name === item.shop_name
      );
      
      if (existingItem) {
        return prev.map(i => 
          i.cid === item.cid && i.shop_name === item.shop_name
            ? { 
                ...i, 
                quantity: Math.min(
                  parseInt(i.quantity, 10) + 1, 
                  parseInt(item.card_quantity, 10)
                )
              }
            : i
        );
      }
      
      return [...prev, { ...item, quantity: 1 }];
    });
  }, []);

  const removeFromCart = useCallback((item) => {
    setCartItems(prev => prev.filter(i => 
      !(i.cid === item.cid && i.shop_name === item.shop_name)
    ));
  }, []);

  const updateQuantity = useCallback((item, newQuantity) => {
    const quantity = parseInt(newQuantity, 10);
    if (isNaN(quantity) || quantity < 1) {
      return;
    }

    setCartItems(prev => prev.map(i => 
      i.cid === item.cid && i.shop_name === item.shop_name
        ? { 
            ...i, 
            quantity: Math.min(
              quantity, 
              parseInt(item.card_quantity, 10)
            )
          }
        : i
    ));
  }, []);

  const checkout = useCallback(async (userId) => {
    if (!userId) {
      throw new Error('User ID is required for checkout');
    }

    if (cartItems.length === 0) {
      throw new Error('Cart is empty');
    }

    try {
      setLoading(true);
      setError(null);

      const transactions = cartItems.map(item => ({
        uid: userId,
        cid: item.cid,
        sid: item.sid || null,
        shop_name: item.shop_name,
        quantity: parseInt(item.quantity, 10),
        price: parseFloat(item.current_value)
      }));

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${API_URL}/transactions/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ transactions })
      });

      if (!response.ok) {
        let errorMessage = 'Checkout failed';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (e) {
          console.error('Error parsing checkout response:', e);
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      setCartItems([]);
      
      return {
        orderId: result.orderId || result.did,
        total: getCartTotal(),
        expectedDelivery: result.expectedDelivery || result.arrival_date,
        items: cartItems
      };
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [cartItems]);

  const clearCart = useCallback(() => {
    setCartItems([]);
    setError(null);
  }, []);

  const getCartTotal = useCallback(() => {
    return cartItems.reduce((total, item) => 
      total + (parseFloat(item.current_value) * parseInt(item.quantity, 10)), 0
    );
  }, [cartItems]);

  return {
    cartItems,
    loading,
    error,
    addToCart,
    removeFromCart,
    updateQuantity,
    checkout,
    clearCart,
    getCartTotal
  };
};