import React from 'react';

const Header = ({ stats, autoRefresh, onAutoRefreshChange, onRefresh, loading, user, onLogout, onShowProfile }) => {
  console.log('Header props:', { stats, autoRefresh, loading, user });
  const formatTime = (date) => {
    if (!date) return 'Hiç';
    return date.toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <header className="header">
      <h1>LocAt - Konum Takip Sistemi</h1>
      
      <div className="header-info" style={{
        display: 'flex',
        visibility: 'visible',
        opacity: 1
      }}>
        <div className="stats">
          <div className="stat-item">
            <div className="stat-number">{stats.totalUsers}</div>
            <div className="stat-label">Toplam Kullanıcı</div>
          </div>
          
          <div className="stat-item">
            <div className="stat-number">{stats.onlineUsers}</div>
            <div className="stat-label">Aktif Kullanıcı</div>
          </div>
          
          <div className="stat-item">
            <div className="stat-number">{stats.totalLocations}</div>
            <div className="stat-label">Toplam Konum</div>
          </div>
          
          <div className="stat-item">
            <div className="stat-number">{formatTime(stats.lastUpdate)}</div>
            <div className="stat-label">Son Güncelleme</div>
          </div>

          {stats.avgBattery !== null && (
            <div className="stat-item">
              <div className="stat-number" style={{ 
                color: stats.avgBattery >= 50 ? '#4CAF50' : stats.avgBattery >= 20 ? '#FF9800' : '#f44336' 
              }}>
                🔋 %{stats.avgBattery}
              </div>
              <div className="stat-label">Ortalama Pil</div>
            </div>
          )}

          {stats.lowBatteryUsers > 0 && (
            <div className="stat-item">
              <div className="stat-number" style={{ color: '#f44336' }}>
                🪫 {stats.lowBatteryUsers}
              </div>
              <div className="stat-label">Düşük Pil</div>
            </div>
          )}
        </div>
        
        <div className="controls" style={{
          display: 'flex',
          visibility: 'visible',
          opacity: 1,
          zIndex: 1000
        }}>
          <button 
            className="refresh-btn" 
            onClick={onRefresh}
            disabled={loading}
            title="Tüm aktif kullanıcılardan gerçek zamanlı konum çek ve verileri yenile"
            style={{
              display: 'block',
              visibility: 'visible',
              opacity: 1,
              zIndex: 1000,
              backgroundColor: '#4CAF50',
              color: 'white',
              border: '2px solid #45a049',
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: 'bold',
              borderRadius: '8px',
              cursor: 'pointer',
              margin: '10px'
            }}
          >
            {loading ? '📡 Cihazlardan gerçek zamanlı konum çekiliyor...' : '📍 Gerçek Zamanlı Konum Çek'}
          </button>
          
          <div className="auto-refresh">
            <input
              type="checkbox"
              id="auto-refresh"
              checked={autoRefresh}
              onChange={(e) => onAutoRefreshChange(e.target.checked)}
            />
            <label htmlFor="auto-refresh">Otomatik Yenile (30s)</label>
          </div>

          {user && (
            <div className="user-info">
              <div className="user-details">
                <span className="user-name">👤 {user.username}</span>
                <span className="user-role">({user.role})</span>
              </div>
              <div className="user-actions">
                <button 
                  className="profile-btn" 
                  onClick={() => {
                    console.log('Profil butonuna tıklandı');
                    if (onShowProfile) {
                      onShowProfile();
                    } else {
                      console.error('onShowProfile prop\'u bulunamadı');
                    }
                  }}
                  title="Profil Bilgileri"
                >
                  ⚙️ Profil
                </button>
                <button 
                  className="logout-btn" 
                  onClick={onLogout}
                  title="Çıkış Yap"
                >
                  🚪 Çıkış
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;