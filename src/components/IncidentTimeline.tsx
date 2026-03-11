import React from 'react';
import { Clock, AlertCircle, CheckCircle, WifiOff, Wifi } from 'lucide-react';
import { Incident } from '../types';
import { clsx } from 'clsx';

interface IncidentTimelineProps {
  incidents: Incident[];
}

export function IncidentTimeline({ incidents }: IncidentTimelineProps) {
  return (
    <div className="glass-panel p-6 h-full flex flex-col">
      <h3 className="text-secondary text-xs uppercase tracking-widest font-mono mb-4 flex items-center gap-2">
        <Clock className="w-4 h-4" /> Incident Timeline
      </h3>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
        {incidents.length === 0 ? (
          <div className="text-center py-8 text-secondary text-xs">No incidents recorded yet.</div>
        ) : (
          incidents.slice().reverse().map((incident) => (
            <div key={incident.id} className="relative pl-4 border-l border-white/10">
              <div className={clsx(
                "absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full border-2 border-slate-900",
                incident.type === 'critical' ? "bg-red-500" :
                incident.type === 'warning' ? "bg-neon-yellow" :
                incident.type === 'spike' ? "bg-neon-blue" :
                incident.type === 'offline' ? "bg-gray-500" : "bg-neon-green"
              )} />
              
              <div className="flex justify-between items-start">
                <span className={clsx(
                  "text-xs font-bold",
                  incident.type === 'critical' ? "text-red-500" :
                  incident.type === 'warning' ? "text-neon-yellow" : "text-white"
                )}>
                  {incident.type.toUpperCase()}
                </span>
                <span className="text-[10px] text-secondary font-mono">{incident.timestamp}</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">{incident.message}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
