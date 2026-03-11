import React from 'react';
import { TrendingUp, AlertTriangle, ShieldCheck, ShieldAlert } from 'lucide-react';
import { clsx } from 'clsx';
import { motion } from 'motion/react';
import { RiskForecast } from '../types';

interface RiskForecastProps {
  forecast: RiskForecast | null;
  loading: boolean;
}

export function RiskForecastCard({ forecast, loading }: RiskForecastProps) {
  // if (!forecast && !loading) return null; // Removed to prevent layout shift/glitch

  const styles = {
    Low: { color: "text-neon-green", border: "border-neon-green/50", icon: ShieldCheck },
    Moderate: { color: "text-neon-yellow", border: "border-neon-yellow/50", icon: TrendingUp },
    High: { color: "text-neon-red", border: "border-neon-red/50", icon: AlertTriangle },
    Critical: { color: "text-red-500", border: "border-red-500", icon: ShieldAlert }
  };

  const style = forecast ? styles[forecast.predicted_risk] : styles.Low;
  const Icon = style.icon;

  return (
    <div className={clsx("glass-panel p-6 border-t-4 relative overflow-hidden", style.border)}>
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-white/5 rounded-full">
          <Icon className={clsx("w-5 h-5", style.color)} />
        </div>
        <h3 className="text-secondary text-xs uppercase tracking-widest font-mono">AI Risk Forecast (Next 10m)</h3>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-1/2 bg-white/10 rounded"></div>
          <div className="h-3 w-3/4 bg-white/5 rounded"></div>
        </div>
      ) : forecast ? (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }}
          className="space-y-3"
        >
          <div className="flex items-baseline gap-2">
            <span className="text-sm text-secondary">Prediction:</span>
            <span className={clsx("text-lg font-bold", style.color)}>{forecast.predicted_risk}</span>
          </div>
          
          <div className="bg-card-inner p-3 rounded border border-white/5">
            <p className="text-xs text-gray-300 leading-relaxed">
              <span className="text-secondary font-mono uppercase text-[10px] block mb-1">Reasoning</span>
              {forecast.reason}
            </p>
          </div>

          <div className="bg-card-inner p-3 rounded border border-white/5">
            <p className="text-xs text-gray-300 leading-relaxed">
              <span className="text-secondary font-mono uppercase text-[10px] block mb-1">Action</span>
              {forecast.preventive_action}
            </p>
          </div>
        </motion.div>
      ) : (
        <p className="text-xs text-secondary">Waiting for sufficient data...</p>
      )}
    </div>
  );
}
