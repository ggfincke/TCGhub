// src/hooks/useCollectionManagement.jsx
import { useState, useEffect, useCallback } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export const useCollectionManagement = () => {
  const [collections, setCollections] = useState([]);
  const [selectedCollectionIndex, setSelectedCollectionIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [collectionCards, setCollectionCards] = useState([]);

  // fetch user's collections on mount
  useEffect(() => {
    const fetchCollections = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
          console.log('No token found in localStorage');
          return;
        }

        console.log('Fetching collections with token:', token);
        const response = await fetch(`${API_URL}/users/collection`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        console.log('Response status:', response.status);
        const responseText = await response.text();
        console.log('Raw response:', responseText);

        if (!response.ok) {
          throw new Error(`Failed to fetch collections: ${response.status} ${responseText}`);
        }
        
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (e) {
          console.error('Failed to parse JSON:', e);
          throw new Error('Invalid JSON response');
        }

        console.log('Parsed collections:', data);
        setCollections(data);
      } catch (err) {
        console.error('Collection fetch error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCollections();
  }, []);

  const fetchCollectionCards = useCallback(async () => {
    const currentCollection = collections[selectedCollectionIndex];
    if (!currentCollection) return;

    try {
      setLoading(true);
      setError(null);
      console.log('Fetching cards for collection:', currentCollection.colid);

      const response = await fetch(`${API_URL}/collection/${currentCollection.colid}/cards`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch collection cards');
      }

      const data = await response.json();
      console.log('Fetched cards:', data);
      setCollectionCards(data || []);
    } catch (err) {
      console.error('Error fetching collection cards:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [collections, selectedCollectionIndex]);

  useEffect(() => {
    if (collections.length > 0) {
      fetchCollectionCards();
    }
  }, [collections, selectedCollectionIndex, fetchCollectionCards]);

  const addCollection = useCallback(async (name) => {
    if (!name) return false;
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/collection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          colname: name,
          collection_type: 'Pokemon'
        })
      });

      if (!response.ok) throw new Error('Failed to create collection');
      
      const newCollection = await response.json();
      setCollections(prev => [...prev, newCollection]);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const editCollection = useCallback(async (colid, newName) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/collection/${colid}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ colname: newName })
      });

      if (!response.ok) throw new Error('Failed to update collection');

      setCollections(prev => prev.map(collection => 
        collection.colid === colid 
          ? { ...collection, colname: newName }
          : collection
      ));
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteCollection = useCallback(async (colid) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/collection/${colid}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete collection');

      setCollections(prev => prev.filter(collection => collection.colid !== colid));
      if (selectedCollectionIndex >= collections.length - 1) {
        setSelectedCollectionIndex(Math.max(0, collections.length - 2));
      }
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [collections.length, selectedCollectionIndex]);

  const getCurrentCollection = useCallback(() => {
    if (!collections.length) return null;
    const collection = collections[selectedCollectionIndex];
    return {
      ...collection,
      cards: collectionCards
    };
  }, [collections, selectedCollectionIndex, collectionCards]);


  const addCard = useCallback(async (colid, card) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/collection/${colid}/cards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          cname: card.cname,
          cid: card.cid,
          card_quantity: 1
        })
      });

      if (!response.ok) throw new Error('Failed to add card');

      await response.json();
      
      setCollections(prev => prev.map(collection => 
        collection.colid === colid ? {
          ...collection,
          cards: [...(collection.cards || []), {
            cid: card.cid,
            name: card.cname,
            quantity: 1
          }]
        } : collection
      ));

      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteCard = useCallback(async (colid, cid) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/collection/${colid}/cards/${cid}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete card');

      await response.json();

      setCollections(prev => prev.map(collection => 
        collection.colid === colid ? {
          ...collection,
          cards: collection.cards.filter(card => card.cid !== cid)
        } : collection
      ));

      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateCardQuantity = useCallback(async (colid, cid, newQuantity) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/collection/${colid}/cards/${cid}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ card_quantity: newQuantity })
      });

      if (!response.ok) throw new Error('Failed to update card quantity');

      await response.json();

      setCollections(prev => prev.map(collection => 
        collection.colid === colid ? {
          ...collection,
          cards: collection.cards.map(card => 
            card.cid === cid ? { ...card, quantity: newQuantity } : card
          )
        } : collection
      ));

      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    collections,
    selectedCollectionIndex,
    setSelectedCollectionIndex,
    loading,
    error,
    addCollection,
    deleteCollection,
    editCollection,
    getCurrentCollection,
    addCard,
    deleteCard,
    updateCardQuantity,
    fetchCollectionCards, // Add this for manual refreshes
  };
};