import React from 'react';
import { Activity, Wifi, WifiOff, AlertTriangle, CheckCircle } from 'lucide-react';
import { DeviceStatus } from '../types';
import { clsx } from 'clsx';

interface SensorHealthProps {
  status: DeviceStatus;
}

export function SensorHealth({ status }: SensorHealthProps) {
  const sensors = [
    { id: 'mq4', name: 'MQ-4 (Methane)', active: status.sensors.mq4 },
    { id: 'mq135', name: 'MQ-135 (Air)', active: status.sensors.mq135 },
    { id: 'dht22', name: 'DHT22 (Env)', active: status.sensors.dht22 },
    { id: 'soil', name: 'Soil Sensor', active: status.sensors.soil },
  ];

  return (
    <div className="glass-panel p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-secondary text-xs uppercase tracking-widest font-mono flex items-center gap-2">
          <Activity className="w-4 h-4" /> System Health
        </h3>
        <div className={clsx(
          "flex items-center gap-2 px-2 py-1 rounded text-xs font-bold",
          status.online ? "bg-neon-green/10 text-neon-green" : "bg-red-500/10 text-red-500"
        )}>
          {status.online ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
          {status.online ? "ONLINE" : "OFFLINE"}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {sensors.map((sensor) => (
          <div key={sensor.id} className="bg-card-inner p-3 rounded border border-white/5 flex items-center justify-between">
            <span className="text-xs text-gray-300 font-mono">{sensor.name}</span>
            {sensor.active ? (
              <CheckCircle className="w-4 h-4 text-neon-green" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />
            )}
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t border-white/5">
        <div className="flex justify-between text-[10px] text-secondary font-mono">
          <span>Last Heartbeat:</span>
          <span>{new Date(status.lastUpdate).toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
}
