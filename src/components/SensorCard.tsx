import React from 'react';
import { clsx } from 'clsx';
import { LucideIcon } from 'lucide-react';

interface SensorCardProps {
  label: string;
  value: number;
  unit: string;
  icon: LucideIcon;
  status: "safe" | "warning" | "danger";
  trend?: "up" | "down" | "stable";
}

export function SensorCard({ label, value, unit, icon: Icon, status, trend }: SensorCardProps) {
  const statusColors = {
    safe: "text-emerald-500 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]",
    warning: "text-amber-500 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.1)]",
    danger: "text-red-500 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.2)] animate-pulse-fast"
  };

  const iconColors = {
    safe: "text-emerald-500",
    warning: "text-amber-500",
    danger: "text-red-500"
  };

  return (
    <div className={clsx(
      "glass-panel p-6 flex flex-col items-center justify-between transition-all duration-300 hover:scale-105",
      status === 'danger' && "border-red-500/50"
    )}>
      <div className="w-full flex justify-between items-start mb-4">
        <span className="text-secondary text-sm uppercase tracking-wider font-mono">{label}</span>
        <Icon className={clsx("w-6 h-6", iconColors[status])} />
      </div>
      
      <div className="flex items-baseline gap-1">
        <span className={clsx("text-4xl font-bold font-mono tracking-tighter", statusColors[status].split(' ')[0])}>
          {value}
        </span>
        <span className="text-secondary text-sm font-mono">{unit}</span>
      </div>

      <div className="w-full mt-4 h-1.5 bg-card-inner rounded-full overflow-hidden">
        <div 
          className={clsx("h-full transition-all duration-1000 ease-out", 
            status === 'safe' ? 'bg-emerald-500' : 
            status === 'warning' ? 'bg-amber-500' : 'bg-red-500'
          )}
          style={{ width: `${Math.min(value, 100)}%` }} // Simplified percentage for demo
        />
      </div>
    </div>
  );
}
