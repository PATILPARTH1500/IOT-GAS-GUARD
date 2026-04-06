import React from 'react';
import { MapPin } from 'lucide-react';

export function HazardMap() {
  // In a real app, use Google Maps API Key here
  // For this demo, we use a stylized placeholder or iframe if key existed
  
  return (
    <div className="glass-panel p-0 overflow-hidden h-full relative group">
      <div className="absolute top-4 left-4 z-10 bg-black/80 backdrop-blur px-3 py-1 rounded border border-white/10">
        <span className="text-xs text-emerald-500 font-mono flex items-center gap-2">
          <MapPin className="w-3 h-3" /> LIVE TRACKING
        </span>
      </div>
      
      {/* Simulated Map Background */}
      <div className="w-full h-full bg-slate-900 relative">
        <div className="absolute inset-0 opacity-30" 
             style={{ 
               backgroundImage: 'radial-gradient(#334155 1px, transparent 1px)', 
               backgroundSize: '20px 20px' 
             }}>
        </div>
        
        {/* Device Marker */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="relative">
            <div className="w-4 h-4 bg-emerald-500 rounded-full shadow-[0_0_20px_#10b981] animate-pulse"></div>
            <div className="absolute -top-8 -left-12 bg-black/90 text-white text-[10px] px-2 py-1 rounded border border-emerald-500/30 whitespace-nowrap">
              ESP32_01 (Safe)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
