import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import MapComponent from './components/MapComponent';
import UserList from './components/UserList';
import Header from './components/Header';
import Login from './components/Login';
import useAuth from './hooks/useAuth';
import './index.css';

// Supabase yapılandırması
const supabaseUrl = 'https://zunrhemhtbslfythqzsi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1bnJoZW1odGJzbGZ5dGhxenNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4MjI3NjQsImV4cCI6MjA2OTM5ODc2NH0.L_T2TPTOqSjAseU623yYETWDcrxbf1S2IrsEZkeUgZg';

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
      
      (data || []).forEach(location => {
        const userId = location.user_id;
        if (!userMap.has(userId) || new Date(location.updated_at) > new Date(userMap.get(userId).updated_at)) {
          userMap.set(userId, {
            id: userId,
            name: `Kullanıcı ${userId.substring(0, 8)}`,
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