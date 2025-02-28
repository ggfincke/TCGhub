// src/hooks/useCardData.jsx
import { useState, useCallback } from 'react';

// mock data
const MOCK_CARDS = [
  {
    id: 1,
    name: 'Black Lotus',
    rarity: 'Rare',
    type: 'Artifact',
    price: 50000.00,
    imageUrl: 'https://via.placeholder.com/223x310'
  },
  {
    id: 2,
    name: 'Time Walk',
    rarity: 'Rare',
    type: 'Sorcery',
    price: 20000.00,
    imageUrl: 'https://via.placeholder.com/223x310'
  }
];

const simulateDelay = () => new Promise(resolve => setTimeout(resolve, 300));

export const useCardData = () => {
  const [cards, setCards] = useState(MOCK_CARDS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cache, setCache] = useState(new Map());

  const fetchCard = useCallback(async (cardId) => {
    if (cache.has(cardId)) {
      return cache.get(cardId);
    }

    try {
      setLoading(true);
      await simulateDelay();
      
      const cardData = MOCK_CARDS.find(card => card.id === cardId);
      if (!cardData) throw new Error('Card not found');
      
      setCache(prev => new Map(prev.set(cardId, cardData)));
      return cardData;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [cache]);

  const fetchCardPrice = useCallback(async (cardId) => {
    try {
      setLoading(true);
      await simulateDelay();
      
      const card = MOCK_CARDS.find(c => c.id === cardId);
      if (!card) throw new Error('Card not found');
      
      return card.price;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getPriceHistory = useCallback(async (cardId, timeframe = '1M') => {
    try {
      setLoading(true);
      await simulateDelay();
      
      const card = MOCK_CARDS.find(c => c.id === cardId);
      if (!card) throw new Error('Card not found');

      // mock price history
      const days = timeframe === '1M' ? 30 : 
                   timeframe === '6M' ? 180 : 
                   timeframe === '1Y' ? 365 : 730;
      
      const history = Array.from({ length: days }, (_, i) => ({
        date: new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        price: card.price * (0.9 + Math.random() * 0.2) // ±10% variation
      }));

      return history;
    } catch (err) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const searchCards = useCallback(async (query) => {
    try {
      setLoading(true);
      await simulateDelay();
      
      const results = MOCK_CARDS.filter(card => 
        card.name.toLowerCase().includes(query.toLowerCase())
      );
      return results;
    } catch (err) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const clearCache = useCallback(() => {
    setCache(new Map());
  }, []);

  return {
    cards,
    loading,
    error,
    fetchCard,
    fetchCardPrice,
    getPriceHistory,
    searchCards,
    clearCache
  };
};
