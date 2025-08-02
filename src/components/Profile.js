import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import './Profile.css';
import useAuth from '../hooks/useAuth';

// Supabase configuration
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

const Profile = ({ user, autoRefresh, onAutoRefreshChange, onClose, onLogout }) => {
  console.log('Profile bileşeni render edildi, user:', user);
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordMessage, setPasswordMessage] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('locat_notifications');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage('Yeni şifreler eşleşmiyor!');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordMessage('Yeni şifre en az 6 karakter olmalıdır!');
      return;
    }

    setIsChangingPassword(true);
    setPasswordMessage('');

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) {
        setPasswordMessage('Şifre değiştirme hatası: ' + error.message);
      } else {
        setPasswordMessage('✅ Şifre başarıyla değiştirildi!');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      }
    } catch (error) {
      setPasswordMessage('Şifre değiştirme hatası: ' + error.message);
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999
      }}
      onClick={onClose}
    >
      <div 
        style={{
          background: 'white',
          padding: '30px',
          borderRadius: '10px',
          minWidth: '400px',
          maxWidth: '600px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, color: '#333' }}>👤 Profil Bilgileri</h2>
          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#666'
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ color: '#333', marginBottom: '10px' }}>📧 Hesap Bilgileri</h3>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>E-posta:</label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                backgroundColor: '#f5f5f5'
              }}
            />
            <small style={{ color: '#666', fontSize: '12px' }}>E-posta adresi değiştirilemez</small>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Kullanıcı Adı:</label>
            <input
              type="text"
              value={user?.username || ''}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '5px'
              }}
            />
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ color: '#333', marginBottom: '10px' }}>🔧 Uygulama Ayarları</h3>
          
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={notifications}
                onChange={(e) => {
                  const newValue = e.target.checked;
                  setNotifications(newValue);
                  localStorage.setItem('locat_notifications', JSON.stringify(newValue));
                }}
                style={{ marginRight: '10px' }} 
              />
              Bildirimler
            </label>
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={autoRefresh}
                onChange={(e) => onAutoRefreshChange(e.target.checked)}
                style={{ marginRight: '10px' }} 
              />
              Otomatik Yenileme
            </label>
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ color: '#333', marginBottom: '10px' }}>🔐 Şifre Değiştir</h3>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Yeni Şifre:</label>
            <input
              type="password"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
              placeholder="Yeni şifrenizi girin"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '5px'
              }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Yeni Şifre (Tekrar):</label>
            <input
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
              placeholder="Yeni şifrenizi tekrar girin"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '5px'
              }}
            />
          </div>

          {passwordMessage && (
            <div style={{ 
              marginBottom: '15px', 
              padding: '10px', 
              borderRadius: '5px',
              backgroundColor: passwordMessage.includes('✅') ? '#d4edda' : '#f8d7da',
              color: passwordMessage.includes('✅') ? '#155724' : '#721c24',
              border: `1px solid ${passwordMessage.includes('✅') ? '#c3e6cb' : '#f5c6cb'}`
            }}>
              {passwordMessage}
            </div>
          )}

          <button
            onClick={handlePasswordChange}
            disabled={isChangingPassword || !passwordData.newPassword || !passwordData.confirmPassword}
            style={{
              background: isChangingPassword ? '#6c757d' : '#007bff',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '5px',
              cursor: isChangingPassword ? 'not-allowed' : 'pointer',
              opacity: isChangingPassword ? 0.6 : 1
            }}
          >
            {isChangingPassword ? '🔄 Değiştiriliyor...' : '🔐 Şifre Değiştir'}
          </button>
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              background: '#6c757d',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Kapat
          </button>
          <button
            onClick={onLogout}
            style={{
              background: '#dc3545',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            🚪 Çıkış Yap
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile; 