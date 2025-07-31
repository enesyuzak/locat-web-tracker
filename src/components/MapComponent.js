import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// Leaflet marker ikonlarını düzelt
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Özel marker ikonları
const createCustomIcon = (isOnline, isSelected) => {
  const color = isSelected ? '#ff4444' : (isOnline ? '#4CAF50' : '#9E9E9E');
  const size = isSelected ? 35 : 25;
  
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background-color: ${color};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: ${size * 0.4}px;
        ${isSelected ? 'animation: pulse 2s infinite;' : ''}
      ">
        👤
      </div>
      <style>
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
      </style>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

// Haritayı seçili kullanıcıya odakla
const MapController = ({ selectedUser, users }) => {
  const map = useMap();
  
  useEffect(() => {
    if (selectedUser) {
      map.setView([selectedUser.latitude, selectedUser.longitude], 16, {
        animate: true,
        duration: 1
      });
    } else if (users.length > 0) {
      // Tüm kullanıcıları kapsayacak şekilde haritayı ayarla
      const bounds = L.latLngBounds(
        users.map(user => [user.latitude, user.longitude])
      );
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [selectedUser, users, map]);
  
  return null;
};

const MapComponent = ({ users, selectedUser, onUserSelect }) => {
  const mapRef = useRef();

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatCoordinates = (lat, lng) => {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  };

  // Varsayılan harita merkezi (İstanbul)
  const defaultCenter = [41.0082, 28.9784];
  const defaultZoom = 10;

  return (
    <MapContainer
      center={defaultCenter}
      zoom={defaultZoom}
      style={{ height: '100%', width: '100%' }}
      ref={mapRef}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      <MapController selectedUser={selectedUser} users={users} />
      
      {users.map((user) => (
        <Marker
          key={user.id}
          position={[user.latitude, user.longitude]}
          icon={createCustomIcon(user.isOnline, selectedUser?.id === user.id)}
          eventHandlers={{
            click: () => onUserSelect(user),
          }}
        >
          <Popup>
            <div style={{ minWidth: '200px' }}>
              <h3 style={{ 
                margin: '0 0 10px 0', 
                color: '#333',
                borderBottom: '2px solid #eee',
                paddingBottom: '5px'
              }}>
                {user.name}
              </h3>
              
              <div style={{ marginBottom: '8px' }}>
                <strong>Durum:</strong>{' '}
                <span style={{ 
                  color: user.isOnline ? '#4CAF50' : '#f44336',
                  fontWeight: 'bold'
                }}>
                  {user.isOnline ? '🟢 Aktif' : '🔴 Pasif'}
                </span>
              </div>
              
              <div style={{ marginBottom: '8px' }}>
                <strong>Konum:</strong><br />
                <code style={{ 
                  background: '#f5f5f5', 
                  padding: '2px 4px',
                  borderRadius: '3px',
                  fontSize: '12px'
                }}>
                  {formatCoordinates(user.latitude, user.longitude)}
                </code>
              </div>
              
              <div style={{ marginBottom: '8px' }}>
                <strong>Son Güncelleme:</strong><br />
                <span style={{ fontSize: '13px', color: '#666' }}>
                  {formatTime(user.updated_at)}
                </span>
              </div>
              
              <div style={{ 
                marginTop: '10px',
                padding: '5px',
                background: '#f8f9fa',
                borderRadius: '4px',
                fontSize: '12px',
                color: '#666'
              }}>
                ID: {user.id.substring(0, 8)}...
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default MapComponent;