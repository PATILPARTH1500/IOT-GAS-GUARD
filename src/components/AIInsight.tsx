import React from 'react';
import { AlertTriangle, CheckCircle, Info, ShieldAlert, Loader2, Sparkles } from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'motion/react';

interface AIInsightProps {
  riskLevel: "Low" | "Moderate" | "High" | "Critical";
  analysis: string;
  recommendation: string;
  loading: boolean;
}

export function AIInsight({ riskLevel, analysis, recommendation, loading }: AIInsightProps) {
  const styles = {
    Low: {
      border: "border-neon-green/50",
      text: "text-neon-green",
      bg: "bg-neon-green/10",
      glow: "shadow-[0_0_30px_-10px_rgba(0,255,157,0.3)]",
      icon: CheckCircle
    },
    Moderate: {
      border: "border-neon-yellow/50",
      text: "text-neon-yellow",
      bg: "bg-neon-yellow/10",
      glow: "shadow-[0_0_30px_-10px_rgba(255,204,0,0.3)]",
      icon: Info
    },
    High: {
      border: "border-neon-red/50",
      text: "text-neon-red",
      bg: "bg-neon-red/10",
      glow: "shadow-[0_0_30px_-10px_rgba(255,0,85,0.3)]",
      icon: AlertTriangle
    },
    Critical: {
      border: "border-neon-red animate-pulse",
      text: "text-red-500",
      bg: "bg-red-500/20",
      glow: "shadow-[0_0_40px_-5px_rgba(255,0,0,0.5)]",
      icon: ShieldAlert
    }
  };

  const style = styles[riskLevel];
  const Icon = style.icon;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={clsx(
        "glass-panel p-6 border-l-4 relative overflow-hidden group",
        style.border,
        style.glow
      )}
      whileHover={{ scale: 1.02 }}
    >
      {/* Background Pulse Effect */}
      <div className={clsx(
        "absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-700 pointer-events-none",
        style.bg
      )} />

      {/* Loading Spinner */}
      <AnimatePresence>
        {loading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute top-4 right-4"
          >
            <Loader2 className="w-4 h-4 text-neon-blue animate-spin" />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Header Section */}
      <div className="flex items-center gap-4 mb-6">
        <motion.div 
          layoutId="icon-bg"
          className={clsx("p-3 rounded-full relative", style.bg)}
        >
          <Icon className={clsx("w-6 h-6", style.text)} />
          {/* Subtle Ping Animation for Critical/High */}
          {(riskLevel === 'High' || riskLevel === 'Critical') && (
            <span className={clsx("absolute inset-0 rounded-full animate-ping opacity-75", style.bg)} />
          )}
        </motion.div>
        
        <div>
          <h3 className="text-secondary text-xs uppercase tracking-widest font-mono mb-1 flex items-center gap-2">
            AI Risk Assessment
            {riskLevel === 'Low' && <Sparkles className="w-3 h-3 text-neon-green opacity-50" />}
          </h3>
          <motion.span 
            key={riskLevel} // Animate when risk level changes
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={clsx("text-2xl font-bold tracking-tight", style.text)}
          >
            {riskLevel} Risk
          </motion.span>
        </div>
      </div>

      {/* Content Section */}
      <div className="space-y-4 relative z-10">
        <motion.div 
          className="bg-card-inner p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors"
          whileHover={{ x: 4 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <h4 className="text-secondary text-xs uppercase mb-2 font-mono opacity-70">Analysis</h4>
          <p className="text-sm leading-relaxed font-medium">{analysis}</p>
        </motion.div>

        <motion.div 
          className="bg-card-inner p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors"
          whileHover={{ x: 4 }}
          transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
        >
          <h4 className="text-secondary text-xs uppercase mb-2 font-mono opacity-70">Recommendation</h4>
          <p className={clsx("text-sm font-bold", style.text)}>{recommendation}</p>
        </motion.div>
      </div>
      
      {/* Footer */}
      <div className="mt-6 flex justify-between items-center border-t border-white/5 pt-4">
        <div className="flex gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-neon-blue animate-pulse" />
          <span className="w-1.5 h-1.5 rounded-full bg-neon-blue animate-pulse delay-75" />
          <span className="w-1.5 h-1.5 rounded-full bg-neon-blue animate-pulse delay-150" />
        </div>
        <span className="text-[10px] text-secondary font-mono opacity-60 flex items-center gap-1">
          Powered by Gemini 2.5 Flash
        </span>
      </div>
    </motion.div>
  );
}
