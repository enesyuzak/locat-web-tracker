import { useState, useEffect } from 'react';

const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = () => {
    try {
      const authData = localStorage.getItem('locat_auth');
      const authToken = localStorage.getItem('locat_auth_token');
      
      if (authData && authToken) {
        const userData = JSON.parse(authData);
        const tokenData = atob(authToken).split(':');
        const loginTime = parseInt(tokenData[2]);
        const currentTime = Date.now();
        
        // Token 24 saat geçerli
        const tokenExpiry = 24 * 60 * 60 * 1000; // 24 hours
        
        if (currentTime - loginTime < tokenExpiry) {
          setUser(userData);
        } else {
          // Token expired
          logout();
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = (userData) => {
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('locat_auth');
    localStorage.removeItem('locat_auth_token');
    setUser(null);
  };

  const isAuthenticated = () => {
    return user !== null;
  };

  const hasRole = (role) => {
    return user && user.role === role;
  };

  return {
    user,
    loading,
    login,
    logout,
    isAuthenticated,
    hasRole
  };
};

export default useAuth;