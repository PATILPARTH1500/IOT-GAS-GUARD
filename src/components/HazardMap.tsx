import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import { MapPin, AlertTriangle, CheckCircle } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { SensorData, DeviceStatus } from '../types';

// Fix for default Leaflet icons in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface HazardMapProps {
  data: SensorData;
  deviceStatus: DeviceStatus;
}

// Custom hook to update map view if needed
function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export function HazardMap({ data, deviceStatus }: HazardMapProps) {
  // Simulated location for the ESP32 sensor (Navi Mumbai, India)
  // In a real app, this might come from GPS coordinates in the sensor data
  const sensorLocation: [number, number] = [19.0330, 73.0297]; // Navi Mumbai
  
  const isDanger = data.alert_gas || data.alert_air;
  const isWarning = data.alert_soil;
  
  const statusColor = isDanger ? '#ef4444' : isWarning ? '#f59e0b' : '#10b981';
  const statusText = isDanger ? 'Critical Hazard' : isWarning ? 'Warning' : 'Safe';

  // Create a custom div icon for the marker
  const customMarkerIcon = L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      background-color: ${statusColor};
      width: 16px;
      height: 16px;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 0 15px ${statusColor};
      animation: pulse 2s infinite;
    "></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  });

  return (
    <div className="glass-panel p-0 overflow-hidden h-full relative group flex flex-col">
      <div className="absolute top-4 left-4 z-[400] bg-black/80 backdrop-blur px-3 py-1.5 rounded-lg border border-white/10 shadow-lg pointer-events-none">
        <span className="text-xs text-emerald-500 font-mono flex items-center gap-2 font-bold">
          <MapPin className="w-3.5 h-3.5" /> LIVE HAZARD MAP
        </span>
      </div>
      
      <div className="w-full h-full flex-1 relative z-0">
        <MapContainer 
          center={sensorLocation} 
          zoom={15} 
          style={{ height: '100%', width: '100%', background: '#0f172a' }}
          zoomControl={false}
          attributionControl={false}
        >
          <MapUpdater center={sensorLocation} />
          
          {/* Dark theme map tiles */}
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />

          {/* Hazard Radius Circle */}
          <Circle 
            center={sensorLocation} 
            radius={isDanger ? 400 : 150} 
            pathOptions={{ 
              color: statusColor, 
              fillColor: statusColor, 
              fillOpacity: isDanger ? 0.2 : 0.1,
              weight: 1,
              dashArray: '4 4'
            }} 
          />

          {/* Sensor Marker */}
          <Marker position={sensorLocation} icon={customMarkerIcon}>
            <Popup className="custom-popup">
              <div className="p-1 min-w-[200px]">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
                  {isDanger ? <AlertTriangle className="w-4 h-4 text-red-500" /> : <CheckCircle className="w-4 h-4 text-emerald-500" />}
                  <h3 className="font-bold text-sm text-gray-900 dark:text-white m-0">Device: {deviceStatus.id}</h3>
                </div>
                
                <div className="space-y-2 text-xs text-gray-600 dark:text-gray-300">
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span style={{ color: statusColor }} className="font-bold">{statusText}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Methane:</span>
                    <span className="font-mono">{Math.round(data.methane)} raw</span>
                  </div>
                  <div className="flex justify-between">
                    <span>AQI:</span>
                    <span className="font-mono">{Math.round(data.air_quality)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last Update:</span>
                    <span className="font-mono">{data.timestamp}</span>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        </MapContainer>
      </div>

      <style>{`
        .custom-popup .leaflet-popup-content-wrapper {
          background: rgba(15, 23, 42, 0.95);
          backdrop-filter: blur(8px);
          color: white;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
        }
        .custom-popup .leaflet-popup-tip {
          background: rgba(15, 23, 42, 0.95);
          border: 1px solid rgba(255,255,255,0.1);
        }
        .custom-popup .leaflet-popup-content {
          margin: 12px;
        }
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(var(--pulse-color), 0.7); }
          70% { box-shadow: 0 0 0 15px rgba(var(--pulse-color), 0); }
          100% { box-shadow: 0 0 0 0 rgba(var(--pulse-color), 0); }
        }
      `}</style>
    </div>
  );
}
