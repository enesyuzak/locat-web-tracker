import React from 'react';

const UserList = ({ 
  users, 
  selectedUser, 
  onUserSelect, 
  searchTerm, 
  onSearchChange, 
  loading, 
  error 
}) => {
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Az önce';
    if (diffMinutes < 60) return `${diffMinutes} dakika önce`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)} saat önce`;
    return `${Math.floor(diffMinutes / 1440)} gün önce`;
  };

  const formatCoordinates = (lat, lng) => {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  };

  const formatBatteryInfo = (batteryLevel, batteryStatus) => {
    if (!batteryLevel && !batteryStatus) {
      return null;
    }

    const getBatteryIcon = (level) => {
      if (level >= 80) return '🔋';
      if (level >= 50) return '🔋';
      if (level >= 20) return '🪫';
      return '🪫';
    };

    if (batteryLevel !== null && batteryLevel !== undefined) {
      const icon = getBatteryIcon(batteryLevel);
      const isCharging = batteryStatus && (batteryStatus.includes('oluyor') || batteryStatus.includes('charging'));
      return `${icon} %${batteryLevel}${isCharging ? ' ⚡' : ''}`;
    } else if (batteryStatus) {
      return `🔋 ${batteryStatus}`;
    }

    return null;
  };

  if (error) {
    return (
      <div className="sidebar">
        <div className="error">
          <h3>Hata</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h3>Kullanıcılar ({users.length})</h3>
        <input
          type="text"
          className="search-box"
          placeholder="Kullanıcı ara..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      
      <div className="user-list">
        {loading && users.length === 0 ? (
          <div className="loading">Kullanıcılar yükleniyor...</div>
        ) : users.length === 0 ? (
          <div className="no-users">
            <h3>Kullanıcı bulunamadı</h3>
            <p>Henüz hiç konum verisi yok</p>
          </div>
        ) : (
          users.map((user) => (
            <div
              key={user.id}
              className={`user-item ${selectedUser?.id === user.id ? 'active' : ''}`}
              onClick={() => onUserSelect(user)}
            >
              <div className="user-name">
                <span className={`user-status ${user.isOnline ? 'online' : 'offline'}`}></span>
                {user.name}
                {user.isStale && <span className="stale-indicator" title="Eski konum">📍⏰</span>}
              </div>
              
              <div className="user-info">
                <div className="user-location">
                  📍 {formatCoordinates(user.latitude, user.longitude)}
                </div>
                <div className={`user-time ${user.isStale ? 'stale' : ''}`}>
                  🕒 {user.locationAge || formatTime(user.updated_at)}
                  {user.isStale && <span className="stale-text"> (Son bilinen konum)</span>}
                </div>
                {formatBatteryInfo(user.batteryLevel, user.batteryStatus) && (
                  <div className="user-battery">
                    {formatBatteryInfo(user.batteryLevel, user.batteryStatus)}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default UserList;