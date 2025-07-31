import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import MapComponent from './components/MapComponent';
import UserList from './components/UserList';
import Header from './components/Header';
import Login from './components/Login';
import useAuth from './hooks/useAuth';
import './index.css';

// Supabase yapılandırması
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://zunrhemhtbslfythqzsi.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1bnJoZW1odGJzbGZ5dGhxenNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4MjI3NjQsImV4cCI6MjA2OTM5ODc2NH0.L_T2TPTOqSjAseU623yYETWDcrxbf1S2IrsEZkeUgZg';

const supabase = createClient(supabaseUrl, supabaseKey);

function App() {
  const { user, loading: authLoading, login, logout, isAuthenticated } = useAuth();
  const [locations, setLocations] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Konumları çek
  const fetchLocations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) {
        throw error;
      }

      console.log('Çekilen konumlar:', data);
      setLocations(data || []);
      
      // Kullanıcıları grupla ve en son konumlarını al
      const userMap = new Map();
      
      // Kullanıcı email bilgilerini auth.users tablosundan al
      const userEmailMap = new Map();
      
      // Benzersiz user ID'leri topla
      const userIds = [...new Set((data || []).map(location => location.user_id))];
      
      // Supabase auth.users tablosundan email bilgilerini çek
      if (userIds.length > 0) {
        try {
          // auth.users tablosuna doğrudan erişim için service_role key gerekli
          // Bunun yerine RPC fonksiyonu kullanacağız
          
          // Her user ID için email bilgisini al
          const emailPromises = userIds.map(async (userId) => {
            try {
              const { data: email, error } = await supabase
                .rpc('get_user_email', { user_uuid: userId });
              
              if (!error && email) {
                // Email'in @ işaretinden önceki kısmını al
                const emailPrefix = email.split('@')[0];
                console.log(`User ${userId} email: ${email} → ${emailPrefix}`);
                return { userId, emailPrefix };
              } else {
                console.log(`User ${userId} email alınamadı:`, error);
                return { userId, emailPrefix: null };
              }
            } catch (error) {
              console.log(`User ${userId} RPC hatası:`, error);
              return { userId, emailPrefix: null };
            }
          });
          
          // Tüm email isteklerini bekle
          const emailResults = await Promise.all(emailPromises);
          
          // Sonuçları map'e ekle
          emailResults.forEach(({ userId, emailPrefix }) => {
            if (emailPrefix) {
              userEmailMap.set(userId, emailPrefix);
            } else {
              // Email alınamazsa daha okunabilir fallback isim kullan
              const parts = userId.split('-');
              const readableName = `User_${parts[0]}`;
              userEmailMap.set(userId, readableName);
            }
          });
          
        } catch (error) {
          console.log('Email bilgileri alınamadı:', error);
          // Hata durumunda tüm kullanıcılar için fallback isim oluştur
          userIds.forEach(userId => {
            const shortId = userId.substring(0, 8);
            userEmailMap.set(userId, `User_${shortId}`);
          });
        }
      }

      (data || []).forEach(location => {
        const userId = location.user_id;
        if (!userMap.has(userId) || new Date(location.updated_at) > new Date(userMap.get(userId).updated_at)) {
          // Email prefix'i varsa kullan, yoksa User_XXXXXXXX formatını kullan
          const userName = userEmailMap.get(userId) || `User_${userId.substring(0, 8)}`;
          userMap.set(userId, {
            id: userId,
            name: userName,
            latitude: location.latitude,
            longitude: location.longitude,
            updated_at: location.updated_at,
            isOnline: isUserOnline(location.updated_at)
          });
        }
      });

      const userList = Array.from(userMap.values());
      setUsers(userList);
      setLastUpdate(new Date());

    } catch (err) {
      console.error('Konum çekme hatası:', err);
      setError(`Konumlar yüklenirken hata oluştu: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  // Kullanıcının online olup olmadığını kontrol et (son 30 dakika)
  const isUserOnline = (lastUpdate) => {
    const now = new Date();
    const updateTime = new Date(lastUpdate);
    const diffMinutes = (now - updateTime) / (1000 * 60);
    return diffMinutes <= 30;
  };

  // Otomatik yenileme
  useEffect(() => {
    fetchLocations();

    let interval;
    if (autoRefresh) {
      // Production'da daha uzun interval (60 saniye)
      const intervalTime = process.env.NODE_ENV === 'production' ? 60000 : 30000;
      interval = setInterval(fetchLocations, intervalTime);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, fetchLocations]);

  // Real-time güncellemeler için Supabase subscription
  useEffect(() => {
    const subscription = supabase
      .channel('locations')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'locations' 
        }, 
        (payload) => {
          console.log('Real-time güncelleme:', payload);
          fetchLocations(); // Yeni veri geldiğinde yenile
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchLocations]);

  // Kullanıcı seçimi
  const handleUserSelect = (user) => {
    setSelectedUser(user);
  };

  // Arama filtresi
  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // İstatistikler
  const stats = {
    totalUsers: users.length,
    onlineUsers: users.filter(user => user.isOnline).length,
    totalLocations: locations.length,
    lastUpdate: lastUpdate
  };

  // Authentication loading
  if (authLoading) {
    return (
      <div className="app">
        <div className="loading" style={{ 
          height: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          fontSize: '1.2rem',
          color: '#666'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📍</div>
            <div>LocAt yükleniyor...</div>
          </div>
        </div>
      </div>
    );
  }

  // Login required
  if (!isAuthenticated()) {
    return <Login onLogin={login} />;
  }

  return (
    <div className="app">
      <Header 
        stats={stats}
        autoRefresh={autoRefresh}
        onAutoRefreshChange={setAutoRefresh}
        onRefresh={fetchLocations}
        loading={loading}
        user={user}
        onLogout={logout}
      />
      
      <div className="main-content">
        <UserList
          users={filteredUsers}
          selectedUser={selectedUser}
          onUserSelect={handleUserSelect}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          loading={loading}
          error={error}
        />
        
        <div className="map-container">
          <MapComponent
            users={users}
            selectedUser={selectedUser}
            onUserSelect={handleUserSelect}
          />
        </div>
      </div>
    </div>
  );
}

export default App;