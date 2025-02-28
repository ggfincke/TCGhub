// src/hooks/useLocation.jsx
import { useState, useCallback } from 'react';

const simulateDelay = () => new Promise(resolve => setTimeout(resolve, 300));

const MOCK_NEARBY_LOCATIONS = [
  {
    id: 1,
    name: "Card Shop A",
    address: "123 Main St",
    distance: "0.5 miles"
  },
  {
    id: 2,
    name: "Gaming Store B",
    address: "456 Oak Ave",
    distance: "1.2 miles"
  }
];

export const useLocation = () => {
  const [location, setLocation] = useState('');
  const [locationError, setLocationError] = useState('');
  const [loading, setLoading] = useState(false);
  const [nearbyResults, setNearbyResults] = useState(null);

  const validateLocation = useCallback(async (input) => {
    try {
      setLoading(true);
      setLocationError('');
      await simulateDelay();

      const zipRegex = /^\d{5}$/;
      const cityStateRegex = /^[A-Za-z\s]+,\s*[A-Z]{2}$/;
      const isValid = zipRegex.test(input) || cityStateRegex.test(input);

      if (!isValid) {
        setLocationError('Please enter a valid ZIP code (12345) or City, State (Portland, OR)');
        return false;
      }

      setNearbyResults(MOCK_NEARBY_LOCATIONS);
      setLocation(input);
      return true;
    } catch (err) {
      setLocationError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearLocation = useCallback(() => {
    setLocation('');
    setLocationError('');
    setNearbyResults(null);
  }, []);

  return {
    location,
    setLocation,
    locationError,
    loading,
    nearbyResults,
    validateLocation,
    clearLocation
  };
};