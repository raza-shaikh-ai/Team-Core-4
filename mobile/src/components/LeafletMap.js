import React, { useRef, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

const LeafletMap = ({ farmers = [], ngos = [] }) => {
  const webViewRef = useRef(null);

  // Generate HTML containing the map logic and the markers
  const generateMapHtml = () => {
    const farmersJson = JSON.stringify(farmers);
    const ngosJson = JSON.stringify(ngos);

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>FarmShare Leaflet Map</title>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="" />
        <style>
          html, body, #map {
            height: 100%;
            margin: 0;
            padding: 0;
            background-color: #f8fafc;
          }
          .custom-popup {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.4;
            padding: 4px;
          }
          .custom-popup h4 {
            margin: 0 0 6px 0;
            font-size: 14px;
            font-weight: 700;
          }
          .farmer-title {
            color: #10b981;
          }
          .ngo-title {
            color: #2563eb;
          }
          .custom-popup p {
            margin: 0 0 3px 0;
            font-size: 12px;
            color: #475569;
          }
          .custom-popup .badge {
            display: inline-block;
            font-size: 10px;
            padding: 2px 6px;
            border-radius: 4px;
            font-weight: 600;
            text-transform: capitalize;
          }
          .badge-available {
            background-color: #ecfdf5;
            color: #059669;
          }
          .badge-requested {
            background-color: #eff6ff;
            color: #2563eb;
          }
          .badge-pending {
            background-color: #fffbeb;
            color: #d97706;
          }
        </style>
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
      </head>
      <body>
        <div id="map"></div>
        <script>
          const farmers = ${farmersJson};
          const ngos = ${ngosJson};

          const map = L.map('map').setView([20.5937, 78.9629], 5);

          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap'
          }).addTo(map);

          const markers = [];

          const greenIcon = new L.Icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
          });

          const blueIcon = new L.Icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
          });

          farmers.forEach(farmer => {
            const lat = farmer.latitude || farmer.lat;
            const lng = farmer.longitude || farmer.lng;
            if (lat && lng) {
              const marker = L.marker([lat, lng], { icon: greenIcon })
                .addTo(map)
                .bindPopup(\`
                  <div class="custom-popup">
                    <h4 class="farmer-title">🌾 \${farmer.farmer_name || farmer.name || 'Farmer'}</h4>
                    <p><strong>Produce:</strong> \${farmer.produce_name}</p>
                    <p><strong>Quantity:</strong> \${farmer.quantity} kg</p>
                    <p><strong>Status:</strong> <span class="badge badge-\${farmer.status || 'unknown'}">\${(farmer.status || 'unknown').replace('_', ' ')}</span></p>
                    <p style="font-size: 10px; color: #94a3b8; margin-top: 6px;">📍 \${farmer.location || ''}</p>
                  </div>
                \`);
              markers.push(marker);
            }
          });

          ngos.forEach(ngo => {
            const lat = ngo.latitude || ngo.lat;
            const lng = ngo.longitude || ngo.lng;
            if (lat && lng) {
              const marker = L.marker([lat, lng], { icon: blueIcon })
                .addTo(map)
                .bindPopup(\`
                  <div class="custom-popup">
                    <h4 class="ngo-title">🏢 \${ngo.name}</h4>
                    <p><strong>Type:</strong> NGO / Food Bank</p>
                    <p><strong>Status:</strong> Active</p>
                    <p style="font-size: 10px; color: #94a3b8; margin-top: 6px;">📍 \${ngo.location || 'Registered Partner'}</p>
                  </div>
                \`);
              markers.push(marker);
            }
          });

          if (markers.length > 0) {
            const group = new L.featureGroup(markers);
            map.fitBounds(group.getBounds().pad(0.15));
          }
        </script>
      </body>
      </html>
    `;
  };

  useEffect(() => {
    if (webViewRef.current) {
      webViewRef.current.reload();
    }
  }, [farmers, ngos]);

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: generateMapHtml() }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#f1f5f9',
  },
  webview: {
    flex: 1,
  },
});

export default LeafletMap;
