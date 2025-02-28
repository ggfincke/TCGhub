import { useState, useEffect, useCallback } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// define available sort options
const SORT_OPTIONS = [
  { value: 'name', label: 'Name' },
  { value: 'price', label: 'Price' },
  { value: 'expansion', label: 'Expansion' },
  { value: 'rarity', label: 'Rarity' }
];

export const useCardSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    rarity: 'all',
    expansion: 'all',
  });
  const [sorting, setSorting] = useState({
    sortBy: 'name',
    sortOrder: 'asc'
  });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filterOptions, setFilterOptions] = useState({
    rarities: ['all'], // Initialize with 'all' to prevent undefined
    expansions: ['all'] // Initialize with 'all' to prevent undefined
  });

  // fetch filter options on mount
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        setLoading(true);
        const [raritiesRes, expansionRes] = await Promise.all([
          fetch(`${API_URL}/cards/rarities`),
          fetch(`${API_URL}/cards/expansion`)
        ]);

        if (!raritiesRes.ok || !expansionRes.ok) {
          throw new Error('Failed to fetch filter options');
        }

        const rarities = await raritiesRes.json();
        const expansions = await expansionRes.json();

        setFilterOptions({
          rarities: ['all', ...(Array.isArray(rarities) ? rarities : [])],
          expansions: ['all', ...(Array.isArray(expansions) ? expansions : [])]
        });
      } catch (err) {
        setError('Failed to load filter options');
        // Set default values in case of error
        setFilterOptions({
          rarities: ['all'],
          expansions: ['all']
        });
      } finally {
        setLoading(false);
      }
    };

    fetchFilterOptions();
  }, []);

  // search function with debouncing
  useEffect(() => {
    const debounceTimeout = setTimeout(async () => {
      if (!searchQuery) {
        setResults([]);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // query params
        const params = new URLSearchParams({
          query: searchQuery,
          ...filters,
          ...sorting
        });

        const response = await fetch(`${API_URL}/cards/search?${params}`);
        if (!response.ok) throw new Error('Search failed');

        const data = await response.json();
        setResults(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(debounceTimeout);
  }, [searchQuery, filters, sorting]);

  const updateFilter = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const updateSorting = useCallback((sortBy, sortOrder = 'asc') => {
    setSorting({ sortBy, sortOrder });
  }, []);

  const toggleSortOrder = useCallback(() => {
    setSorting(prev => ({
      ...prev,
      sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  const getFormattedFilterOptions = useCallback(() => {
    // Ensure we have arrays to map over
    const rarities = filterOptions.rarities || ['all'];
    const expansions = filterOptions.expansions || ['all'];

    return [
      {
        key: 'rarity',
        label: 'Rarity',
        options: rarities.map(rarity => ({
          value: rarity,
          label: rarity.charAt(0).toUpperCase() + rarity.slice(1)
        }))
      },
      {
        key: 'expansion',
        label: 'Expansion',
        options: expansions.map(expansion => ({
          value: expansion,
          label: expansion.charAt(0).toUpperCase() + expansion.slice(1)
        }))
      }
    ];
  }, [filterOptions]);

  return {
    searchQuery,
    setSearchQuery,
    filters,
    updateFilter,
    sorting,
    updateSorting,
    toggleSortOrder,
    results,
    loading,
    error,
    filterOptions: getFormattedFilterOptions(),
    sortOptions: SORT_OPTIONS
  };
};