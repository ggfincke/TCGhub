// src/hooks/useCart.jsx
import { useState, useCallback } from 'react';

const simulateDelay = () => new Promise(resolve => setTimeout(resolve, 300));

export const useCart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const addToCart = useCallback(async (item) => {
    try {
      setLoading(true);
      setError(null);
      await simulateDelay();

      setCartItems(prev => {
        const existingItem = prev.find(i => i.id === item.id);
        if (existingItem) {
          return prev.map(i => 
            i.id === item.id 
              ? { ...i, quantity: i.quantity + 1 }
              : i
          );
        }
        return [...prev, { ...item, quantity: 1 }];
      });
      return true;
    } catch (err) {
      setError('Failed to add item to cart');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const removeFromCart = useCallback(async (itemId) => {
    try {
      setLoading(true);
      setError(null);
      await simulateDelay();
      
      setCartItems(prev => prev.filter(item => item.id !== itemId));
      return true;
    } catch (err) {
      setError('Failed to remove item from cart');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateQuantity = useCallback(async (itemId, quantity) => {
    try {
      setLoading(true);
      setError(null);
      await simulateDelay();

      if (quantity < 1) {
        return removeFromCart(itemId);
      }

      setCartItems(prev => 
        prev.map(item => 
          item.id === itemId 
            ? { ...item, quantity }
            : item
        )
      );
      return true;
    } catch (err) {
      setError('Failed to update quantity');
      return false;
    } finally {
      setLoading(false);
    }
  }, [removeFromCart]);

  return {
    cartItems,
    loading,
    error,
    addToCart,
    removeFromCart,
    updateQuantity
  };
};