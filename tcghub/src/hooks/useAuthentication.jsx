// src/hooks/useAuthentication.jsx
import { useState, useEffect } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export const useAuthentication = () => {
  const [authState, setAuthState] = useState({
    user: null,
    isAuthenticated: false,
    loading: true,
    error: null
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchUserData(token);
    } else {
      setAuthState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  const fetchUserData = async (token) => {
    try {
      const response = await fetch(`${API_URL}/users/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch user data');
      }
      
      const userData = await response.json();
      
      setAuthState({
        user: userData,
        isAuthenticated: true,
        loading: false,
        error: null
      });

      localStorage.setItem('user', JSON.stringify(userData));
    } catch (err) {
      setAuthState({
        user: null,
        isAuthenticated: false,
        loading: false,
        error: err.message
      });
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  };

  const register = async (userData) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      console.log('Attempting to register with:', userData);
      console.log('API URL:', `${API_URL}/auth/register`);
      
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });
  
      // Log the raw response
      const responseText = await response.text();
      console.log('Raw response:', responseText);
  
      // Try to parse as JSON only if it looks like JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse JSON:', e);
        throw new Error('Invalid server response');
      }
  
      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }
  
      setAuthState({
        user: data.user,
        isAuthenticated: true,
        loading: false,
        error: null
      });
  
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      return data.user;
    } catch (err) {
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: err.message
      }));
      throw err;
    }
  };

  const login = async ({ username, password }) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
  
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
  
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Login failed');
      }
  
      const data = await response.json();
      
      // Store the token
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Update the auth state
      setAuthState({
        user: data.user,
        isAuthenticated: true,
        loading: false,
        error: null
      });
      
      return data;
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: error.message,
        isAuthenticated: false,
        user: null
      }));
      
      // Clean up storage on error
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      throw error;
    }
  };

  const logout = () => {
    setAuthState({
      user: null,
      isAuthenticated: false,
      loading: false,
      error: null
    });
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const updateUserProfile = async (profileData) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }));
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      const updatedUser = await response.json();
      setAuthState({
        user: updatedUser,
        isAuthenticated: true,
        loading: false,
        error: null
      });
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      return updatedUser;
    } catch (err) {
      setAuthState(prev => ({ ...prev, error: err.message, loading: false }));
      throw err;
    }
  };

  const updateBio = async (bio) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }));
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/users/bio`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ bio })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update bio');
      }

      const updatedUser = await response.json();
      setAuthState({
        user: updatedUser,
        isAuthenticated: true,
        loading: false,
        error: null
      });
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      return updatedUser;
    } catch (err) {
      setAuthState(prev => ({ ...prev, error: err.message, loading: false }));
      throw err;
    }
  };

  return {
    ...authState,
    register,
    login,
    logout,
    updateUserProfile,
    updateBio
  };
};