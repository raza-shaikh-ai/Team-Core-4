import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import client from '../api/client';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load token and user on app startup
  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('token');
        const storedUser = await AsyncStorage.getItem('user');

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          
          // Verify session validity with quick health stats request
          try {
            await client.get('/stats/platform');
          } catch (err) {
            // If API call fails because of auth, clear storage
            if (err.response && (err.response.status === 401 || err.response.status === 403)) {
              await logout();
            }
          }
        }
      } catch (e) {
        console.error('Failed to load storage session', e);
      } finally {
        setLoading(false);
      }
    };

    bootstrapAsync();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await client.post('/auth/login', { email, password });
      const { access_token, user: userData } = response.data;
      
      await AsyncStorage.setItem('token', access_token);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      
      setToken(access_token);
      setUser(userData);
      return { success: true };
    } catch (error) {
      console.error('Login detailed error:', error);
      const message = error.response?.data?.detail || error.message || 'Login failed';
      // Handled case: OTP verification required
      if (error.response?.status === 403 && message.includes('verify your OTP')) {
        return { success: false, otpRequired: true, message };
      }
      return { success: false, message };
    }
  };

  const register = async (name, email, password, role, latitude, longitude) => {
    try {
      const response = await client.post('/auth/register', {
        name,
        email,
        password,
        role,
        latitude,
        longitude
      });
      return { success: true, message: response.data.message };
    } catch (error) {
      console.error('Register detailed error:', error);
      const message = error.response?.data?.detail || error.message || 'Registration failed';
      return { success: false, message };
    }
  };

  const verifyOtp = async (email, otpCode) => {
    try {
      const response = await client.post('/auth/verify-otp', {
        email,
        otp_code: otpCode
      });
      const { access_token, user: userData } = response.data;

      await AsyncStorage.setItem('token', access_token);
      await AsyncStorage.setItem('user', JSON.stringify(userData));

      setToken(access_token);
      setUser(userData);
      return { success: true };
    } catch (error) {
      console.error('Verify OTP detailed error:', error);
      const message = error.response?.data?.detail || error.message || 'OTP verification failed';
      return { success: false, message };
    }
  };

  const updateLocation = async (latitude, longitude) => {
    try {
      const response = await client.patch('/auth/location', {
        latitude,
        longitude
      });
      // Update local storage and user state with new location
      const updatedUser = { ...user, latitude, longitude };
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      return { success: true };
    } catch (error) {
      console.warn('Failed to update location on backend:', error);
      return { success: false };
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      setToken(null);
      setUser(null);
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,
        login,
        register,
        verifyOtp,
        updateLocation,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
