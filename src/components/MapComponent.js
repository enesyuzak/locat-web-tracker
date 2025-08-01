import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// Leaflet marker ikonlarını düzelt
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Adres temizleme fonksiyonu
const cleanAddressText = (text) => {
  if (!text) return '';
  
  return text
    .replace(/ Sokak$/i, '')
    .replace(/ Caddesi$/i, '')
    .replace(/ Yolu$/i, '')
    .replace(/ Bulvarı$/i, '')
    .replace(/ Mahallesi$/i, '')
    .replace(/ Mahalle$/i, '')
    .replace(/ Semti$/i, '')
    .replace(/ Semt$/i, '')
    .replace(/ Köyü$/i, '')
    .replace(/ Köy$/i, '')
    .replace(/ Kasabası$/i, '')
    .replace(/ Kasaba$/i, '')
    .replace(/ İlçesi$/i, '')
    .replace(/ İlçe$/i, '')
    .replace(/ İli$/i, '')
    .replace(/ İl$/i, '')
    .trim();
};

// Açık adres alma fonksiyonu
const getAddressFromCoordinates = async (latitude, longitude) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1&accept-language=tr`
    );
    
    if (!response.ok) {
      throw new Error('Adres alınamadı');
    }
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    // Adres bileşenlerini al
    const address = data.address;
    
    // Türkçe adres formatı oluştur
    let fullAddress = '';
    
    // Sokak ve numara
    if (address.house_number && address.road) {
      fullAddress += `No:${address.house_number}`;
    } else if (address.road) {
      fullAddress += cleanAddressText(address.road);
    }
    
    // Mahalle
    if (address.suburb) {
      const suburbName = cleanAddressText(address.suburb);
      fullAddress += fullAddress ? `,${suburbName}` : suburbName;
    } else if (address.neighbourhood) {
      const neighbourhoodName = cleanAddressText(address.neighbourhood);
      fullAddress += fullAddress ? `,${neighbourhoodName}` : neighbourhoodName;
    }
    
    // İlçe
    if (address.city_district) {
      const districtName = cleanAddressText(address.city_district);
      fullAddress += fullAddress ? `,${districtName}` : districtName;
    } else if (address.district) {
      const districtName = cleanAddressText(address.district);
      fullAddress += fullAddress ? `,${districtName}` : districtName;
    }
    
    // İl
    if (address.city) {
      const cityName = cleanAddressText(address.city);
      fullAddress += fullAddress ? `,${cityName}` : cityName;
    } else if (address.state) {
      const stateName = cleanAddressText(address.state);
      fullAddress += fullAddress ? `,${stateName}` : stateName;
    }
    
    // Ülke
    if (address.country) {
      const countryName = cleanAddressText(address.country);
      fullAddress += fullAddress ? `,${countryName}` : countryName;
    }
    
    return fullAddress || 'Adres bilgisi alınamadı';
    
  } catch (error) {
    console.error('Adres alma hatası:', error);
    return 'Adres bilgisi alınamadı';
  }
};

// Özel marker ikonları
const createCustomIcon = (isOnline, isSelected, userName, batteryLevel = null) => {
  let color;
  
  if (isSelected) {
    color = '#ff4444'; // Seçili kullanıcı - kırmızı
  } else if (!isOnline) {
    color = '#9E9E9E'; // Offline - gri
  } else if (batteryLevel !== null && batteryLevel !== undefined) {
    // Pil seviyesine göre renk
    if (batteryLevel >= 50) {
      color = '#4CAF50'; // Yüksek pil - yeşil
    } else if (batteryLevel >= 20) {
      color = '#FF9800'; // Orta pil - turuncu
    } else {
      color = '#f44336'; // Düşük pil - kırmızı
    }
  } else {
    color = '#4CAF50'; // Varsayılan - yeşil
  }
  
  const size = isSelected ? 44 : 31; // %25 artırıldı (35*1.25=44, 25*1.25=31)
  
  // Email'in ilk 3 harfini al
  const getInitials = (name) => {
    if (!name) return 'U';
    
    // Eğer User_ ile başlıyorsa, User_ kısmını çıkar
    const cleanName = name.startsWith('User_') ? name.replace('User_', '') : name;
    
    // İlk 3 harfi al ve büyük harfe çevir
    return cleanName.substring(0, 3).toUpperCase();
  };
  
  const initials = getInitials(userName);
  
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
        font-size: ${size * 0.35}px;
        font-family: 'Arial', sans-serif;
        ${isSelected ? 'animation: pulse 2s infinite;' : ''}
      ">
        ${initials}
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
  const [address, setAddress] = useState('');

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    
    // UTC zamanını olduğu gibi göster (timezone dönüşümü yapma)
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    const seconds = String(date.getUTCSeconds()).padStart(2, '0');
    
    return `${day}.${month}.${year} ${hours}:${minutes}:${seconds} UTC`;
  };

  const formatCoordinates = (lat, lng) => {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
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

    const getBatteryColor = (level) => {
      if (level >= 50) return '#4CAF50';
      if (level >= 20) return '#FF9800';
      return '#f44336';
    };

    let batteryText = '';
    let batteryColor = '#666';

    if (batteryLevel !== null && batteryLevel !== undefined) {
      const icon = getBatteryIcon(batteryLevel);
      batteryColor = getBatteryColor(batteryLevel);
      batteryText = `${icon} %${batteryLevel}`;
      
      if (batteryStatus) {
        const isCharging = batteryStatus.includes('oluyor') || batteryStatus.includes('charging');
        batteryText += isCharging ? ' ⚡' : '';
      }
    } else if (batteryStatus) {
      batteryText = batteryStatus;
    }

    return { text: batteryText, color: batteryColor };
  };

  // Varsayılan harita merkezi (İstanbul)
  const defaultCenter = [41.0082, 28.9784];
  const defaultZoom = 10;

  useEffect(() => {
    const updateAddress = async () => {
      if (selectedUser) {
        const addr = await getAddressFromCoordinates(selectedUser.latitude, selectedUser.longitude);
        setAddress(addr);
      } else {
        setAddress('');
      }
    };

    updateAddress();
  }, [selectedUser]);

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
          icon={createCustomIcon(user.isOnline, selectedUser?.id === user.id, user.name, user.batteryLevel)}
          eventHandlers={{
            click: async () => {
              onUserSelect(user);
              // Marker'a tıklandığında adres bilgisini al
              const addr = await getAddressFromCoordinates(user.latitude, user.longitude);
              setAddress(addr);
            },
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
              
              {selectedUser?.id === user.id && address && (
                <div style={{ marginBottom: '8px' }}>
                  <strong>Açık Adres:</strong><br />
                  <span style={{ 
                    fontSize: '13px', 
                    color: '#333',
                    fontStyle: 'italic'
                  }}>
                    📍 {address}
                  </span>
                </div>
              )}
              
              <div style={{ marginBottom: '8px' }}>
                <strong>Son Güncelleme:</strong><br />
                <span style={{ fontSize: '13px', color: '#666' }}>
                  {formatTime(user.updated_at)}
                </span>
              </div>

              {(() => {
                const batteryInfo = formatBatteryInfo(user.batteryLevel, user.batteryStatus);
                return batteryInfo ? (
                  <div style={{ marginBottom: '8px' }}>
                    <strong>Pil Durumu:</strong>{' '}
                    <span style={{ 
                      color: batteryInfo.color,
                      fontWeight: 'bold',
                      fontSize: '14px'
                    }}>
                      {batteryInfo.text}
                    </span>
                  </div>
                ) : null;
              })()}
              
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
              
              <div style={{ 
                marginTop: '10px',
                textAlign: 'center'
              }}>
                <button
                  onClick={() => {
                    const googleMapsUrl = `https://www.google.com/maps?q=${user.latitude},${user.longitude}`;
                    window.open(googleMapsUrl, '_blank');
                  }}
                  style={{
                    background: '#4285f4',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px',
                    width: '100%'
                  }}
                  title="Google Maps'te Aç"
                >
                  🗺️ Google Maps'te Aç
                </button>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default MapComponent;