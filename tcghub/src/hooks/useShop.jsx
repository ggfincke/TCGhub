import { useState, useEffect, useCallback } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export const useShop = () => {
  const [shops, setShops] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // fetch all shops and their inventory
  const fetchShopInventory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_URL}/shops/cards`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch shop inventory');
      }

      const data = await response.json();
      
      // group cards by shop
      const shopMap = new Map();
      data.forEach(item => {
        if (!shopMap.has(item.shop_name)) {
          shopMap.set(item.shop_name, {
            name: item.shop_name,
            inventory: []
          });
        }
        shopMap.get(item.shop_name).inventory.push({
          name: item.cname,
          quantity: item.quantity
        });
      });

      setShops(Array.from(shopMap.values()));
      setInventory(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // search shop inventory
  const searchInventory = useCallback((query) => {
    if (!query) return inventory;
    
    const searchTerm = query.toLowerCase();
    return inventory.filter(item => 
      item.cname.toLowerCase().includes(searchTerm) ||
      item.shop_name.toLowerCase().includes(searchTerm)
    );
  }, [inventory]);

  // get specific shop's inventory
  const getShopInventory = useCallback((shopName) => {
    return inventory.filter(item => item.shop_name === shopName);
  }, [inventory]);

  useEffect(() => {
    fetchShopInventory();
  }, [fetchShopInventory]);

  return {
    shops,
    inventory,
    loading,
    error,
    searchInventory,
    getShopInventory,
    refreshInventory: fetchShopInventory
  };
};