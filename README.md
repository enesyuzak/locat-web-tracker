# LocAt Web Tracker

LocAt mobil uygulamasının kullanıcı konumlarını web üzerinden takip etmek için geliştirilmiş React tabanlı web paneli.

## Özellikler

### 🗺️ **Harita Görünümü**
- **Interactive Harita**: OpenStreetMap tabanlı interaktif harita
- **Kullanıcı Markerları**: Her kullanıcı için özel renkli markerlar
- **Durum Gösterimi**: Aktif/pasif kullanıcılar için farklı renkler
- **Popup Bilgileri**: Kullanıcı detayları, konum ve son güncelleme zamanı
- **Otomatik Odaklama**: Seçili kullanıcıya otomatik zoom

### 👥 **Kullanıcı Listesi**
- **Kullanıcı Arama**: İsim veya ID ile kullanıcı arama
- **Durum Gösterimi**: Online/offline durumu
- **Son Konum**: Koordinat bilgileri
- **Zaman Bilgisi**: Son güncelleme zamanı
- **Tıklama ile Odaklama**: Kullanıcıya tıklayarak haritada odaklama

### 📊 **İstatistikler**
- **Toplam Kullanıcı**: Sistemdeki toplam kullanıcı sayısı
- **Aktif Kullanıcı**: Son 30 dakikada konum güncelleyen kullanıcılar
- **Toplam Konum**: Veritabanındaki toplam konum kayıt sayısı
- **Son Güncelleme**: Verilerin son çekilme zamanı

### 🔄 **Real-time Güncellemeler**
- **Otomatik Yenileme**: 30 saniyede bir otomatik veri çekme
- **Supabase Real-time**: Anlık veri güncellemeleri
- **Manuel Yenileme**: İsteğe bağlı manuel yenileme butonu

## Kurulum

### Gereksinimler
- Node.js 16+ 
- npm veya yarn

### Adımlar

1. **Bağımlılıkları yükle:**
```bash
cd web-tracker
npm install
```

2. **Uygulamayı başlat:**
```bash
npm start
```

3. **Tarayıcıda aç:**
```
http://localhost:3000
```

## Kullanılan Teknolojiler

- **React 18**: Modern React hooks ve functional components
- **React Leaflet**: Harita görünümü için
- **Supabase**: Veritabanı ve real-time güncellemeler
- **Leaflet**: Harita kütüphanesi
- **CSS3**: Modern responsive tasarım

## Yapılandırma

### Supabase Bağlantısı
`src/App.js` dosyasında Supabase URL ve API key'i zaten yapılandırılmış:

```javascript
const supabaseUrl = 'https://zunrhemhtbslfythqzsi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

### Otomatik Yenileme Süresi
Varsayılan olarak 30 saniyede bir yenilenir. Değiştirmek için `App.js`'te:

```javascript
interval = setInterval(fetchLocations, 30000); // 30 saniye
```

### Online Kullanıcı Süresi
Kullanıcının online sayılması için son güncelleme süresi (varsayılan 30 dakika):

```javascript
const isUserOnline = (lastUpdate) => {
  const diffMinutes = (now - updateTime) / (1000 * 60);
  return diffMinutes <= 30; // 30 dakika
};
```

## Özellik Detayları

### Harita Kontrolleri
- **Zoom**: Mouse tekerleği veya +/- butonları
- **Pan**: Sürükleyerek hareket ettirme
- **Marker Tıklama**: Kullanıcı bilgilerini görüntüleme
- **Otomatik Fit**: Tüm kullanıcıları kapsayacak şekilde zoom

### Responsive Tasarım
- **Desktop**: Yan panel + harita görünümü
- **Mobile**: Tam ekran harita, açılır kullanıcı listesi
- **Tablet**: Uyumlu orta boyut tasarım

### Performans Optimizasyonları
- **Memoization**: Gereksiz re-render'ları önleme
- **Lazy Loading**: Bileşenlerin ihtiyaç halinde yüklenmesi
- **Efficient Updates**: Sadece değişen verilerin güncellenmesi

## Geliştirme

### Yeni Özellik Ekleme
1. `src/components/` klasöründe yeni bileşen oluştur
2. `App.js`'te import et ve kullan
3. Gerekirse CSS stillerini `index.css`'e ekle

### Build ve Deploy
```bash
npm run build
```

Build dosyaları `build/` klasöründe oluşturulur ve herhangi bir web sunucusunda host edilebilir.

## Sorun Giderme

### Harita Görünmüyor
- Leaflet CSS'inin doğru yüklendiğinden emin olun
- Network sekmesinde tile isteklerini kontrol edin

### Veriler Gelmiyor
- Supabase bağlantı bilgilerini kontrol edin
- Browser console'da hata mesajlarını inceleyin
- Network sekmesinde API isteklerini kontrol edin

### Real-time Çalışmıyor
- Supabase real-time özelliğinin aktif olduğundan emin olun
- WebSocket bağlantısını kontrol edin

## Lisans

Bu proje MIT lisansı altında lisanslanmıştır.