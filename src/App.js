import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import MapComponent from './components/MapComponent';
import UserList from './components/UserList';
import Header from './components/Header';
import Login from './components/Login';
import Profile from './components/Profile';
import ResetPassword from './components/ResetPassword';
import useAuth from './hooks/useAuth';
import './index.css';
import './components/Profile.css';

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
  const [autoRefresh, setAutoRefresh] = useState(() => {
    const saved = localStorage.getItem('locat_autoRefresh');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [lastUpdate, setLastUpdate] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isRequestingLocations, setIsRequestingLocations] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);

  // URL'de reset-password varsa modal'ı aç
  useEffect(() => {
    console.log('URL hash:', window.location.hash);
    if (window.location.hash.includes('reset-password')) {
      console.log('Reset password modal açılıyor...');
      setShowResetPassword(true);
      // URL'den hash'i temizle
      window.history.replaceState(null, null, window.location.pathname);
    }
  }, []);

  // Konumları çek
  const fetchLocations = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);

      // Eğer manuel yenileme ise, önce tüm kullanıcılardan anlık konum iste
      if (forceRefresh) {
        console.log('🔄 Manuel yenileme: Tüm kullanıcılardan GERÇEK ZAMANLI konum isteniyor...');
        
        // Hemen trigger sinyali gönder
        await sendTriggerSignal();
        
        // Mobil cihazların yanıt vermesi için daha uzun bekle (gerçek zamanlı konum için)
        await new Promise(resolve => setTimeout(resolve, 10000)); // 10 saniye bekle
      }

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
              // Fallback: User ID'nin ilk 8 karakterini kullan
              const shortId = userId.substring(0, 8);
              userEmailMap.set(userId, `User_${shortId}`);
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
        
        // Trigger kayıtlarını filtrele (gerçek konum kayıtları değil)
        if (location.battery_status === 'LOCATION_REQUEST_TRIGGER' || 
            location.battery_status === 'TRIGGER_TIMESTAMP_UPDATE') {
          return;
        }
        
        if (!userMap.has(userId) || new Date(location.updated_at) > new Date(userMap.get(userId).updated_at)) {
          // Email prefix'i varsa kullan, yoksa User_XXXXXXXX formatını kullan
          const userName = userEmailMap.get(userId) || `User_${userId.substring(0, 8)}`;
          
          // Konum yaşını hesapla
          const locationAge = getLocationAge(location.updated_at);
          
          userMap.set(userId, {
            id: userId,
            name: userName,
            latitude: location.latitude,
            longitude: location.longitude,
            updated_at: location.updated_at,
            isOnline: isUserOnline(location.updated_at),
            batteryLevel: location.battery_level || null,
            batteryStatus: location.battery_status || null,
            locationAge: locationAge,
            isStale: !isUserOnline(location.updated_at) // Eski konum mu?
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

  // Basit trigger sinyali gönder - Alternatif yöntem
  const sendTriggerSignal = async () => {
    console.log('🔓 Trigger sinyali gönderiliyor...');
    
    try {
      const timestamp = new Date().toISOString();
      console.log('📡 Trigger sinyali gönderiliyor (alternatif yöntem)...', timestamp);
      
      // Mevcut kullanıcılardan birini kullan (foreign key constraint için)
      const { data: existingUsers, error: usersError } = await supabase
        .from('locations')
        .select('user_id')
        .limit(1)
        .order('updated_at', { ascending: false });

      if (usersError || !existingUsers || existingUsers.length === 0) {
        console.error('❌ Mevcut kullanıcı bulunamadı, trigger gönderilemiyor');
        return;
      }

      const existingUserId = existingUsers[0].user_id;
      console.log('👤 Kullanıcı ID kullanılıyor:', existingUserId);
      
      // Yöntem 1: Özel trigger kaydı
      const triggerRecord = {
        user_id: existingUserId, // Mevcut kullanıcı ID'si kullan
        latitude: 0,
        longitude: 0,
        updated_at: timestamp,
        battery_level: -999,
        battery_status: 'LOCATION_REQUEST_TRIGGER'
      };

      console.log('📡 Gönderilecek trigger kaydı:', triggerRecord);

      const { data: triggerData, error: triggerError } = await supabase
        .from('locations')
        .insert([triggerRecord]);
      
      if (triggerError) {
        console.error('❌ Trigger gönderme hatası:', triggerError);
      } else {
        console.log('✅ Trigger sinyali başarıyla gönderildi:', triggerData);
      }

      // Yöntem 2: Mevcut kullanıcıların battery_status'unu güncelle
      console.log('📡 Alternatif: Mevcut kullanıcılara sinyal gönderiliyor...');
      
      // Son 2 saat içinde aktif olan kullanıcıları bul
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      const { data: activeUsers, error: activeUsersError } = await supabase
        .from('locations')
        .select('user_id')
        .gte('updated_at', twoHoursAgo)
        .neq('battery_status', 'LOCATION_REQUEST_TRIGGER')
        .neq('battery_status', 'TRIGGER_TIMESTAMP_UPDATE');

      if (!activeUsersError && activeUsers && activeUsers.length > 0) {
        console.log(`📱 ${activeUsers.length} aktif kullanıcıya trigger gönderiliyor...`);
        
        // Her aktif kullanıcı için özel trigger kaydı oluştur
        const userTriggers = activeUsers.slice(0, 5).map(user => ({
          user_id: user.user_id,
          latitude: 0,
          longitude: 0,
          updated_at: timestamp,
          battery_level: -888,
          battery_status: 'LOCATION_REQUEST_TRIGGER'
        }));

        const { data: userTriggerData, error: userTriggerError } = await supabase
          .from('locations')
          .insert(userTriggers);

        if (userTriggerError) {
          console.error('❌ Kullanıcı trigger gönderme hatası:', userTriggerError);
        } else {
          console.log('✅ Kullanıcı trigger sinyalleri gönderildi:', userTriggerData);
        }
      } else {
        console.log('⚠️ Aktif kullanıcı bulunamadı, sadece ana trigger gönderildi');
      }

      console.log('✅ Trigger zamanı:', timestamp);
      
    } catch (error) {
      console.error('❌ Trigger gönderme exception:', error);
    }
  };

  // Kullanıcının online olup olmadığını kontrol et (son 30 dakika)
  const isUserOnline = (lastUpdate) => {
    const now = new Date();
    const updateTime = new Date(lastUpdate);
    const diffMinutes = (now - updateTime) / (1000 * 60);
    return diffMinutes <= 30;
  };

  // Konum yaşını hesapla ve okunabilir format döndür
  const getLocationAge = (lastUpdate) => {
    const now = new Date();
    const updateTime = new Date(lastUpdate);
    const diffMinutes = (now - updateTime) / (1000 * 60);
    
    if (diffMinutes < 1) {
      return 'Şimdi';
    } else if (diffMinutes < 60) {
      return `${Math.floor(diffMinutes)} dk önce`;
    } else if (diffMinutes < 1440) { // 24 saat
      const hours = Math.floor(diffMinutes / 60);
      return `${hours} saat önce`;
    } else {
      const days = Math.floor(diffMinutes / 1440);
      return `${days} gün önce`;
    }
  };

  // Tüm kullanıcılardan anlık konum çek ve kaydet
  const requestLocationFromAllUsers = async () => {
    try {
      setIsRequestingLocations(true);
      console.log('📍 Tüm kullanıcılardan GERÇEK ZAMANLI konum isteniyor...');
      
      // Hemen trigger sinyali gönder
      await sendTriggerSignal();
      
      // Mobil cihazların yanıt vermesi için daha uzun bekle (gerçek zamanlı konum için)
      await new Promise(resolve => setTimeout(resolve, 10000)); // 10 saniye bekle

      // Önce mevcut aktif kullanıcıları tespit et
      const { data: currentLocations, error } = await supabase
        .from('locations')
        .select('user_id')
        .neq('battery_status', 'LOCATION_REQUEST_TRIGGER')
        .neq('battery_status', 'TRIGGER_TIMESTAMP_UPDATE')
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('❌ Aktif kullanıcılar alınamadı:', error);
        setIsRequestingLocations(false);
        return;
      }

      // Benzersiz kullanıcıları al
      const activeUsers = new Set(currentLocations?.map(loc => loc.user_id) || []);
      console.log(`📊 ${activeUsers.size} aktif kullanıcı tespit edildi`);

      if (activeUsers.size === 0) {
        console.log('⚠️ Aktif kullanıcı bulunamadı');
        setIsRequestingLocations(false);
        return;
      }

      let waitTime = 0;
      const maxWaitTime = 30000; // 30 saniye (gerçek zamanlı konum için daha uzun)
      const checkInterval = 3000; // 3 saniye
      
      const checkForNewLocations = async () => {
        if (waitTime >= maxWaitTime) {
          console.log('⏰ Maksimum bekleme süresi doldu');
          setIsRequestingLocations(false);
          fetchLocations(false);
          return;
        }

        // Son 2 dakika içindeki yeni konumları kontrol et (gerçek zamanlı konum için daha geniş aralık)
        const twoMinutesAgo = new Date(Date.now() - 120000).toISOString();
        const { data: recentLocations } = await supabase
          .from('locations')
          .select('user_id, updated_at')
          .gte('updated_at', twoMinutesAgo)
          .neq('battery_status', 'LOCATION_REQUEST_TRIGGER')
          .neq('battery_status', 'TRIGGER_TIMESTAMP_UPDATE')
          .order('updated_at', { ascending: false });

        const recentUserCount = new Set(recentLocations?.map(loc => loc.user_id) || []).size;
        
        console.log(`📊 Son 2 dakikada ${recentUserCount} kullanıcıdan gerçek zamanlı konum alındı`);
        
        if (recentUserCount >= Math.min(activeUsers.size * 0.3, 2)) {
          // Kullanıcıların en az %30'undan veya minimum 2 kullanıcıdan yanıt geldi
          console.log('✅ Yeterli sayıda gerçek zamanlı konum yanıtı alındı');
          setIsRequestingLocations(false);
          fetchLocations(false);
          return;
        }

        waitTime += checkInterval;
        setTimeout(checkForNewLocations, checkInterval);
      };

      // Fallback trigger sistemi
      const sendTriggerFallback = async () => {
        console.log('📡 Fallback: Trigger sistemi kullanılıyor...');
        
        // Mevcut kullanıcılardan birini kullan (foreign key constraint için)
        const { data: existingUsers, error: usersError } = await supabase
          .from('locations')
          .select('user_id')
          .limit(1)
          .order('updated_at', { ascending: false });

        if (usersError || !existingUsers || existingUsers.length === 0) {
          console.error('❌ Mevcut kullanıcı bulunamadı, fallback trigger gönderilemiyor');
          return;
        }

        const existingUserId = existingUsers[0].user_id;
        
        const triggerRecord = {
          user_id: existingUserId, // Mevcut kullanıcı ID'si kullan
          latitude: 0,
          longitude: 0,
          updated_at: new Date().toISOString(),
          battery_level: -999,
          battery_status: 'LOCATION_REQUEST_TRIGGER'
        };

        await supabase.from('locations').insert([triggerRecord]);
        console.log('✅ Fallback trigger sinyali gönderildi');
      };

      // İlk kontrol 5 saniye sonra başlasın
      setTimeout(checkForNewLocations, 5000);

    } catch (error) {
      console.error('❌ Konum talebi hatası:', error);
      setIsRequestingLocations(false);
    }
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

  // Profil state'ini debug et
  useEffect(() => {
    console.log('showProfile state değişti:', showProfile);
  }, [showProfile]);

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
  const usersWithBattery = users.filter(user => user.batteryLevel !== null && user.batteryLevel !== undefined);
  const lowBatteryUsers = usersWithBattery.filter(user => user.batteryLevel < 20);
  const avgBattery = usersWithBattery.length > 0 
    ? Math.round(usersWithBattery.reduce((sum, user) => sum + user.batteryLevel, 0) / usersWithBattery.length)
    : null;

  const stats = {
    totalUsers: users.length,
    onlineUsers: users.filter(user => user.isOnline).length,
    totalLocations: locations.length,
    lastUpdate: lastUpdate,
    usersWithBattery: usersWithBattery.length,
    lowBatteryUsers: lowBatteryUsers.length,
    avgBattery: avgBattery
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
        onAutoRefreshChange={(value) => {
          setAutoRefresh(value);
          localStorage.setItem('locat_autoRefresh', JSON.stringify(value));
        }}
        onRefresh={() => fetchLocations(true)}
        loading={loading || isRequestingLocations}
        user={user}
        onLogout={async () => {
          await logout();
        }}
        onShowProfile={() => {
          console.log('Header\'dan showProfile çağrıldı');
          console.log('Önceki showProfile state:', showProfile);
          setShowProfile(true);
          console.log('setShowProfile(true) çağrıldı');
        }}
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

      {/* Profile modal */}
      {showProfile && (
        <Profile
          user={user}
          autoRefresh={autoRefresh}
          onAutoRefreshChange={(value) => {
            setAutoRefresh(value);
            localStorage.setItem('locat_autoRefresh', JSON.stringify(value));
          }}
          onClose={() => {
            console.log('Profile kapatılıyor');
            setShowProfile(false);
          }}
          onLogout={async () => {
            await logout();
          }}
        />
      )}

      {/* Reset Password modal */}
      {showResetPassword && (
        <ResetPassword
          onClose={() => {
            console.log('Reset Password kapatılıyor');
            setShowResetPassword(false);
          }}
          onSuccess={() => {
            console.log('Şifre başarıyla değiştirildi');
            // Başarılı şifre değişikliği sonrası yapılacak işlemler
          }}
        />
      )}
    </div>
  );
}

export default App;