import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://zunrhemhtbslfythqzsi.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1bnJoZW1odGJzbGZ5dGhxenNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4MjI3NjQsImV4cCI6MjA2OTM5ODc2NH0.L_T2TPTOqSjAseU623yYETWDcrxbf1S2IrsEZkeUgZg';
const supabase = createClient(supabaseUrl, supabaseKey);

const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
    
    // Supabase auth state değişikliklerini dinle
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session);
        
        if (event === 'SIGNED_IN' && session) {
          const userData = {
            id: session.user.id,
            email: session.user.email,
            username: session.user.email.split('@')[0],
            role: 'admin',
            loginTime: new Date().toISOString(),
            accessToken: session.access_token,
            refreshToken: session.refresh_token
          };
          
          localStorage.setItem('locat_auth', JSON.stringify(userData));
          localStorage.setItem('locat_auth_token', session.access_token);
          setUser(userData);
        } else if (event === 'SIGNED_OUT') {
          logout();
        } else if (event === 'TOKEN_REFRESHED' && session) {
          // Token yenilendiğinde localStorage'ı güncelle
          const existingUser = JSON.parse(localStorage.getItem('locat_auth') || '{}');
          const updatedUser = {
            ...existingUser,
            accessToken: session.access_token,
            refreshToken: session.refresh_token
          };
          localStorage.setItem('locat_auth', JSON.stringify(updatedUser));
          localStorage.setItem('locat_auth_token', session.access_token);
          setUser(updatedUser);
        }
        
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkAuthStatus = async () => {
    try {
      // Önce Supabase session'ını kontrol et
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Session check error:', error);
        logout();
        return;
      }

      if (session && session.user) {
        // Aktif session var
        const userData = {
          id: session.user.id,
          email: session.user.email,
          username: session.user.email.split('@')[0],
          role: 'admin',
          loginTime: new Date().toISOString(),
          accessToken: session.access_token,
          refreshToken: session.refresh_token
        };
        
        localStorage.setItem('locat_auth', JSON.stringify(userData));
        localStorage.setItem('locat_auth_token', session.access_token);
        setUser(userData);
      } else {
        // Session yok, localStorage'dan kontrol et
        const authData = localStorage.getItem('locat_auth');
        const authToken = localStorage.getItem('locat_auth_token');
        
        if (authData && authToken) {
          // Token'ı doğrula
          const { data: { user: tokenUser }, error: tokenError } = await supabase.auth.getUser(authToken);
          
          if (tokenError || !tokenUser) {
            // Token geçersiz
            logout();
          } else {
            // Token geçerli
            const userData = JSON.parse(authData);
            setUser(userData);
          }
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