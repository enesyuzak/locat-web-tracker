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
              </div>
              
              <div className="user-info">
                <div className="user-location">
                  📍 {formatCoordinates(user.latitude, user.longitude)}
                </div>
                <div className="user-time">
                  🕒 {formatTime(user.updated_at)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default UserList;