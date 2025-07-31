import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import './Login.css';

// Supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://zunrhemhtbslfythqzsi.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1bnJoZW1odGJzbGZ5dGhxenNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4MjI3NjQsImV4cCI6MjA2OTM5ODc2NH0.L_T2TPTOqSjAseU623yYETWDcrxbf1S2IrsEZkeUgZg';
const supabase = createClient(supabaseUrl, supabaseKey);

const Login = ({ onLogin }) => {
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { email, password } = credentials;

    try {
      // Supabase Auth ile giriş yap
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
      });

      if (error) {
        throw error;
      }

      if (data.user && data.session) {
        // Login başarılı
        const userData = {
          id: data.user.id,
          email: data.user.email,
          username: data.user.email.split('@')[0],
          role: 'admin', // Tüm giriş yapan kullanıcılar admin olarak kabul edilsin
          loginTime: new Date().toISOString(),
          accessToken: data.session.access_token,
          refreshToken: data.session.refresh_token
        };
        
        // LocalStorage'a kaydet
        localStorage.setItem('locat_auth', JSON.stringify(userData));
        localStorage.setItem('locat_auth_token', data.session.access_token);
        
        onLogin(userData);
      }
    } catch (err) {
      console.error('Login error:', err);
      
      // Kullanıcı dostu hata mesajları
      let errorMessage = 'Giriş yapılırken bir hata oluştu';
      
      if (err.message.includes('Invalid login credentials')) {
        errorMessage = 'Geçersiz email veya şifre';
      } else if (err.message.includes('Email not confirmed')) {
        errorMessage = 'Email adresinizi doğrulamanız gerekiyor';
      } else if (err.message.includes('Too many requests')) {
        errorMessage = 'Çok fazla deneme yapıldı, lütfen daha sonra tekrar deneyin';
      } else if (err.message.includes('Invalid email')) {
        errorMessage = 'Geçersiz email formatı';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
    setError(''); // Clear error when user types
  };

  return (
    <div className="login-container">
      <div className="login-background">
        <div className="login-overlay"></div>
      </div>
      
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <div className="logo-icon">📍</div>
            <h1>LocAt</h1>
          </div>
          <h2>Web Tracker</h2>
          <p>Konum takip sistemi yönetim paneli</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={credentials.email}
              onChange={handleChange}
              required
              placeholder="Email adresinizi girin"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Şifre</label>
            <input
              type="password"
              id="password"
              name="password"
              value={credentials.password}
              onChange={handleChange}
              required
              placeholder="Şifrenizi girin"
              disabled={loading}
            />
          </div>

          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className={`login-button ${loading ? 'loading' : ''}`}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Giriş yapılıyor...
              </>
            ) : (
              'Giriş Yap'
            )}
          </button>
        </form>

        <div className="login-footer">
          <div className="login-info">
            <h4>ℹ️ Giriş Bilgisi</h4>
            <p>LocAt mobil uygulamasında kayıtlı olan email ve şifrenizi kullanarak giriş yapabilirsiniz.</p>
            <div className="info-note">
              <strong>Not:</strong> Henüz hesabınız yoksa, önce LocAt mobil uygulamasından kayıt olmanız gerekmektedir.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;