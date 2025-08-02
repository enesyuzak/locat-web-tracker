import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://zunrhemhtbslfythqzsi.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1bnJoZW1odGJzbGZ5dGhxenNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4MjI3NjQsImV4cCI6MjA2OTM5ODc2NH0.L_T2TPTOqSjAseU623yYETWDcrxbf1S2IrsEZkeUgZg';

// Sınırsız session için Supabase client konfigürasyonu
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
    // Session timeout'larını sınırsız yap
    storage: {
      getItem: (key) => {
        try {
          return localStorage.getItem(key);
        } catch {
          return null;
        }
      },
      setItem: (key, value) => {
        try {
          localStorage.setItem(key, value);
        } catch {}
      },
      removeItem: (key) => {
        try {
          localStorage.removeItem(key);
        } catch {}
      }
    }
  }
});

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
          // Sadece manuel logout durumunda localStorage'ı temizle
          // Otomatik logout durumunda localStorage'ı koru
          const isManualLogout = !localStorage.getItem('locat_auth');
          if (isManualLogout) {
            logout();
          }
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
      // Önce localStorage'dan kontrol et (sınırsız session için)
      const authData = localStorage.getItem('locat_auth');
      const authToken = localStorage.getItem('locat_auth_token');
      
      if (authData && authToken) {
        // LocalStorage'da veri var, kullanıcıyı otomatik giriş yap
        const userData = JSON.parse(authData);
        setUser(userData);
        setLoading(false);
        return;
      }
      
      // LocalStorage'da veri yoksa Supabase session'ını kontrol et
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Session check error:', error);
        // Hata durumunda logout yapma, sadece loading'i false yap
        setLoading(false);
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
      }
    } catch (error) {
      console.error('Auth check error:', error);
      // Hata durumunda logout yapma, sadece loading'i false yap
    } finally {
      setLoading(false);
    }
  };

  const login = (userData) => {
    setUser(userData);
  };

  const logout = async () => {
    try {
      // Supabase session'ını temizle
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // LocalStorage'ı temizle
      localStorage.removeItem('locat_auth');
      localStorage.removeItem('locat_auth_token');
      setUser(null);
    }
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