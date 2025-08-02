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
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [isForgotPasswordMode, setIsForgotPasswordMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const { email, password, confirmPassword } = credentials;

    // Register mode validasyonları
    if (isRegisterMode) {
      if (password !== confirmPassword) {
        setError('Şifreler eşleşmiyor');
        setLoading(false);
        return;
      }
      
      if (password.length < 6) {
        setError('Şifre en az 6 karakter olmalıdır');
        setLoading(false);
        return;
      }
    }

    try {
      if (isRegisterMode) {
        // Kayıt olma işlemi
        const { data, error } = await supabase.auth.signUp({
          email: email,
          password: password,
          options: {
            data: {
              username: email.split('@')[0]
            }
          }
        });

        if (error) {
          throw error;
        }

        if (data.user) {
          setSuccess('Kayıt başarılı! Email adresinizi kontrol edin ve doğrulama linkine tıklayın.');
          setCredentials({ email: '', password: '', confirmPassword: '' });
          // 3 saniye sonra login moduna geç
          setTimeout(() => {
            setIsRegisterMode(false);
            setSuccess('');
          }, 3000);
        }
      } else {
        // Giriş yapma işlemi
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
            role: 'admin',
            loginTime: new Date().toISOString(),
            accessToken: data.session.access_token,
            refreshToken: data.session.refresh_token
          };
          
          // LocalStorage'a kaydet
          localStorage.setItem('locat_auth', JSON.stringify(userData));
          localStorage.setItem('locat_auth_token', data.session.access_token);
          
          onLogin(userData);
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
      
      // Kullanıcı dostu hata mesajları
      let errorMessage = isRegisterMode ? 'Kayıt olurken bir hata oluştu' : 'Giriş yapılırken bir hata oluştu';
      
      if (err.message.includes('Invalid login credentials')) {
        errorMessage = 'Geçersiz email veya şifre';
      } else if (err.message.includes('Email not confirmed')) {
        errorMessage = 'Email adresinizi doğrulamanız gerekiyor';
      } else if (err.message.includes('Too many requests')) {
        errorMessage = 'Çok fazla deneme yapıldı, lütfen daha sonra tekrar deneyin';
      } else if (err.message.includes('Invalid email')) {
        errorMessage = 'Geçersiz email formatı';
      } else if (err.message.includes('User already registered')) {
        errorMessage = 'Bu email adresi zaten kayıtlı';
      } else if (err.message.includes('Password should be at least 6 characters')) {
        errorMessage = 'Şifre en az 6 karakter olmalıdır';
      } else if (err.message.includes('Unable to validate email address')) {
        errorMessage = 'Email adresi doğrulanamadı';
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
    setError('');
    setSuccess('');
  };

  const toggleMode = () => {
    setIsRegisterMode(!isRegisterMode);
    setCredentials({ email: '', password: '', confirmPassword: '' });
    setError('');
    setSuccess('');
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!resetEmail) {
      setError('Email adresini girin');
      setLoading(false);
      return;
    }

    try {
      // Supabase email reset
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: window.location.origin + '/reset-password'
      });

      if (error) {
        throw error;
      }

      setSuccess('Şifre sıfırlama linki email adresinize gönderildi. Email\'inizi kontrol edin ve linke tıklayın.');
      
      setResetEmail('');
      
      // 10 saniye sonra login moduna geç
      setTimeout(() => {
        setIsForgotPasswordMode(false);
        setSuccess('');
      }, 10000);
    } catch (err) {
      console.error('Password reset error:', err);
      setError('Şifre sıfırlama hatası. Lütfen daha sonra tekrar deneyin.');
    } finally {
      setLoading(false);
    }
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
          <p>{isRegisterMode ? 'Yeni hesap oluşturun' : 'Konum takip sistemi yönetim paneli'}</p>
        </div>

        {isForgotPasswordMode ? (
          <form onSubmit={handleForgotPassword} className="login-form">
            <div className="form-group">
              <label htmlFor="resetEmail">Email</label>
              <input
                type="email"
                id="resetEmail"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
                placeholder="Email adresinizi girin"
                disabled={loading}
              />
            </div>
            
            <button type="submit" className="login-button" disabled={loading}>
              {loading ? 'Gönderiliyor...' : 'Şifre Sıfırlama Linki Gönder'}
            </button>
            
            <button 
              type="button" 
              className="back-to-login" 
              onClick={() => {
                setIsForgotPasswordMode(false);
                setResetEmail('');
                setError('');
                setSuccess('');
              }}
            >
              ← Giriş Ekranına Dön
            </button>
          </form>
        ) : (
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
                placeholder={isRegisterMode ? "Şifrenizi oluşturun (min. 6 karakter)" : "Şifrenizi girin"}
                disabled={loading}
                minLength={isRegisterMode ? 6 : undefined}
              />
            </div>

          {isRegisterMode && (
            <div className="form-group">
              <label htmlFor="confirmPassword">Şifre Tekrar</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={credentials.confirmPassword}
                onChange={handleChange}
                required
                placeholder="Şifrenizi tekrar girin"
                disabled={loading}
                minLength={6}
              />
            </div>
          )}

          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          {success && (
            <div className="success-message">
              <span className="success-icon">✅</span>
              {success}
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
                {isRegisterMode ? 'Kayıt oluşturuluyor...' : 'Giriş yapılıyor...'}
              </>
            ) : (
              isRegisterMode ? 'Kayıt Ol' : 'Giriş Yap'
            )}
          </button>

          {!isRegisterMode && (
            <div className="forgot-password">
              <button 
                type="button" 
                className="forgot-password-button"
                onClick={() => {
                  setIsForgotPasswordMode(true);
                  setError('');
                  setSuccess('');
                }}
                disabled={loading}
              >
                Şifremi Unuttum
              </button>
            </div>
          )}

          <div className="auth-toggle">
            <button 
              type="button" 
              className="toggle-button"
              onClick={toggleMode}
              disabled={loading}
            >
              {isRegisterMode ? 'Zaten hesabınız var mı? Giriş yapın' : 'Hesabınız yok mu? Kayıt olun'}
            </button>
          </div>
        </form>
        )}

        <div className="login-footer">
          <div className="login-info">
            <h4>ℹ️ {isRegisterMode ? 'Kayıt Bilgisi' : 'Giriş Bilgisi'}</h4>
            {isRegisterMode ? (
              <>
                <p>Web paneli için yeni bir hesap oluşturun. Kayıt olduktan sonra email adresinizi doğrulamanız gerekecek.</p>
                <div className="info-note">
                  <strong>Not:</strong> Bu hesap sadece web paneli içindir. Mobil uygulama için ayrı kayıt gereklidir.
                </div>
              </>
            ) : (
              <>
                <p>LocAt web paneli veya mobil uygulamasında kayıtlı olan email ve şifrenizi kullanarak giriş yapabilirsiniz.</p>
                <div className="info-note">
                  <strong>Not:</strong> Henüz hesabınız yoksa yukarıdaki "Kayıt Ol" butonunu kullanabilirsiniz.
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;