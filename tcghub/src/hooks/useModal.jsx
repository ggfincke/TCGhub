// src/hooks/useModal.jsx
import { useState, useCallback } from 'react';

export const useModal = (initialState = false) => {
  const [isOpen, setIsOpen] = useState(initialState);
  const [error, setError] = useState(null);

  const open = useCallback(() => {
    try {
      setError(null);
      setIsOpen(true);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const close = useCallback(() => {
    try {
      setError(null);
      setIsOpen(false);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const toggle = useCallback(() => {
    try {
      setError(null);
      setIsOpen(prev => !prev);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  return {
    isOpen,
    error,
    open,
    close,
    toggle
  };
};