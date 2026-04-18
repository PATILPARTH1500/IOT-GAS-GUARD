import React from 'react';
import { clsx } from 'clsx';
import { LucideIcon } from 'lucide-react';

interface SensorCardProps {
  label: string;
  value: number | string;
  unit: string;
  icon: LucideIcon;
  status: "safe" | "warning" | "danger";
  trend?: "up" | "down" | "stable";
  min?: number;
  max?: number;
  gaugeValue?: number;
}

export function SensorCard({ label, value, unit, icon: Icon, status, trend, min = 0, max = 100, gaugeValue }: SensorCardProps) {
  const statusColors = {
    safe: "text-emerald-500 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]",
    warning: "text-amber-500 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.1)]",
    danger: "text-red-500 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.2)] animate-pulse-fast"
  };

  const strokeColors = {
    safe: "#10b981", // emerald-500
    warning: "#f59e0b", // amber-500
    danger: "#ef4444" // red-500
  };

  const iconColors = {
    safe: "text-emerald-500",
    warning: "text-amber-500",
    danger: "text-red-500"
  };

  const displayValue = value;
  
  const numericValue = gaugeValue !== undefined ? gaugeValue : (typeof value === 'number' ? value : 0);
  const clampedValue = Math.max(min, Math.min(max, numericValue));
  const percentage = (clampedValue - min) / (max - min);
  
  // SVG Arc calculations
  const radius = 36;
  const circumference = Math.PI * radius;
  const strokeDashoffset = circumference - (percentage * circumference);
  const needleAngle = -90 + (percentage * 180);

  return (
    <div className={clsx(
      "glass-panel p-5 flex flex-col items-center justify-between transition-all duration-300 hover:scale-105 relative overflow-hidden",
      status === 'danger' && "border-red-500/50"
    )}>
      <div className="w-full flex justify-between items-start mb-2 z-10">
        <span className="text-secondary text-xs uppercase tracking-wider font-mono">{label}</span>
        <Icon className={clsx("w-5 h-5", iconColors[status])} />
      </div>
      
      <div className="relative w-full flex flex-col justify-center items-center mt-2">
        <svg viewBox="0 0 100 60" className="w-full max-w-[160px] overflow-visible drop-shadow-xl">
          <defs>
            <filter id={`glow-${label.replace(/\s+/g, '-')}`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <linearGradient id="hubGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
          </defs>

          {/* Ticks */}
          {[...Array(21)].map((_, i) => {
            const tickAngle = -90 + (i * 9); // 180 degrees / 20 intervals = 9 degrees
            const isMajor = i % 5 === 0;
            return (
              <line
                key={i}
                x1="50" y1={isMajor ? "6" : "9"}
                x2="50" y2="11"
                stroke={isMajor ? "var(--text-primary)" : "var(--text-secondary)"}
                strokeWidth={isMajor ? "1.5" : "1"}
                transform={`rotate(${tickAngle}, 50, 50)`}
                opacity={isMajor ? "0.9" : "0.4"}
              />
            );
          })}

          {/* Background Arc Track (Shadow) */}
          <path
            d="M 14 50 A 36 36 0 0 1 86 50"
            fill="none"
            stroke="rgba(0,0,0,0.3)"
            strokeWidth="8"
            strokeLinecap="round"
          />
          {/* Background Arc Track (Base) */}
          <path
            d="M 14 50 A 36 36 0 0 1 86 50"
            fill="none"
            stroke="var(--card-inner-bg)"
            strokeWidth="6"
            strokeLinecap="round"
          />
          
          {/* Foreground Arc */}
          <path
            d="M 14 50 A 36 36 0 0 1 86 50"
            fill="none"
            stroke={strokeColors[status]}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
            filter={`url(#glow-${label.replace(/\s+/g, '-')})`}
          />

          {/* Needle */}
          <g className="transition-transform duration-1000 ease-out" style={{ transform: `rotate(${needleAngle}deg)`, transformOrigin: '50px 50px' }}>
            {/* Shadow */}
            <polygon points="48,50 52,50 50,12" fill="rgba(0,0,0,0.3)" transform="translate(1, 2)" />
            {/* Needle Body */}
            <polygon points="48.5,50 51.5,50 50,12" fill={strokeColors[status]} />
            {/* Hub */}
            <circle cx="50" cy="50" r="6" fill="url(#hubGradient)" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
            <circle cx="50" cy="50" r="2" fill={strokeColors[status]} />
          </g>
        </svg>
        
        <div className="mt-4 flex flex-col items-center">
          <div className="bg-black/20 dark:bg-black/40 px-4 py-1.5 rounded-lg border border-black/10 dark:border-white/5 shadow-inner flex items-baseline gap-1 min-w-[80px] justify-center">
            <span className={clsx("text-2xl font-bold font-mono tracking-tighter", statusColors[status].split(' ')[0])}>
              {displayValue}
            </span>
          </div>
          {unit && <span className="text-secondary text-xs font-mono uppercase tracking-widest mt-2">{unit}</span>}
        </div>
      </div>
    </div>
  );
}
