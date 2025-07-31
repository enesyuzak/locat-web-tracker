import React from 'react';

const Header = ({ stats, autoRefresh, onAutoRefreshChange, onRefresh, loading, user, onLogout }) => {
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
      
      <div className="header-info">
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
        </div>
        
        <div className="controls">
          <button 
            className="refresh-btn" 
            onClick={onRefresh}
            disabled={loading}
          >
            {loading ? 'Yenileniyor...' : 'Yenile'}
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
              <button 
                className="logout-btn" 
                onClick={onLogout}
                title="Çıkış Yap"
              >
                🚪 Çıkış
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;