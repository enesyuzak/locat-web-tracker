import React, { useState } from 'react';
import './Login.css';

const Login = ({ onLogin }) => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Demo credentials - Production'da bu bilgiler backend'den gelecek
  const validCredentials = {
    admin: 'locat2025',
    demo: 'demo123',
    tracker: 'track2025'
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const { username, password } = credentials;

    if (validCredentials[username] && validCredentials[username] === password) {
      // Login başarılı
      const userData = {
        username,
        role: username === 'admin' ? 'admin' : 'viewer',
        loginTime: new Date().toISOString()
      };
      
      // LocalStorage'a kaydet
      localStorage.setItem('locat_auth', JSON.stringify(userData));
      localStorage.setItem('locat_auth_token', btoa(`${username}:${password}:${Date.now()}`));
      
      onLogin(userData);
    } else {
      setError('Geçersiz kullanıcı adı veya şifre');
    }
    
    setLoading(false);
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
            <label htmlFor="username">Kullanıcı Adı</label>
            <input
              type="text"
              id="username"
              name="username"
              value={credentials.username}
              onChange={handleChange}
              required
              placeholder="Kullanıcı adınızı girin"
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
          <div className="demo-credentials">
            <h4>Demo Hesapları:</h4>
            <div className="demo-accounts">
              <div className="demo-account">
                <strong>admin</strong> / locat2025
              </div>
              <div className="demo-account">
                <strong>demo</strong> / demo123
              </div>
              <div className="demo-account">
                <strong>tracker</strong> / track2025
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;